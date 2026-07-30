import { VisualizerPreview } from "@/components/VisualizerPreview";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center gap-6 bg-zinc-950 px-6 py-16 text-zinc-50">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Audio Visualizer v2 &mdash; Live Preview
        </h1>
        <p className="max-w-md text-sm text-zinc-400">
          Phase 1: audioreaktiver 3D-Balken-Visualizer (react-three-fiber +
          Remotion), gespeist mit echten FFT-Daten einer synthetischen
          Demo-Spur.
        </p>
      </div>
      <VisualizerPreview />
    </div>
  );
}
