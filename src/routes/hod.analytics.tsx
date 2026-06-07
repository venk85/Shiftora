import { createFileRoute } from "@tanstack/react-router";
import { useActiveTenant } from "@/lib/shiftora-store";
import { Card, PageHeader, SectionLabel } from "@/components/shiftora/primitives";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export const Route = createFileRoute("/hod/analytics")({ component: Analytics });

function Analytics() {
  const tenant = useActiveTenant();
  const dept = tenant.subdivisions[0];
  const weekly = ["W1","W2","W3","W4","W5","W6","W7","W8"].map((w, i) => ({ w, runs: 8 + i * 4 + (i % 3) * 2 }));

  if (!dept) {
    return (
      <div>
        <PageHeader title="Department analytics" subtitle="Usage trends and scenario mix" />
        <div className="text-[13px] text-text-muted mt-4">No department configured yet. Ask your admin to set up a department under School config.</div>
      </div>
    );
  }

  const dist = [
    { k: "Lesson / draft", v: 38 },
    { k: "Feedback", v: 24 },
    { k: "Rubric / spec", v: 18 },
    { k: "Email / comms", v: 12 },
    { k: "Other", v: 8 },
  ];
  const colors = ["var(--b)", "var(--vi)", "var(--tl)", "var(--g)", "var(--t3)"];
  return (
    <div>
      <PageHeader title="Department analytics" subtitle={`${dept.name} · ${tenant.aiName} usage trends`} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <SectionLabel>Weekly sandbox runs</SectionLabel>
          <div className="h-[240px] mt-2">
            <ResponsiveContainer>
              <BarChart data={weekly}>
                <CartesianGrid stroke="var(--bd)" vertical={false} />
                <XAxis dataKey="w" stroke="var(--t3)" fontSize={11} />
                <YAxis stroke="var(--t3)" fontSize={11} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--bd)", fontSize: 12 }} />
                <Bar dataKey="runs" fill="var(--vi)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <SectionLabel>Scenario mix</SectionLabel>
          <div className="h-[240px] mt-2 relative">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={dist} dataKey="v" innerRadius={56} outerRadius={86}>
                  {dist.map((_, i) => <Cell key={i} fill={colors[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--bd)", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 gap-1 text-[11px] mt-2">
            {dist.map((d, i) => (
              <div key={d.k} className="flex justify-between"><span className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: colors[i] }} />{d.k}</span><span className="text-text-muted">{d.v}%</span></div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
