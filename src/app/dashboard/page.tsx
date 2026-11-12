import { Crown, Download, Film, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DeleteButton } from "@/components/DeleteButton";
import { DeleteProjectButton } from "@/components/DeleteProjectButton";
import { ProjectThumb } from "@/components/ProjectThumb";
import { RefreshWhile } from "@/components/RefreshWhile";
import { SiteFooter } from "@/components/SiteFooter";
import { FREE_TOP, PREMIUM_TOP, TEMPLATE_COUNT } from "@/components/site/content";
import { Rise, Stagger, StaggerItem } from "@/components/site/kit";
import { ArrowLink } from "@/components/site/sections";
import { TemplateGrid } from "@/components/TemplateGrid";
import { prisma } from "@/lib/prisma";
import { getTier } from "@/lib/userTier";
import { sanitizeAspect, sanitizeResolution } from "@/lib/visualizerSettings";
import { outputSize } from "../../../remotion/types";

export const metadata: Metadata = { title: "Your projects" };

/** Finished videos shown in the history. */
const MAX_VIDEOS = 30;
/** Templates offered under "Start from a template". */
const STARTERS = 8;

const dateFormat = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});
const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** "2 hours ago", "yesterday", and a plain date for anything older than a week. */
function ago(date: Date): string {
  const minutes = Math.round((date.getTime() - Date.now()) / 60_000);
  if (Math.abs(minutes) < 1) return "just now";
  if (Math.abs(minutes) < 60) return relative.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return relative.format(hours, "hour");
  const days = Math.round(hours / 24);
  if (Math.abs(days) <= 7) return relative.format(days, "day");
  return dateFormat.format(date);
}

/** What a video is: its size and frame rate, read from the job. */
function describeVideo(settings: unknown): { size: string; fps: string } {
  const raw = (settings ?? {}) as Record<string, unknown>;
  const { width, height } = outputSize(
    sanitizeAspect(raw.aspect),
    sanitizeResolution(raw.resolution),
  );
  const fps = typeof raw.fps === "number" ? raw.fps : 30;
  return { size: `${width} x ${height}`, fps: `${fps} fps` };
}

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

type JobProject = { id: string; title: string; updatedAt: Date } | null;

/** The picture of a video: its project's, or a plain tile for one made without a project. */
function JobThumb({ project }: { project: JobProject }) {
  if (!project) {
    return (
      <span className="thumb job-thumb job-thumb--none">
        <Film className="pf-i" aria-hidden />
      </span>
    );
  }
  return (
    <ProjectThumb
      className="thumb job-thumb"
      src={`/api/files/thumbs/${project.id}.jpg?v=${project.updatedAt.getTime()}`}
    />
  );
}

