// Shared audio analysis for every scene.
//
// The whole track is analysed ONCE per audio file into a table of values at
// a fixed rate (ANALYSIS_RATE steps per second). Scenes then just look up a
// point in time in that table. This is what keeps the live preview and the
// server render identical: the result depends only on the audio and the
// time, never on which frames happened to be drawn before (Remotion renders
// frames out of order and in parallel tabs) and never on the video's fps -
// a 30 fps and a 60 fps export of the same track get the same beats.
//
// Because the pass over the track is sequential, we can do things a
// per-frame FFT cannot: real attack/release smoothing, loudness
// normalisation against the whole track, and beat detection.

import type {MediaUtilsAudioData} from '@remotion/media-utils';

/** Number of log-spaced frequency bands stored per frame. */
export const BAND_COUNT = 64;

/** Analysis steps per second, independent of the video frame rate. */
export const ANALYSIS_RATE = 60;

const FFT_SIZE = 2048;
const MIN_HZ = 30;
const MAX_HZ = 16000;

/** Bands above (peak - DYNAMIC_RANGE_DB) are visible, everything below is 0. */
const DYNAMIC_RANGE_DB = 48;
/** Compensates the natural bass-heavy tilt of music so highs stay visible. */
const TILT_DB_PER_OCTAVE = 3;

const ATTACK_SECONDS = 0.012;
const RELEASE_SECONDS = 0.16;

const BASS_MAX_HZ = 150;
const MID_MAX_HZ = 2000;

const BEAT_MAX_HZ = 200;
const BEAT_WINDOW_SECONDS = 1;
/** A hit must exceed the average bass flux around it by this factor. */
const BEAT_THRESHOLD = 1.7;
/** Caps detection at 240 beats per minute. */
const BEAT_MIN_GAP_SECONDS = 0.25;
const BEAT_DECAY_SECONDS = 0.2;

export type TrackAnalysis = {
  /** Number of analysis steps (ANALYSIS_RATE per second of audio). */
  stepCount: number;
  /** stepCount * BAND_COUNT smoothed band levels, each 0..1. */
  bands: Float32Array;
  /** Smoothed 0..1 energy of the low / mid / high part of the spectrum. */
  bass: Float32Array;
  mid: Float32Array;
  treble: Float32Array;
  /** Smoothed 0..1 overall loudness. */
  level: Float32Array;
  /** 1 on a detected beat, decaying towards 0 until the next one. */
  beat: Float32Array;
  /** Number of beats detected up to and including this step. */
  beatCount: Uint32Array;
};

export type AudioFrame = {
  bass: number;
  mid: number;
  treble: number;
  level: number;
  beat: number;
  beatCount: number;
};

const FFT_BITS = Math.log2(FFT_SIZE);
const bitReversed = new Uint32Array(FFT_SIZE);
for (let i = 0; i < FFT_SIZE; i++) {
  let r = 0;
  for (let bit = 0; bit < FFT_BITS; bit++) r |= ((i >> bit) & 1) << (FFT_BITS - 1 - bit);
  bitReversed[i] = r;
}
const twiddleCos = new Float32Array(FFT_SIZE / 2);
const twiddleSin = new Float32Array(FFT_SIZE / 2);
for (let i = 0; i < FFT_SIZE / 2; i++) {
  twiddleCos[i] = Math.cos((-2 * Math.PI * i) / FFT_SIZE);
  twiddleSin[i] = Math.sin((-2 * Math.PI * i) / FFT_SIZE);
}

/** In-place radix-2 FFT for arrays of length FFT_SIZE. */
function fft(re: Float32Array, im: Float32Array) {
  const n = FFT_SIZE;

  for (let i = 0; i < n; i++) {
    const j = bitReversed[i];
    if (i < j) {
      const tr = re[i];
      re[i] = re[j];
      re[j] = tr;
      const ti = im[i];
      im[i] = im[j];
      im[j] = ti;
    }
  }

  for (let len = 2; len <= n; len <<= 1) {
    const half = len >> 1;
    const stride = n / len;

    for (let i = 0; i < n; i += len) {
      for (let j = 0; j < half; j++) {
        const wCos = twiddleCos[j * stride];
        const wSin = twiddleSin[j * stride];
        const a = i + j;
        const b = a + half;
        const vRe = re[b] * wCos - im[b] * wSin;
        const vIm = re[b] * wSin + im[b] * wCos;
        re[b] = re[a] - vRe;
        im[b] = im[a] - vIm;
        re[a] += vRe;
        im[a] += vIm;
      }
    }
  }
}

function mixToMono(audioData: MediaUtilsAudioData): Float32Array {
  const channels = audioData.channelWaveforms;
  if (channels.length === 1) return channels[0];

  const length = channels[0].length;
  const mono = new Float32Array(length);
  for (const channel of channels) {
    for (let i = 0; i < length; i++) mono[i] += channel[i];
  }
  const scale = 1 / channels.length;
  for (let i = 0; i < length; i++) mono[i] *= scale;
  return mono;
}

