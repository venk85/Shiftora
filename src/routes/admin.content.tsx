import { createFileRoute } from "@tanstack/react-router";
import { useActiveTenant } from "@/lib/shiftora-store";
import { shiftoraApi, type LearningModule } from "@/lib/shiftora-api";
import { Card, PageHeader, Chip, Btn } from "@/components/shiftora/primitives";
import { IconBook, IconPlus } from "@tabler/icons-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/admin/content")({ component: Content });

function Content() {
  const tenant = useActiveTenant();
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    void shiftoraApi
      .adminLearningModules(tenant.id)
      .then(setModules)
      .catch((err) => setError((err as Error).message));
  }, [tenant.id]);

  return (
    <div>
      <PageHeader title="Content library" subtitle="Learning modules loaded from the backend." right={<Btn size="sm" disabled><IconPlus className="size-4" /> Add content</Btn>} />
      {error && <Card className="mb-4"><div className="text-[13px] text-[color:var(--er)]">{error}</div></Card>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {modules.map((module) => (
          <Card key={module.id} hover>
            <div className="flex items-start gap-3">
              <div className="size-9 rounded-md grid place-items-center" style={{ background: "var(--bl)", color: "var(--bt)" }}><IconBook className="size-4" /></div>
              <div className="flex-1">
                <div className="font-semibold text-[13.5px]">{module.title}</div>
                <div className="text-[11px] text-text-muted">{module.level} · {module.estimatedMinutes} min · {module.language}</div>
                <div className="text-[11px] text-text-muted mt-1">{module.description}</div>
              </div>
              <Chip tone={module.status === "published" ? "teal" : "gold"}>{module.status}</Chip>
            </div>
          </Card>
        ))}
        {!modules.length && !error && <Card><div className="text-[13px] text-text-muted">No learning modules configured for this tenant.</div></Card>}
      </div>
    </div>
  );
}
