import { createFileRoute } from "@tanstack/react-router";
import { useActiveTenant, useApp } from "@/lib/shiftora-store";
import { shiftoraApi, type CompletionRow } from "@/lib/shiftora-api";
import { adminVocabulary } from "@/lib/admin-vocabulary";
import { Btn, Card, Chip, PageHeader, ProgressBar, SectionLabel } from "@/components/shiftora/primitives";
import { IconCertificate, IconMail, IconUsers } from "@tabler/icons-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/admin/completion")({ component: AdminCompletion });

function AdminCompletion() {
  const tenant = useActiveTenant();
  const vocab = adminVocabulary(tenant.industry);
  const currentUser = useApp((s) => s.currentUser);
  const [rows, setRows] = useState<CompletionRow[]>([]);
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState("");

  const load = () => {
    setError("");
    void shiftoraApi
      .completionRows(tenant.id)
      .then(setRows)
      .catch((err) => setError((err as Error).message));
  };

  useEffect(load, [tenant.id]);

  const markWorkshop = async (row: CompletionRow) => {
    setBusyKey(`w-${row.assignment.id}`);
    setError("");
    try {
      const updated = await shiftoraApi.markWorkshopComplete(tenant.id, {
        userId: row.user.id,
        assignmentId: row.assignment.id,
        completedBy: currentUser?.email ?? "admin",
        notes: "Marked complete from admin completion console.",
      });
      setRows((current) => current.map((item) => sameRow(item, row) ? updated : item));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyKey("");
    }
  };

  const generateCertificate = async (row: CompletionRow) => {
    setBusyKey(`c-${row.assignment.id}`);
    setError("");
    try {
      const updated = await shiftoraApi.generateCertificate(tenant.id, {
        userId: row.user.id,
        assignmentId: row.assignment.id,
        generatedBy: currentUser?.email ?? "admin",
      });
      setRows((current) => current.map((item) => sameRow(item, row) ? updated : item));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyKey("");
    }
  };

  return (
    <div>
      <PageHeader
        title="Completion & certificates"
        subtitle="Mark workshop completion and email certificates once prerequisites are met."
        right={<Chip tone="blue"><IconUsers className="size-3" /> {rows.length} {vocab.contextPlural}</Chip>}
      />

      {error && (
        <Card className="mb-4">
          <div className="text-[13px] text-[color:var(--er)]">{error}</div>
        </Card>
      )}

      <Card padded={false}>
        <div className="overflow-x-auto">
        <table className="min-w-[780px] w-full text-[12.5px]">
          <thead>
            <tr className="text-left text-text-muted border-b border-border">
              <th className="px-4 py-2.5 font-semibold">{vocab.learnerSingular}</th>
              <th className="px-4 py-2.5 font-semibold">Context</th>
              <th className="px-4 py-2.5 font-semibold">Learning</th>
              <th className="px-4 py-2.5 font-semibold">Workshop</th>
              <th className="px-4 py-2.5 font-semibold" title="Knowledge check">
                <span className="hidden sm:inline">Knowledge check</span>
                <span className="inline sm:hidden">Know.</span>
              </th>
              <th className="px-4 py-2.5 font-semibold">Certificate</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.user.id}-${row.assignment.id}`} className="border-b border-border last:border-0 align-top">
                <td className="px-4 py-3">
                  <div className="font-semibold">{row.user.name}</div>
                  <div className="text-[11px] text-text-muted">{row.user.email}</div>
                </td>
                <td className="px-4 py-3 text-text-muted">
                  {row.assignment.grade} {row.assignment.division} · {row.assignment.subject}
                  <div className="text-[11px]">{row.assignment.schoolName}</div>
                </td>
                <td className="px-4 py-3 min-w-[120px]">
                  <div className="flex justify-between text-[11px] text-text-muted mb-1">
                    <span>{row.learningProgress}%</span>
                    <span>Ready {row.readinessScore}%</span>
                  </div>
                  <ProgressBar value={row.learningProgress} tone={row.learningProgress === 100 ? "teal" : "blue"} />
                </td>
                <td className="px-4 py-3">
                  {row.workshopCompleted ? (
                    <Chip tone="teal">Completed</Chip>
                  ) : (
                    <Btn size="sm" variant="outline" disabled={busyKey === `w-${row.assignment.id}`} onClick={() => markWorkshop(row)}>
                      Mark complete
                    </Btn>
                  )}
                </td>
                <td className="px-4 py-3">
                  {row.knowledgeScore == null ? (
                    <Chip tone="muted">Pending</Chip>
                  ) : (
                    <Chip tone={row.knowledgePassed ? "teal" : "gold"}>{row.knowledgeScore}%</Chip>
                  )}
                </td>
                <td className="px-4 py-3">
                  {row.certificateStatus === "emailed" ? (
                    <div>
                      <Chip tone="teal"><IconMail className="size-3" /> Emailed</Chip>
                      <div className="text-[11px] text-text-muted mt-1">{row.certificateNumber}</div>
                    </div>
                  ) : (
                    <Btn
                      size="sm"
                      disabled={!row.certificateEligible || busyKey === `c-${row.assignment.id}`}
                      onClick={() => generateCertificate(row)}
                    >
                      <IconCertificate className="size-3.5" /> Email certificate
                    </Btn>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {!rows.length && (
          <div className="p-8 text-center text-[13px] text-text-muted">
            No {vocab.learnerSingular.toLowerCase()} {vocab.contextPlural} found for this tenant.
          </div>
        )}
      </Card>

      <Card className="mt-4">
        <SectionLabel>Certificate prerequisites</SectionLabel>
        <div className="mt-2 text-[12px] text-text-muted">
          Readiness completed, learning at 100%, workshop completed by admin, and knowledge check passed.
        </div>
      </Card>
    </div>
  );
}

function sameRow(a: CompletionRow, b: CompletionRow) {
  return a.user.id === b.user.id && a.assignment.id === b.assignment.id;
}
