import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
  IconCalendarCheck,
  IconMap2,
  IconSparkles,
  IconSchool,
} from "@tabler/icons-react";
import { useActiveTenant, useApp } from "@/lib/shiftora-store";
import { shiftoraApi, type BeoOverview as BeoOverviewData } from "@/lib/shiftora-api";

export const Route = createFileRoute("/beo/overview")({ component: BeoOverview });

function heatTone(score: number) {
  if (score >= 80) return "bg-[color:var(--okl)] border-[color:var(--okb)] text-[color:var(--ok)]";
  if (score >= 65) return "bg-[color:var(--bl)] border-[color:var(--bb)] text-[color:var(--bt)]";
  if (score >= 50)
    return "bg-[color:var(--aml)] border-[color:rgba(217,119,6,.22)] text-[color:var(--am)]";
  return "bg-[color:var(--erl)] border-[color:rgba(220,38,38,.22)] text-[color:var(--er)]";
}

function BeoOverview() {
  const tenant = useActiveTenant();
  const currentUser = useApp((state) => state.currentUser);
  const nav = useNavigate();
  const [overview, setOverview] = useState<BeoOverviewData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Guard: if user's actual role is DEO (data mismatch), redirect to the right page.
  useEffect(() => {
    if (currentUser && !currentUser.isSuper && currentUser.role === "deo") {
      void nav({ to: "/deo/overview" });
    }
  }, [currentUser, nav]);

  useEffect(() => {
    setError("");
    setLoading(true);
    const scopedTenantId = currentUser?.role === "beo" && !currentUser.isSuper ? undefined : tenant.id;
    shiftoraApi
      .beoOverview(scopedTenantId)
      .then(setOverview)
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load BEO overview"))
      .finally(() => setLoading(false));
  }, [currentUser?.isSuper, currentUser?.role, tenant.id]);

  return (
    <div>
      <PageHeader
        title="BEO · Block overview"
        subtitle={overview ? `${overview.blockName} block monitoring for NIPUN FLN, visits, and AI-supported interventions.` : "Loading block overview from PostgreSQL."}
        right={
          <Chip tone="teal">
            <IconSparkles className="size-3" /> Shiksha AI recommendations active
          </Chip>
        }
      />
      {loading && !overview && (
        <Card className="mb-5">
          <div className="text-[13px] text-text-muted">Loading block data…</div>
        </Card>
      )}
      {error && (
        <Card className="mb-5">
          <div className="text-[13px] font-semibold text-[color:var(--er)]">
            {error.toLowerCase().includes("not configured") || error.toLowerCase().includes("no data")
              ? "No BEO data is configured for this block. Contact the platform admin to assign block and school data."
              : error}
          </div>
        </Card>
      )}
      {!loading && !error && !overview && (
        <Card className="mb-5">
          <div className="text-[13px] text-text-muted">No block overview data found. The BEO profile may not be fully configured yet.</div>
        </Card>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Metric
          label="Schools tracked"
          value={overview ? String(overview.schoolsTracked) : "0"}
          sub={overview ? overview.blockOfficerOffice : "from onboarded schools"}
          tone="teal"
          icon={<IconSchool className="size-3.5" />}
        />
        <Metric
          label="Block FLN"
          value={`${overview?.blockFln ?? 0}%`}
          sub={overview?.districtName ?? "assigned district"}
          tone="blue"
          icon={<IconMap2 className="size-3.5" />}
        />
        <Metric
          label="Visits logged"
          value={String(overview?.visitsLogged ?? 0)}
          sub="derived from visit coverage"
          tone="gold"
          icon={<IconCalendarCheck className="size-3.5" />}
        />
        <Metric
          label="At-risk schools"
          value={String(overview?.atRiskSchools ?? 0)}
          sub="need BRC support"
          tone="er"
          icon={<IconAlertTriangle className="size-3.5" />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.45fr_.9fr] gap-4">
        <Card>
          <div className="flex items-center justify-between gap-3 mb-3">
            <SectionLabel>{overview?.schoolsTracked ?? 0}-school onboarded heatmap</SectionLabel>
            <div className="flex gap-1.5">
              <Chip tone="ok">Strong</Chip>
              <Chip tone="blue">Watch</Chip>
              <Chip tone="am">Support</Chip>
              <Chip tone="er">Critical</Chip>
            </div>
          </div>
          <div className="grid grid-cols-7 md:grid-cols-12 gap-1.5">
            {(overview?.schools ?? []).map((school) => (
              <button
                key={school.udiseCode}
                title={`${school.name}: ${school.score}%`}
                className={`aspect-square rounded-md border text-[10px] font-bold transition-transform hover:scale-110 ${heatTone(school.score)}`}
              >
                {school.score}
              </button>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <SectionLabel>NIPUN grade-wise progress</SectionLabel>
            <div className="space-y-3 mt-3">
              {(overview?.gradeProgress ?? []).map(({ grade, progress }) => (
                <div key={grade}>
                  <div className="flex justify-between text-[12px] mb-1">
                    <span className="font-semibold">{grade}</span>
                    <span className="text-text-muted">{progress}%</span>
                  </div>
                  <ProgressBar value={progress} tone={progress > 88 ? "ok" : "blue"} />
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <SectionLabel>AI recommendations</SectionLabel>
            <div className="space-y-2 mt-3 text-[12px]">
              {(overview?.recommendations ?? []).map((rec) => (
                <div
                  key={rec.text}
                  className="rounded-md border border-[color:var(--bb)] bg-[color:var(--bl)] px-3 py-2 text-text"
                >
                  {rec.text}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Card className="mt-4" padded={false}>
        <div className="p-4 pb-2">
          <SectionLabel>School visit log</SectionLabel>
        </div>
        <table className="w-full text-[12.5px]">
          <tbody>
            {(overview?.visits ?? []).map((visit) => (
              <tr key={visit.school} className="border-t border-border">
                <td className="px-4 py-3 font-semibold">
                  {visit.school}
                  <div className="text-[11px] text-text-muted">{visit.focus}</div>
                </td>
                <td className="px-4 py-3 text-text-muted">{visit.date}</td>
                <td className="px-4 py-3 text-right">
                  <Chip tone={visit.status === "Follow-up needed" ? "am" : "ok"}>
                    {visit.status}
                  </Chip>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