/** One-pole attack/release follower, applied in place along the time axis. */
function smoothOverTime(
  values: Float32Array,
  stride: number,
  offset: number,
  attack: number,
  release: number,
) {
  let current = 0;
  for (let i = offset; i < values.length; i += stride) {
    const target = values[i];
    current += (target - current) * (target > current ? attack : release);
    values[i] = current;
  }
}

function analyzeTrack(audioData: MediaUtilsAudioData): TrackAnalysis {
  const fps = ANALYSIS_RATE;
  const mono = mixToMono(audioData);
  const {sampleRate} = audioData;
  const frameCount = Math.max(1, Math.ceil((mono.length / sampleRate) * fps));

  const bands = new Float32Array(frameCount * BAND_COUNT);
  const bass = new Float32Array(frameCount);
  const mid = new Float32Array(frameCount);
  const treble = new Float32Array(frameCount);
  const level = new Float32Array(frameCount);
  const beat = new Float32Array(frameCount);
  const beatCount = new Uint32Array(frameCount);
  const bassFlux = new Float32Array(frameCount);

  // --- Band layout: log-spaced edges, expressed as fractional FFT bins. ---
  const binHz = sampleRate / FFT_SIZE;
  const maxHz = Math.min(MAX_HZ, sampleRate / 2 - binHz);
  const edges = new Float32Array(BAND_COUNT + 1);
  for (let b = 0; b <= BAND_COUNT; b++) {
    edges[b] = (MIN_HZ * Math.pow(maxHz / MIN_HZ, b / BAND_COUNT)) / binHz;
  }
  const tiltDb = new Float32Array(BAND_COUNT);
  let bassBands = 0;
  let midBands = 0;
  for (let b = 0; b < BAND_COUNT; b++) {
    const centerHz = Math.sqrt(edges[b] * edges[b + 1]) * binHz;
    tiltDb[b] = TILT_DB_PER_OCTAVE * Math.log2(centerHz / 1000);
    if (centerHz < BASS_MAX_HZ) bassBands = b + 1;
    if (centerHz < MID_MAX_HZ) midBands = b + 1;
  }

  const hann = new Float32Array(FFT_SIZE);
  for (let i = 0; i < FFT_SIZE; i++) {
    hann[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (FFT_SIZE - 1)));
  }

  // --- Pass 1: raw band levels in dB for every frame. ---
  const re = new Float32Array(FFT_SIZE);
  const im = new Float32Array(FFT_SIZE);
  const mags = new Float32Array(FFT_SIZE / 2);
  const halfWindow = FFT_SIZE >> 1;
  const beatBins = Math.ceil(BEAT_MAX_HZ / binHz) + 1;
  const previousLow = new Float32Array(beatBins);
  let peakDb = -Infinity;

  for (let f = 0; f < frameCount; f++) {
    const start = Math.round((f / fps) * sampleRate) - halfWindow;
    for (let i = 0; i < FFT_SIZE; i++) {
      const idx = start + i;
      re[i] = idx >= 0 && idx < mono.length ? mono[idx] * hann[i] : 0;
      im[i] = 0;
    }
    fft(re, im);
    for (let k = 0; k < mags.length; k++) {
      mags[k] = Math.sqrt(re[k] * re[k] + im[k] * im[k]);
    }

    // Spectral flux of the low end: how much louder the bass got since the
    // previous frame. Unlike plain energy it ignores a constant bass line
    // and only reacts to new hits (kick drum, bass note onsets).
    let flux = 0;
    for (let k = 1; k < beatBins; k++) {
      const rise = mags[k] - previousLow[k];
      if (f > 0 && rise > 0) flux += rise;
      previousLow[k] = mags[k];
    }
    bassFlux[f] = flux;

    const row = f * BAND_COUNT;
    for (let b = 0; b < BAND_COUNT; b++) {
      const lo = edges[b];
      const hi = edges[b + 1];
      let magnitude: number;

      if (hi - lo < 1) {
        // Band is narrower than one FFT bin (low frequencies): interpolate.
        const center = (lo + hi) / 2;
        const k = Math.floor(center);
        const t = center - k;
        magnitude = mags[k] * (1 - t) + mags[k + 1] * t;
      } else {
        // Loudest bin wins, so a single clear tone is not averaged away.
        magnitude = 0;
        for (let k = Math.floor(lo); k < Math.ceil(hi); k++) {
          if (mags[k] > magnitude) magnitude = mags[k];
        }
      }

      const db = 20 * Math.log10(magnitude + 1e-9) + tiltDb[b];
      bands[row + b] = db;
      if (db > peakDb) peakDb = db;
    }
  }

  // --- Normalise against the loudest moment of the track -> 0..1. ---
  // A (near) silent track has no meaningful peak; keep everything at 0.
  const isSilent = peakDb < -100;
  const floorDb = peakDb - DYNAMIC_RANGE_DB;
  for (let i = 0; i < bands.length; i++) {
    const v = isSilent ? 0 : (bands[i] - floorDb) / DYNAMIC_RANGE_DB;
    bands[i] = v <= 0 ? 0 : v >= 1 ? 1 : v;
  }

  // --- Band groups (from the un-smoothed values, smoothed afterwards). ---
  const mean = (row: number, from: number, to: number) => {
    let sum = 0;
    for (let b = from; b < to; b++) sum += bands[row + b];
    return to > from ? sum / (to - from) : 0;
  };
  for (let f = 0; f < frameCount; f++) {
    const row = f * BAND_COUNT;
    bass[f] = mean(row, 0, bassBands);
    mid[f] = mean(row, bassBands, midBands);
    treble[f] = mean(row, midBands, BAND_COUNT);
    level[f] = mean(row, 0, BAND_COUNT);
  }

  // --- Attack/release smoothing along time. ---
  const dt = 1 / fps;
  const attack = 1 - Math.exp(-dt / ATTACK_SECONDS);
  const release = 1 - Math.exp(-dt / RELEASE_SECONDS);
  for (let b = 0; b < BAND_COUNT; b++) {
    smoothOverTime(bands, BAND_COUNT, b, attack, release);
  }
  for (const group of [bass, mid, treble, level]) {
    smoothOverTime(group, 1, 0, attack, release);
  }

  // --- Beats: peaks in the bass flux that stand out from their surroundings. ---
  const window = Math.max(1, Math.round((BEAT_WINDOW_SECONDS * fps) / 2));
  const minGap = Math.max(1, Math.round(BEAT_MIN_GAP_SECONDS * fps));
  const decay = Math.exp(-dt / BEAT_DECAY_SECONDS);

  let maxFlux = 0;
  const prefix = new Float64Array(frameCount + 1);
  for (let f = 0; f < frameCount; f++) {
    if (bassFlux[f] > maxFlux) maxFlux = bassFlux[f];
    prefix[f + 1] = prefix[f] + bassFlux[f];
  }
  const minFlux = maxFlux * 0.08;

  let lastBeat = -minGap;
  let pulse = 0;
  let count = 0;
  for (let f = 0; f < frameCount; f++) {
    const from = Math.max(0, f - window);
    const to = Math.min(frameCount, f + window + 1);
    const average = (prefix[to] - prefix[from]) / (to - from);
    const flux = bassFlux[f];
    const isPeak =
      flux >= (f > 0 ? bassFlux[f - 1] : 0) &&
      flux > (f + 1 < frameCount ? bassFlux[f + 1] : 0);

    if (
      isPeak &&
      flux > minFlux &&
      flux > average * BEAT_THRESHOLD &&
      f - lastBeat >= minGap
    ) {
      lastBeat = f;
      pulse = 1;
      count++;
    } else {
      pulse *= decay;
    }

    beat[f] = pulse;
    beatCount[f] = count;
  }

  return {stepCount: frameCount, bands, bass, mid, treble, level, beat, beatCount};
}

