import { createFileRoute } from "@tanstack/react-router";
import { useApp, useActiveTenant } from "@/lib/shiftora-store";
import { adminVocabulary } from "@/lib/admin-vocabulary";
import type { TenantLocation } from "@/lib/shiftora-config";
import { shiftoraApi } from "@/lib/shiftora-api";
import { Card, PageHeader, Btn, Chip, SectionLabel } from "@/components/shiftora/primitives";
import { IconPlus, IconTrash, IconRefresh } from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/config")({ component: Config });

function Config() {
  const tenant = useActiveTenant();
  const vocab = adminVocabulary(tenant.industry);
  const { updateTenant, addSubdivision, updateSubdivision, removeSubdivision, loadFromBackend } = useApp();

  const [newSub, setNewSub] = useState("");
  const [newHod, setNewHod] = useState("");
  const [udiseInput, setUdiseInput] = useState(tenant.udiseCode ?? "");
  const [decoding, setDecoding] = useState(false);

  function uploadSchoolPhoto(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Upload an image file.");
      return;
    }
    if (file.size > 600_000) {
      toast.error("Keep the school photo under 600 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updateTenant(tenant.id, { schoolPhotoDataUrl: String(reader.result) });
      toast.success("School photo saved");
    };
    reader.readAsDataURL(file);
  }

  async function decodeAndSaveUdise() {
    if (!udiseInput.match(/^\d{11}$/)) {
      toast.error("UDISE code must be exactly 11 digits.");
      return;
    }
    setDecoding(true);
    try {
      const assignment = await shiftoraApi.decodeUdise(udiseInput);
      const previous = tenant.educationAssignment;
      const mismatch =
        previous?.status &&
        previous.status !== "ERROR" &&
        (previous.udiseDistrictCode !== assignment.udiseDistrictCode || previous.udiseBlockCode !== assignment.udiseBlockCode);
      updateTenant(tenant.id, {
        udiseCode: udiseInput,
        educationAssignment: assignment,
      });
      if (assignment.status === "NEEDS_REVIEW" || mismatch) {
        await shiftoraApi.createEducationReview({
          tenantId: tenant.id,
          udiseCode: udiseInput,
          reason: mismatch ? "UDISE decode differs from existing manual assignment" : assignment.message,
          previousAssignment: previous,
          decodedAssignment: assignment,
        });
      }
      toast[assignment.status === "ASSIGNED" ? "success" : "warning"](assignment.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not decode UDISE.");
    } finally {
      setDecoding(false);
    }
  }

  return (
    <div>
      <PageHeader title={vocab.configTitle} subtitle={vocab.configSubtitle} right={<Btn variant="outline" size="sm" onClick={() => { void loadFromBackend(); toast.success("Reloaded from backend"); }}><IconRefresh className="size-3.5" /> Reload backend data</Btn>} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <SectionLabel>Identity</SectionLabel>
          <div className="space-y-3 mt-2">
            <Field label="Organisation name" value={tenant.name} onChange={(v) => updateTenant(tenant.id, { name: v })} />
            {tenant.industry === "edu" && (
              <>
                <Field label="School board" value={tenant.board ?? ""} placeholder="e.g. TN Board, CBSE, ICSE, IB" onChange={(v) => updateTenant(tenant.id, { board: v })} />
                <div className="rounded-md border border-border bg-surface-2 p-3">
                  <SectionLabel>School photo</SectionLabel>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="size-16 rounded-md border border-border bg-surface overflow-hidden grid place-items-center text-[12px] font-bold text-text-muted">
                      {tenant.schoolPhotoDataUrl ? <img src={tenant.schoolPhotoDataUrl} alt={tenant.name} className="h-full w-full object-cover" /> : tenant.abbr}
                    </div>
                    <div className="min-w-0">
                      <input type="file" accept="image/*" className="text-[12px]" onChange={(event) => uploadSchoolPhoto(event.target.files?.[0])} />
                      <div className="text-[11px] text-text-muted mt-1">Shown to teachers, HODs and principal after login.</div>
                    </div>
                  </div>
                </div>
                <div className="rounded-md border border-border bg-surface-2 p-3">
                  <SectionLabel>UDISE officer assignment</SectionLabel>
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-end mt-2">
                    <Field label="UDISE code" value={udiseInput} onChange={(v) => setUdiseInput(v.replace(/\D/g, "").slice(0, 11))} />
                    <Btn type="button" size="sm" variant="outline" onClick={decodeAndSaveUdise} disabled={decoding || udiseInput.length !== 11}>
                      {decoding ? "Decoding..." : "Decode & save"}
                    </Btn>
                  </div>
                  {tenant.educationAssignment && (
                    <div className="mt-2 rounded-md border border-border bg-surface px-3 py-2 text-[12px] text-text-muted">
                      {(tenant.educationAssignment.status || tenant.educationAssignment.message) && (
                        <div className="font-semibold text-text">
                          {[tenant.educationAssignment.status, tenant.educationAssignment.message].filter(Boolean).join(": ")}
                        </div>
                      )}
                      <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-1">
                        <span>{tenant.educationAssignment.districtOfficerTitle || "District officer"}: {tenant.educationAssignment.districtOfficerOffice || "Pending"}</span>
                        <span>{tenant.educationAssignment.blockOfficerTitle || "Block officer"}: {tenant.educationAssignment.blockOfficerOffice || "Pending"}</span>
                      </div>
                    </div>
                  )}
                </div>
                <Field
                  label="Address line 1"
                  value={tenant.location?.addressLine1 ?? ""}
                  onChange={(v) => updateTenant(tenant.id, { location: { ...defaultLocation(tenant.location), addressLine1: v } })}
                />
                <Field
                  label="Address line 2"
                  value={tenant.location?.addressLine2 ?? ""}
                  onChange={(v) => updateTenant(tenant.id, { location: { ...defaultLocation(tenant.location), addressLine2: v } })}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="City / town" value={tenant.location?.city ?? ""} onChange={(v) => updateTenant(tenant.id, { location: { ...defaultLocation(tenant.location), city: v } })} />
                  <Field label="District" value={tenant.location?.district ?? ""} onChange={(v) => updateTenant(tenant.id, { location: { ...defaultLocation(tenant.location), district: v } })} />
                  <Field label="State" value={tenant.location?.state ?? ""} onChange={(v) => updateTenant(tenant.id, { location: { ...defaultLocation(tenant.location), state: v } })} />
                  <Field label="PIN code" value={tenant.location?.pincode ?? ""} onChange={(v) => updateTenant(tenant.id, { location: { ...defaultLocation(tenant.location), pincode: v } })} />
                </div>
              </>
            )}
            <Field label={`${tenant.aiName} persona name`} value={tenant.aiName} onChange={(v) => updateTenant(tenant.id, { aiName: v })} />
            <Field label="Unit label (e.g. Departments, Sections, Teams, Wards)" value={tenant.subdivisionNoun} onChange={(v) => updateTenant(tenant.id, { subdivisionNoun: v })} />
            <div>
              <label className="block text-[11px] font-semibold text-text-muted mb-1">AI instruction (system prompt addition)</label>
              <textarea rows={3} className="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-[12px]" value={tenant.aiInstruction} onChange={(e) => updateTenant(tenant.id, { aiInstruction: e.target.value })} />
            </div>
          </div>
        </Card>

        <Card>
          <SectionLabel>Role labels</SectionLabel>
          <div className="grid grid-cols-1 gap-2 mt-2">
            {(["Platform", "Admin", "Principal", "HOD", "Learner"] as const).map((slot, i) => (
              <div key={slot} className="flex items-center gap-2">
                <Chip tone="muted" className="w-[90px] justify-center">{slot}</Chip>
                <input
                  className="flex-1 rounded-md border border-border-strong bg-surface px-3 py-1.5 text-[12px]"
                  value={tenant.roleLabels[i]}
                  onChange={(e) => {
                    const next = [...tenant.roleLabels] as typeof tenant.roleLabels;
                    next[i] = e.target.value;
                    updateTenant(tenant.id, { roleLabels: next });
                  }}
                />
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <SectionLabel>{tenant.subdivisionNoun}</SectionLabel>
            <span className="text-[11px] text-text-muted">{tenant.subdivisions.length} total</span>
          </div>
          <div className="space-y-2">
            {tenant.subdivisions.map((s) => (
              <div key={s.id} className="grid grid-cols-12 gap-2 items-center rounded-md border border-border bg-surface-2 p-2">
                <input className="col-span-12 sm:col-span-4 rounded-md border border-border-strong bg-surface px-3 py-1.5 text-[12px] font-semibold" value={s.name} onChange={(e) => updateSubdivision(tenant.id, s.id, { name: e.target.value })} />
                <input className="col-span-6 sm:col-span-3 rounded-md border border-border-strong bg-surface px-3 py-1.5 text-[12px]" placeholder="Lead name" value={s.hod} onChange={(e) => updateSubdivision(tenant.id, s.id, { hod: e.target.value })} />
                <input className="col-span-5 sm:col-span-3 rounded-md border border-border-strong bg-surface px-3 py-1.5 text-[12px]" placeholder="Lead role" value={s.leadRole ?? ""} onChange={(e) => updateSubdivision(tenant.id, s.id, { leadRole: e.target.value })} />
                <input type="number" className="col-span-10 sm:col-span-1 rounded-md border border-border-strong bg-surface px-3 py-1.5 text-[12px]" value={s.staff} onChange={(e) => updateSubdivision(tenant.id, s.id, { staff: parseInt(e.target.value) || 0 })} />
                <Btn variant="ghost" size="sm" className="col-span-1 justify-self-end" onClick={() => removeSubdivision(tenant.id, s.id)}><IconTrash className="size-3.5" /></Btn>
                <input className="col-span-12 rounded-md border border-border-strong bg-surface px-3 py-1.5 text-[12px]" placeholder="Details, responsibilities or grade span" value={s.description ?? ""} onChange={(e) => updateSubdivision(tenant.id, s.id, { description: e.target.value })} />
              </div>
            ))}
            <div className="grid grid-cols-12 gap-2 pt-2 border-t border-border mt-3">
              <input className="col-span-5 rounded-md border border-border-strong bg-surface px-3 py-1.5 text-[12px]" placeholder={`New ${tenant.subdivisionNoun.replace(/s$/, "").toLowerCase()} name`} value={newSub} onChange={(e) => setNewSub(e.target.value)} />
              <input className="col-span-4 rounded-md border border-border-strong bg-surface px-3 py-1.5 text-[12px]" placeholder="HOD name" value={newHod} onChange={(e) => setNewHod(e.target.value)} />
              <Btn className="col-span-3" size="sm" disabled={!newSub.trim()} onClick={() => { addSubdivision(tenant.id, newSub.trim(), newHod.trim() || "TBD"); setNewSub(""); setNewHod(""); toast.success("Added"); }}><IconPlus className="size-3.5" /> Add</Btn>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-text-muted mb-1">{label}</label>
      <input className="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-[13px]" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function defaultLocation(location?: TenantLocation) {
  return {
    addressLine1: location?.addressLine1 ?? "",
    addressLine2: location?.addressLine2 ?? "",
    city: location?.city ?? "",
    district: location?.district ?? "",
    state: location?.state ?? "",
    pincode: location?.pincode ?? "",
    country: location?.country ?? "India",
  };
}
