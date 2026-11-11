import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DeleteProjectButton } from "@/components/DeleteProjectButton";
import { prisma } from "@/lib/prisma";
import { TEMPLATES } from "../../../remotion/scene/templates";

const dateFormat = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

/** The signed-in user's saved projects, plus the templates to start a new one from. */
export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/dashboard");

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, updatedAt: true },
  });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-10">
      <section className="flex flex-col gap-4">
        <h1 className="font-sans text-2xl font-semibold tracking-tight text-cream">
          Your projects
        </h1>

        {projects.length === 0 ? (
          <p className="text-sm text-steel">
            Nothing saved yet. Start from a template below, load a track and
            press Save in the editor.
          </p>
        ) : (
          <ul className="flex flex-col rounded-[10px] border border-hairline bg-panel">
            {projects.map((project) => (
              <li
                key={project.id}
                className="flex items-center gap-4 border-b border-hairline px-4 py-3 last:border-b-0"
              >
                <Link
                  href={`/?project=${project.id}`}
                  className="flex min-w-0 flex-1 flex-col gap-0.5 outline-none hover:text-amber focus-visible:text-amber"
                >
                  <span className="truncate text-sm text-cream">
                    {project.title}
                  </span>
                  <span className="font-mono text-[11px] tracking-[0.06em] text-steel uppercase">
                    Changed {dateFormat.format(project.updatedAt)}
                  </span>
                </Link>
                <DeleteProjectButton id={project.id} title={project.title} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-[11px] tracking-[0.12em] text-steel uppercase">
          Start a new project
        </h2>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {TEMPLATES.map((template) => (
            <li key={template.id}>
              <Link
                href={`/?template=${template.id}`}
                className="flex flex-col gap-1 rounded-[10px] border border-hairline bg-panel px-4 py-3 outline-none hover:border-amber-dim focus-visible:border-amber"
              >
                <span className="text-sm text-cream">{template.label}</span>
                <span className="text-xs text-steel">
                  {template.scene.elements.map((e) => e.name).join(" · ")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
