import { createFileRoute } from "@tanstack/react-router";
import { useActiveTenant, useApp } from "@/lib/shiftora-store";
import { shiftoraApi, type LearningModule, type LearningPath, type LearningUnit } from "@/lib/shiftora-api";
import { Card, PageHeader, ProgressBar, Chip, Btn, SectionLabel, Metric } from "@/components/shiftora/primitives";
import { useI18n } from "@/lib/use-i18n";
import {
  IconBook,
  IconCheck,
  IconClock,
  IconExternalLink,
  IconLanguage,
  IconLock,
  IconPlayerPlay,
  IconSchool,
  IconTarget,
} from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/learner/learning")({ component: Learning });

function Learning() {
  const tenant = useActiveTenant();
  const { t } = useI18n();
  const currentUser = useApp((s) => s.currentUser);
  const [assignmentId, setAssignmentId] = useState("");
  const [path, setPath] = useState<LearningPath | null>(null);
  const [activeModuleId, setActiveModuleId] = useState("");
  const [activeUnitId, setActiveUnitId] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentUser?.email) return;
    setError("");
    void shiftoraApi
      .learningPath(tenant.id, currentUser.email, assignmentId || undefined)
      .then((data) => {
        setPath(data);
        setAssignmentId(data.activeAssignment.id);
        const nextModule = data.modules.find((module) => module.progress < 100) ?? data.modules[0];
        setActiveModuleId(nextModule?.id ?? "");
        setActiveUnitId(nextModule?.units.find((unit) => unit.status !== "completed")?.id ?? nextModule?.units[0]?.id ?? "");
      })
      .catch((err) => setError((err as Error).message));
  }, [assignmentId, currentUser?.email, tenant.id]);

  const activeModule = useMemo(
    () => path?.modules.find((module) => module.id === activeModuleId) ?? path?.modules[0],
    [activeModuleId, path?.modules],
  );
  const activeUnit = useMemo(
    () => activeModule?.units.find((unit) => unit.id === activeUnitId) ?? activeModule?.units[0],
    [activeModule, activeUnitId],
  );

  const completeUnit = async () => {
    if (!path || !activeModule || !activeUnit || !currentUser?.email) return;
    setSaving(true);
    setError("");
    try {
      const updated = await shiftoraApi.saveLearningProgress(tenant.id, currentUser.email, {
        assignmentId: path.activeAssignment.id,
        moduleId: activeModule.id,
        unitId: activeUnit.id,
        status: "completed",
        score: activeUnit.type === "quiz" ? 100 : undefined,
        timeSpentSeconds: activeUnit.estimatedMinutes * 60,
      });
      setPath(updated);
      const refreshedModule = updated.modules.find((module) => module.id === activeModule.id);
      const nextUnit = refreshedModule?.units.find((unit) => unit.status !== "completed");
      if (nextUnit) {
        setActiveUnitId(nextUnit.id);
      } else {
        const nextModule = updated.modules.find((module) => module.progress < 100);
        setActiveModuleId(nextModule?.id ?? activeModule.id);
        setActiveUnitId(nextModule?.units[0]?.id ?? activeUnit.id);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={t("learningPath")}
        subtitle={
          path
            ? `${path.activeAssignment.schoolName} · ${path.activeAssignment.grade} ${path.activeAssignment.division} · ${path.activeAssignment.subject}`
            : t("loadingSelfPacedModules")
        }
        right={
          path && (
            <Chip tone="blue">
              {path.completedModules}/{path.totalModules} {t("modulesComplete")}
            </Chip>
          )
        }
      />

      {/* Completion banner */}
      {path && path.totalModules > 0 && path.completedModules === path.totalModules && (
        <Card className="mb-4" style={{ borderColor: "var(--okb)", background: "var(--okl)" }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-[13px]" style={{ color: "var(--ok)" }}>Learning path complete</div>
              <div className="text-[12px] text-text-muted mt-0.5">Your workshop session is now unlocked.</div>
            </div>
            <Btn as="link" href="/learner/workshop" size="sm">Go to Workshop</Btn>
          </div>
        </Card>
      )}

      {error && (
        <Card className="mb-4">
          <div className="text-[13px] text-[color:var(--er)]">{error}</div>
        </Card>
      )}

      {path && (
        <>
          {path.assignments.length > 1 && (
            <Card className="mb-4">
              <SectionLabel>{t("teachingContext")}</SectionLabel>
              <div className="mt-2 flex flex-wrap gap-2">
                {path.assignments.map((assignment) => (
                  <button
                    key={assignment.id}
                    onClick={() => setAssignmentId(assignment.id)}
                    className="rounded-md border px-3 py-2 text-left text-[12px] transition-colors"
                    style={{
                      background: assignment.id === path.activeAssignment.id ? "var(--bl)" : "var(--s3)",
                      color: assignment.id === path.activeAssignment.id ? "var(--bt)" : "var(--t1)",
                      borderColor: assignment.id === path.activeAssignment.id ? "var(--bb)" : "var(--bd)",
                    }}
                  >
                    <span className="block font-semibold">
                      {assignment.grade} {assignment.division} · {assignment.subject}
                    </span>
                    <span className="text-[11px] opacity-75">{assignment.responsibility}</span>
                  </button>
                ))}
              </div>
            </Card>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <Metric label={t("readiness")} value={`${path.readinessScore}%`} sub={t("latestCheck")} tone="blue" icon={<IconTarget className="size-3.5" />} />
            <Metric label={t("modules")} value={path.totalModules} sub={t("matchedToRole")} tone="teal" icon={<IconBook className="size-3.5" />} />
            <Metric label={t("duration")} value={`${path.totalMinutes}m`} sub={t("selfPaced")} tone="gold" icon={<IconClock className="size-3.5" />} />
            <Metric label={t("language")} value={activeModule?.language ?? t("mixed")} sub={t("contentLanguage")} tone="violet" icon={<IconLanguage className="size-3.5" />} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-4">
            <div className="space-y-3">
              {path.modules.map((module) => (
                <ModuleCard
                  key={module.id}
                  module={module}
                  active={module.id === activeModule?.id}
                  onClick={() => {
                    setActiveModuleId(module.id);
                    setActiveUnitId(module.units.find((unit) => unit.status !== "completed")?.id ?? module.units[0]?.id ?? "");
                  }}
                />
              ))}
            </div>

            <Card>
              {activeModule && activeUnit ? (
                <>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <SectionLabel>{activeModule.level} {t("modules")}</SectionLabel>
                      <h2 className="text-[18px] font-bold mt-1">{activeModule.title}</h2>
                      <p className="text-[12px] text-text-muted mt-1">{activeModule.description}</p>
                    </div>
                    <Chip tone={activeUnit.status === "completed" ? "teal" : "gold"}>
                      {activeUnit.status === "completed" ? t("completed") : `${activeUnit.estimatedMinutes} ${t("minutes")}`}
                    </Chip>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-5">
                    {activeModule.units.map((unit) => (
                      <button
                        key={unit.id}
                        onClick={() => setActiveUnitId(unit.id)}
                        className="rounded-md border px-3 py-2 text-left text-[12px]"
                        style={{
                          background: unit.id === activeUnit.id ? "var(--bl)" : "var(--s3)",
                          color: unit.id === activeUnit.id ? "var(--bt)" : "var(--t1)",
                          borderColor: unit.id === activeUnit.id ? "var(--bb)" : "var(--bd)",
                        }}
                      >
                        {unit.status === "completed" && <IconCheck className="inline size-3 mr-1" />}
                        {unit.sortOrder}. {unit.title}
                      </button>
                    ))}
                  </div>

                  <LearningUnitView unit={activeUnit} />

                  <div className="mt-5 flex justify-end">
                    <Btn onClick={completeUnit} disabled={saving || activeUnit.status === "completed"}>
                      {activeUnit.status === "completed" ? (
                        <>
                          <IconCheck className="size-4" /> {t("completed")}
                        </>
                      ) : (
                        <>
                          <IconPlayerPlay className="size-4" /> {saving ? t("saving") : t("markComplete")}
                        </>
                      )}
                    </Btn>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-[13px] text-text-muted">
                  {t("noLearningModules")}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function ModuleCard({
  module,
  active,
  onClick,
}: {
  module: LearningModule;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left"
    >
      <Card className={active ? "border-[color:var(--bb)]" : ""} hover>
        <div className="flex items-start gap-3">
          <div
            className="size-9 rounded-md grid place-items-center font-bold text-[14px] shrink-0"
            style={{
              background: module.progress === 100 ? "var(--okl)" : "var(--bl)",
              color: module.progress === 100 ? "var(--ok)" : "var(--bt)",
            }}
          >
            {module.progress === 100 ? <IconCheck className="size-4" /> : module.sortOrder}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-[13px]">{module.title}</span>
              {module.mandatory && (
                <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium"
                  style={{ background: "var(--erl)", color: "var(--er)" }}>
                  <IconLock className="size-2.5" /> Required
                </span>
              )}
            </div>
            <p className="text-[12px] text-text-muted mt-0.5 mb-2">{module.description}</p>
            <div className="flex items-center justify-between text-[11px] text-text-muted mb-1">
              <span><IconSchool className="inline size-3 mr-1" />{module.level}</span>
              <span>{module.progress}%</span>
            </div>
            <ProgressBar value={module.progress} tone={module.progress === 100 ? "teal" : "blue"} />
          </div>
        </div>
      </Card>
    </button>
  );
}

function toEmbedUrl(url: string): string {
  const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : url;
}

function LearningUnitView({ unit }: { unit: LearningUnit }) {
  const { t } = useI18n();
  const summary = String(unit.content.summary ?? "");
  const body = String(unit.content.body ?? "");
  const videoUrl = String(unit.content.videoUrl ?? "");
  const activity = String(unit.content.activity ?? "");
  const question = String(unit.content.question ?? "");
  const answer = String(unit.content.answer ?? "");
  const resources = (unit.content.externalResources ?? []) as { title: string; url: string; source?: string }[];

  return (
    <div className="rounded-lg border border-border bg-surface-2 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Chip tone={unit.type === "quiz" ? "violet" : unit.type === "activity" ? "gold" : unit.type === "video" ? "blue" : unit.type === "external" ? "teal" : "blue"}>
          {unit.type}
        </Chip>
        <span className="text-[11px] text-text-muted">{unit.estimatedMinutes} {t("minutes")}</span>
      </div>
      <h3 className="text-[16px] font-semibold mb-2">{unit.title}</h3>
      {summary && <p className="text-[13px] text-text mb-3">{summary}</p>}

      {/* Video embed */}
      {unit.type === "video" && videoUrl && (
        <div className="rounded-lg overflow-hidden mb-3" style={{ aspectRatio: "16/9" }}>
          <iframe
            src={toEmbedUrl(videoUrl)}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={unit.title}
          />
        </div>
      )}

      {body && <p className="text-[12.5px] leading-6 text-text-muted mb-3 whitespace-pre-line">{body}</p>}
      {activity && (
        <div className="rounded-md border border-[color:var(--gb)] bg-[color:var(--gl)] p-3 text-[12.5px] text-[color:var(--gt)]">
          <span className="font-semibold">{t("activity")}: </span>
          <span className="whitespace-pre-line">{activity}</span>
        </div>
      )}
      {question && (
        <div className="rounded-md border border-[color:var(--vib)] bg-[color:var(--vil)] p-3 text-[12.5px] text-[color:var(--vi)]">
          <div className="font-semibold mb-1">{question}</div>
          {answer && <div>{t("expectedAnswer")}: {answer}</div>}
        </div>
      )}

      {/* External resources */}
      {resources.length > 0 && (
        <div className="mt-4 rounded-md border border-border p-3">
          <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-2">Self-study resources</div>
          <div className="space-y-1.5">
            {resources.map((r, i) => (
              <a key={i} href={r.url} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 text-[12.5px] text-blue-600 hover:underline">
                <IconExternalLink className="size-3.5 shrink-0" />
                {r.title}
                {r.source && (
                  <Chip tone="muted" className="text-[10px]">{r.source}</Chip>
                )}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
