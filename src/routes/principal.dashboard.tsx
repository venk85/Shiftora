import { createFileRoute } from "@tanstack/react-router";
import { useActiveTenant } from "@/lib/shiftora-store";
import { Card, PageHeader, Metric, SectionLabel, Chip, ProgressBar } from "@/components/shiftora/primitives";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Line, LineChart, Legend } from "recharts";
import { IconTrendingUp, IconCurrencyRupee, IconUsers, IconBolt } from "@tabler/icons-react";

export const Route = createFileRoute("/principal/dashboard")({ component: PrincipalDash });

function PrincipalDash() {
  const tenant = useActiveTenant();
  const trend = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((m, i) => ({ m, adoption: 18 + i * 8 + ((i * 11) % 6), maturity: 22 + i * 6 + ((i * 5) % 5) }));
  const benchmark = [{ k: "You", v: tenant.adoption }, { k: "Peer avg", v: 48 }, { k: "Top 10%", v: 78 }];

  return (
    <div>
      <PageHeader title={`${tenant.personas.principal.title} dashboard`} subtitle={`${tenant.name} · executive view`} right={<Chip tone="gold">Q2 FY26</Chip>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Metric label="AI maturity" value={`${tenant.maturity}%`} sub="+8 QoQ" tone="blue" icon={<IconTrendingUp className="size-3.5" />} />
        <Metric label="Adoption" value={`${tenant.adoption}%`} sub={`vs peer avg 48%`} tone="violet" icon={<IconBolt className="size-3.5" />} />
        <Metric label="Time saved" value={`${Math.round(tenant.size * 1.4)}h/wk`} sub="across organisation" tone="teal" icon={<IconUsers className="size-3.5" />} />
        <Metric label="Est. ROI" value={`₹${(tenant.size * 0.08).toFixed(1)}L`} sub="annualised" tone="gold" icon={<IconCurrencyRupee className="size-3.5" />} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <SectionLabel>Maturity & adoption trend</SectionLabel>
          <div className="h-[240px] mt-2">
            <ResponsiveContainer>
              <LineChart data={trend}>
                <CartesianGrid stroke="var(--bd)" vertical={false} />
                <XAxis dataKey="m" stroke="var(--t3)" fontSize={11} />
                <YAxis stroke="var(--t3)" fontSize={11} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--bd)", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="maturity" stroke="var(--b)" strokeWidth={2} />
                <Line type="monotone" dataKey="adoption" stroke="var(--vi)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <SectionLabel>Benchmark vs peers</SectionLabel>
          <div className="space-y-4 mt-3">
            {benchmark.map((b) => (
              <div key={b.k}>
                <div className="flex justify-between text-[12px] mb-1"><span className="font-semibold">{b.k}</span><span className="text-text-muted">{b.v}%</span></div>
                <ProgressBar value={b.v} tone={b.k === "You" ? "blue" : b.k === "Top 10%" ? "teal" : "muted"} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
