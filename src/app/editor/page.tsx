import { Editor } from "@/components/Editor";

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

/**
 * The editor. `/editor?project=<id>` opens a saved project,
 * `/editor?template=<id>` starts from a built-in template and
 * `/editor?scene=<id>` from a template somebody saved and shared.
 */
export default async function EditorPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const projectId = first(params.project) ?? null;
  const templateId = first(params.template) ?? null;
  const sceneId = first(params.scene) ?? null;

  return (
    // On large screens the editor fills exactly the space under the nav bar
    // and never scrolls as a page; on small screens it stacks and scrolls.
    <div className="flex flex-1 flex-col bg-canvas lg:min-h-0 lg:basis-0 lg:overflow-hidden">
      <Editor
        // A different project or template is a fresh editor, not an update.
        key={`${projectId ?? ""}:${templateId ?? ""}:${sceneId ?? ""}`}
        initialProjectId={projectId}
        initialTemplateId={templateId}
        initialSceneId={sceneId}
      />
    </div>
  );
}
