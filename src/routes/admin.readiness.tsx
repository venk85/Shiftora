import { createFileRoute } from "@tanstack/react-router";
import { useActiveTenant } from "@/lib/shiftora-store";
import { adminVocabulary } from "@/lib/admin-vocabulary";
import {
  shiftoraApi,
  type AppUser,
  type Assignment,
  type ReadinessQuestion,
  type ReadinessTemplate,
} from "@/lib/shiftora-api";
import { Btn, Card, Chip, PageHeader, SectionLabel } from "@/components/shiftora/primitives";
import {
  IconClipboardCheck,
  IconDeviceFloppy,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

export const Route = createFileRoute("/admin/readiness")({ component: AdminReadiness });

const INPUT_CLASS =
  "w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-[12.5px] outline-none transition-colors focus:border-[color:var(--bb)] focus:ring-2 focus:ring-[color:var(--bl)]";

const EMPTY_TEMPLATE = (tenantId: string): ReadinessTemplate => ({
  id: null,
  tenantId,
  name: "",
  description: "",
  status: "draft",
  sortOrder: 10,
  targeting: {
    schoolName: "Any",
    grade: "Any",
    division: "Any",
    subject: "Any",
    responsibility: "Any",
  },
  questions: [],
  updatedAt: 0,
});

function AdminReadiness() {
  const tenant = useActiveTenant();
  const vocab = adminVocabulary(tenant.industry);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [templates, setTemplates] = useState<ReadinessTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<string>("new");
  const [draft, setDraft] = useState<ReadinessTemplate>(() => EMPTY_TEMPLATE(tenant.id));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setError("");
    void Promise.all([
      shiftoraApi.adminUsers(tenant.id),
      shiftoraApi.adminAssignments(tenant.id),
      shiftoraApi.readinessTemplates(tenant.id),
    ])
      .then(([userData, assignmentData, templateData]) => {
        setUsers(userData);
        setAssignments(assignmentData);
        setTemplates(templateData);
        const first = templateData[0];
        setSelectedId(first?.id ?? "new");
        setDraft(first ?? EMPTY_TEMPLATE(tenant.id));
      })
      .catch((err) => setError((err as Error).message));
  }, [tenant.id]);

  const groupedAssignments = useMemo(() => {
    return users
      .map((user) => ({
        user,
        assignments: assignments.filter((item) => item.userId === user.id),
      }))
      .filter((row) => row.assignments.length);
  }, [assignments, users]);

  const updateTarget = (key: string, value: string) => {
    setDraft((current) => ({
      ...current,
      targeting: { ...current.targeting, [key]: value || "Any" },
    }));
  };

  const updateQuestion = (
    index: number,
    patch: Partial<ReadinessQuestion> & { optionsText?: string },
  ) => {
    setDraft((current) => ({
      ...current,
      questions: current.questions.map((question, i) => {
        if (i !== index) return question;
        const next = { ...question, ...patch };
        if (patch.optionsText !== undefined) {
          next.options = patch.optionsText
            .split(",")
            .map((option) => option.trim())
            .filter(Boolean);
        }
        return next;
      }),
    }));
  };

  const addQuestion = () => {
    setDraft((current) => ({
      ...current,
      questions: [
        ...current.questions,
        {
          id: `q-${Date.now().toString(36)}`,
          type: "scale",
          prompt: "",
          options: ["Not yet", "Trying", "Comfortable", "Confident"],
          weight: 1,
        },
      ],
    }));
  };

  const removeQuestion = (index: number) => {
    setDraft((current) => ({
      ...current,
      questions: current.questions.filter((_, i) => i !== index),
    }));
  };

  const selectTemplate = (id: string) => {
    setSelectedId(id);
    setDraft(id === "new" ? EMPTY_TEMPLATE(tenant.id) : templates.find((item) => item.id === id) ?? EMPTY_TEMPLATE(tenant.id));
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const saved = await shiftoraApi.saveReadinessTemplate({
        ...draft,
        tenantId: tenant.id,
        questions: draft.questions.map((question) => ({
          ...question,
          options: question.options.length ? question.options : ["Not yet", "Trying", "Comfortable"],
        })),
      });
      setTemplates((current) => {
        const rest = current.filter((item) => item.id !== saved.id);
        return [saved, ...rest].sort((a, b) => a.sortOrder - b.sortOrder);
      });
      setSelectedId(saved.id ?? "new");
      setDraft(saved);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Readiness checks"
        subtitle={`Configure readiness questions and map them to real ${vocab.contextPlural}.`}
        right={
          <Btn size="sm" onClick={() => selectTemplate("new")}>
            <IconPlus className="size-4" /> New check
          </Btn>
        }
      />

      {error && (
        <Card className="mb-4">
          <div className="text-[13px] text-[color:var(--er)]">{error}</div>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-4">
        <div className="space-y-4">
          <Card>
            <SectionLabel>Published templates</SectionLabel>
            <div className="mt-3 space-y-1.5">
              <TemplateButton
                active={selectedId === "new"}
                title="Create new check"
                sub="Draft"
                onClick={() => selectTemplate("new")}
              />
              {templates.map((template) => (
                <TemplateButton
                  key={template.id}
                  active={selectedId === template.id}
                  title={template.name}
                  sub={`${template.status} · ${template.questions.length} questions`}
                  onClick={() => selectTemplate(template.id ?? "new")}
                />
              ))}
            </div>
          </Card>

          <Card>
            <SectionLabel>{vocab.learnerSingular} context map</SectionLabel>
            <div className="mt-3 space-y-3">
              {groupedAssignments.map(({ user, assignments: rows }) => (
                <div key={user.id} className="border-b border-border last:border-0 pb-3 last:pb-0">
                  <div className="text-[12px] font-semibold">{user.name}</div>
                  <div className="text-[11px] text-text-muted mb-2">{user.email}</div>
                  <div className="flex flex-wrap gap-1">
                    {rows.map((assignment) => (
                      <Chip key={assignment.id} tone={assignment.primaryAssignment ? "blue" : "muted"}>
                        {assignment.grade} {assignment.division} · {assignment.subject}
                      </Chip>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <div className="font-semibold flex items-center gap-2">
                <IconClipboardCheck className="size-4 text-primary" /> Check setup
              </div>
              <div className="text-[11px] text-text-muted mt-0.5">
                {vocab.learnerPlural} see the first published check matching their {vocab.schoolLabel.toLowerCase()},
                {vocab.gradeLabel.toLowerCase()}, {vocab.sectionLabel.toLowerCase()}, {vocab.subjectLabel.toLowerCase()}
                and responsibility.
              </div>
            </div>
            <Btn size="sm" onClick={save} disabled={saving || !draft.name.trim()}>
              <IconDeviceFloppy className="size-4" /> {saving ? "Saving..." : "Save"}
            </Btn>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
            <Field label="Name">
              <input
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                className={INPUT_CLASS}
                  placeholder={`${vocab.gradeOptions[0]} ${vocab.subjectOptions[0]} AI Readiness`}
              />
            </Field>
            <Field label="Status">
              <select
                value={draft.status}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    status: event.target.value as ReadinessTemplate["status"],
                  }))
                }
                className={INPUT_CLASS}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </Field>
            <Field label="Description">
              <input
                value={draft.description}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, description: event.target.value }))
                }
                className={INPUT_CLASS}
                placeholder="Purpose and audience for this readiness check"
              />
            </Field>
            <Field label="Priority">
              <input
                type="number"
                value={draft.sortOrder}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, sortOrder: Number(event.target.value) }))
                }
                className={INPUT_CLASS}
              />
            </Field>
          </div>

          <SectionLabel>Targeting</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mt-2 mb-5">
            {["schoolName", "grade", "division", "subject", "responsibility"].map((key) => (
              <Field key={key} label={targetLabel(key, vocab)}>
                <input
                  value={String(draft.targeting[key] ?? "Any")}
                  onChange={(event) => updateTarget(key, event.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Any"
                />
              </Field>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 mb-2">
            <SectionLabel>Questions</SectionLabel>
            <Btn size="sm" variant="outline" onClick={addQuestion}>
              <IconPlus className="size-4" /> Add question
            </Btn>
          </div>
          <div className="space-y-3">
            {draft.questions.map((question, index) => (
              <div key={question.id} className="rounded-lg border border-border bg-surface-2 p-3">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_140px_88px_36px] gap-2 items-end">
                  <Field label={`Question ${index + 1}`}>
                    <input
                      value={question.prompt}
                      onChange={(event) => updateQuestion(index, { prompt: event.target.value })}
                      className={INPUT_CLASS}
                      placeholder="What readiness signal should we capture?"
                    />
                  </Field>
                  <Field label="Type">
                    <select
                      value={question.type}
                      onChange={(event) =>
                        updateQuestion(index, {
                          type: event.target.value as ReadinessQuestion["type"],
                        })
                      }
                      className={INPUT_CLASS}
                    >
                      <option value="scale">Scale</option>
                      <option value="single_choice">Single choice</option>
                    </select>
                  </Field>
                  <Field label="Weight">
                    <input
                      type="number"
                      min={1}
                      value={question.weight}
                      onChange={(event) => updateQuestion(index, { weight: Number(event.target.value) })}
                      className={INPUT_CLASS}
                    />
                  </Field>
                  <Btn
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-9 px-2"
                    onClick={() => removeQuestion(index)}
                    aria-label="Remove question"
                  >
                    <IconTrash className="size-4" />
                  </Btn>
                </div>
                <Field label="Options, comma separated">
                  <input
                    value={question.options.join(", ")}
                    onChange={(event) =>
                      updateQuestion(index, { optionsText: event.target.value })
                    }
                    className={`${INPUT_CLASS} mt-2`}
                    placeholder="Not yet, Trying, Comfortable, Confident"
                  />
                </Field>
              </div>
            ))}
            {!draft.questions.length && (
              <div className="rounded-lg border border-dashed border-border-strong bg-surface-2 p-5 text-center text-[12px] text-text-muted">
                Add at least one question before publishing this readiness check.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function TemplateButton({
  active,
  title,
  sub,
  onClick,
}: {
  active: boolean;
  title: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-md border px-3 py-2 text-left transition-colors"
      style={{
        background: active ? "var(--bl)" : "var(--s3)",
        color: active ? "var(--bt)" : "var(--t1)",
        borderColor: active ? "var(--bb)" : "var(--bd)",
      }}
    >
      <span className="block truncate text-[12px] font-semibold">{title}</span>
      <span className="block truncate text-[11px] opacity-75">{sub}</span>
    </button>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.06em] text-text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

function targetLabel(key: string, vocab: ReturnType<typeof adminVocabulary>) {
  const labels: Record<string, string> = {
    schoolName: vocab.schoolLabel,
    grade: vocab.gradeLabel,
    division: vocab.sectionLabel,
    subject: vocab.subjectLabel,
    responsibility: "Role",
  };
  return labels[key] ?? key;
}
