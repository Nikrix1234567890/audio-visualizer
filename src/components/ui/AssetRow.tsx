"use client";

import { useRef, useState } from "react";

const KINDS = {
  image: {
    accept: "image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp",
    choose: "Choose picture",
    hint: "PNG, JPG or WebP, up to 10 MB.",
  },
  model: {
    accept: ".glb,model/gltf-binary",
    choose: "Choose model",
    hint: "A .glb file, up to 50 MB.",
  },
} as const;

/**
 * A file parameter (a picture or a 3D model). Choosing a file uploads it
 * straight away - the render server needs it later - and stores the key it
 * gets back; the row then offers to replace or remove it. Pictures show a
 * thumbnail in a small recessed well.
 */
export function AssetRow({
  kind,
  label,
  value,
  onChange,
}: {
  kind: keyof typeof KINDS;
  label: string;
  /** Storage key of the uploaded file, or "" for none. */
  value: string;
  onChange: (value: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { accept, choose, hint } = KINDS[kind];

  const upload = async (file: File) => {
    setError(null);
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append(kind, file);
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Upload failed.");
      onChange(data.key as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const buttonClass =
    "rounded-md border border-line px-2.5 py-1.5 font-mono text-[11px] tracking-[0.06em] text-ink uppercase outline-none hover:border-accent-dim hover:text-accent focus-visible:border-accent disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="flex flex-col gap-2">
      <span className="font-mono text-[11px] tracking-[0.08em] text-muted uppercase">
        {label}
      </span>

      <div className="flex items-center gap-3">
        {kind === "image" ? (
          <div
            role="img"
            aria-label={value ? "Chosen picture" : "No picture chosen"}
            className="h-12 w-12 shrink-0 rounded-md border border-line bg-canvas bg-cover bg-center shadow-scope-recessed"
            style={
              value ? { backgroundImage: `url("/api/files/${value}")` } : undefined
            }
          />
        ) : (
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${
              value ? "bg-accent shadow-glow-active" : "bg-accent-dim"
            }`}
            aria-label={value ? "Model loaded" : "No model chosen"}
            role="img"
          />
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isUploading}
            onClick={() => input.current?.click()}
            className={buttonClass}
          >
            {isUploading ? "Uploading…" : value ? "Replace" : choose}
          </button>
          {value && !isUploading && (
            <button type="button" onClick={() => onChange("")} className={buttonClass}>
              Remove
            </button>
          )}
        </div>
      </div>

      <input
        ref={input}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = "";
        }}
      />

      {error && <p className="text-xs text-red-400">{error}</p>}
      {!value && !error && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}
