import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useApp } from "@/lib/shiftora-store";
import { INDUSTRY_LABELS, type IndustryKey, type Tenant, type TenantLocation } from "@/lib/shiftora-config";
import { shiftoraApi } from "@/lib/shiftora-api";
import { LANGUAGE_LABELS, type LanguageKey } from "@/lib/i18n";
import { useI18n } from "@/lib/use-i18n";
import { Card, PageHeader, Btn, Chip, SectionLabel, Metric } from "@/components/shiftora/primitives";
import { IconPlus, IconTrash, IconCheck, IconLanguage, IconSchool, IconUsers, IconLayoutGrid, IconBuilding, IconSearch, IconEdit } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/platform/tenants")({ component: Tenants });

type TenantEditDraft = {
  id: string;
  name: string;
  abbr: string;
  type: string;
  board: string;
  brandColor: string;
  aiName: string;
  aiInstruction: string;
  subdivisionNoun: string;
  location: TenantLocation;
};

function Tenants() {
  const { tenants, activeTenantId, setActiveTenant, setRole, updateTenant, deleteTenant, enabledLanguages, setEnabledLanguages, language, setLanguage, backendReady, tenantLoadStatus, tenantLoadError, loadFromBackend } = useApp();
  const { t } = useI18n();
  const nav = useNavigate();
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryKey | "all">("all");
  const [query, setQuery] = useState("");
  const [reviewCount, setReviewCount] = useState(0);
  const [userCounts, setUserCounts] = useState<Record<string, number>>({});
  const [editingTenant, setEditingTenant] = useState<TenantEditDraft | null>(null);
  useEffect(() => {
    shiftoraApi.educationReviews()
      .then((reviews) => setReviewCount(reviews.length))
      .catch(() => setReviewCount(0));
  }, []);
  useEffect(() => {
    let cancelled = false;
    async function loadCounts() {
      const entries = await Promise.all(
        tenants.map(async (tenant) => {
          try {
            const users = await shiftoraApi.adminUsers(tenant.id);
            return [tenant.id, users.length] as const;
          } catch {
            return [tenant.id, 0] as const;
          }
        }),
      );
      if (!cancelled) setUserCounts(Object.fromEntries(entries));
    }
    if (tenants.length) void loadCounts();
    else setUserCounts({});
    return () => {
      cancelled = true;
    };
  }, [tenants]);
  const filteredTenants = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return tenants.filter((tenant) => {
      const sectorMatch = selectedIndustry === "all" || tenant.industry === selectedIndustry;
      const location = tenant.location;
      const searchMatch = !needle || [
        tenant.name,
        tenant.abbr,
        tenant.type,
        tenant.board ?? "",
        location?.city ?? "",
        location?.district ?? "",
        location?.state ?? "",
        INDUSTRY_LABELS[tenant.industry].label,
      ].some((item) => item.toLowerCase().includes(needle));
      return sectorMatch && searchMatch;
    });
  }, [query, selectedIndustry, tenants]);
  const activeIndustryCount = selectedIndustry === "all" ? tenants.length : tenants.filter((tenant) => tenant.industry === selectedIndustry).length;
  const actualUsers = filteredTenants.reduce((sum, tenant) => sum + (userCounts[tenant.id] ?? 0), 0);
  const totalDepartments = filteredTenants.reduce((sum, tenant) => sum + tenant.subdivisions.length, 0);
  const sectorCount = new Set(filteredTenants.map((tenant) => tenant.industry)).size;
  const educationSelected = selectedIndustry === "edu";
  const sectorLabel = selectedIndustry === "all" ? "all sectors" : INDUSTRY_LABELS[selectedIndustry].label;
  const toggleLanguage = (item: LanguageKey) => {
    if (item === "en") return;
    const next = enabledLanguages.includes(item)
      ? enabledLanguages.filter((languageItem) => languageItem !== item)
      : [...enabledLanguages, item];
    setEnabledLanguages(next);
    if (!next.includes(language)) setLanguage("en");
  };
  const startEdit = (tenantRow: Tenant) => {
    setEditingTenant({
      id: tenantRow.id,
      name: tenantRow.name,
      abbr: tenantRow.abbr,
      type: tenantRow.type,
      board: tenantRow.board ?? "",
      brandColor: tenantRow.brandColor,
      aiName: tenantRow.aiName,
      aiInstruction: tenantRow.aiInstruction,
      subdivisionNoun: tenantRow.subdivisionNoun,
      location: defaultLocation(tenantRow.location),
    });
  };
  const saveEdit = () => {
    if (!editingTenant) return;
    if (!editingTenant.name.trim() || !editingTenant.abbr.trim() || !editingTenant.type.trim()) {
      toast.error("Add organization name, abbreviation and type.");
      return;
    }
    updateTenant(editingTenant.id, {
      name: editingTenant.name.trim(),
      abbr: editingTenant.abbr.trim().toUpperCase().slice(0, 6),
      type: editingTenant.type.trim(),
      board: editingTenant.board.trim() || undefined,
      brandColor: editingTenant.brandColor,
      aiName: editingTenant.aiName.trim() || "Shiftora AI",
      aiInstruction: editingTenant.aiInstruction.trim(),
      subdivisionNoun: editingTenant.subdivisionNoun.trim() || "Units",
      location: editingTenant.location,
    });
    toast.success("Organization details saved");
    setEditingTenant(null);
  };
  const confirmDelete = (tenantRow: Tenant) => {
    const ok = window.confirm(`Delete ${tenantRow.name}? This removes the organization from the platform directory.`);
    if (!ok) return;
    deleteTenant(tenantRow.id);
    toast.success(`${tenantRow.name} deleted`);
  };
  const manageTenant = (tenantRow: Tenant) => {
    setActiveTenant(tenantRow.id);
    setRole("admin");
    nav({ to: "/admin/overview" });
  };
  return (
    <div>
      <PageHeader
        title="Organization directory"
        subtitle={`${activeIndustryCount} ${sectorLabel} organization${activeIndustryCount === 1 ? "" : "s"} loaded from ${backendReady ? "PostgreSQL" : "backend pending"}.`}
        right={<Link to="/platform/create"><Btn><IconPlus className="size-4" /> Add organization</Btn></Link>}
      />
      {tenantLoadStatus === "loading" && (
        <Card className="mb-5">
          <div className="text-[13px] font-semibold">Loading organization data from PostgreSQL...</div>
          <div className="text-[12px] text-text-muted mt-1">The platform directory reads tenant details from the backend database.</div>
        </Card>
      )}
      {tenantLoadStatus === "error" && (
        <Card className="mb-5">
          <div className="text-[13px] font-semibold text-[color:var(--er)]">Backend tenant API is unavailable</div>
          <div className="text-[12px] text-text-muted mt-1">
            Tenant details must come from PostgreSQL. Last error: {tenantLoadError ?? "unknown error"}.
          </div>
          <Btn className="mt-3" size="sm" variant="outline" onClick={() => void loadFromBackend()}>Retry backend load</Btn>
        </Card>
      )}
      <Card className="mb-5">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-start">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-md grid place-items-center bg-primary-soft text-primary-strong">
                <IconLanguage className="size-4" />
              </div>
              <div>
                <SectionLabel>{t("languageAccess")}</SectionLabel>
                <div className="text-[12px] text-text-muted mt-1">
                  Platform language controls saved in PostgreSQL for signed-in users.
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-[360px]">
            <div>
              <div className="text-[11px] font-bold text-text-muted mb-1.5">Enabled languages</div>
              <div className="flex flex-wrap gap-2">
                {(["en", "ta", "hi"] as LanguageKey[]).map((item) => {
                  const enabled = enabledLanguages.includes(item);
                  const locked = item === "en";
                  return (
                    <button
                      key={item}
                      onClick={() => toggleLanguage(item)}
                      disabled={locked}
                      className="rounded-md border px-3 py-2 text-[12px] font-semibold disabled:cursor-not-allowed text-left"
                      style={{
                        background: enabled ? "var(--bl)" : "var(--s3)",
                        color: enabled ? "var(--bt)" : "var(--t2)",
                        borderColor: enabled ? "var(--bb)" : "var(--bd)",
                      }}
                    >
                      <span className="inline-flex items-center gap-1">
                        {enabled && <IconCheck className="size-3" />}
                        {LANGUAGE_LABELS[item]}
                      </span>
                      <span className="block text-[10px] font-semibold opacity-70 mt-0.5">
                        {locked ? "Required fallback" : enabled ? "Click to disable" : "Click to enable"}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="text-[10.5px] text-text-muted mt-1">English stays enabled as fallback.</div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-text-muted mb-1.5">Active language</div>
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value as LanguageKey)}
                className="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-[12px] font-semibold"
              >
                {enabledLanguages.map((item) => (
                  <option key={item} value={item}>{LANGUAGE_LABELS[item]}</option>
                ))}
              </select>
              <div className="text-[10.5px] text-text-muted mt-1">Changes apply instantly to translated labels.</div>
            </div>
          </div>
        </div>
      </Card>
      <Card className="mb-5">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4 items-end">
          <div>
            <SectionLabel>Sector context</SectionLabel>
            <div className="flex flex-wrap gap-2 mt-2">
              <SectorButton label="All sectors" active={selectedIndustry === "all"} onClick={() => setSelectedIndustry("all")} />
              {(["edu", "bfsi", "gcc", "health"] as IndustryKey[]).map((industry) => (
                <SectorButton
                  key={industry}
                  label={`${INDUSTRY_LABELS[industry].emoji} ${INDUSTRY_LABELS[industry].label}`}
                  active={selectedIndustry === industry}
                  onClick={() => setSelectedIndustry(industry)}
                />
              ))}
            </div>
            {educationSelected && (
              <div className="mt-3 rounded-md border border-primary-soft bg-primary-soft/40 px-3 py-2 text-[12px] text-text-muted">
                Education-only controls such as Schools, DEO, BEO, DIET, grades, sections and UDISE+ should stay scoped to this sector.
              </div>
            )}
          </div>
          <div>
            <label className="block text-[11px] font-bold text-text-muted mb-1.5">Search</label>
            <div className="relative">
              <IconSearch className="absolute left-2.5 top-2.5 size-4 text-text-subtle" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Name, type or sector"
                className="w-full rounded-md border border-border-strong bg-surface pl-8 pr-3 py-2 text-[12.5px]"
              />
            </div>
          </div>
        </div>
      </Card>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Metric label={educationSelected ? "Schools" : "Organizations"} value={filteredTenants.length} sub={sectorLabel} tone="blue" icon={educationSelected ? <IconSchool className="size-3.5" /> : <IconBuilding className="size-3.5" />} />
        <Metric label="Actual users" value={actualUsers.toLocaleString()} sub="loaded user records" tone="teal" icon={<IconUsers className="size-3.5" />} />
        <Metric label="Subdivisions" value={totalDepartments} sub="sector-specific units" tone="violet" icon={<IconLayoutGrid className="size-3.5" />} />
        <Metric label={educationSelected ? "Reviews" : "Sectors"} value={educationSelected ? reviewCount : sectorCount} sub={educationSelected ? "UDISE assignments needing admin review" : backendReady ? "from DB tenant rows" : "waiting for backend DB"} tone="gold" icon={<IconBuilding className="size-3.5" />} />
      </div>
      <Card padded={false}>
        <div className="relative overflow-x-auto">
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-8 bg-gradient-to-l from-white to-transparent" />
        <table className="min-w-[900px] w-full text-[12.5px]">
          <thead>
            <tr className="text-left text-text-muted border-b border-border">
              <th className="px-4 py-2.5 font-semibold">{t("organisation")}</th><th className="px-4 py-2.5 font-semibold">Sector</th><th className="px-4 py-2.5 font-semibold">Profile</th><th className="px-4 py-2.5 font-semibold">Actual users</th><th className="px-4 py-2.5 font-semibold">Units</th><th className="sticky right-0 z-20 bg-surface px-4 py-2.5 font-semibold shadow-[-8px_0_14px_rgba(15,23,42,.06)]"></th>
            </tr>
          </thead>
          <tbody>
            {filteredTenants.map((tenantRow) => (
              <tr key={tenantRow.id} className="border-b border-border last:border-0 hover:bg-surface-3">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="size-7 rounded-md grid place-items-center text-white font-bold text-[11px]" style={{ background: tenantRow.brandColor }}>{tenantRow.abbr}</div>
                    <div><div className="font-semibold">{tenantRow.name}</div><div className="text-[11px] text-text-muted">{tenantRow.type}</div></div>
                  </div>
                </td>
                <td className="px-4 py-3 text-text-muted">{INDUSTRY_LABELS[tenantRow.industry].emoji} {INDUSTRY_LABELS[tenantRow.industry].label}</td>
                <td className="px-4 py-3 text-text-muted">
                  <div>{tenantRow.industry === "edu" && tenantRow.board ? tenantRow.board : tenantRow.type}</div>
                  {tenantRow.location?.city || tenantRow.location?.state ? (
                    <div className="text-[11px] text-text-subtle">
                      {[tenantRow.location.city, tenantRow.location.state].filter(Boolean).join(", ")}
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-text-muted">{(userCounts[tenantRow.id] ?? 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-text-muted">{tenantRow.subdivisions.length}</td>
                <td className="sticky right-0 z-20 bg-surface px-4 py-3 text-right shadow-[-8px_0_14px_rgba(15,23,42,.06)]">
                  <div className="flex justify-end gap-1.5">
                    {tenantRow.id === activeTenantId && <Chip tone="ok"><IconCheck className="size-3" /> {t("active")}</Chip>}
                    <Btn size="sm" variant="outline" onClick={() => manageTenant(tenantRow)}>Manage</Btn>
                    <Btn size="sm" variant="ghost" onClick={() => startEdit(tenantRow)}><IconEdit className="size-3.5" /></Btn>
                    <Btn size="sm" variant="ghost" onClick={() => confirmDelete(tenantRow)}><IconTrash className="size-3.5" /></Btn>
                  </div>
                </td>
              </tr>
            ))}
            {!filteredTenants.length && (
              <tr>
                <td className="px-4 py-8 text-center text-text-muted" colSpan={6}>
                  No organizations match the selected sector/search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </Card>
      {editingTenant && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-4">
          <Card className="w-full max-w-3xl max-h-[88vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <SectionLabel>Edit organization</SectionLabel>
                <h2 className="text-lg font-bold mt-1">{editingTenant.name || "Organization details"}</h2>
                <div className="text-[12px] text-text-muted mt-1">Changes are saved to the backend tenant record.</div>
              </div>
              <Btn size="sm" variant="ghost" onClick={() => setEditingTenant(null)}>Close</Btn>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <EditField label="Organization name" value={editingTenant.name} onChange={(name) => setEditingTenant({ ...editingTenant, name })} />
              <EditField label="Abbreviation" value={editingTenant.abbr} onChange={(abbr) => setEditingTenant({ ...editingTenant, abbr })} />
              <EditField label="Organization type" value={editingTenant.type} onChange={(type) => setEditingTenant({ ...editingTenant, type })} />
              <EditField label="Board / profile label" value={editingTenant.board} onChange={(board) => setEditingTenant({ ...editingTenant, board })} />
              <EditField label="Unit label" value={editingTenant.subdivisionNoun} onChange={(subdivisionNoun) => setEditingTenant({ ...editingTenant, subdivisionNoun })} />
              <EditField label="Brand color" type="color" value={editingTenant.brandColor} onChange={(brandColor) => setEditingTenant({ ...editingTenant, brandColor })} />
              <EditField label="Address line 1" value={editingTenant.location.addressLine1} onChange={(addressLine1) => setEditingTenant({ ...editingTenant, location: { ...editingTenant.location, addressLine1 } })} />
              <EditField label="Address line 2" value={editingTenant.location.addressLine2 ?? ""} onChange={(addressLine2) => setEditingTenant({ ...editingTenant, location: { ...editingTenant.location, addressLine2 } })} />
              <EditField label="City / town" value={editingTenant.location.city} onChange={(city) => setEditingTenant({ ...editingTenant, location: { ...editingTenant.location, city } })} />
              <EditField label="District" value={editingTenant.location.district ?? ""} onChange={(district) => setEditingTenant({ ...editingTenant, location: { ...editingTenant.location, district } })} />
              <EditField label="State" value={editingTenant.location.state} onChange={(state) => setEditingTenant({ ...editingTenant, location: { ...editingTenant.location, state } })} />
              <EditField label="PIN / postal code" value={editingTenant.location.pincode ?? ""} onChange={(pincode) => setEditingTenant({ ...editingTenant, location: { ...editingTenant.location, pincode } })} />
              <EditField label="Country" value={editingTenant.location.country} onChange={(country) => setEditingTenant({ ...editingTenant, location: { ...editingTenant.location, country } })} />
              <EditField label="AI persona name" value={editingTenant.aiName} onChange={(aiName) => setEditingTenant({ ...editingTenant, aiName })} />
              <label className="md:col-span-2">
                <span className="block text-[11px] font-bold text-text-muted mb-1.5">AI instruction</span>
                <textarea
                  rows={3}
                  value={editingTenant.aiInstruction}
                  onChange={(event) => setEditingTenant({ ...editingTenant, aiInstruction: event.target.value })}
                  className="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-[12.5px]"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <Btn variant="outline" onClick={() => setEditingTenant(null)}>Cancel</Btn>
              <Btn onClick={saveEdit}><IconCheck className="size-3.5" /> Save organization</Btn>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function SectorButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-md border px-3 py-2 text-[12px] font-semibold"
      style={{
        background: active ? "var(--bl)" : "var(--s3)",
        color: active ? "var(--bt)" : "var(--t2)",
        borderColor: active ? "var(--bb)" : "var(--bd)",
      }}
    >
      {label}
    </button>
  );
}

function defaultLocation(location?: TenantLocation): TenantLocation {
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

function EditField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: "text" | "color" }) {
  return (
    <label>
      <span className="block text-[11px] font-bold text-text-muted mb-1.5">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-[12.5px] ${type === "color" ? "h-9" : ""}`}
      />
    </label>
  );
}
