import { createFileRoute, Link } from "@tanstack/react-router";
import { useActiveTenant } from "@/lib/shiftora-store";
import { shiftoraApi, type CompletionRow } from "@/lib/shiftora-api";
import { adminVocabulary } from "@/lib/admin-vocabulary";
import { useI18n } from "@/lib/use-i18n";
import { Card, PageHeader, Metric, Chip, ProgressBar, SectionLabel, Btn } from "@/components/shiftora/primitives";
import { IconClipboardCheck, IconSchool, IconShieldCheck, IconUsers } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/admin/overview")({ component: Overview });

function Overview() {
  const tenant = useActiveTenant();
  const vocab = adminVocabulary(tenant.industry);
  const { t } = useI18n();
  const [rows, setRows] = useState<CompletionRow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    void shiftoraApi
      .completionRows(tenant.id)
      .then(setRows)
      .catch((err) => setError((err as Error).message));
  }, [tenant.id]);

  const teacherRows = useMemo(() => {
    const byUser = new Map<string, CompletionRow[]>();
    rows.forEach((row) => byUser.set(row.user.id, [...(byUser.get(row.user.id) ?? []), row]));
    return Array.from(byUser.values()).map((items) => {
      const first = items[0];
      const learning = Math.round(items.reduce((sum, item) => sum + item.learningProgress, 0) / Math.max(1, items.length));
      return {
        user: first.user,
        contexts: items.map((item) => item.assignment),
        readiness: first.readinessScore,
        learning,
        workshop: items.some((item) => item.workshopCompleted),
        knowledge: items.some((item) => item.knowledgePassed),
        certificate: items.some((item) => item.certificateStatus === "emailed"),
      };
    });
  }, [rows]);

  const total = teacherRows.length;
  const readinessDone = teacherRows.filter((row) => row.readiness > 0).length;
  const workshopDone = teacherRows.filter((row) => row.workshop).length;
  const certificateDone = teacherRows.filter((row) => row.certificate).length;

  return (
    <div>
      <PageHeader
        title={`${tenant.name} · ${vocab.adminOverviewTitle}`}
        subtitle={`${vocab.learnerSingular} onboarding, learning progress and certificate readiness from the backend.`}
        right={<Link to="/admin/people"><Btn size="sm"><IconUsers className="size-4" /> {t("manageTeachers")}</Btn></Link>}
      />

      {error && <Card className="mb-4"><div className="text-[13px] text-[color:var(--er)]">{error}</div></Card>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Metric label={vocab.learnerPlural} value={total} sub={`with ${vocab.contextPlural}`} tone="blue" icon={<IconSchool className="size-3.5" />} />
        <Metric label={t("readiness")} value={`${percent(readinessDone, total)}%`} sub={`${readinessDone} completed`} tone="teal" icon={<IconClipboardCheck className="size-3.5" />} />
        <Metric label={t("workshop")} value={`${percent(workshopDone, total)}%`} sub={`${workshopDone} marked complete`} tone="gold" icon={<IconUsers className="size-3.5" />} />
        <Metric label="Certificates" value={certificateDone} sub="emailed by admin" tone="violet" icon={<IconShieldCheck className="size-3.5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2" padded={false}>
          <div className="p-4 border-b border-border flex items-center justify-between">
            <SectionLabel>Teacher lifecycle</SectionLabel>
            <Link to="/admin/completion"><Btn variant="outline" size="sm">Review completion</Btn></Link>
          </div>
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="text-left text-text-muted border-b border-border">
                <th className="px-4 py-2.5 font-semibold">{vocab.learnerSingular}</th>
                <th className="px-4 py-2.5 font-semibold">Contexts</th>
                <th className="px-4 py-2.5 font-semibold">Learning</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {teacherRows.map((row) => (
                <tr key={row.user.id} className="border-b border-border last:border-0 align-top">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{row.user.name}</div>
                    <div className="text-[11px] text-text-muted">{row.user.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {row.contexts.map((context) => (
                        <Chip key={context.id} tone={context.primaryAssignment ? "blue" : "muted"}>
                          {context.grade} {context.division} · {context.subject}
                        </Chip>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 min-w-[140px]">
                    <div className="text-[11px] text-text-muted mb-1">{row.learning}%</div>
                    <ProgressBar value={row.learning} tone={row.learning >= 100 ? "teal" : "blue"} />
                  </td>
                  <td className="px-4 py-3">
                    <LifecycleChip row={row} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!teacherRows.length && <div className="p-8 text-center text-[13px] text-text-muted">No {vocab.learnerSingular.toLowerCase()} journey data yet. Add {vocab.learnerPlural.toLowerCase()} from the onboarding screen.</div>}
        </Card>

        <Card>
          <SectionLabel>Admin next actions</SectionLabel>
          <div className="mt-3 space-y-2">
            <ActionLink to="/admin/people" label={`Invite ${vocab.learnerPlural.toLowerCase()} and map ${vocab.contextPlural}`} />
            <ActionLink to="/admin/readiness" label="Publish the common readiness check" />
            <ActionLink to="/admin/completion" label="Mark workshops and email certificates" />
            <ActionLink to="/admin/config" label="Review school configuration" />
          </div>
        </Card>
      </div>
    </div>
  );
}

function LifecycleChip({ row }: { row: { readiness: number; learning: number; workshop: boolean; knowledge: boolean; certificate: boolean } }) {
  if (row.certificate) return <Chip tone="teal">Certificate emailed</Chip>;
  if (row.knowledge) return <Chip tone="blue">Certificate ready</Chip>;
  if (row.workshop) return <Chip tone="gold">Knowledge pending</Chip>;
  if (row.learning >= 100) return <Chip tone="blue">Workshop pending</Chip>;
  if (row.readiness > 0) return <Chip tone="muted">Learning active</Chip>;
  return <Chip tone="muted">Readiness pending</Chip>;
}

function ActionLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="block rounded-lg border border-border bg-surface-2 px-3 py-2 text-[12px] font-semibold hover:bg-surface-3">
      {label}
    </Link>
  );
}

function percent(value: number, total: number) {
  return total === 0 ? 0 : Math.round((value / total) * 100);
}
