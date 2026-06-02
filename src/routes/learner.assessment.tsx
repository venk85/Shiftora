import { createFileRoute, Link } from "@tanstack/react-router";
import { useActiveTenant, useApp } from "@/lib/shiftora-store";
import { shiftoraApi, type ReadinessCheck } from "@/lib/shiftora-api";
import { Card, PageHeader, Btn, Chip, ProgressBar, SectionLabel } from "@/components/shiftora/primitives";
import { useI18n } from "@/lib/use-i18n";
import { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export const Route = createFileRoute("/learner/assessment")({ component: Assessment });

function Assessment() {
  const tenant = useActiveTenant();
  const { t } = useI18n();
  const currentUser = useApp((s) => s.currentUser);
  const [assignmentId, setAssignmentId] = useState("");
  const [check, setCheck] = useState<ReadinessCheck | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!currentUser?.email) return;
    setError("");
    setSavedMessage("");
    void shiftoraApi
      .readinessCheck(tenant.id, currentUser.email, assignmentId || undefined)
      .then((data) => {
        setCheck(data);
        setAssignmentId(data.assignment.id);
        setStep(0);
        setAnswers(data.latestAttempt?.answers ?? {});
        setDirty(false);
      })
      .catch((err) => setError((err as Error).message));
  }, [assignmentId, currentUser?.email, tenant.id]);

  const questions = check?.questions ?? [];
  const done = check ? step >= questions.length : false;
  const latestScore = check?.latestAttempt?.score;
  const draftScore = useMemo(() => {
    if (!questions.length) return 0;
    let earned = 0;
    let possible = 0;
    for (const question of questions) {
      const max = Math.max(1, (question.options?.length ?? 1) - 1);
      const selected = Number(answers[question.id] ?? 0);
      earned += Math.max(0, Math.min(max, selected)) * Math.max(1, question.weight);
      possible += max * Math.max(1, question.weight);
    }
    return possible ? Math.round((earned / possible) * 100) : 0;
  }, [answers, questions]);

  const submit = async () => {
    if (!check || !currentUser?.email) return;
    setSaving(true);
    setError("");
    setSavedMessage("");
    try {
      const attempt = await shiftoraApi.submitReadiness(tenant.id, currentUser.email, {
        templateId: check.templateId,
        assignmentId: check.assignment.id,
        answers,
      });
      setCheck({ ...check, latestAttempt: attempt });
      setStep(questions.length);
      setDirty(false);
      setSavedMessage(`${t("readinessSaved")}: ${attempt.score}%`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={check?.title ?? `${tenant.aiName} ${t("readinessCheck")}`}
        subtitle={
          check
            ? `${t("oneAiReadinessPersonalized")} ${check.availableAssignments.length} ${t("contextsKnown")}.`
            : t("loadingReadinessContext")
        }
      />

      {error && (
        <Card className="mb-4">
          <div className="text-[13px] text-[color:var(--er)]">{error}</div>
        </Card>
      )}

      {savedMessage && (
        <Card className="mb-4">
          <div className="text-[13px] font-semibold text-[color:var(--ok)]">{savedMessage}</div>
        </Card>
      )}

      {check && check.availableAssignments.length > 1 && (
        <Card className="mb-4">
          <SectionLabel>{t("teachingContextsRecognised")}</SectionLabel>
          <div className="mt-2 flex flex-wrap gap-2">
            {check.availableAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="rounded-md border px-3 py-2 text-left text-[12px]"
                style={{
                  background: "var(--s3)",
                  color: "var(--t1)",
                  borderColor: "var(--bd)",
                }}
              >
                <span className="block font-semibold">
                  {assignment.grade} {assignment.division} · {assignment.subject}
                </span>
                <span className="text-[11px] opacity-75">{assignment.responsibility}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {check && !done && questions[step] && (
        <Card className="max-w-xl">
          <div className="flex items-center justify-between mb-3">
            <Chip tone="blue">
              {t("question")} {step + 1} / {questions.length}
            </Chip>
            <span className="text-[11px] text-text-muted">
              {Math.round((step / questions.length) * 100)}% {t("completeLabel")}
            </span>
          </div>
          <ProgressBar value={(step / questions.length) * 100} className="mb-5" />
          <div className="font-semibold text-[15px] mb-4">{questions[step].prompt}</div>
          <div className="space-y-2">
            {questions[step].options.map((option, i) => (
              <button
                key={option}
                className="w-full text-left px-4 py-2.5 rounded-md border border-border-strong bg-surface hover:bg-primary-soft hover:border-[color:var(--bb)] text-[13px] transition-colors"
                onClick={() => {
                  setAnswers((current) => ({ ...current, [questions[step].id]: i }));
                  setDirty(true);
                  setSavedMessage("");
                  setStep((current) => current + 1);
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </Card>
      )}

      {check && done && (
        <Card className="max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <ScoreDonut score={latestScore ?? draftScore} />
            <div>
              <Chip tone={(latestScore ?? draftScore) > 60 ? "teal" : "gold"}>
                {(latestScore ?? draftScore) > 60 ? t("practitionerLevel") : t("foundationLevel")}
              </Chip>
              <div className="font-semibold text-[16px] mt-2 mb-1">{t("recommendedPath")}</div>
              <p className="text-[12px] text-text-muted mb-3">{t("scoreStoredProfile")}</p>
              {check.latestAttempt?.recommendedModules.length ? (
                <div className="mb-3 flex flex-wrap gap-1">
                  {check.latestAttempt.recommendedModules.map((module) => (
                    <Chip key={module} tone="muted">
                      {module}
                    </Chip>
                  ))}
                </div>
              ) : null}
              <div className="flex gap-2">
                {(latestScore == null || dirty) && (
                  <Btn onClick={submit} disabled={saving}>
                    {saving ? t("saving") : t("saveReadiness")}
                  </Btn>
                )}
                <Link to="/learner/learning">
                  <Btn variant={latestScore != null && !dirty ? "primary" : "outline"}>{t("startLearningPath")}</Btn>
                </Link>
                <Btn
                  variant="outline"
                  onClick={() => {
                    setStep(0);
                    setAnswers({});
                    setDirty(true);
                    setSavedMessage("");
                  }}
                >
                  {t("retake")}
                </Btn>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function ScoreDonut({ score }: { score: number }) {
  const { t } = useI18n();
  return (
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={[{ v: score }, { v: 100 - score }]}
            dataKey="v"
            innerRadius={60}
            outerRadius={88}
            startAngle={90}
            endAngle={-270}
          >
            <Cell fill="var(--b)" />
            <Cell fill="var(--s4)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="text-center -mt-[120px]">
        <div className="text-[28px] font-extrabold">{score}%</div>
        <div className="text-[10px] text-text-muted">{t("readiness")}</div>
      </div>
    </div>
  );
}
