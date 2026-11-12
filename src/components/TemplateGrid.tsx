import { Stagger, StaggerItem } from "@/components/site/kit";
import { TemplateCard } from "@/components/site/TemplateCard";
import { TEMPLATE_SUMMARIES } from "@/components/site/templateData";

/** The built-in templates as picture cards that open them in the editor. */
export function TemplateGrid({ limit }: { limit?: number }) {
  const templates = limit ? TEMPLATE_SUMMARIES.slice(0, limit) : TEMPLATE_SUMMARIES;
  return (
    <Stagger as="ul" className="db-grid" gap={0.05}>
      {templates.map((template) => (
        <StaggerItem as="li" key={template.id}>
          <TemplateCard template={template} href={`/editor?template=${template.id}`} />
        </StaggerItem>
      ))}
    </Stagger>
  );
}
