import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Card,
  Chip,
  Metric,
  PageHeader,
  ProgressBar,
  SectionLabel,
} from "@/components/shiftora/primitives";
import {
  IconAlertTriangle,
  IconFileAnalytics,
  IconMap2,
  IconShieldCheck,
} from "@tabler/icons-react";
import { useActiveTenant, useApp } from "@/lib/shiftora-store";
import { shiftoraApi, type DeoOverview as DeoOverviewData } from "@/lib/shiftora-api";

export const Route = createFileRoute("/deo/overview")({ component: DeoOverview });

function DeoOverview() {
  const tenant = useActiveTenant();
  const currentUser = useApp((state) => state.currentUser);
  const [overview, setOverview] = useState<DeoOverviewData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    const scopedTenantId = currentUser?.role === "deo" && !currentUser.isSuper ? undefined : tenant.id;
    shiftoraApi
      .deoOverview(scopedTenantId)
      .then(setOverview)
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load DEO overview"));
  }, [currentUser?.isSuper, currentUser?.role, tenant.id]);

  return (
    <div>
      <PageHeader
        title="DEO · District overview"
        subtitle={overview ? `${overview.districtName} district command view for FLN, compliance, risk and directorate reporting.` : "Loading district overview from PostgreSQL."}
        right={
          <Chip tone="violet">
            <IconFileAnalytics className="size-3" /> Directorate report auto-generated
          </Chip>
        }
      />
      {error && (
        <Card className="mb-5">
          <div className="text-[13px] font-semibold text-[color:var(--er)]">{error}</div>
        </Card>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Metric
          label="Blocks"
          value={String(overview?.blocks ?? 0)}
          sub={overview?.districtName ?? "assigned district"}
          tone="violet"
          icon={<IconMap2 className="size-3.5" />}
        />
        <Metric
          label="District FLN"
          value={`${overview?.districtFln ?? 0}%`}
          sub="onboarded school average"
          tone="blue"
          icon={<IconShieldCheck className="size-3.5" />}
        />
        <Metric
          label="At-risk alerts"
          value={String(overview?.atRiskAlerts ?? 0)}
          sub="schools in critical blocks"
          tone="er"
          icon={<IconAlertTriangle className="size-3.5" />}
        />
        <Metric
          label="Compliance"
          value={`${overview?.compliance ?? 0}%`}
          sub="weighted average"
          tone="teal"
          icon={<IconFileAnalytics className="size-3.5" />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-4">
        <Card>
          <SectionLabel>{overview?.blocks ?? 0}-block heatmap</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            {(overview?.blockHeatmap ?? []).map((block) => (
              <div
                key={block.blockCode}
                className={`rounded-lg border p-4 ${block.critical ? "bg-[color:var(--erl)] border-[color:rgba(220,38,38,.22)]" : block.score >= 80 ? "bg-[color:var(--okl)] border-[color:var(--okb)]" : "bg-[color:var(--bl)] border-[color:var(--bb)]"}`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{block.name}</div>
                  <Chip tone={block.schools === 0 ? "default" : block.critical ? "er" : block.score >= 80 ? "ok" : "blue"}>
                    {block.schools === 0 ? "No schools" : block.critical ? "Critical" : "Active"}
                  </Chip>
                </div>
                <div
                  className={`text-[30px] font-bold mt-4 ${block.critical ? "text-[color:var(--er)]" : block.score >= 80 ? "text-[color:var(--ok)]" : "text-[color:var(--bt)]"}`}
                >
                  {block.score}%
                </div>
                <div className="text-[11px] text-text-muted">FLN readiness index · {block.schools} schools</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionLabel>NEP / NIPUN / Samagra / UDISE+ compliance</SectionLabel>
          <div className="space-y-3 mt-3">
            {(overview?.complianceBars ?? []).map((item) => (
              <div key={item.name}>
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="font-semibold">{item.name}</span>
                  <span className="text-text-muted">{item.value}%</span>
                </div>
                <ProgressBar
                  value={item.value}
                  tone={item.value > 85 ? "ok" : item.value > 75 ? "blue" : "am"}
                />
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-2">
            <SectionLabel>At-risk alerts</SectionLabel>
            {(overview?.alerts ?? []).map((alert) => (
              <div
                key={alert}
                className="flex items-start gap-2 rounded-md bg-[color:var(--erl)] border border-[color:rgba(220,38,38,.18)] p-2 text-[12px]"
              >
                <IconAlertTriangle className="size-4 text-[color:var(--er)] mt-0.5 shrink-0" />
                <span>{alert}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <SectionLabel>Auto-generated directorate report</SectionLabel>
          <Chip tone="violet">Draft ready</Chip>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[12px]">
          {(overview?.directorateReport ?? []).map((item, index) => (
            <div key={item} className="rounded-md bg-surface-3 p-3">
              <b>{["Executive summary", "Directorate asks", "Next submission"][index] ?? "Report note"}</b>
              <p className="text-text-muted mt-1">{item}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
