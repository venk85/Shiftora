import { nanoid } from "nanoid";

export type IndustryKey = "edu" | "bfsi" | "gcc" | "health";
export type RoleKey =
  | "platform"
  | "admin"
  | "principal"
  | "hod"
  | "learner"
  | "beo"
  | "deo"
  | "diet";
export type AccentKey = "blue" | "gold" | "teal" | "violet";

export type Subdivision = {
  id: string;
  name: string;
  hod: string;
  leadRole?: string;
  description?: string;
  maturity: number; // 0-100
  adoption: number; // 0-100
  staff: number;
};

export type TenantLocation = {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  district?: string;
  state: string;
  pincode?: string;
  country: string;
};

export type EducationAssignment = {
  status: "ASSIGNED" | "NEEDS_REVIEW" | "ERROR" | "MANUAL" | string;
  message: string;
  udiseCode?: string;
  stateCode?: string;
  stateName?: string;
  udiseDistrictCode?: string;
  districtName?: string;
  districtOfficerTitle?: string;
  districtOfficerOffice?: string;
  districtOfficerContact?: string | null;
  udiseBlockCode?: string;
  blockName?: string;
  blockUnitName?: string;
  blockOfficerTitle?: string;
  blockOfficerOffice?: string;
  blockOfficerContact?: string | null;
  // School-level fields — populated when UDISE code is found in TN school master
  schoolName?: string | null;
  schoolType?: string | null;
  staffCount?: number | null;
  boardName?: string | null;
};

export type Persona = {
  name: string;
  title: string;
  avatar: string; // initials
};

export type Scenario = {
  id: string;
  title: string;
  desc: string;
  icon: string; // emoji
  inputs: {
    key: string;
    label: string;
    type: "text" | "textarea" | "select" | "number";
    options?: string[];
    placeholder?: string;
  }[];
  systemPrompt: string;
  scoreLabels: string[]; // 3 labels, e.g. ["Curriculum alignment","Engagement design","Time distribution"]
};

export type Tenant = {
  id: string;
  name: string;
  abbr: string;
  type: string;
  size: number;
  industry: IndustryKey;
  board?: string;
  location?: TenantLocation;
  udiseCode?: string;
  educationAssignment?: EducationAssignment;
  schoolPhotoDataUrl?: string;
  aiName: string;
  subdivisionNoun: string;
  subdivisions: Subdivision[];
  roleLabels: [string, string, string, string, string]; // [platform, admin, principal, hod, learner]
  personas: { admin: Persona; principal: Persona; hod: Persona; learner: Persona };
  brandColor: string;
  maturity: number;
  adoption: number;
  aiInstruction: string;
  createdAt: number;
};

export const INDUSTRY_LABELS: Record<IndustryKey, { label: string; emoji: string }> = {
  edu: { label: "Education", emoji: "🎓" },
  bfsi: { label: "BFSI", emoji: "🏦" },
  gcc: { label: "GCC / IT", emoji: "💻" },
  health: { label: "Healthcare", emoji: "🏥" },
};

export const ROLE_ACCENT: Record<RoleKey, AccentKey> = {
  platform: "violet",
  admin: "teal",
  principal: "gold",
  hod: "blue",
  learner: "blue",
  beo: "teal",
  deo: "violet",
  diet: "gold",
};

export const ACCENT_CSS: Record<AccentKey, { color: string; soft: string; border: string }> = {
  blue: { color: "var(--b)", soft: "var(--bl)", border: "var(--bb)" },
  gold: { color: "var(--g)", soft: "var(--gl)", border: "var(--gb)" },
  teal: { color: "var(--tl)", soft: "var(--tll)", border: "var(--tlb)" },
  violet: { color: "var(--vi)", soft: "var(--vil)", border: "var(--vib)" },
};

export function newTenantId() {
  return "tn-" + nanoid(8);
}
