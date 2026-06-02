import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useActiveTenant, useApp } from "@/lib/shiftora-store";
import { shiftoraApi, type Journey } from "@/lib/shiftora-api";
import { useI18n } from "@/lib/use-i18n";
import type { I18nKey } from "@/lib/i18n";
import {
  Card,
  PageHeader,
  Metric,
  Chip,
  SectionLabel,
  ProgressBar,
  Btn,
} from "@/components/shiftora/primitives";
import {
  IconBolt,
  IconTarget,
  IconTrendingUp,
  IconSparkles,
  IconCheck,
  IconArrowRight,
  IconClock,
  IconFlame,
  IconLock,
  IconMedal2,
  IconTrophy,
} from "@tabler/icons-react";
import { useEffect, useState, type ReactNode } from "react";

export const Route = createFileRoute("/learner/dashboard")({ component: LearnerDashboard });

function LearnerDashboard() {
  const tenant = useActiveTenant();
  const { t } = useI18n();
  const currentUser = useApp((s) => s.currentUser);
  const nav = useNavigate();
  const [journey, setJourney] = useState<Journey | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!currentUser?.email) return;
    setError("");
    void shiftoraApi
      .journey(tenant.id, currentUser.email)
      .then(setJourney)
      .catch((err) => setError((err as Error).message));
  }, [currentUser?.email, tenant.id]);

  const completed = journey?.metrics.completedSteps ?? 0;
  const game = journey ? gameStats(journey, t) : null;

  return (
    <div>
      <PageHeader
        title={`${t("welcomeBack")}, ${journey?.user.name.split(" ").slice(-1)[0] ?? "there"}`}
        subtitle={
          journey
            ? `${t("oneAiJourneyPersonalized")} ${journey.assignments.length} ${t("contextsKnown")}.`
            : t("yourAiJourney").replace("AI", tenant.aiName)
        }
        right={
          <Chip tone="violet">
            <IconSparkles className="size-3" /> {t("aiReady")}
          </Chip>
        }
      />

      {error && (
        <Card className="mb-4">
          <div className="text-[13px] text-[color:var(--er)]">{error}</div>
        </Card>
      )}

      {journey && (
        <>
          {journey.assignments.length > 1 && (
            <Card className="mb-4">
              <SectionLabel>{t("teachingContextsRecognised")}</SectionLabel>
              <div className="mt-2 flex flex-wrap gap-2">
                {journey.assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="rounded-md border px-3 py-2 text-left text-[12px] transition-colors"
                    style={{
                      background: assignment.primaryAssignment ? "var(--bl)" : "var(--s3)",
                      color: assignment.primaryAssignment ? "var(--bt)" : "var(--t1)",
                      borderColor: assignment.primaryAssignment ? "var(--bb)" : "var(--bd)",
                    }}
                  >
                    <span className="block font-semibold">
                      {assignment.grade} {assignment.division} · {assignment.subject}
                    </span>
                    <span className="text-[11px] opacity-75">
                      {assignment.primaryAssignment ? `${t("primary")} · ` : ""}{assignment.responsibility}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <Metric
              label={t("readiness")}
              value={`${journey.metrics.readiness}%`}
              sub={journey.metrics.readiness ? t("latestAttempt") : t("notStarted")}
              tone="blue"
              icon={<IconTarget className="size-3.5" />}
            />
            <Metric
              label={t("practice")}
              value={journey.metrics.practiceRuns}
              sub={t("savedInDb")}
              tone="violet"
              icon={<IconBolt className="size-3.5" />}
            />
            <Metric
              label={t("confidence")}
              value={journey.metrics.confidence}
              sub={t("derivedFromReadiness")}
              tone="teal"
              icon={<IconTrendingUp className="size-3.5" />}
            />
            <Metric
              label={t("completed")}
              value={`${completed}/${journey.steps.length}`}
              sub={t("journeySteps")}
              tone="gold"
              icon={<IconClock className="size-3.5" />}
            />
          </div>

          {game && (
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-4 mb-5">
              <Card>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <SectionLabel>{t("momentum")}</SectionLabel>
                    <div className="mt-1 text-[18px] font-bold text-text">{t("level")} {game.level}</div>
                    <div className="text-[12px] text-text-muted">{game.title}</div>
                  </div>
                  <Chip tone="gold"><IconTrophy className="size-3" /> {game.xp} XP</Chip>
                </div>
                <div className="flex items-center justify-between text-[11px] text-text-muted mb-1">
                  <span>{game.currentLevelXp} {t("xpThisLevel")}</span>
                  <span>{game.nextLevelXp} {t("xpNeeded")}</span>
                </div>
                <ProgressBar value={game.levelProgress} tone="gold" className="h-2" />
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <MiniStat icon={<IconFlame className="size-3.5" />} label={t("streak")} value={`${game.streak} ${t(game.streak === 1 ? "day" : "days")}`} />
                  <MiniStat icon={<IconBolt className="size-3.5" />} label={t("practice")} value={`${journey.metrics.practiceRuns}`} />
                  <MiniStat icon={<IconCheck className="size-3.5" />} label={t("steps")} value={`${completed}/${journey.steps.length}`} />
                </div>
              </Card>

              <Card>
                <SectionLabel>{t("badges")}</SectionLabel>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {game.badges.map((badge) => (
                    <div
                      key={badge.label}
                      className="relative rounded-md border px-3 py-2 transition-colors"
                      style={{
                        background: badge.unlocked ? "var(--gl)" : "var(--s3)",
                        borderColor: badge.unlocked ? "var(--gb)" : "var(--bd)",
                        color: badge.unlocked ? "var(--gt)" : "var(--t3)",
                        opacity: badge.unlocked ? 1 : 0.64,
                      }}
                    >
                      <div className="flex items-center gap-1.5 text-[12px] font-semibold">
                        <IconMedal2 className="size-3.5" fill={badge.unlocked ? "currentColor" : "none"} /> {badge.label}
                      </div>
                      <div className="mt-0.5 text-[10.5px] opacity-75">{badge.detail}</div>
                      {!badge.unlocked && <IconLock className="absolute right-2 top-2 size-3 text-text-subtle" />}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          <Card className="mb-5">
            <div className="flex items-center justify-between mb-3">
                <div className="font-semibold">{t("myJourney")}</div>
              <Chip tone="blue">
                {t("steps")} {Math.min(completed + 1, journey.steps.length)} / {journey.steps.length}
              </Chip>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {journey.steps.map((step, i) => (
                <div key={step.key} className="flex items-center gap-1.5 shrink-0">
                  <button type="button" onClick={() => nav({ to: step.path as never })}>
                    <span
                      className="px-3 py-2 rounded-md border text-[11.5px] font-semibold flex items-center gap-1.5 transition-all"
                      style={{
                        background:
                          step.status === "active"
                            ? "var(--bl)"
                            : step.status === "done"
                              ? "var(--okl)"
                              : "var(--s3)",
                        color:
                          step.status === "active"
                            ? "var(--bt)"
                            : step.status === "done"
                              ? "var(--ok)"
                              : "var(--t2)",
                        borderColor:
                          step.status === "active"
                            ? "var(--bb)"
                            : step.status === "done"
                              ? "var(--okb)"
                              : "var(--bd)",
                      }}
                    >
                      {step.status === "done" && <IconCheck className="size-3" />} {step.label}
                    </span>
                  </button>
                  {i < journey.steps.length - 1 && (
                    <IconArrowRight className="size-3.5 text-text-subtle shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold">{t("continueLearning")}</div>
                <Btn variant="ghost" size="sm">
                  {t("viewAll")}
                </Btn>
              </div>
              <div className="space-y-3">
                {journey.modules.map((module) => (
                  <div key={module.title}>
                    <div className="flex justify-between text-[12px] mb-1">
                      <span className="font-medium">{module.title}</span>
                      <span className="text-text-muted">{module.progress}%</span>
                    </div>
                    <ProgressBar value={module.progress} tone={module.progress === 100 ? "teal" : "blue"} />
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <SectionLabel>{t("recommendedNext")}</SectionLabel>
              <div className="mt-2 text-[13px] font-semibold mb-1">{journey.nextAction.label}</div>
              <p className="text-[12px] text-text-muted mb-3">{t("continueProgrammeJourney")}</p>
              <Btn size="sm" onClick={() => nav({ to: journey.nextAction.path as never })}>
                {t("continue")} <IconArrowRight className="size-3.5" />
              </Btn>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-surface-2 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-text-muted">
        {icon} {label}
      </div>
      <div className="mt-1 text-[13px] font-bold text-text">{value}</div>
    </div>
  );
}

function gameStats(journey: Journey, t: (key: I18nKey) => string) {
  const completedSteps = journey.metrics.completedSteps;
  const moduleXp = journey.modules.reduce((sum, module) => sum + Math.round(module.progress / 5), 0);
  const xp = journey.metrics.readiness + completedSteps * 120 + journey.metrics.practiceRuns * 40 + moduleXp;
  const levelSize = 250;
  const level = Math.max(1, Math.floor(xp / levelSize) + 1);
  const currentLevelXp = xp % levelSize;
  const nextLevelXp = levelSize - currentLevelXp;
  const levelProgress = Math.round((currentLevelXp / levelSize) * 100);
  const streak = Math.max(1, Math.min(7, completedSteps + Math.min(3, journey.metrics.practiceRuns)));
  return {
    xp,
    level,
    currentLevelXp,
    nextLevelXp,
    levelProgress,
    streak,
    title: level >= 4 ? t("classroomAiPractitioner") : level >= 2 ? t("buildingClassroomFluency") : t("gettingStarted"),
    badges: [
      {
        label: t("readiness"),
        detail: journey.metrics.readiness ? `${journey.metrics.readiness}% ${t("score")}` : t("completeReadiness"),
        unlocked: journey.metrics.readiness > 0,
      },
      {
        label: t("learningPath"),
        detail: journey.modules.some((module) => module.progress > 0) ? t("moduleProgressStarted") : t("startFirstModule"),
        unlocked: journey.modules.some((module) => module.progress > 0),
      },
      {
        label: t("practice"),
        detail: journey.metrics.practiceRuns
          ? `${journey.metrics.practiceRuns} ${t(journey.metrics.practiceRuns === 1 ? "savedRun" : "savedRuns")}`
          : t("saveSandboxRun"),
        unlocked: journey.metrics.practiceRuns > 0,
      },
      {
        label: t("completion"),
        detail: completedSteps ? `${completedSteps} ${t("journeySteps")}` : t("completeFirstStep"),
        unlocked: completedSteps > 0,
      },
    ],
  };
}
