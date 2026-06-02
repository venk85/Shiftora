import { createFileRoute, Link } from "@tanstack/react-router";
import { useApp, useActiveTenant } from "@/lib/shiftora-store";
import { shiftoraApi } from "@/lib/shiftora-api";
import { useI18n } from "@/lib/use-i18n";
import type { PracticeEntry } from "@/lib/shiftora-store";
import { Card, PageHeader, Chip, Btn, SectionLabel } from "@/components/shiftora/primitives";
import { IconSparkles } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/learner/practice")({ component: Practice });

function Practice() {
  const tenant = useActiveTenant();
  const { t } = useI18n();
  const allPractice = useApp((s) => s.practiceLog);
  const [remoteLog, setRemoteLog] = useState<PracticeEntry[] | null>(null);
  const [error, setError] = useState("");
  const localLog = useMemo(() => allPractice.filter((p) => p.tenantId === tenant.id), [allPractice, tenant.id]);
  const log = remoteLog ?? localLog;

  useEffect(() => {
    setError("");
    void shiftoraApi
      .practiceForTenant(tenant.id)
      .then(setRemoteLog)
      .catch((err) => {
        setRemoteLog(null);
        setError((err as Error).message);
      });
  }, [tenant.id]);

  const totalRuns = log.length;
  const avgScore = log.length
    ? Math.round(log.flatMap((e) => e.scores.map((s) => s.value)).reduce((a, b) => a + b, 0) / log.flatMap((e) => e.scores).length)
    : 0;
  const qualified = avgScore >= 80 && totalRuns >= 3;

  return (
    <div>
      <PageHeader
        title={t("practiceLog")}
        subtitle={t("practiceLogSubtitle")}
        right={<Chip tone={qualified ? "teal" : "gold"}>{qualified ? t("qualified") : t("inProgress")}</Chip>}
      />
      {error && (
        <Card className="mb-4">
          <div className="text-[13px] text-[color:var(--er)]">{t("unableToLoadPractice")} {error}</div>
        </Card>
      )}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card><SectionLabel>{t("totalRuns")}</SectionLabel><div className="metric-num">{totalRuns}</div></Card>
        <Card><SectionLabel>{t("averageQuality")}</SectionLabel><div className="metric-num">{avgScore || "—"}{avgScore ? "%" : ""}</div></Card>
        <Card><SectionLabel>{t("status")}</SectionLabel><div className="metric-num text-[18px]" style={{ color: qualified ? "var(--ok)" : "var(--g)" }}>{qualified ? t("certificateReady") : t("keepPracticing")}</div></Card>
      </div>
      {log.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <IconSparkles className="size-8 mx-auto text-text-subtle mb-2" />
            <div className="font-semibold mb-1">{t("noPracticeRuns")}</div>
            <p className="text-[12px] text-text-muted mb-3">{t("saveSandboxRun")}</p>
            <Link to="/learner/sandbox"><Btn>{t("openSandbox")}</Btn></Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {log.map((e) => (
            <Card key={e.id}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="font-semibold text-[13px]">{e.scenarioTitle}</div>
                  <div className="text-[11px] text-text-muted">{new Date(e.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex gap-1.5">
                  {e.scores.map((s) => <Chip key={s.label} tone={s.value >= 85 ? "teal" : "gold"}>{s.label}: {s.value}</Chip>)}
                </div>
              </div>
              {Object.keys(e.inputs ?? {}).length > 0 && (
                <div className="mb-2 rounded-md border border-border bg-surface-2 px-3 py-2">
                  <SectionLabel>{t("inputsUsed")}</SectionLabel>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {Object.entries(e.inputs).map(([key, value]) => (
                      <Chip key={key} tone="muted" className="max-w-full">
                        <span className="truncate">
                          {formatInputKey(key)}: {value}
                        </span>
                      </Chip>
                    ))}
                  </div>
                </div>
              )}
              <div className="text-[12px] text-text-muted line-clamp-2">{e.output.replace(/[#*`]/g, "").slice(0, 220)}…</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function formatInputKey(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
