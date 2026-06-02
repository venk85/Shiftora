import { createFileRoute } from "@tanstack/react-router";
import { useActiveTenant } from "@/lib/shiftora-store";
import { shiftoraApi, type AppUser, type Assignment } from "@/lib/shiftora-api";
import { adminVocabulary } from "@/lib/admin-vocabulary";
import { useI18n } from "@/lib/use-i18n";
import { Card, PageHeader, Chip, Btn, Metric, SectionLabel } from "@/components/shiftora/primitives";
import { IconEdit, IconPlus, IconSearch, IconUserPlus, IconUsers } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/people")({ component: People });

type TeacherDraft = {
  id: string;
  name: string;
  email: string;
  role: string;
  designation: string;
  language: string;
  status: string;
  password: string;
};

type AssignmentDraft = {
  id: string;
  userId: string;
  schoolName: string;
  grade: string;
  division: string;
  subject: string;
  responsibility: string;
  primaryAssignment: boolean;
  active: boolean;
};

function People() {
  const tenant = useActiveTenant();
  const vocab = adminVocabulary(tenant.industry);
  const { t } = useI18n();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [teacherDraft, setTeacherDraft] = useState<TeacherDraft | null>(null);
  const [assignmentDraft, setAssignmentDraft] = useState<AssignmentDraft | null>(null);
  const [modalError, setModalError] = useState("");
  const [savingTeacher, setSavingTeacher] = useState(false);
  const [savingAssignment, setSavingAssignment] = useState(false);

  const load = () => {
    setLoading(true);
    setError("");
    Promise.all([shiftoraApi.adminUsers(tenant.id), shiftoraApi.adminAssignments(tenant.id)])
      .then(([nextUsers, nextAssignments]) => {
        setUsers(nextUsers);
        setAssignments(nextAssignments);
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [tenant.id]);

  const teachers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return users
      .filter((user) => tenant.industry === "edu" ? ["ADMIN", "PRINCIPAL", "HOD", "TRAINEE", "TEACHER", "LEARNER"].includes(user.role.toUpperCase()) : ["TRAINEE", "TEACHER", "LEARNER"].includes(user.role.toUpperCase()))
      .filter((user) => {
        if (!needle) return true;
        const contexts = assignments
          .filter((item) => item.userId === user.id)
          .map((item) => `${item.grade} ${item.division} ${item.subject}`)
          .join(" ");
        return `${user.name} ${user.email} ${contexts}`.toLowerCase().includes(needle);
      });
  }, [assignments, query, users]);

  const contextsFor = (userId: string) =>
    assignments.filter((item) => item.userId === userId).sort((a, b) => Number(b.primaryAssignment) - Number(a.primaryAssignment));

  const openInvite = () => {
    setModalError("");
    setTeacherDraft({
      id: "",
      name: "",
        email: "",
        role: tenant.industry === "edu" ? "TEACHER" : "TRAINEE",
        designation: "Subject Teacher",
      language: "Tamil + English",
      status: "invited",
      password: "",
    });
  };

  const openEditTeacher = (user: AppUser) => {
    setModalError("");
    setTeacherDraft({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.toUpperCase(),
      designation: String(user.profile.designation ?? "Subject Teacher"),
      language: String(user.profile.language ?? "Tamil + English"),
      status: String(user.profile.status ?? "active"),
      password: "",
    });
  };

  const openAssignment = (userId: string, assignment?: Assignment) => {
    setModalError("");
    setAssignmentDraft(
      assignment
        ? {
            id: assignment.id,
            userId: assignment.userId,
            schoolName: assignment.schoolName,
            grade: assignment.grade,
            division: assignment.division,
            subject: assignment.subject,
            responsibility: assignment.responsibility,
            primaryAssignment: assignment.primaryAssignment,
            active: assignment.active,
          }
        : {
            id: "",
            userId,
            schoolName: tenant.name,
            grade: vocab.gradeOptions[0],
            division: vocab.sectionOptions[0],
            subject: vocab.subjectOptions[0],
            responsibility: vocab.defaultResponsibility,
            primaryAssignment: contextsFor(userId).length === 0,
            active: true,
          },
    );
  };

  const saveTeacher = async () => {
    if (!teacherDraft) return;
    if (!teacherDraft.name.trim()) {
      setModalError("Add the user's name.");
      return;
    }
    if (!teacherDraft.email.trim()) {
      setModalError("Add the user's email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(teacherDraft.email.trim())) {
      setModalError("Enter a valid email address.");
      return;
    }
    if (!teacherDraft.id && teacherDraft.password.trim().length < 6) {
      setModalError("Temporary password must be at least 6 characters.");
      return;
    }
    setError("");
    setModalError("");
    setSavingTeacher(true);
    try {
      const saved = await shiftoraApi.saveAdminUser({
        id: teacherDraft.id,
        tenantId: tenant.id,
        email: teacherDraft.email.trim(),
        name: teacherDraft.name.trim(),
        role: teacherDraft.role,
        avatar: initials(teacherDraft.name.trim()),
        profile: {
          designation: teacherDraft.designation.trim() || roleName(teacherDraft.role),
          language: teacherDraft.language.trim() || "English",
          status: teacherDraft.status,
          ...(teacherDraft.password.trim() ? { password: teacherDraft.password.trim() } : {}),
        },
      });
      setUsers((current) => upsertById(current, saved));
      if (!teacherDraft.id && canHaveClassContext(teacherDraft.role)) {
        setAssignmentDraft({
          id: "",
          userId: saved.id,
          schoolName: tenant.name,
          grade: vocab.gradeOptions[0],
          division: vocab.sectionOptions[0],
          subject: vocab.subjectOptions[0],
          responsibility: teacherDraft.designation,
          primaryAssignment: true,
          active: true,
        });
      }
      setTeacherDraft(null);
      toast.success(`${roleName(teacherDraft.role)} saved`);
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Could not save user. Please try again.";
      setModalError(message);
      toast.error(message);
    } finally {
      setSavingTeacher(false);
    }
  };

  const saveAssignment = async () => {
    if (!assignmentDraft) return;
    setError("");
    setModalError("");
    setSavingAssignment(true);
    try {
      const saved = await shiftoraApi.saveAdminAssignment({
        id: assignmentDraft.id,
        userId: assignmentDraft.userId,
        tenantId: tenant.id,
        schoolName: assignmentDraft.schoolName,
        grade: assignmentDraft.grade,
        division: assignmentDraft.division,
        subject: assignmentDraft.subject,
        responsibility: assignmentDraft.responsibility,
        primaryAssignment: assignmentDraft.primaryAssignment,
        active: assignmentDraft.active,
        metadata: { domain: tenant.industry },
      });
      const refreshed = assignmentDraft.primaryAssignment
        ? await shiftoraApi.adminAssignments(tenant.id)
        : upsertById(assignments, saved);
      setAssignments(refreshed);
      setAssignmentDraft(null);
      toast.success("Teaching context saved");
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Could not save class mapping. Please try again.";
      setModalError(message);
      toast.error(message);
    } finally {
      setSavingAssignment(false);
    }
  };

  const activeTeachers = teachers.filter((user) => String(user.profile.status ?? "active") === "active").length;
  const contextCount = teachers.reduce((sum, user) => sum + contextsFor(user.id).length, 0);

  return (
    <div>
      <PageHeader
        title={vocab.onboardingTitle}
        subtitle={`${vocab.onboardingSubtitle} ${tenant.name}.`}
        right={<Btn size="sm" onClick={openInvite}><IconUserPlus className="size-4" /> Add {tenant.industry === "edu" ? "school user" : vocab.learnerSingular.toLowerCase()}</Btn>}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <Metric label={tenant.industry === "edu" ? "School users" : vocab.learnerPlural} value={teachers.length} sub={`onboarded in this ${tenant.type.toLowerCase()}`} tone="blue" icon={<IconUsers className="size-3.5" />} />
        <Metric label="Active" value={activeTeachers} sub="ready for programme" tone="teal" />
        <Metric label={vocab.contextMetric} value={contextCount} sub={`${vocab.gradeLabel.toLowerCase()}-${vocab.sectionLabel.toLowerCase()}-${vocab.subjectLabel.toLowerCase()} mappings`} tone="gold" />
      </div>

      {error && <Card className="mb-4"><div className="text-[13px] text-[color:var(--er)]">{error}</div></Card>}

      <Card padded={false}>
        <div className="p-3 border-b border-border flex items-center gap-2">
          <IconSearch className="size-4 text-text-muted" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} className="flex-1 bg-transparent text-[12.5px] outline-none" placeholder={`Search ${vocab.learnerSingular.toLowerCase()}, ${vocab.gradeLabel.toLowerCase()}, ${vocab.sectionLabel.toLowerCase()} or ${vocab.subjectLabel.toLowerCase()}`} />
        </div>
        <div className="divide-y divide-border">
          {teachers.map((teacher) => {
            const contexts = contextsFor(teacher.id);
            return (
              <div key={teacher.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-[14px]">{teacher.name}</div>
                    <div className="text-[11px] text-text-muted">{teacher.email} · {roleName(teacher.role)} · {String(teacher.profile.designation ?? "Teacher")}</div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Chip tone={String(teacher.profile.status ?? "active") === "active" ? "teal" : "blue"}>{String(teacher.profile.status ?? "active")}</Chip>
                      <Chip tone="muted">{String(teacher.profile.language ?? "Tamil + English")}</Chip>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {canHaveClassContext(teacher.role) && <Btn variant="outline" size="sm" onClick={() => openAssignment(teacher.id)}><IconPlus className="size-3.5" /> Class</Btn>}
                    <Btn variant="ghost" size="sm" onClick={() => openEditTeacher(teacher)}><IconEdit className="size-3.5" /></Btn>
                  </div>
                </div>
                {canHaveClassContext(teacher.role) && <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-2">
                  {contexts.map((context) => (
                    <button key={context.id} onClick={() => openAssignment(teacher.id, context)} className="text-left rounded-lg border border-border bg-surface-2 px-3 py-2 hover:bg-surface-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12.5px] font-semibold">{context.grade} {context.division} · {context.subject}</span>
                        <Chip tone={context.active ? "teal" : "muted"}>{context.primaryAssignment ? "Primary" : context.active ? "Active" : "Inactive"}</Chip>
                      </div>
                      <div className="text-[11px] text-text-muted mt-1">{context.responsibility} · {context.schoolName}</div>
                    </button>
                  ))}
                  {!contexts.length && (
                    <button onClick={() => openAssignment(teacher.id)} className="text-left rounded-lg border border-dashed border-border-strong px-3 py-2 text-[12px] text-text-muted">
                      Add the first {vocab.contextSingular} for this {vocab.learnerSingular.toLowerCase()}.
                    </button>
                  )}
                </div>}
              </div>
            );
          })}
          {loading && <div className="p-8 text-center text-[13px] text-text-muted">Loading teachers from backend...</div>}
          {!loading && !teachers.length && <div className="p-8 text-center text-[13px] text-text-muted">No {vocab.learnerPlural.toLowerCase()} match this search.</div>}
        </div>
      </Card>

      {teacherDraft && (
        <Editor title={teacherDraft.id ? "Edit school user" : "Add school user"} onCancel={() => setTeacherDraft(null)} onSave={saveTeacher} saveLabel={teacherDraft.id ? "Save user" : "Create user"} error={modalError} saving={savingTeacher}>
          <Field label={`${vocab.learnerSingular} name`} value={teacherDraft.name} onChange={(value) => setTeacherDraft({ ...teacherDraft, name: value })} />
          <Field label="Email" value={teacherDraft.email} onChange={(value) => setTeacherDraft({ ...teacherDraft, email: value })} />
          {tenant.industry === "edu" ? (
            <SelectField label="Role" value={teacherDraft.role} options={["ADMIN", "PRINCIPAL", "HOD", "TEACHER", "TRAINEE", "CUSTOM"]} onChange={(value) => setTeacherDraft({ ...teacherDraft, role: value, designation: value === "CUSTOM" ? teacherDraft.designation : roleName(value) })} />
          ) : null}
          {teacherDraft.role === "CUSTOM" && <Field label="Custom role label" value={teacherDraft.designation} onChange={(value) => setTeacherDraft({ ...teacherDraft, designation: value })} />}
          <Field label="Designation" value={teacherDraft.designation} onChange={(value) => setTeacherDraft({ ...teacherDraft, designation: value })} />
          <Field label="Language" value={teacherDraft.language} onChange={(value) => setTeacherDraft({ ...teacherDraft, language: value })} />
          <Field
            label={teacherDraft.id ? "Reset password (optional)" : "Temporary password"}
            type="password"
            value={teacherDraft.password}
            onChange={(value) => setTeacherDraft({ ...teacherDraft, password: value })}
          />
          <SelectField label={t("status")} value={teacherDraft.status} options={["invited", "active", "paused"]} onChange={(value) => setTeacherDraft({ ...teacherDraft, status: value })} />
        </Editor>
      )}

      {assignmentDraft && (
        <Editor title={assignmentDraft.id ? "Edit class mapping" : "Add class mapping"} onCancel={() => setAssignmentDraft(null)} onSave={saveAssignment} saveLabel="Save class" error={modalError} saving={savingAssignment}>
          <Field label={vocab.schoolLabel} value={assignmentDraft.schoolName} onChange={(value) => setAssignmentDraft({ ...assignmentDraft, schoolName: value })} />
          <div className="grid grid-cols-3 gap-2">
            <SelectField label={vocab.gradeLabel} value={assignmentDraft.grade} options={vocab.gradeOptions} onChange={(value) => setAssignmentDraft({ ...assignmentDraft, grade: value })} />
            <SelectField label={vocab.sectionLabel} value={assignmentDraft.division} options={vocab.sectionOptions} onChange={(value) => setAssignmentDraft({ ...assignmentDraft, division: value })} />
            <SelectField label={vocab.subjectLabel} value={assignmentDraft.subject} options={vocab.subjectOptions} onChange={(value) => setAssignmentDraft({ ...assignmentDraft, subject: value })} />
          </div>
          <Field label="Responsibility" value={assignmentDraft.responsibility} onChange={(value) => setAssignmentDraft({ ...assignmentDraft, responsibility: value })} />
          <label className="flex items-center gap-2 text-[12px] font-semibold text-text">
            <input type="checkbox" checked={assignmentDraft.primaryAssignment} onChange={(event) => setAssignmentDraft({ ...assignmentDraft, primaryAssignment: event.target.checked })} />
            {vocab.primaryContext}
          </label>
          <label className="flex items-center gap-2 text-[12px] font-semibold text-text">
            <input type="checkbox" checked={assignmentDraft.active} onChange={(event) => setAssignmentDraft({ ...assignmentDraft, active: event.target.checked })} />
            Active
          </label>
        </Editor>
      )}
    </div>
  );
}

function Editor({ title, children, onCancel, onSave, saveLabel, error, saving }: { title: string; children: React.ReactNode; onCancel: () => void; onSave: () => void; saveLabel: string; error?: string; saving?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 px-4">
      <Card className="w-full max-w-[560px]">
        <div className="flex items-center justify-between mb-4">
          <SectionLabel>{title}</SectionLabel>
          <Btn variant="ghost" size="sm" onClick={onCancel}>Close</Btn>
        </div>
        {error && (
          <div className="mb-3 rounded-md border px-3 py-2 text-[12px] font-semibold" style={{ background: "var(--erl)", borderColor: "rgba(220,38,38,.22)", color: "var(--er)" }}>
            {error}
          </div>
        )}
        <div className="space-y-3">{children}</div>
        <div className="mt-5 flex justify-end gap-2">
          <Btn variant="outline" onClick={onCancel} disabled={saving}>Cancel</Btn>
          <Btn onClick={onSave} disabled={saving}>{saving ? "Saving..." : saveLabel}</Btn>
        </div>
      </Card>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold text-text-muted mb-1">{label}</span>
      <input type={type} className="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-[13px]" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold text-text-muted mb-1">{label}</span>
      <select className="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-[13px]" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function upsertById<T extends { id: string }>(items: T[], item: T) {
  return items.some((existing) => existing.id === item.id)
    ? items.map((existing) => existing.id === item.id ? item : existing)
    : [...items, item];
}

function canHaveClassContext(role: string) {
  return ["HOD", "TRAINEE", "TEACHER", "LEARNER"].includes(role.toUpperCase());
}

function roleName(role: string) {
  const names: Record<string, string> = {
    ADMIN: "School Admin",
    PRINCIPAL: "Principal",
    HOD: "HOD",
    TEACHER: "Teacher",
    TRAINEE: "Teacher",
    LEARNER: "Teacher",
    CUSTOM: "Custom role",
  };
  return names[role.toUpperCase()] ?? role;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "T";
}
