import { createFileRoute } from "@tanstack/react-router";
import { useActiveTenant, useApp } from "@/lib/shiftora-store";
import { type Scenario } from "@/lib/shiftora-config";
import { shiftoraApi, type Assignment, type AppUser } from "@/lib/shiftora-api";
import { useI18n } from "@/lib/use-i18n";
import { Card, PageHeader, SectionLabel, Chip, Btn } from "@/components/shiftora/primitives";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import {
  IconSparkles,
  IconArrowLeft,
  IconLoader2,
  IconBookmark,
  IconAlertTriangle,
} from "@tabler/icons-react";

export const Route = createFileRoute("/learner/sandbox")({
  component: SandboxPage,
});

function SandboxPage() {
  const tenant = useActiveTenant();
  const { t } = useI18n();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [scenarioError, setScenarioError] = useState("");
  const [active, setActive] = useState<Scenario | null>(null);

  useEffect(() => {
    setScenarios([]);
    setScenarioError("");
    void shiftoraApi
      .scenarios(tenant.industry)
      .then(setScenarios)
      .catch((error) => setScenarioError(error instanceof Error ? error.message : "Unable to load sandbox scenarios"));
  }, [tenant.industry]);

  return (
    <div>
      <PageHeader
        title={t("aiSandbox")}
        subtitle={t("aiPracticeSubtitle").replace("AI", tenant.aiName)}
        right={
          <Chip tone="violet">
            <IconSparkles className="size-3" /> {t("poweredBy")} {tenant.aiName}
          </Chip>
        }
      />
      {!active ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scenarioError && (
            <Card className="md:col-span-3">
              <div className="text-[13px] font-semibold text-[color:var(--er)]">{scenarioError}</div>
            </Card>
          )}
          {!scenarioError && scenarios.length === 0 && (
            <Card className="md:col-span-3">
              <div className="text-[13px] text-text-muted">No sandbox scenarios are configured for this industry.</div>
            </Card>
          )}
          {scenarios.map((s) => (
            <Card key={s.id} hover className="cursor-pointer">
              <button onClick={() => setActive(s)} className="text-left w-full">
                <div className="text-3xl mb-2">{s.icon}</div>
                <div className="font-semibold text-[14px] mb-1">{s.title}</div>
                <p className="text-[12px] text-text-muted mb-3">{s.desc}</p>
                <div className="flex flex-wrap gap-1">
                  {s.scoreLabels.map((l) => (
                    <Chip key={l} tone="muted" className="text-[10px]">
                      {l}
                    </Chip>
                  ))}
                </div>
              </button>
            </Card>
          ))}
        </div>
      ) : (
        <SandboxWorkspace scenario={active} onBack={() => setActive(null)} />
      )}
    </div>
  );
}

