import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useApp } from "@/lib/shiftora-store";
import { INDUSTRY_LABELS, type EducationAssignment, type IndustryKey, type Tenant } from "@/lib/shiftora-config";
import { shiftoraApi, type EducationBlock, type EducationState, type EducationalDistrict } from "@/lib/shiftora-api";
import { Card, PageHeader, Btn, Chip, SectionLabel } from "@/components/shiftora/primitives";
import { IconPlus, IconTrash, IconDeviceFloppy } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import { nanoid } from "nanoid";
import { toast } from "sonner";

export const Route = createFileRoute("/platform/create")({ component: Create });

const SECTOR_DEFAULTS: Record<IndustryKey, {
  aiName: string;
  noun: string;
  type: string;
  roles: [string, string, string, string, string];
  aiInstruction: string;
  subdivisionPlaceholder: string;
  leadPlaceholder: string;
  leadRole: string;
}> = {
  edu: {
    aiName: "Shiksha AI",
    noun: "Departments",
    type: "K-12 School",
    roles: ["Platform", "School Admin", "Principal", "HOD", "Teacher"],
    aiInstruction: "Respond as a helpful, classroom-ready co-teacher. Keep examples grade-aware and board-aligned.",
    subdivisionPlaceholder: "Mathematics / Primary Section",
    leadPlaceholder: "HOD or academic lead",
    leadRole: "HOD",
  },
  bfsi: {
    aiName: "Axiom AI",
    noun: "Teams",
    type: "Retail Bank",
    roles: ["Platform", "Branch Admin", "Regional Head", "Team Lead", "RM / Employee"],
    aiInstruction: "Respond as a compliant, risk-aware banking co-pilot. Keep language neutral and audit-ready.",
    subdivisionPlaceholder: "Retail Banking / Risk",
    leadPlaceholder: "Team lead",
    leadRole: "Team Lead",
  },
  gcc: {
    aiName: "Nexus AI",
    noun: "Teams",
    type: "Global Capability Centre",
    roles: ["Platform", "Unit Admin", "Delivery Head", "Tech Lead", "Developer"],
    aiInstruction: "Respond as an engineering and delivery co-pilot. Be concise, specific and implementation-aware.",
    subdivisionPlaceholder: "Engineering / QA / Data",
    leadPlaceholder: "Capability lead",
    leadRole: "Tech Lead",
  },
  health: {
    aiName: "Medora AI",
    noun: "Departments",
    type: "Multi-speciality Hospital",
    roles: ["Platform", "Dept Admin", "Medical Director", "Dept Head", "Clinician"],
    aiInstruction: "Respond as a clinical documentation assistant. Prioritise accuracy, safety and patient-readable language.",
    subdivisionPlaceholder: "Cardiology / Nursing",
    leadPlaceholder: "Department head",
    leadRole: "Dept Head",
  },
};

type SubDraft = { id: string; name: string; hod: string; leadRole: string; description: string };

