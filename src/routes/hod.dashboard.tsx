import { createFileRoute } from "@tanstack/react-router";
import { useActiveTenant } from "@/lib/shiftora-store";
import { Card, PageHeader, Metric, ProgressBar, Chip, SectionLabel } from "@/components/shiftora/primitives";

export const Route = createFileRoute("/hod/dashboard")({ component: HodDash });

function HodDash() {
  const tenant = useActiveTenant();
  const dept = tenant.subdivisions[0];
  const people = Array.from({ length: 8 }).map((_, i) => ({
    n: ["Aarav S", "Priya M", "Rohan K", "Neha R", "Vikram P", "Sara T", "Karan D", "Meera J"][i],
    runs: 12 - i,
    quality: 92 - i * 3,
    status: i < 5 ? "Active" : "Catching up",
  }));
  return (
    <div>
      <PageHeader title={`${dept.name} · ${tenant.personas.hod.title.split("·")[0].trim()} view`} subtitle={`${dept.staff} people · ${dept.adoption}% adoption`} right={<Chip tone="blue">Owner: {dept.hod}</Chip>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Metric label="Team adoption" value={`${dept.adoption}%`} tone="violet" />
        <Metric label="Maturity" value={`${dept.maturity}%`} tone="blue" />
        <Metric label="Avg quality" value="86%" sub="across runs" tone="teal" />
        <Metric label="Champions" value={3} sub="self-led learners" tone="gold" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2" padded={false}>
          <div className="p-3 border-b border-border font-semibold">Team activity</div>
          <table className="w-full text-[12.5px]">
            <thead><tr className="text-text-muted text-left border-b border-border"><th className="px-4 py-2">Name</th><th className="px-4 py-2">Runs</th><th className="px-4 py-2">Quality</th><th className="px-4 py-2">Status</th></tr></thead>
            <tbody>
              {people.map((p, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5 font-semibold">{p.n}</td>
                  <td className="px-4 py-2.5">{p.runs}</td>
                  <td className="px-4 py-2.5 w-[160px]"><div className="flex items-center gap-2"><ProgressBar value={p.quality} className="flex-1" /><span className="w-8 text-right text-[11px] text-text-muted">{p.quality}</span></div></td>
                  <td className="px-4 py-2.5"><Chip tone={p.status === "Active" ? "teal" : "gold"}>{p.status}</Chip></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card>
          <SectionLabel>Coaching prompts</SectionLabel>
          <ul className="mt-2 space-y-2 text-[12.5px]">
            <li className="p-2 rounded-md bg-surface-3">3 teammates haven't run a sandbox scenario this week — nudge them.</li>
            <li className="p-2 rounded-md bg-surface-3">Quality dropped 4pts on customer comms — share top examples.</li>
            <li className="p-2 rounded-md bg-surface-3">Workshop coming up — confirm 24 attendees.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
