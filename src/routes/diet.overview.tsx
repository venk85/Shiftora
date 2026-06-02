import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Card,
  Chip,
  Metric,
  PageHeader,
  ProgressBar,
  SectionLabel,
} from "@/components/shiftora/primitives";
import {
  IconCertificate,
  IconLanguage,
  IconSchool,
  IconSparkles,
  IconUsersGroup,
} from "@tabler/icons-react";

export const Route = createFileRoute("/diet/overview")({ component: DietOverview });

const batches = [
  { name: "FLN Remediation Batch A", teachers: 42, status: "Live", completion: 68 },
  { name: "AI Worksheet Design", teachers: 36, status: "Scheduled", completion: 24 },
  { name: "NIPUN Assessment Rubrics", teachers: 51, status: "Live", completion: 73 },
  { name: "Bilingual Classroom Practice", teachers: 28, status: "Draft", completion: 12 },
];

function DietOverview() {
  const [language, setLanguage] = useState("Tamil");
  return (
    <div>
      <PageHeader
        title="DIET · Training batch management"
        subtitle="Plan teacher cohorts, generate AI modules in local languages, and track certificate outcomes."
        right={
          <Chip tone="gold">
            <IconSparkles className="size-3" /> AI module generator
          </Chip>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Metric
          label="Active batches"
          value="4"
          sub="157 teachers"
          tone="gold"
          icon={<IconSchool className="size-3.5" />}
        />
        <Metric
          label="Completion"
          value="61%"
          sub="+11 in 30 days"
          tone="blue"
          icon={<IconUsersGroup className="size-3.5" />}
        />
        <Metric
          label="Certificates"
          value="483"
          sub="issued this quarter"
          tone="teal"
          icon={<IconCertificate className="size-3.5" />}
        />
        <Metric
          label="Languages"
          value="5"
          sub="Tamil, Telugu, Hindi, Urdu, English"
          tone="violet"
          icon={<IconLanguage className="size-3.5" />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_.9fr] gap-4">
        <Card padded={false}>
          <div className="p-4 pb-2">
            <SectionLabel>Training batches</SectionLabel>
          </div>
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="text-left text-text-muted border-t border-b border-border">
                <th className="px-4 py-2.5 font-semibold">Batch</th>
                <th className="px-4 py-2.5 font-semibold">Teachers</th>
                <th className="px-4 py-2.5 font-semibold">Completion</th>
                <th className="px-4 py-2.5 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch) => (
                <tr key={batch.name} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-semibold">{batch.name}</td>
                  <td className="px-4 py-3 text-text-muted">{batch.teachers}</td>
                  <td className="px-4 py-3 min-w-[160px]">
                    <ProgressBar
                      value={batch.completion}
                      tone={batch.completion > 60 ? "ok" : "blue"}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Chip
                      tone={
                        batch.status === "Live"
                          ? "ok"
                          : batch.status === "Scheduled"
                            ? "blue"
                            : "muted"
                      }
                    >
                      {batch.status}
                    </Chip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <SectionLabel>AI module generator</SectionLabel>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-md border border-border-strong bg-surface px-2 py-1.5 text-[12px]"
            >
              {["Tamil", "Telugu", "Hindi", "Urdu", "English"].map((lang) => (
                <option key={lang}>{lang}</option>
              ))}
            </select>
          </div>
          <div className="mt-3 rounded-lg border border-[color:var(--gb)] bg-[color:var(--gl)] p-4">
            <div className="text-[13px] font-semibold">
              Generated module: G3 Reading Fluency for {language} medium
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[12px]">
              <div className="rounded-md bg-white/60 p-2">Micro-lesson script</div>
              <div className="rounded-md bg-white/60 p-2">Facilitator guide</div>
              <div className="rounded-md bg-white/60 p-2">Practice worksheet</div>
              <div className="rounded-md bg-white/60 p-2">Exit assessment</div>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <SectionLabel>Certificate stats</SectionLabel>
            {[
              ["Eligible", 76],
              ["Issued", 63],
              ["Pending verification", 14],
            ].map(([label, value]) => (
              <div key={label}>
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="font-semibold">{label}</span>
                  <span className="text-text-muted">{value}%</span>
                </div>
                <ProgressBar
                  value={Number(value)}
                  tone={label === "Pending verification" ? "am" : "teal"}
                />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
