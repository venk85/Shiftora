import { createFileRoute } from "@tanstack/react-router";
import { useActiveTenant } from "@/lib/shiftora-store";
import { Card, PageHeader, Metric, SectionLabel } from "@/components/shiftora/primitives";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/principal/roi")({ component: ROI });

function ROI() {
  const tenant = useActiveTenant();
  const data = tenant.subdivisions.map((s) => ({ name: s.name.split(" ")[0], hours: Math.round(s.staff * (s.adoption / 100) * 2.4), inr: Math.round(s.staff * (s.adoption / 100) * 1800) }));
  const totalHours = data.reduce((a, b) => a + b.hours, 0);
  const totalInr = data.reduce((a, b) => a + b.inr, 0);
  return (
    <div>
      <PageHeader title="ROI & impact" subtitle="Where AI is creating measurable value." />
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Metric label="Hours saved / month" value={totalHours.toLocaleString()} sub="across all teams" tone="teal" />
        <Metric label="Value created" value={`₹${(totalInr / 100000).toFixed(1)}L`} sub="this month" tone="gold" />
        <Metric label="Programme cost" value={`₹${(tenant.size * 0.012).toFixed(1)}L`} sub="per month" tone="muted" />
      </div>
      <Card>
        <SectionLabel>Hours saved by {tenant.subdivisionNoun.toLowerCase()}</SectionLabel>
        <div className="h-[280px] mt-2">
          <ResponsiveContainer>
            <BarChart data={data}>
              <CartesianGrid stroke="var(--bd)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--t3)" fontSize={11} />
              <YAxis stroke="var(--t3)" fontSize={11} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--bd)", fontSize: 12 }} />
              <Bar dataKey="hours" fill="var(--tl)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
