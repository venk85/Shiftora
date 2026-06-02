import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useActiveTenant, useApp } from "@/lib/shiftora-store";
import { Card, PageHeader, Chip, SectionLabel } from "@/components/shiftora/primitives";

export const Route = createFileRoute("/principal/heatmap")({ component: Heatmap });

function color(v: number) {
  if (v >= 70) return { bg: "var(--okl)", bd: "var(--okb)", tx: "var(--ok)" };
  if (v >= 45) return { bg: "var(--bl)", bd: "var(--bb)", tx: "var(--bt)" };
  if (v >= 30) return { bg: "var(--gl)", bd: "var(--gb)", tx: "var(--gt)" };
  return { bg: "var(--erl)", bd: "rgba(220,38,38,.22)", tx: "var(--er)" };
}

function Heatmap() {
  const tenant = useActiveTenant();
  const nav = useNavigate();
  const setRole = useApp((s) => s.setRole);
  return (
    <div>
      <PageHeader title={`${tenant.subdivisionNoun} heatmap`} subtitle="Click a cell to drill into that team's view." right={<div className="flex gap-1.5"><Chip tone="ok">Strong</Chip><Chip tone="blue">Adopting</Chip><Chip tone="gold">Early</Chip><Chip tone="er">At risk</Chip></div>} />
      <Card padded={false}>
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="text-left text-text-muted border-b border-border">
              <th className="px-4 py-2.5 font-semibold">{tenant.subdivisionNoun.replace(/s$/, "")}</th>
              <th className="px-4 py-2.5 font-semibold text-center">Maturity</th>
              <th className="px-4 py-2.5 font-semibold text-center">Adoption</th>
              <th className="px-4 py-2.5 font-semibold text-center">Quality</th>
              <th className="px-4 py-2.5 font-semibold text-center">Engagement</th>
            </tr>
          </thead>
          <tbody>
            {tenant.subdivisions.map((s) => {
              const cells = [s.maturity, s.adoption, Math.min(95, s.adoption + 10), Math.max(20, s.maturity - 5)];
              return (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-semibold">{s.name}<div className="text-[11px] font-normal text-text-muted">{s.hod}</div></td>
                  {cells.map((v, i) => {
                    const c = color(v);
                    return (
                      <td key={i} className="px-3 py-2 text-center">
                        <button onClick={() => { setRole("hod"); nav({ to: "/hod/dashboard" }); }} className="w-full rounded-md py-2.5 font-bold text-[13px] border transition-transform hover:scale-105" style={{ background: c.bg, color: c.tx, borderColor: c.bd }}>{v}</button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
