import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  IconCheck,
  IconEdit,
  IconMap2,
  IconPlus,
  IconSchool,
  IconShieldCheck,
  IconUsers,
} from "@tabler/icons-react";
import { Btn, Card, Chip, Metric, PageHeader, SectionLabel } from "@/components/shiftora/primitives";
import { useApp } from "@/lib/shiftora-store";
import {
  shiftoraApi,
  type AppUser,
  type EducationBlock,
  type EducationState,
  type EducationalDistrict,
} from "@/lib/shiftora-api";

export const Route = createFileRoute("/platform/officers")({ component: EducationOfficers });

type OfficerRole = "BEO" | "DEO" | "DIET";

type OfficerDraft = {
  id: string;
  tenantId: string;
  role: OfficerRole;
  name: string;
  email: string;
  password: string;
  stateCode: string;
  districtCode: string;
  blockCode: string;
};

const EMPTY_DRAFT: OfficerDraft = {
  id: "",
  tenantId: "",
  role: "BEO",
  name: "",
  email: "",
  password: "",
  stateCode: "",
  districtCode: "",
  blockCode: "",
};

function EducationOfficers() {
  const { tenants, loadFromBackend, tenantLoadStatus } = useApp();
  const educationTenants = useMemo(
    () => tenants.filter((tenant) => tenant.industry === "edu"),
    [tenants],
  );
  const [states, setStates] = useState<EducationState[]>([]);
  const [districts, setDistricts] = useState<EducationalDistrict[]>([]);
  const [blocks, setBlocks] = useState<EducationBlock[]>([]);
  const [officers, setOfficers] = useState<AppUser[]>([]);
  const [draft, setDraft] = useState<OfficerDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (tenantLoadStatus === "idle") void loadFromBackend();
  }, [loadFromBackend, tenantLoadStatus]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [stateRows, userGroups] = await Promise.all([
          shiftoraApi.educationStates(),
          Promise.all(
            educationTenants.map(async (tenant) => {
              try {
                return await shiftoraApi.adminUsers(tenant.id);
              } catch {
                return [];
              }
            }),
          ),
        ]);
        if (cancelled) return;
        setStates(stateRows);
        setOfficers(userGroups.flat().filter((user) => ["BEO", "DEO", "DIET"].includes(user.role)));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load education officers");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [educationTenants]);

  useEffect(() => {
    if (!draft?.stateCode) {
      setDistricts([]);
      return;
    }
    let cancelled = false;
    shiftoraApi
      .educationDistricts(draft.stateCode)
      .then((rows) => {
        if (!cancelled) setDistricts(rows);
      })
      .catch(() => {
        if (!cancelled) setDistricts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [draft?.stateCode]);

  useEffect(() => {
    if (!draft?.districtCode || draft.role !== "BEO") {
      setBlocks([]);
      return;
    }
    let cancelled = false;
    shiftoraApi
      .educationBlocks(draft.districtCode)
      .then((rows) => {
        if (!cancelled) setBlocks(rows);
      })
      .catch(() => {
        if (!cancelled) setBlocks([]);
      });
    return () => {
      cancelled = true;
    };
  }, [draft?.districtCode, draft?.role]);

  const selectedState = states.find((item) => item.stateCode === draft?.stateCode);
  const selectedDistrict = districts.find((item) => item.udiseDistrictCode === draft?.districtCode);
  const selectedBlock = blocks.find((item) => item.udiseBlockCode === draft?.blockCode);
  const scopedOfficers = {
    beo: officers.filter((user) => user.role === "BEO").length,
    deo: officers.filter((user) => user.role === "DEO").length,
    diet: officers.filter((user) => user.role === "DIET").length,
  };

  const startCreate = (role: OfficerRole = "BEO") => {
    setDraft({
      ...EMPTY_DRAFT,
      role,
      tenantId: educationTenants[0]?.id ?? "",
    });
  };

  const startEdit = (user: AppUser) => {
    setDraft({
      id: user.id,
      tenantId: user.tenantId,
      role: user.role as OfficerRole,
      name: user.name,
      email: user.email,
      password: "",
      stateCode: string(user.profile.stateCode),
      districtCode: string(user.profile.udiseDistrictCode),
      blockCode: string(user.profile.udiseBlockCode),
    });
  };

  const saveOfficer = async () => {
    if (!draft) return;
    const validation = validateDraft(draft);
    if (validation) {
      toast.error(validation);
      return;
    }
    setSaving(true);
    try {
      const saved = await shiftoraApi.saveAdminUser({
        id: draft.id,
        tenantId: draft.tenantId,
        name: draft.name.trim(),
        email: draft.email.trim().toLowerCase(),
        role: draft.role,
        avatar: initials(draft.name.trim()),
        profile: {
          designation: roleTitle(draft.role),
          status: "active",
          officerScope: draft.role,
          stateCode: draft.stateCode,
          stateName: selectedState?.stateName ?? "",
          udiseDistrictCode: draft.districtCode,
          districtName: selectedDistrict?.districtName ?? "",
          udiseBlockCode: draft.role === "BEO" ? draft.blockCode : "",
          blockName: draft.role === "BEO" ? selectedBlock?.blockName ?? "" : "",
          ...(draft.password.trim() ? { password: draft.password.trim() } : {}),
        },
      });
      setOfficers((current) => upsertById(current, saved));
      setDraft(null);
      toast.success(`${roleTitle(saved.role as OfficerRole)} login saved`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save officer login");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Education officer logins"
        subtitle="Create BEO, DEO and DIET users with DB-backed state, district and block scope."
        right={
          <Btn onClick={() => startCreate("BEO")} disabled={!educationTenants.length}>
            <IconPlus className="size-4" /> Add officer
          </Btn>
        }
      />

      {error && (
        <Card className="mb-5">
          <div className="text-[13px] font-semibold text-[color:var(--er)]">{error}</div>
        </Card>
      )}

      {!educationTenants.length && (
        <Card className="mb-5">
          <div className="text-[13px] font-semibold">Create an education organization first.</div>
          <div className="text-[12px] text-text-muted mt-1">
            Officer users need one education organization as their login anchor. Their BEO/DEO authority is stored separately as state, district and block scope.
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Metric label="Education orgs" value={educationTenants.length} sub="login anchors" tone="blue" icon={<IconSchool className="size-3.5" />} />
        <Metric label="BEO logins" value={scopedOfficers.beo} sub="block scoped" tone="teal" icon={<IconMap2 className="size-3.5" />} />
        <Metric label="DEO logins" value={scopedOfficers.deo} sub="district scoped" tone="violet" icon={<IconShieldCheck className="size-3.5" />} />
        <Metric label="DIET logins" value={scopedOfficers.diet} sub="training body" tone="gold" icon={<IconUsers className="size-3.5" />} />
      </div>

      <Card padded={false}>
        <div className="p-4 border-b border-border flex items-center justify-between gap-3">
          <SectionLabel>Officer directory</SectionLabel>
          <div className="flex gap-2">
            <Btn size="sm" variant="outline" onClick={() => startCreate("DEO")} disabled={!educationTenants.length}>Add DEO</Btn>
            <Btn size="sm" variant="outline" onClick={() => startCreate("BEO")} disabled={!educationTenants.length}>Add BEO</Btn>
            <Btn size="sm" variant="outline" onClick={() => startCreate("DIET")} disabled={!educationTenants.length}>Add DIET</Btn>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[860px] w-full text-[12.5px]">
            <thead>
              <tr className="text-left text-text-muted border-b border-border">
                <th className="px-4 py-2.5 font-semibold">Officer</th>
                <th className="px-4 py-2.5 font-semibold">Role</th>
                <th className="px-4 py-2.5 font-semibold">Login anchor</th>
                <th className="px-4 py-2.5 font-semibold">Scope</th>
                <th className="px-4 py-2.5 font-semibold text-right"></th>
              </tr>
            </thead>
            <tbody>
              {officers.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-0 hover:bg-surface-3">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{user.name}</div>
                    <div className="text-[11px] text-text-muted">{user.email}</div>
                  </td>
                  <td className="px-4 py-3"><Chip tone={roleTone(user.role)}>{user.role}</Chip></td>
                  <td className="px-4 py-3 text-text-muted">{tenantName(educationTenants, user.tenantId)}</td>
                  <td className="px-4 py-3 text-text-muted">{scopeLabel(user)}</td>
                  <td className="px-4 py-3 text-right">
                    <Btn size="sm" variant="ghost" onClick={() => startEdit(user)}>
                      <IconEdit className="size-3.5" /> Edit
                    </Btn>
                  </td>
                </tr>
              ))}
              {!officers.length && (
                <tr>
                  <td className="px-4 py-8 text-center text-text-muted" colSpan={5}>
                    {loading ? "Loading officer logins..." : "No BEO, DEO or DIET logins have been created yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {draft && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-4">
          <Card className="w-full max-w-3xl max-h-[88vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <SectionLabel>{draft.id ? "Edit officer login" : "Create officer login"}</SectionLabel>
                <h2 className="text-lg font-bold mt-1">{draft.name || roleTitle(draft.role)}</h2>
                <div className="text-[12px] text-text-muted mt-1">
                  The login anchor controls authentication. The selected education scope controls BEO/DEO dashboard data.
                </div>
              </div>
              <Btn size="sm" variant="ghost" onClick={() => setDraft(null)}>Close</Btn>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <SelectField
                label="Role"
                value={draft.role}
                onChange={(role) => setDraft({ ...draft, role: role as OfficerRole, blockCode: "" })}
                options={[
                  ["BEO", "BEO - Block Education Officer"],
                  ["DEO", "DEO - District Education Officer"],
                  ["DIET", "DIET - Training body"],
                ]}
              />
              <SelectField
                label="Login anchor organization"
                value={draft.tenantId}
                onChange={(tenantId) => setDraft({ ...draft, tenantId })}
                options={educationTenants.map((tenant) => [tenant.id, tenant.name])}
              />
              <TextField label="Name" value={draft.name} onChange={(name) => setDraft({ ...draft, name })} />
              <TextField label="Email" value={draft.email} onChange={(email) => setDraft({ ...draft, email })} />
              <TextField
                label={draft.id ? "New password optional" : "Temporary password"}
                type="password"
                value={draft.password}
                onChange={(password) => setDraft({ ...draft, password })}
              />
              <SelectField
                label="State / UT"
                value={draft.stateCode}
                onChange={(stateCode) => setDraft({ ...draft, stateCode, districtCode: "", blockCode: "" })}
                options={states.map((state) => [state.stateCode, state.stateName])}
              />
              <SelectField
                label="Education district"
                value={draft.districtCode}
                onChange={(districtCode) => setDraft({ ...draft, districtCode, blockCode: "" })}
                options={districts.map((district) => [district.udiseDistrictCode, district.districtName])}
                disabled={!draft.stateCode || draft.role === "DIET"}
              />
              <SelectField
                label="Block"
                value={draft.blockCode}
                onChange={(blockCode) => setDraft({ ...draft, blockCode })}
                options={blocks.map((block) => [block.udiseBlockCode, block.blockName])}
                disabled={draft.role !== "BEO" || !draft.districtCode}
              />
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <Btn variant="outline" onClick={() => setDraft(null)}>Cancel</Btn>
              <Btn onClick={saveOfficer} disabled={saving}>
                <IconCheck className="size-3.5" /> {saving ? "Saving..." : "Save officer login"}
              </Btn>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function validateDraft(draft: OfficerDraft) {
  if (!draft.tenantId) return "Select a login anchor organization.";
  if (!draft.name.trim()) return "Add the officer name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) return "Enter a valid email address.";
  if (!draft.id && draft.password.trim().length < 6) return "Temporary password must be at least 6 characters.";
  if (!draft.stateCode) return "Select the state or union territory.";
  if (draft.role !== "DIET" && !draft.districtCode) return "Select the education district.";
  if (draft.role === "BEO" && !draft.blockCode) return "Select the block.";
  return "";
}

function TextField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label>
      <span className="block text-[11px] font-bold text-text-muted mb-1.5">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-[12.5px]"
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options, disabled = false }: { label: string; value: string; onChange: (value: string) => void; options: [string, string][]; disabled?: boolean }) {
  return (
    <label>
      <span className="block text-[11px] font-bold text-text-muted mb-1.5">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-[12.5px] disabled:bg-surface-3 disabled:text-text-subtle"
      >
        <option value="">Select</option>
        {options.map(([optionValue, labelText]) => (
          <option key={optionValue} value={optionValue}>{labelText}</option>
        ))}
      </select>
    </label>
  );
}

function roleTitle(role: OfficerRole) {
  if (role === "DEO") return "District Education Officer";
  if (role === "DIET") return "DIET training coordinator";
  return "Block Education Officer";
}

function roleTone(role: string): "teal" | "violet" | "gold" {
  if (role === "DEO") return "violet";
  if (role === "DIET") return "gold";
  return "teal";
}

function scopeLabel(user: AppUser) {
  const state = string(user.profile.stateName);
  const district = string(user.profile.districtName);
  const block = string(user.profile.blockName);
  if (user.role === "BEO") return [state, district, block].filter(Boolean).join(" / ");
  if (user.role === "DEO") return [state, district].filter(Boolean).join(" / ");
  return state || "State training scope";
}

function tenantName(tenants: { id: string; name: string }[], tenantId: string) {
  return tenants.find((tenant) => tenant.id === tenantId)?.name ?? tenantId;
}

function upsertById<T extends { id: string }>(items: T[], item: T) {
  return items.some((existing) => existing.id === item.id)
    ? items.map((existing) => (existing.id === item.id ? item : existing))
    : [item, ...items];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? "O").toUpperCase() + (parts[1]?.[0] ?? "").toUpperCase();
}

function string(value: unknown) {
  return value == null ? "" : String(value);
}