function Create() {
  const { loadFromBackend } = useApp();
  const nav = useNavigate();

  const [industry, setIndustry] = useState<IndustryKey>("edu");
  const defaults = SECTOR_DEFAULTS[industry];
  const [name, setName] = useState("");
  const [abbr, setAbbr] = useState("");
  const [type, setType] = useState(defaults.type);
  const [board, setBoard] = useState("TN State Board");
  const [udiseCode, setUdiseCode] = useState("");
  const [educationAssignment, setEducationAssignment] = useState<EducationAssignment | null>(null);
  const [educationStates, setEducationStates] = useState<EducationState[]>([]);
  const [educationDistricts, setEducationDistricts] = useState<EducationalDistrict[]>([]);
  const [educationBlocks, setEducationBlocks] = useState<EducationBlock[]>([]);
  const [selectedStateCode, setSelectedStateCode] = useState("");
  const [selectedDistrictCode, setSelectedDistrictCode] = useState("");
  const [selectedBlockCode, setSelectedBlockCode] = useState("");
  const [decodingUdise, setDecodingUdise] = useState(false);
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [stateName, setStateName] = useState("");
  const [pincode, setPincode] = useState("");
  const [country, setCountry] = useState("India");
  const [brandColor, setBrandColor] = useState("#4069F0");
  const [aiName, setAiName] = useState(defaults.aiName);
  const [aiInstruction, setAiInstruction] = useState(defaults.aiInstruction);
  const [subdivisionNoun, setSubdivisionNoun] = useState(defaults.noun);
  const [subs, setSubs] = useState<SubDraft[]>([{ id: nanoid(6), name: "", hod: "", leadRole: defaults.leadRole, description: "" }]);
  const [roleLabels, setRoleLabels] = useState<[string, string, string, string, string]>(defaults.roles);
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const selectedState = useMemo(() => educationStates.find((item) => item.stateCode === selectedStateCode), [educationStates, selectedStateCode]);
  const selectedDistrict = useMemo(() => educationDistricts.find((item) => item.udiseDistrictCode === selectedDistrictCode), [educationDistricts, selectedDistrictCode]);
  const selectedBlock = useMemo(() => educationBlocks.find((item) => item.udiseBlockCode === selectedBlockCode), [educationBlocks, selectedBlockCode]);

  function clearError(key: string) {
    setFieldErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  }

  useEffect(() => {
    let cancelled = false;
    shiftoraApi.educationStates()
      .then((rows) => {
        if (cancelled) return;
        setEducationStates(rows);
        const tamilNadu = rows.find((item) => item.stateCode === "33");
        setSelectedStateCode((current) => current || tamilNadu?.stateCode || rows[0]?.stateCode || "");
      })
      .catch(() => toast.error("Could not load education state masters."));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedStateCode) return;
    let cancelled = false;
    shiftoraApi.educationDistricts(selectedStateCode)
      .then((rows) => {
        if (cancelled) return;
        setEducationDistricts(rows);
        setSelectedDistrictCode(rows[0]?.udiseDistrictCode || "");
        setSelectedBlockCode("");
      })
      .catch(() => toast.error("Could not load educational districts."));
    return () => { cancelled = true; };
  }, [selectedStateCode]);

  useEffect(() => {
    if (!selectedDistrictCode) {
      setEducationBlocks([]);
      setSelectedBlockCode("");
      return;
    }
    let cancelled = false;
    shiftoraApi.educationBlocks(selectedDistrictCode)
      .then((rows) => {
        if (cancelled) return;
        setEducationBlocks(rows);
        setSelectedBlockCode(rows[0]?.udiseBlockCode || "");
      })
      .catch(() => toast.error("Could not load block masters."));
    return () => { cancelled = true; };
  }, [selectedDistrictCode]);

  function changeIndustry(next: IndustryKey) {
    const nextDefaults = SECTOR_DEFAULTS[next];
    setIndustry(next);
    setType(nextDefaults.type);
    setAiName(nextDefaults.aiName);
    setAiInstruction(nextDefaults.aiInstruction);
    setSubdivisionNoun(nextDefaults.noun);
    setRoleLabels(nextDefaults.roles);
    setSubs((items) => items.map((item) => ({ ...item, leadRole: nextDefaults.leadRole })));
    if (next === "edu") setBoard("TN State Board");
    setFieldErrors({});
  }

  async function decodeUdise() {
    if (!udiseCode.trim().match(/^\d{11}$/)) {
      setEducationAssignment({ status: "ERROR", message: "UDISE code must be exactly 11 digits", udiseCode });
      return;
    }
    setDecodingUdise(true);
    try {
      const assignment = await shiftoraApi.decodeUdise(udiseCode.trim());
      setEducationAssignment(assignment);
      if (assignment.stateCode) setSelectedStateCode(assignment.stateCode);
      if (assignment.udiseDistrictCode) setSelectedDistrictCode(assignment.udiseDistrictCode);
      if (assignment.udiseBlockCode) setSelectedBlockCode(assignment.udiseBlockCode);
      if (assignment.stateName) { setStateName(assignment.stateName); clearError("stateName"); }
      if (assignment.districtName) { setDistrict(assignment.districtName); }
      if (assignment.blockName) { setCity(assignment.blockName); clearError("city"); }
      setCountry("India");
      // Auto-fill org fields from school master if found
      if (assignment.schoolName) {
        setName(assignment.schoolName);
        clearError("name");
      }
      if (assignment.schoolType) {
        setType(assignment.schoolType);
      }
      if (assignment.boardName) {
        setBoard(assignment.boardName);
        clearError("board");
      }
      toast[assignment.status === "ASSIGNED" ? "success" : "warning"](assignment.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not decode UDISE code.");
    } finally {
      setDecodingUdise(false);
    }
  }

  function manualAssignment(): EducationAssignment {
    return {
      status: "MANUAL",
      message: "Assigned through fallback educational district and block selection",
      udiseCode: udiseCode.trim(),
      stateCode: selectedState?.stateCode,
      stateName: selectedState?.stateName,
      udiseDistrictCode: selectedDistrict?.udiseDistrictCode,
      districtName: selectedDistrict?.districtName,
      districtOfficerTitle: selectedState?.districtOfficerTitle,
      districtOfficerOffice: selectedDistrict?.deoOfficeName,
      districtOfficerContact: selectedDistrict?.deoContact ?? null,
      udiseBlockCode: selectedBlock?.udiseBlockCode,
      blockName: selectedBlock?.blockName,
      blockUnitName: selectedState?.blockUnitName,
      blockOfficerTitle: selectedState?.blockOfficerTitle,
      blockOfficerOffice: selectedBlock?.beoOfficeName,
      blockOfficerContact: selectedBlock?.beoContact ?? null,
    };
  }

  async function submit() {
    const errors: Record<string, string> = {};

    if (!name.trim()) errors.name = "Organisation name is required.";
    if (!adminName.trim()) errors.adminName = "Admin name is required.";
    if (!adminEmail.trim()) {
      errors.adminEmail = "Admin email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail.trim())) {
      errors.adminEmail = "Enter a valid email address.";
    }
    if (!adminPassword.trim()) {
      errors.adminPassword = "Password is required.";
    } else if (adminPassword.trim().length < 6) {
      errors.adminPassword = "Minimum 6 characters.";
    }

    if (industry === "edu") {
      if (!board.trim()) errors.board = "Board is required.";
      if (!addressLine1.trim()) errors.addressLine1 = "Address is required.";
      if (!city.trim()) errors.city = "City / town is required.";
      if (!stateName.trim()) errors.stateName = "State is required.";
      if (!educationAssignment && (!selectedState || !selectedDistrict || !selectedBlock))
        errors.udiseAssignment = "Decode UDISE or select state, district and block.";
    } else {
      if (!subs.some((s) => s.name.trim())) errors.units = "Add at least one unit.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.error("Please fix the highlighted fields.");
      return;
    }

    const cleanSubs = industry === "edu"
      ? [{
          id: nanoid(8),
          name: "Academic",
          hod: "TBD",
          leadRole: "Academic lead",
          description: "Default school academic group. Configure classes, teachers, HODs and sections from School Admin.",
          maturity: 0,
          adoption: 0,
          staff: 0,
        }]
      : subs.filter((s) => s.name.trim()).map((s) => ({
          id: nanoid(8),
          name: s.name.trim(),
          hod: s.hod.trim() || "TBD",
          leadRole: s.leadRole.trim() || defaults.leadRole,
          description: s.description.trim(),
          maturity: 0,
          adoption: 0,
          staff: 0,
        }));
    const tenant: Omit<Tenant, "id" | "createdAt"> = {
      name: name.trim(),
      abbr: (abbr || name.slice(0, 2)).toUpperCase().slice(0, 4),
      type: type.trim() || "Organisation",
      size: 1,
      industry,
      board: industry === "edu" ? board.trim() : "",
      udiseCode: industry === "edu" ? udiseCode.trim() : "",
      educationAssignment: industry === "edu" ? (educationAssignment && educationAssignment.status !== "ERROR" ? educationAssignment : manualAssignment()) : undefined,
      schoolPhotoDataUrl: "",
      location: {
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim(),
        city: city.trim(),
        district: district.trim(),
        state: stateName.trim(),
        pincode: pincode.trim(),
        country: country.trim() || "India",
      },
      aiName,
      subdivisionNoun,
      subdivisions: cleanSubs,
      roleLabels,
      personas: {
        admin: { name: "Admin User", title: roleLabels[1], avatar: "AU" },
        principal: { name: "Leadership", title: roleLabels[2], avatar: "LD" },
        hod: { name: cleanSubs[0].hod, title: `${roleLabels[3]} · ${cleanSubs[0].name}`, avatar: cleanSubs[0].hod.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() },
        learner: { name: "Team Member", title: `${roleLabels[4]} · ${cleanSubs[0].name}`, avatar: "TM" },
      },
      brandColor,
      maturity: 0,
      adoption: 0,
      aiInstruction,
    };
    setSaving(true);
    try {
      const savedTenant = await shiftoraApi.createTenant(tenant);
      if (tenant.educationAssignment?.status === "NEEDS_REVIEW") {
        await shiftoraApi.createEducationReview({
          tenantId: savedTenant.id,
          udiseCode: tenant.udiseCode,
          reason: tenant.educationAssignment.message,
          assignment: tenant.educationAssignment,
        });
      }
      const adminDisplayName = adminName.trim();
      await shiftoraApi.saveAdminUser({
        id: "",
        tenantId: savedTenant.id,
        email: adminEmail.trim().toLowerCase(),
        name: adminDisplayName,
        role: "ADMIN",
        avatar: initials(adminDisplayName),
        profile: {
          status: "active",
          designation: roleLabels[1],
          password: adminPassword,
          createdFrom: "platform-create",
        },
      });
      await loadFromBackend();
      toast.success(`${savedTenant.name} created`);
      nav({ to: "/platform/tenants" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save organization.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="Create organization" subtitle="Add a sector-aware organization and its first admin login." right={<Btn onClick={submit} disabled={saving}><IconDeviceFloppy className="size-4" /> {saving ? "Saving..." : "Save organization"}</Btn>} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <SectionLabel>Organisation</SectionLabel>
          <div className="space-y-3 mt-2">
            <div>
              <label className="block text-[11px] font-semibold text-text-muted mb-1">Sector</label>
              <select
                value={industry}
                onChange={(event) => changeIndustry(event.target.value as IndustryKey)}
                className="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-[13px]"
              >
                {(["edu", "bfsi", "gcc", "health"] as IndustryKey[]).map((item) => (
                  <option key={item} value={item}>{INDUSTRY_LABELS[item].label}</option>
                ))}
              </select>
            </div>
            <Field
              label="Organisation name"
              value={name}
              onChange={setName}
              placeholder="e.g. Greenwood Public School"
              required
              error={fieldErrors.name}
              onClearError={() => clearError("name")}
            />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Abbreviation" value={abbr} onChange={setAbbr} placeholder="GPS" />
              <Field label="Type" value={type} onChange={setType} placeholder="K-12 School" />
            </div>
            {industry === "edu" && (
              <div className="space-y-3 rounded-md border border-border bg-surface-2 p-3">
                <SectionLabel>UDISE and officer assignment</SectionLabel>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-end">
                  <Field label="UDISE code" value={udiseCode} onChange={(value) => { setUdiseCode(value.replace(/\D/g, "").slice(0, 11)); setEducationAssignment(null); }} placeholder="11-digit UDISE code" />
                  <Btn type="button" variant="outline" onClick={decodeUdise} disabled={decodingUdise || udiseCode.length !== 11}>
                    {decodingUdise ? "Decoding..." : "Decode"}
                  </Btn>
                </div>
                {educationAssignment && (
                  <div className={`rounded-md border px-3 py-2 text-[12px] ${educationAssignment.status === "ASSIGNED" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : educationAssignment.status === "NEEDS_REVIEW" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-red-200 bg-red-50 text-red-900"}`}>
                    <div className="font-semibold">{educationAssignment.message}</div>
                    {educationAssignment.schoolName && (
                      <div className="mt-1 font-medium">{educationAssignment.schoolName} · {educationAssignment.schoolType}</div>
                    )}
                    {educationAssignment.status !== "ERROR" && (
                      <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
                        <span>{educationAssignment.districtOfficerTitle || "District officer"}: {educationAssignment.districtOfficerOffice || "Pending selection"}</span>
                        <span>{educationAssignment.blockOfficerTitle || "Block officer"}: {educationAssignment.blockOfficerOffice || "Pending selection"}</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="rounded-md border border-border bg-surface p-3">
                  <div className="text-[11px] font-semibold text-text-muted mb-2">Fallback assignment</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <SelectField label="State" value={selectedStateCode} onChange={setSelectedStateCode} options={educationStates.map((item) => ({ value: item.stateCode, label: item.stateName }))} />
                    <SelectField label="Educational district" value={selectedDistrictCode} onChange={setSelectedDistrictCode} options={educationDistricts.map((item) => ({ value: item.udiseDistrictCode, label: item.districtName }))} />
                    <SelectField label={selectedState?.blockUnitName ?? "Block"} value={selectedBlockCode} onChange={setSelectedBlockCode} options={educationBlocks.map((item) => ({ value: item.udiseBlockCode, label: item.blockName }))} />
                  </div>
                  {selectedState && selectedDistrict && selectedBlock && (
                    <div className="mt-2 text-[11px] text-text-muted">
                      {selectedState.districtOfficerTitle}: {selectedDistrict.deoOfficeName} · {selectedState.blockOfficerTitle}: {selectedBlock.beoOfficeName}
                    </div>
                  )}
                </div>
                {fieldErrors.udiseAssignment && (
                  <p className="text-[11px] text-red-600">{fieldErrors.udiseAssignment}</p>
                )}
                <SectionLabel>School location and board</SectionLabel>
                <Field
                  label="Board"
                  value={board}
                  onChange={setBoard}
                  placeholder="TN State Board / CBSE / ICSE"
                  required
                  error={fieldErrors.board}
                  onClearError={() => clearError("board")}
                />
                <Field
                  label="Address line 1"
                  value={addressLine1}
                  onChange={setAddressLine1}
                  placeholder="Street, area, village or campus"
                  required
                  error={fieldErrors.addressLine1}
                  onClearError={() => clearError("addressLine1")}
                />
                <Field label="Address line 2" value={addressLine2} onChange={setAddressLine2} placeholder="Optional landmark" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field
                    label="City / town"
                    value={city}
                    onChange={setCity}
                    required
                    error={fieldErrors.city}
                    onClearError={() => clearError("city")}
                  />
                  <Field label="District" value={district} onChange={setDistrict} />
                  <Field
                    label="State"
                    value={stateName}
                    onChange={setStateName}
                    required
                    error={fieldErrors.stateName}
                    onClearError={() => clearError("stateName")}
                  />
                  <Field label="PIN code" value={pincode} onChange={setPincode} />
                </div>
                <Field label="Country" value={country} onChange={setCountry} />
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-md border border-border-strong bg-surface px-3 py-2">
                <div className="text-[11px] font-semibold text-text-muted">Initial user count</div>
                <div className="text-[16px] font-bold">1</div>
                <div className="text-[11px] text-text-muted">First admin account</div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-text-muted mb-1">Brand colour</label>
                <input type="color" className="w-full h-[38px] rounded-md border border-border-strong bg-surface" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} />
              </div>
            </div>
            <Field label="AI persona name" value={aiName} onChange={setAiName} />
            <div>
              <label className="block text-[11px] font-semibold text-text-muted mb-1">AI instruction</label>
              <textarea rows={3} className="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-[12px]" value={aiInstruction} onChange={(e) => setAiInstruction(e.target.value)} />
            </div>
          </div>
        </Card>

        {industry !== "edu" && <Card>
          <SectionLabel>Structure</SectionLabel>
          <div className="space-y-3 mt-2">
            <Field label="Unit label" value={subdivisionNoun} onChange={setSubdivisionNoun} placeholder="Departments, Sections, Teams or Wards" />
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-text-muted">{subdivisionNoun}</span>
                <Btn size="sm" variant="ghost" onClick={() => setSubs((s) => [...s, { id: nanoid(6), name: "", hod: "", leadRole: defaults.leadRole, description: "" }])}><IconPlus className="size-3.5" /> Add</Btn>
              </div>
              <div className="space-y-2">
                {subs.map((s, idx) => (
                  <div key={s.id} className="grid grid-cols-12 gap-2 items-center rounded-md border border-border bg-surface-2 p-2">
                    <input className="col-span-12 sm:col-span-5 rounded-md border border-border-strong bg-surface px-2 py-1.5 text-[12px]" placeholder={defaults.subdivisionPlaceholder} value={s.name} onChange={(e) => { setSubs((arr) => arr.map((x) => (x.id === s.id ? { ...x, name: e.target.value } : x))); clearError("units"); }} />
                    <input className="col-span-7 sm:col-span-3 rounded-md border border-border-strong bg-surface px-2 py-1.5 text-[12px]" placeholder={defaults.leadPlaceholder} value={s.hod} onChange={(e) => setSubs((arr) => arr.map((x) => (x.id === s.id ? { ...x, hod: e.target.value } : x)))} />
                    <input className="col-span-4 sm:col-span-3 rounded-md border border-border-strong bg-surface px-2 py-1.5 text-[12px]" placeholder={defaults.leadRole} value={s.leadRole} onChange={(e) => setSubs((arr) => arr.map((x) => (x.id === s.id ? { ...x, leadRole: e.target.value } : x)))} />
                    <Btn variant="ghost" size="sm" className="col-span-1 justify-self-end" onClick={() => setSubs((arr) => arr.filter((x) => x.id !== s.id))}><IconTrash className="size-3.5" /></Btn>
                    <input className="col-span-12 rounded-md border border-border-strong bg-surface px-2 py-1.5 text-[12px]" placeholder="Details, responsibilities or grade span" value={s.description} onChange={(e) => setSubs((arr) => arr.map((x) => (x.id === s.id ? { ...x, description: e.target.value } : x)))} />
                  </div>
                ))}
              </div>
              {fieldErrors.units && <p className="text-[11px] text-red-600 mt-1">{fieldErrors.units}</p>}
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-text-muted mb-1">Role labels</label>
              <div className="space-y-1.5">
                {(["Platform", "Admin", "Principal", "HOD", "Learner"] as const).map((slot, i) => (
                  <div key={slot} className="flex items-center gap-2">
                    <Chip tone="muted" className="w-[80px] justify-center">{slot}</Chip>
                    <input className="flex-1 rounded-md border border-border-strong bg-surface px-2 py-1.5 text-[12px]" value={roleLabels[i]} onChange={(e) => setRoleLabels((r) => { const n = [...r] as typeof r; n[i] = e.target.value; return n; })} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>}
        <Card>
          <SectionLabel>First admin login</SectionLabel>
          <div className="space-y-3 mt-2">
            <Field
              label="Admin name"
              value={adminName}
              onChange={setAdminName}
              placeholder="e.g. Kavitha Raman"
              required
              error={fieldErrors.adminName}
              onClearError={() => clearError("adminName")}
            />
            <Field
              label="Admin email"
              value={adminEmail}
              onChange={setAdminEmail}
              placeholder="admin@school.edu"
              required
              error={fieldErrors.adminEmail}
              onClearError={() => clearError("adminEmail")}
            />
            <Field
              label="Temporary password"
              type="password"
              value={adminPassword}
              onChange={setAdminPassword}
              placeholder="Minimum 6 characters"
              required
              error={fieldErrors.adminPassword}
              onClearError={() => clearError("adminPassword")}
            />
            <p className="text-[11px] text-text-muted">
              This creates the first organization admin in PostgreSQL. The password is hashed by the backend and is never returned to the browser.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "AD";
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  error,
  onClearError,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  error?: string;
  onClearError?: () => void;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-text-muted mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        className={`w-full rounded-md border bg-surface px-3 py-2 text-[13px] ${error ? "border-red-400" : "border-border-strong"}`}
        value={value}
        onChange={(e) => { onClearError?.(); onChange(e.target.value); }}
        placeholder={placeholder}
      />
      {error && <p className="text-[11px] text-red-600 mt-0.5">{error}</p>}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  required,
  error,
  onClearError,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  error?: string;
  onClearError?: () => void;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-text-muted mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <select
        className={`w-full rounded-md border bg-surface px-3 py-2 text-[13px] ${error ? "border-red-400" : "border-border-strong"}`}
        value={value}
        onChange={(event) => { onClearError?.(); onChange(event.target.value); }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      {error && <p className="text-[11px] text-red-600 mt-0.5">{error}</p>}
    </div>
  );
}
