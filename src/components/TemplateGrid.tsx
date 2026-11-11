import Link from "next/link";
import { Thumbnail } from "@/components/ui/Thumbnail";
import { TEMPLATES } from "../../remotion/scene/templates";

/** The built-in templates as picture cards that open them in the editor. */
export function TemplateGrid({ limit }: { limit?: number }) {
  const templates = limit ? TEMPLATES.slice(0, limit) : TEMPLATES;
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {templates.map((template) => (
        <li key={template.id}>
          <Link
            href={`/editor?template=${template.id}`}
            className="group flex flex-col overflow-hidden rounded-[10px] border border-hairline bg-panel outline-none hover:border-amber-dim focus-visible:border-amber"
          >
            <Thumbnail src={`/thumbnails/templates/${template.id}.jpg`} dimmed />
            <span className="truncate px-3 py-2 font-mono text-[11px] tracking-[0.06em] text-steel uppercase group-hover:text-cream">
              {template.label}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