/** The signed-in user's saved projects and videos, plus the templates to start a new project from. */
export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/dashboard");
  const userId = session.user.id;

  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      updatedAt: true,
      settings: true,
      _count: { select: { renderJobs: true } },
    },
  });

  // Videos that are waiting or being drawn right now.
  const running = await prisma.renderJob.findMany({
    where: { userId, status: { in: ["QUEUED", "RENDERING"] } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      status: true,
      progress: true,
      settings: true,
      projectId: true,
      project: { select: { id: true, title: true, updatedAt: true } },
    },
  });

  const videos = await prisma.renderJob.findMany({
    where: { userId, status: "DONE", outputPath: { not: null } },
    orderBy: { createdAt: "desc" },
    take: MAX_VIDEOS,
    select: {
      id: true,
      outputPath: true,
      settings: true,
      completedAt: true,
      createdAt: true,
      project: { select: { id: true, title: true, updatedAt: true } },
    },
  });

  const tier = await getTier(userId);

  return (
    <div className="site db">
      <RefreshWhile active={running.length > 0} />
      <div className="db-wrap">
        <Rise className="db-head">
          <div className="pf-stack gap-1.5">
            <h1 className="db-h1">Your projects</h1>
            <span className="db-sub">
              {count(projects.length, "project", "projects")},{" "}
              {count(videos.length + running.length, "video", "videos")}
            </span>
          </div>
          <Link href="/editor" className="pf-btn pf-btn--cta pf-btn--lg">
            <Plus className="pf-i" aria-hidden />
            New project
          </Link>
        </Rise>

        {tier === "FREE" && (
          <Rise delay={0.05}>
            <div className="pf-banner pf-banner--premium">
              <Crown className="pf-i" aria-hidden />
              <span>
                <b>Your videos export at up to {FREE_TOP} with a small watermark.</b> Premium
                goes up to {PREMIUM_TOP}, without it.
              </span>
              <Link href="/pricing" className="pf-btn pf-btn--premium pf-btn--sm pf-banner__action">
                See Premium
              </Link>
            </div>
          </Rise>
        )}

        <section aria-label="Projects">
          <Stagger as="ul" className="db-grid" gap={0.05} delay={0.1}>
            <StaggerItem as="li">
              <Link href="/editor" className="pf-drop db-new">
                <span className="pf-drop__icon">
                  <Plus className="pf-i pf-i--lg" aria-hidden />
                </span>
                <span className="pf-drop__title">New project</span>
                <span className="pf-drop__hint">Start with your track</span>
              </Link>
            </StaggerItem>
            {projects.map((project) => {
              const job = running.find((j) => j.projectId === project.id);
              const aspect = sanitizeAspect((project.settings as Record<string, unknown> | null)?.aspect);
              const href = `/editor?project=${project.id}`;
              return (
                <StaggerItem as="li" key={project.id}>
                  <div className="pf-tcard db-project">
                    <Link href={href} tabIndex={-1} aria-hidden className="db-project__media">
                      {/* The address changes with every save, so the browser
                          never shows the picture of an older version. */}
                      <ProjectThumb
                        src={`/api/files/thumbs/${project.id}.jpg?v=${project.updatedAt.getTime()}`}
                      />
                      <span className="pf-tcard__badges">
                        {job ? (
                          <span className="pf-badge pf-badge--accent">
                            <span className="pf-badge__dot pf-badge__dot--live" />
                            {job.status === "QUEUED"
                              ? "Queued"
                              : `Rendering ${Math.round(job.progress * 100)}%`}
                          </span>
                        ) : (
                          <span className="pf-badge pf-badge--solid">{aspect}</span>
                        )}
                      </span>
                    </Link>
                    <span className="pf-tcard__body">
                      <Link href={href} className="pf-stack db-project__text">
                        <span className="pf-tcard__name">{project.title}</span>
                        <span className="pf-tcard__meta">
                          Edited {ago(project.updatedAt)}
                          {project._count.renderJobs > 0 &&
                            ` · ${count(project._count.renderJobs, "video", "videos")}`}
                        </span>
                      </Link>
                      <DeleteProjectButton id={project.id} title={project.title} />
                    </span>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
          {projects.length === 0 && (
            <p className="db-sub db-hint">
              Nothing saved yet. Open the editor, load a track and save the project. It shows
              up here with a picture.
            </p>
          )}
        </section>

        <section>
          <h2 className="db-h2">Videos</h2>
          {running.length === 0 && videos.length === 0 ? (
            <div className="pf-empty db-empty">
              <span className="pf-empty__icon">
                <Film className="pf-i pf-i--lg" aria-hidden />
              </span>
              <span className="pf-empty__title">No videos yet</span>
              <span>Videos you export while logged in are kept here, ready to download again.</span>
              <Link href="/editor" className="pf-btn pf-btn--secondary mt-3">
                Open the editor
              </Link>
            </div>
          ) : (
            <Stagger as="ul" className="db-jobs" gap={0.04}>
              {running.map((job) => {
                const video = describeVideo(job.settings);
                const percent = Math.round(job.progress * 100);
                return (
                  <StaggerItem as="li" key={job.id} className="pf-job">
                    <JobThumb project={job.project} />
                    <div className="pf-stack gap-1.5">
                      <span className="pf-job__title">{job.project?.title ?? "Video"}</span>
                      {job.status === "RENDERING" && (
                        <div
                          className="pf-progress"
                          role="progressbar"
                          aria-label="Rendering"
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={percent}
                          style={{ "--p": job.progress } as React.CSSProperties}
                        >
                          <span />
                        </div>
                      )}
                      <span className="pf-job__meta">
                        <span>{video.size}</span>
                        <span>{video.fps}</span>
                        {job.status === "RENDERING" && <span>{percent}%</span>}
                      </span>
                    </div>
                    {job.status === "QUEUED" ? (
                      <span className="pf-badge pf-badge--outline">Queued</span>
                    ) : (
                      <span className="pf-badge pf-badge--accent">
                        <span className="pf-badge__dot pf-badge__dot--live" />
                        Rendering
                      </span>
                    )}
                  </StaggerItem>
                );
              })}
              {videos.map((video) => {
                const info = describeVideo(video.settings);
                return (
                  <StaggerItem as="li" key={video.id} className="pf-job">
                    <JobThumb project={video.project} />
                    <div className="pf-stack gap-1.5">
                      <span className="pf-job__title">{video.project?.title ?? "Video"}</span>
                      <span className="pf-job__meta">
                        <span>{info.size}</span>
                        <span>{info.fps}</span>
                        <span>{dateFormat.format(video.completedAt ?? video.createdAt)}</span>
                      </span>
                    </div>
                    <span className="db-job__actions">
                      <a
                        href={`/api/files/${video.outputPath}`}
                        download
                        className="pf-btn pf-btn--secondary pf-btn--sm"
                      >
                        <Download className="pf-i pf-i--sm" aria-hidden />
                        Download
                      </a>
                      <DeleteButton
                        url={`/api/render/${video.id}`}
                        question="Delete this video? This cannot be undone."
                        label="Delete this video"
                      />
                    </span>
                  </StaggerItem>
                );
              })}
            </Stagger>
          )}
        </section>

        <section>
          <div className="db-row">
            <h2 className="db-h2">Start from a template</h2>
            <ArrowLink href="/templates">See all {TEMPLATE_COUNT} templates</ArrowLink>
          </div>
          <TemplateGrid limit={STARTERS} />
        </section>
      </div>
      <SiteFooter />
    </div>
  );
}
