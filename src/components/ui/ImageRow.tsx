"use client";

import { useRef, useState } from "react";

const ACCEPTED_IMAGES = "image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp";

/**
 * A picture parameter. Choosing a file uploads it straight away (the render
 * server needs it later) and stores the key it gets back; the row then shows
 * a thumbnail with buttons to replace or remove it.
 */
export function ImageRow({
  label,
  value,
  onChange,
}: {
  label: string;
  /** Storage key of the uploaded picture, or "" for none. */
  value: string;
  onChange: (value: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setError(null);
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
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
    "rounded-md border border-hairline px-2.5 py-1.5 font-mono text-[11px] tracking-[0.06em] text-cream uppercase outline-none hover:border-amber-dim hover:text-amber focus-visible:border-amber disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="flex flex-col gap-2">
      <span className="font-mono text-[11px] tracking-[0.08em] text-steel uppercase">
        {label}
      </span>

      <div className="flex items-center gap-3">
        <div
          role="img"
          aria-label={value ? "Chosen picture" : "No picture chosen"}
          className="h-12 w-12 shrink-0 rounded-md border border-hairline bg-chassis bg-cover bg-center shadow-scope-recessed"
          style={value ? { backgroundImage: `url("/api/files/${value}")` } : undefined}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isUploading}
            onClick={() => input.current?.click()}
            className={buttonClass}
          >
            {isUploading ? "Uploading…" : value ? "Replace" : "Choose picture"}
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
        accept={ACCEPTED_IMAGES}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = "";
        }}
      />

      {error && <p className="text-xs text-red-400">{error}</p>}
      {!value && !error && (
        <p className="text-xs text-steel">PNG, JPG or WebP, up to 10 MB.</p>
      )}
    </div>
  );
}
