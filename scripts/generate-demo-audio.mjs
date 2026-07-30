// Generates a short, fully synthetic (royalty-free) demo track used only
// for local development/testing of the audio-reactive visualizer.
// Layers: kick pulses (low), bass swell (low-mid), pad (mid), hi-hats (high).
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const OUT_PATH = fileURLToPath(
  new URL("../public/audio/demo-track.wav", import.meta.url)
);

const SAMPLE_RATE = 44100;
const DURATION_SECONDS = 12;
const NUM_SAMPLES = SAMPLE_RATE * DURATION_SECONDS;

function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);

function kick(t) {
  const beat = 0.5;
  const tb = t % beat;
  if (tb > 0.18) return 0;
  const envelope = Math.exp(-tb * 22);
  const freq = 120 - 70 * (tb / 0.18);
  return envelope * Math.sin(2 * Math.PI * freq * t);
}

function bass(t) {
  const swell = 0.6 + 0.4 * Math.sin(2 * Math.PI * 0.1 * t);
  return swell * Math.sin(2 * Math.PI * 55 * t);
}

function pad(t) {
  const swell = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.05 * t + 1);
  return (
    swell *
    0.5 *
    (Math.sin(2 * Math.PI * 220 * t) + Math.sin(2 * Math.PI * 330 * t))
  );
}

function hats(t) {
  const step = 0.25;
  const th = t % step;
  if (th > 0.03) return 0;
  const envelope = Math.exp(-th * 140);
  return envelope * (rand() * 2 - 1);
}

const samples = new Float32Array(NUM_SAMPLES);
let peak = 0;
for (let i = 0; i < NUM_SAMPLES; i++) {
  const t = i / SAMPLE_RATE;
  const value =
    kick(t) * 0.9 + bass(t) * 0.35 + pad(t) * 0.25 + hats(t) * 0.25;
  samples[i] = value;
  if (Math.abs(value) > peak) peak = Math.abs(value);
}

// Normalize to ~90% of full scale to avoid clipping.
const norm = peak > 0 ? 0.9 / peak : 1;

const bytesPerSample = 2;
const blockAlign = bytesPerSample * 1; // mono
const dataSize = NUM_SAMPLES * blockAlign;
const buffer = Buffer.alloc(44 + dataSize);

buffer.write("RIFF", 0);
buffer.writeUInt32LE(36 + dataSize, 4);
buffer.write("WAVE", 8);
buffer.write("fmt ", 12);
buffer.writeUInt32LE(16, 16); // fmt chunk size
buffer.writeUInt16LE(1, 20); // PCM
buffer.writeUInt16LE(1, 22); // mono
buffer.writeUInt32LE(SAMPLE_RATE, 24);
buffer.writeUInt32LE(SAMPLE_RATE * blockAlign, 28); // byte rate
buffer.writeUInt16LE(blockAlign, 32);
buffer.writeUInt16LE(16, 34); // bits per sample
buffer.write("data", 36);
buffer.writeUInt32LE(dataSize, 40);

for (let i = 0; i < NUM_SAMPLES; i++) {
  const s = Math.max(-1, Math.min(1, samples[i] * norm));
  buffer.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
}

mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, buffer);
console.log(`Wrote ${OUT_PATH} (${DURATION_SECONDS}s, ${SAMPLE_RATE}Hz mono)`);
