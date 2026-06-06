import { createFileRoute } from "@tanstack/react-router";
import { useActiveTenant } from "@/lib/shiftora-store";
import { shiftoraApi, type WorkshopSession } from "@/lib/shiftora-api";
import { useI18n } from "@/lib/use-i18n";
import { Card, PageHeader, Chip, Btn, SectionLabel } from "@/components/shiftora/primitives";
import { IconCalendarEvent, IconVideo, IconUsers, IconClock } from "@tabler/icons-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/learner/workshop")({ component: Workshop });

function Workshop() {
  const tenant = useActiveTenant();
  const { t } = useI18n();
  const [session, setSession] = useState<WorkshopSession | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    void shiftoraApi
      .workshopSession(tenant.id)
      .then(setSession)
      .catch((err) => setError((err as Error).message));
  }, [tenant.id]);

  return (
    <div>
      <PageHeader title={t("liveWorkshop")} subtitle={t("handsOnCohortSession").replace("AI", tenant.aiName)} />
      {error && (
        <Card className="mb-4">
          {error.toLowerCase().includes("not configured") ? (
            <div className="space-y-1">
              <div className="text-[13px] font-semibold text-text">No workshop scheduled yet</div>
              <div className="text-[12px] text-text-muted">
                Your admin hasn't set up a workshop session for this programme. Check back soon, or contact your school admin to schedule one.
              </div>
            </div>
          ) : (
            <div className="text-[13px] text-[color:var(--er)]">{error}</div>
          )}
        </Card>
      )}
      {session && (
        <>
          <Card className="mb-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <Chip tone={session.status === "completed" ? "teal" : "gold"}>{label(session.status, t)}</Chip>
                <div className="font-semibold text-[18px] mt-2">{session.title}</div>
                <div className="text-[12px] text-text-muted mt-1">{t("facilitator")}: {session.facilitator}</div>
                <div className="flex flex-wrap gap-4 mt-3 text-[12px] text-text-muted">
                  <span><IconCalendarEvent className="inline size-3.5 mr-1" /> {new Date(session.startsAt).toLocaleString()}</span>
                  <span><IconClock className="inline size-3.5 mr-1" /> {session.durationMinutes} {t("minutes")}</span>
                  <span><IconUsers className="inline size-3.5 mr-1" /> {session.attendeeCount} {t("colleaguesAttending")}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Btn onClick={() => window.open(session.meetingUrl, "_blank", "noopener,noreferrer")}><IconVideo className="size-4" /> {t("joinWorkshop")}</Btn>
                <Btn variant="outline">{t("addToCalendar")}</Btn>
              </div>
            </div>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <SectionLabel>{t("agenda")}</SectionLabel>
              <ol className="mt-2 space-y-2 text-[13px]">
                {session.agenda.map((item, i) => (
                  <li key={item} className="flex gap-3"><span className="size-5 rounded-full bg-primary-soft text-primary-strong grid place-items-center text-[11px] font-bold shrink-0">{i + 1}</span>{item}</li>
                ))}
              </ol>
            </Card>
            <Card>
              <SectionLabel>{t("preRequisites")}</SectionLabel>
              <ul className="mt-2 space-y-2 text-[13px]">
                {session.prerequisites.map((item) => (
                  <li key={item} className="flex gap-2"><span className="size-4 rounded-full border-2 mt-0.5 shrink-0" style={{ borderColor: "var(--bd2)" }} />{item}</li>
                ))}
              </ul>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function label(status: string, t: (key: "completed" | "inProgress") => string) {
  if (status === "completed") return t("completed");
  if (status === "scheduled" || status === "in_progress") return t("inProgress");
  return status.slice(0, 1).toUpperCase() + status.slice(1);
}
