import { createFileRoute } from "@tanstack/react-router";
import { useActiveTenant, useApp } from "@/lib/shiftora-store";
import { shiftoraApi, type KnowledgeCheck } from "@/lib/shiftora-api";
import { Card, PageHeader, Btn, Chip, ProgressBar, SectionLabel } from "@/components/shiftora/primitives";
import { useI18n } from "@/lib/use-i18n";
import { IconLock, IconChecks, IconAlertCircle } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/learner/check")({ component: Check });

function Check() {
  const tenant = useActiveTenant();
  const { t } = useI18n();
  const currentUser = useApp((s) => s.currentUser);
  const [assignmentId, setAssignmentId] = useState("");
  const [check, setCheck] = useState<KnowledgeCheck | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentUser?.email) return;
    setError("");
    void shiftoraApi
      .knowledgeCheck(tenant.id, currentUser.email, assignmentId || undefined)
      .then((data) => {
        setCheck(data);
        setAssignmentId(data.assignment.id);
        setAnswers(
          Object.fromEntries(
            Object.entries(data.latestAttempt?.answers ?? {}).map(([key, value]) => [key, Number(value)]),
          ),
        );
      })
      .catch((err) => setError((err as Error).message));
  }, [assignmentId, currentUser?.email, tenant.id]);

  const questions = check?.questions ?? [];
  const completed = Object.keys(answers).length;
  const draftScore = useMemo(() => {
    if (!questions.length) return 0;
    let earned = 0;
    let possible = 0;
    for (const question of questions) {
      const weight = Math.max(1, question.weight);
      if (answers[question.id] === question.answerIndex) earned += weight;
      possible += weight;
    }
    return possible ? Math.round((earned / possible) * 100) : 0;
  }, [answers, questions]);

  const submit = async () => {
    if (!check?.id || !currentUser?.email) return;
    setSaving(true);
    setError("");
    try {
      const attempt = await shiftoraApi.submitKnowledge(tenant.id, currentUser.email, {
        knowledgeCheckId: check.id,
        answers,
      });
      setCheck({ ...check, latestAttempt: attempt });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={check?.title ?? t("knowledgeCheck")}
        subtitle={
          check
            ? `${t("commonAiFluencyCheck")} ${check.availableAssignments.length}`
            : t("loadingAssignedCheck")
        }
      />

      {error && (
        <Card className="mb-4">
          <div className="text-[13px] text-[color:var(--er)]">{error}</div>
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

      {check && !check.available && (
        <Card className="max-w-xl">
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-md grid place-items-center bg-[color:var(--gl)] text-[color:var(--gt)]">
              <IconLock className="size-4" />
            </div>
            <div>
              <Chip tone="gold">{t("locked")}</Chip>
              <div className="font-semibold mt-2">{t("knowledgeCheckUnavailable")}</div>
              <p className="text-[12px] text-text-muted mt-1">{check.lockedReason}</p>
            </div>
          </div>
        </Card>
      )}

      {check && check.available && (
        <div className="space-y-3 max-w-2xl">
          <Card>
            <div className="flex items-center justify-between mb-2">
              <div>
                <Chip tone={check.latestAttempt?.passed ? "teal" : "blue"}>
                  {t("passScore")} {check.passScore}%
                </Chip>
                {check.latestAttempt && (
                  <Chip tone={check.latestAttempt.passed ? "teal" : "gold"} className="ml-2">
                    {t("latestAttempt")} {check.latestAttempt.score}%
                  </Chip>
                )}
              </div>
              <span className="text-[11px] text-text-muted">
                {completed}/{questions.length} {t("completed")}
              </span>
            </div>
            <ProgressBar value={(completed / Math.max(1, questions.length)) * 100} />
          </Card>

          {questions.map((question, qi) => (
            <Card key={question.id}>
              <div className="font-semibold text-[13px] mb-2">
                {qi + 1}. {question.prompt}
              </div>
              <div className="space-y-1.5">
                {question.options.map((option, oi) => (
                  <label
                    key={option}
                    className="flex items-center gap-2 p-2 rounded-md border border-border cursor-pointer hover:bg-surface-3"
                    style={answers[question.id] === oi ? { borderColor: "var(--bb)", background: "var(--bl)" } : undefined}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      checked={answers[question.id] === oi}
                      onChange={() => setAnswers((current) => ({ ...current, [question.id]: oi }))}
                    />
                    <span className="text-[12.5px]">{option}</span>
                  </label>
                ))}
              </div>
            </Card>
          ))}

          <div className="flex items-center justify-between">
            <div className="text-[12px] text-text-muted">
              {t("draftScore")}: {draftScore}% {draftScore >= check.passScore && <IconChecks className="inline size-4 text-[color:var(--ok)]" />}
            </div>
            <Btn disabled={completed < questions.length || saving} onClick={submit}>
              {saving ? t("submitting") : t("submitCheck")}
            </Btn>
          </div>

          {check.latestAttempt && !check.latestAttempt.passed && (
            <Card>
              <div className="flex gap-2 text-[12px] text-text-muted">
                <IconAlertCircle className="size-4 text-[color:var(--am)] shrink-0" />
                {t("reviewLearningPath")}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
