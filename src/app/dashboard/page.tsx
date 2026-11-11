import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DeleteButton } from "@/components/DeleteButton";
import { DeleteProjectButton } from "@/components/DeleteProjectButton";
import { RefreshWhile } from "@/components/RefreshWhile";
import { TemplateGrid } from "@/components/TemplateGrid";
import { prisma } from "@/lib/prisma";
import { sanitizeAspect, sanitizeResolution } from "@/lib/visualizerSettings";
import { outputSize } from "../../../remotion/types";

/** Finished videos shown in the history. */
const MAX_VIDEOS = 30;

const dateFormat = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

/** What a finished video is: its size and frame rate, read from the job. */
function describeVideo(settings: unknown): string {
  const raw = (settings ?? {}) as Record<string, unknown>;
  const { width, height } = outputSize(
    sanitizeAspect(raw.aspect),
    sanitizeResolution(raw.resolution),
  );
  const fps = typeof raw.fps === "number" ? raw.fps : 30;
  return `${width} x ${height} · ${fps} fps`;
}

/** The signed-in user's saved projects and videos, plus the templates to start a new project from. */
export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/dashboard");

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, updatedAt: true },
  });

  // Videos that are waiting or being drawn right now.
  const running = await prisma.renderJob.findMany({
    where: { userId: session.user.id, status: { in: ["QUEUED", "RENDERING"] } },
    orderBy: { createdAt: "asc" },
    select: { id: true, status: true, progress: true, settings: true },
  });

  const videos = await prisma.renderJob.findMany({
    where: { userId: session.user.id, status: "DONE", outputPath: { not: null } },
    orderBy: { createdAt: "desc" },
    take: MAX_VIDEOS,
    select: { id: true, outputPath: true, settings: true, completedAt: true, createdAt: true },
  });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-10">
      <section className="flex flex-col gap-4">
        <h1 className="font-sans text-2xl font-semibold tracking-tight text-ink">
          Your projects
        </h1>

        {projects.length === 0 ? (
          <p className="text-sm text-muted">
            Nothing saved yet. Start from a template below, load a track and
            press Save in the editor.
          </p>
        ) : (
          <ul className="flex flex-col rounded-2xl border border-line bg-surface">
            {projects.map((project) => (
              <li
                key={project.id}
                className="flex items-center gap-4 border-b border-line px-4 py-3 last:border-b-0"
              >
                <Link
                  href={`/editor?project=${project.id}`}
                  className="flex min-w-0 flex-1 flex-col gap-0.5 outline-none hover:text-accent focus-visible:text-accent"
                >
                  <span className="truncate text-sm text-ink">
                    {project.title}
                  </span>
                  <span className="font-mono text-[11px] tracking-[0.06em] text-muted uppercase">
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
        <h2 className="font-mono text-[11px] tracking-[0.12em] text-muted uppercase">
          Your videos
        </h2>
        <RefreshWhile active={running.length > 0} />
        {running.length > 0 && (
          <ul className="flex flex-col rounded-2xl border border-accent-dim bg-surface">
            {running.map((job) => (
              <li
                key={job.id}
                className="flex items-center gap-4 border-b border-line px-4 py-3 last:border-b-0"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="text-sm text-ink tabular-nums">
                    {describeVideo(job.settings)}
                  </span>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-canvas">
                    <div
                      className="h-full bg-accent shadow-glow-active transition-[width] duration-500"
                      style={{ width: `${Math.round(job.progress * 100)}%` }}
                    />
                  </div>
                </div>
                <span className="shrink-0 font-mono text-[11px] tracking-[0.06em] text-accent uppercase tabular-nums">
                  {job.status === "QUEUED"
                    ? "Waiting"
                    : `Rendering ${Math.round(job.progress * 100)}%`}
                </span>
              </li>
            ))}
          </ul>
        )}
        {videos.length === 0 && running.length > 0 ? null : videos.length === 0 ? (
          <p className="text-sm text-muted">
            Videos you render while logged in are kept here, ready to
            download again.
          </p>
        ) : (
          <ul className="flex flex-col rounded-2xl border border-line bg-surface">
            {videos.map((video) => (
              <li
                key={video.id}
                className="flex items-center gap-4 border-b border-line px-4 py-3 last:border-b-0"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-sm text-ink tabular-nums">
                    {describeVideo(video.settings)}
                  </span>
                  <span className="font-mono text-[11px] tracking-[0.06em] text-muted uppercase">
                    Rendered {dateFormat.format(video.completedAt ?? video.createdAt)}
                  </span>
                </div>
                <a
                  href={`/api/files/${video.outputPath}`}
                  download
                  className="shrink-0 rounded-md border border-line px-2.5 py-1.5 font-mono text-[11px] tracking-[0.06em] text-ink uppercase outline-none hover:border-accent-dim hover:text-accent focus-visible:border-accent"
                >
                  Download
                </a>
                <DeleteButton
                  url={`/api/render/${video.id}`}
                  question="Delete this video? This cannot be undone."
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-[11px] tracking-[0.12em] text-muted uppercase">
          Start a new project
        </h2>
        <TemplateGrid />
      </section>
    </div>
  );
}