const cache = new WeakMap<MediaUtilsAudioData, TrackAnalysis>();

/** Analyses the track on first use, then returns the cached result. */
export function getTrackAnalysis(audioData: MediaUtilsAudioData): TrackAnalysis {
  let analysis = cache.get(audioData);
  if (!analysis) {
    analysis = analyzeTrack(audioData);
    cache.set(audioData, analysis);
  }
  return analysis;
}

function stepAt(analysis: TrackAnalysis, seconds: number): number {
  const step = Math.round(seconds * ANALYSIS_RATE);
  return step < 0 ? 0 : step >= analysis.stepCount ? analysis.stepCount - 1 : step;
}

/** Bass / mid / treble / level / beat at a point in time (in seconds). */
export function getAudioFrame(
  analysis: TrackAnalysis,
  seconds: number,
): AudioFrame {
  const f = stepAt(analysis, seconds);
  return {
    bass: analysis.bass[f],
    mid: analysis.mid[f],
    treble: analysis.treble[f],
    level: analysis.level[f],
    beat: analysis.beat[f],
    beatCount: analysis.beatCount[f],
  };
}

/**
 * The spectrum at a point in time (in seconds), resampled to any number of
 * values (0..1 each, low frequencies first). `count` does not have to be a
 * power of two.
 */
export function getSpectrum(
  analysis: TrackAnalysis,
  seconds: number,
  count: number,
): number[] {
  const row = stepAt(analysis, seconds) * BAND_COUNT;
  const out = new Array<number>(count);

  for (let i = 0; i < count; i++) {
    const position = count > 1 ? (i / (count - 1)) * (BAND_COUNT - 1) : 0;
    const b = Math.floor(position);
    const t = position - b;
    const next = Math.min(BAND_COUNT - 1, b + 1);
    out[i] = analysis.bands[row + b] * (1 - t) + analysis.bands[row + next] * t;
  }

  return out;
}