function SandboxWorkspace({ scenario, onBack }: { scenario: Scenario; onBack: () => void }) {
  const tenant = useActiveTenant();
  const { t } = useI18n();
  const currentUser = useApp((s) => s.currentUser);
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(scenario.inputs.map((i) => [i.key, ""])),
  );
  const [context, setContext] = useState<{ user: AppUser; assignment: Assignment; count: number } | null>(null);
  const [saved, setSaved] = useState(false);
  const [savingPractice, setSavingPractice] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    setValues(Object.fromEntries(scenario.inputs.map((i) => [i.key, ""])));
    setContext(null);
    if (!currentUser?.email) return;
    void shiftoraApi
      .journey(tenant.id, currentUser.email)
      .then((journey) => {
        setContext({
          user: journey.user,
          assignment: journey.activeAssignment,
          count: journey.assignments.length,
        });
        setValues((current) => ({
          ...contextDefaults(scenario, journey.activeAssignment, journey.user, tenant.type),
          ...nonEmptyValues(current),
        }));
      })
      .catch((error) => console.warn("Sandbox context unavailable", error));
  }, [currentUser?.email, scenario, tenant.id, tenant.type]);

  const mutation = useMutation({
    mutationFn: () =>
      shiftoraApi.runSandbox({
        aiName: tenant.aiName,
        scenarioTitle: scenario.title,
        systemPrompt: scenario.systemPrompt,
        tenantInstruction: tenant.aiInstruction,
        scoreLabels: scenario.scoreLabels,
        inputs: values,
      }),
    onSuccess: () => {
      setSaved(false);
      setSaveError("");
    },
  });

  const updateValue = (key: string, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setSaved(false);
    setSaveError("");
  };

  const savePracticeRun = async () => {
    if (!mutation.data || savingPractice) return;
    setSavingPractice(true);
    setSaveError("");
    try {
      await shiftoraApi.createPractice({
        scenarioId: scenario.id,
        scenarioTitle: scenario.title,
        tenantId: tenant.id,
        inputs: practiceInputs(values, context),
        output: mutation.data.output,
        scores: mutation.data.scores,
      });
      setSaved(true);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : t("savePracticeFailed"));
    } finally {
      setSavingPractice(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Btn variant="ghost" size="sm" onClick={onBack}>
            <IconArrowLeft className="size-4" /> {t("back")}
          </Btn>
          <div className="font-semibold">
            {scenario.icon} {scenario.title}
          </div>
        </div>
        {context && (
          <div className="rounded-md border border-border bg-surface-2 px-3 py-2">
            <SectionLabel>{t("contextApplied")}</SectionLabel>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <Chip tone="blue">
                {context.assignment.grade} {context.assignment.division} · {context.assignment.subject}
              </Chip>
              <Chip tone="muted">{context.assignment.responsibility}</Chip>
              {context.count > 1 && <Chip tone="muted">{context.count} {t("contextsKnown")}</Chip>}
            </div>
          </div>
        )}
        <div className="space-y-3">
          {scenario.inputs.map((inp) => (
            <div key={inp.key}>
              <label className="block text-[11px] font-semibold text-text-muted mb-1">
                {inp.label}
              </label>
              {inp.type === "textarea" ? (
                <textarea
                  rows={3}
                  className="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-[13px]"
                  placeholder={inp.placeholder}
                  value={values[inp.key]}
                  onChange={(e) => updateValue(inp.key, e.target.value)}
                />
              ) : inp.type === "select" ? (
                <select
                  className="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-[13px]"
                  value={values[inp.key]}
                  onChange={(e) => updateValue(inp.key, e.target.value)}
                >
                  <option value="">{t("select")}</option>
                  {inp.options?.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={inp.type === "number" ? "number" : "text"}
                  className="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-[13px]"
                  placeholder={inp.placeholder}
                  value={values[inp.key]}
                  onChange={(e) => updateValue(inp.key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
        <Btn onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? (
            <>
              <IconLoader2 className="size-4 animate-spin" /> {t("thinking")}
            </>
          ) : (
            <>
              <IconSparkles className="size-4" /> {t("generateWithAi").replace("AI", tenant.aiName)}
            </>
          )}
        </Btn>
      </Card>
      <Card className="flex flex-col gap-3 min-h-[420px]">
        <SectionLabel>{t("aiResponse").replace("AI", tenant.aiName)}</SectionLabel>
        {mutation.isPending && (
          <div className="flex items-center gap-2 text-[13px] text-text-muted">
            <IconLoader2 className="size-4 animate-spin text-primary" /> {t("thinking")}
          </div>
        )}
        {mutation.isError && (
          <div
            className="flex items-start gap-2 p-3 rounded-md"
            style={{ background: "var(--erl)", color: "var(--er)" }}
          >
            <IconAlertTriangle className="size-4 mt-0.5 shrink-0" />
            <div className="text-[12px]">{errorMessage(mutation.error, t("somethingWentWrongGenerating"))}</div>
          </div>
        )}
        {mutation.data && (
          <>
            <div className="prose prose-sm max-w-none text-[13px] leading-[1.55] [&_h1]:text-[16px] [&_h2]:text-[14px] [&_h3]:text-[13px] [&_h2]:mt-3 [&_h3]:mt-2 [&_p]:my-1 [&_table]:text-[12px] [&_ul]:my-1 [&_li]:my-0.5">
              <ReactMarkdown>{mutation.data.output}</ReactMarkdown>
            </div>
            <div className="border-t border-border pt-3 space-y-2">
              <SectionLabel>{t("selfAssessedQuality")}</SectionLabel>
              {mutation.data.scores.map((s) => (
                <div key={s.label}>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-text">{s.label}</span>
                    <span className="font-bold text-primary">{s.value}</span>
                  </div>
                  <div className="progress-track">
                    <motion.div
                      className="progress-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${s.value}%` }}
                      transition={{ duration: 0.9, ease: "easeOut" }}
                    />
                  </div>
                </div>
              ))}
              <Btn
                variant="soft"
                size="sm"
                disabled={saved || savingPractice}
                onClick={savePracticeRun}
              >
                <IconBookmark className="size-3.5" />{" "}
                {saved ? t("savedToPracticeLog") : savingPractice ? t("saving") : t("saveToPracticeLog")}
              </Btn>
              {saveError && (
                <div className="text-[12px] text-[color:var(--er)]">
                  {t("savePracticeFailed")}: {saveError}
                </div>
              )}
            </div>
          </>
        )}
        {!mutation.data && !mutation.isPending && !mutation.isError && (
          <div className="text-[12px] text-text-subtle">
            {t("fillGeneratePrompt").replace("AI", tenant.aiName)}
          </div>
        )}
      </Card>
    </div>
  );
}

function nonEmptyValues(values: Record<string, string>) {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value.trim()));
}

function practiceInputs(
  values: Record<string, string>,
  context: { user: AppUser; assignment: Assignment; count: number } | null,
) {
  const inputs: Record<string, string> = { ...nonEmptyValues(values) };
  if (!context) return inputs;
  inputs.school = context.assignment.schoolName;
  inputs.grade = context.assignment.grade;
  inputs.division = context.assignment.division;
  inputs.subject = context.assignment.subject;
  inputs.responsibility = context.assignment.responsibility;
  inputs.teacher = context.user.name;
  return inputs;
}

function errorMessage(error: unknown, fallback: string) {
  if (typeof error === "string" && error.trim()) return error;
  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message?: unknown }).message ?? "").trim();
    if (message) return message;
  }
  return fallback;
}

function contextDefaults(
  scenario: Scenario,
  assignment: Assignment,
  user: AppUser,
  tenantType: string,
) {
  const focus = String(assignment.metadata.focus ?? assignment.metadata.portfolio ?? assignment.metadata.stack ?? assignment.metadata.shift ?? "");
  const language = String(user.profile.language ?? "English");
  const defaults: Record<string, string> = {};
  for (const input of scenario.inputs) {
    const key = input.key.toLowerCase();
    const label = input.label.toLowerCase();
    if (key === "subject" || label === "subject") defaults[input.key] = assignment.subject;
    if (key === "grade" || label === "grade") defaults[input.key] = assignment.grade;
    if (key === "subjectgrade" || label.includes("subject / grade")) {
      defaults[input.key] = `${assignment.subject} / ${assignment.grade}`;
    }
    if (key === "topic" || label.includes("topic")) {
      defaults[input.key] = focus ? `${assignment.subject}: ${focus}` : assignment.subject;
    }
    if (key === "duration" || label.includes("duration")) defaults[input.key] = "45 minutes";
    if (key === "objective" || label.includes("objective")) {
      defaults[input.key] = `Learners will build confidence in ${assignment.subject.toLowerCase()} using examples appropriate for ${assignment.grade} ${assignment.division}.`;
    }
    if (key === "classprofile" || label.includes("class profile")) {
      defaults[input.key] = `${assignment.grade} ${assignment.division}, ${assignment.responsibility}, ${language}`;
    }
    if (key === "board" || label.includes("board")) defaults[input.key] = String(assignment.metadata.board ?? tenantType);
    if (key === "language" || label.includes("language")) defaults[input.key] = language;
    if (key === "focus" || label.includes("focus")) {
      defaults[input.key] = focus || `${assignment.responsibility} support for ${assignment.subject}`;
    }
  }
  return defaults;
}
