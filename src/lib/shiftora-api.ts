import type { EducationAssignment, IndustryKey, RoleKey, Scenario, Tenant } from "./shiftora-config";
import type { PracticeEntry } from "./shiftora-store";

export type SandboxRunRequest = {
  aiName: string;
  scenarioTitle: string;
  systemPrompt: string;
  tenantInstruction: string;
  scoreLabels: string[];
  inputs: Record<string, string>;
};

export type SandboxRunResult = {
  output: string;
  scores: { label: string; value: number }[];
};

export type Assignment = {
  id: string;
  userId: string;
  tenantId: string;
  schoolName: string;
  grade: string;
  division: string;
  subject: string;
  responsibility: string;
  primaryAssignment: boolean;
  active: boolean;
  metadata: Record<string, unknown>;
};

export type AppUser = {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: string;
  avatar: string;
  profile: Record<string, unknown>;
};

export type EducationState = {
  stateCode: string;
  stateName: string;
  blockOfficerTitle: string;
  districtOfficerTitle: string;
  blockUnitName: string;
  udiseBlockDigits: number;
};

export type EducationalDistrict = {
  udiseDistrictCode: string;
  stateCode: string;
  districtName: string;
  deoOfficeName: string;
  deoContact: string | null;
};

export type EducationBlock = {
  udiseBlockCode: string;
  udiseDistrictCode: string;
  stateCode: string;
  blockName: string;
  beoOfficeName: string;
  beoContact: string | null;
};

export type EducationAssignmentReview = {
  id: string;
  tenantId: string;
  udiseCode: string;
  status: string;
  reason: string;
  payload: Record<string, unknown>;
  createdAt: number;
};

export type BeoOverview = {
  blockCode: string;
  blockName: string;
  blockOfficerOffice: string;
  districtCode: string;
  districtName: string;
  schoolsTracked: number;
  blockFln: number;
  visitsLogged: number;
  atRiskSchools: number;
  schools: { udiseCode: string; name: string; score: number; status: string; tenantId: string | null }[];
  gradeProgress: { grade: string; progress: number }[];
  visits: { school: string; date: string; focus: string; status: string }[];
  recommendations: { text: string }[];
};

export type DeoOverview = {
  districtCode: string;
  districtName: string;
  districtOfficerOffice: string;
  blocks: number;
  districtFln: number;
  atRiskAlerts: number;
  compliance: number;
  blockHeatmap: { blockCode: string; name: string; score: number; schools: number; critical: boolean }[];
  complianceBars: { name: string; value: number }[];
  alerts: string[];
  directorateReport: string[];
};

export type ReadinessQuestion = {
  id: string;
  type: "scale" | "single_choice" | "multi_choice" | "text";
  prompt: string;
  options: string[];
  weight: number;
};

export type ReadinessTemplate = {
  id: string | null;
  tenantId: string;
  name: string;
  description: string;
  status: "draft" | "published";
  sortOrder: number;
  targeting: Record<string, unknown>;
  questions: ReadinessQuestion[];
  updatedAt: number;
};

export type ReadinessAttempt = {
  id: string;
  templateId: string;
  assignmentId: string | null;
  answers: Record<string, unknown>;
  score: number;
  level: string;
  recommendedModules: string[];
  createdAt: number;
};

export type ReadinessCheck = {
  templateId: string;
  title: string;
  description: string;
  assignment: Assignment;
  availableAssignments: Assignment[];
  questions: ReadinessQuestion[];
  latestAttempt: ReadinessAttempt | null;
};

export type Journey = {
  user: AppUser;
  activeAssignment: Assignment;
  assignments: Assignment[];
  steps: {
    key: string;
    label: string;
    path: string;
    status: "todo" | "active" | "done" | "locked" | string;
    progress: number;
    score: number | null;
    lockReason?: string | null;
  }[];
  modules: { title: string; progress: number; status: string }[];
  metrics: { readiness: number; practiceRuns: number; confidence: string; completedSteps: number };
  nextAction: { label: string; path: string };
};

export type LearningUnit = {
  id: string;
  moduleId: string;
  title: string;
  type: "reading" | "video" | "activity" | "quiz" | "external" | string;
  estimatedMinutes: number;
  sortOrder: number;
  content: {
    summary?: string;
    body?: string;
    videoUrl?: string;
    activity?: string;
    question?: string;
    answer?: string;
    externalResources?: { title: string; url: string; source?: string }[];
    [key: string]: unknown;
  };
  status: "not_started" | "in_progress" | "completed" | string;
};

export type LearningModuleTargeting = {
  schoolName?: string;
  grade?: string | string[];
  division?: string;
  subject?: string;
  responsibility?: string;
  board?: string | string[];
  minReadiness?: number;
  maxReadiness?: number;
};

export type LearningModule = {
  id: string;
  tenantId: string | null;
  title: string;
  description: string;
  level: string;
  language: string;
  estimatedMinutes: number;
  status: string;
  sortOrder: number;
  targeting: LearningModuleTargeting;
  progress: number;
  locked: boolean;
  units: LearningUnit[];
  mandatory: boolean;
  isPlatform: boolean;
};

export type TenantModuleAdoption = {
  id: string;
  tenantId: string;
  moduleId: string;
  mandatory: boolean;
  sortOrder: number;
  targeting: LearningModuleTargeting;
  adoptedAt: number;
};

export type LearningPath = {
  user: AppUser;
  activeAssignment: Assignment;
  assignments: Assignment[];
  readinessScore: number;
  completedModules: number;
  totalModules: number;
  totalMinutes: number;
  modules: LearningModule[];
};

export type KnowledgeQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answerIndex: number;
  weight: number;
};

export type KnowledgeAttempt = {
  id: string;
  knowledgeCheckId: string;
  assignmentId: string | null;
  answers: Record<string, unknown>;
  score: number;
  passed: boolean;
  createdAt: number;
};

export type KnowledgeCheck = {
  id: string | null;
  title: string;
  description: string;
  passScore: number;
  workshopCompleted: boolean;
  available: boolean;
  lockedReason: string;
  assignment: Assignment;
  availableAssignments: Assignment[];
  questions: KnowledgeQuestion[];
  latestAttempt: KnowledgeAttempt | null;
};

export type CompletionRow = {
  user: AppUser;
  assignment: Assignment;
  readinessScore: number;
  learningProgress: number;
  workshopCompleted: boolean;
  knowledgeScore: number | null;
  knowledgePassed: boolean;
  certificateEligible: boolean;
  certificateStatus: string;
  certificateNumber: string;
  emailedTo: string;
};

export type WorkshopSession = {
  id: string;
  tenantId: string;
  title: string;
  status: string;
  startsAt: number;
  durationMinutes: number;
  facilitator: string;
  meetingUrl: string;
  attendeeCount: number;
  agenda: string[];
  prerequisites: string[];
};

export type AuthUserResponse = {
  email: string;
  name: string;
  avatar: string;
  role: RoleKey;
  tenantId: string | null;
  isSuper: boolean;
  allowedRoles: RoleKey[];
};

export type LoginResponse = {
  token: string;
  expiresAt: number;
  user: AuthUserResponse;
};

export type PlatformSettings = {
  enabledLanguages: string[];
  activeLanguage: string;
  updatedAt: number;
};

export type EducationKysSyncResult = {
  source: string;
  yearId: number;
  states: number;
  districts: number;
  blocks: number;
  syncedStateCodes: string[];
};

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ??
  (typeof window === "undefined" ? "http://localhost:8081/api" : "/api")
).replace(/\/$/, "");

function authToken() {
  if (typeof window === "undefined") return "";
  try {
    const state = JSON.parse(window.localStorage.getItem("shiftora-store-db-v1") ?? "{}");
    return state?.state?.authToken ?? "";
  } catch {
    return "";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = path === "/auth/login" ? "" : authToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(body.message || body.error || res.statusText || `API error ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const shiftoraApi = {
  login: (email: string, password: string) =>
    request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  platformSettings: () => request<PlatformSettings>("/platform/settings"),
  updatePlatformSettings: (settings: Pick<PlatformSettings, "enabledLanguages" | "activeLanguage">) =>
    request<PlatformSettings>("/platform/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    }),
  tenants: () => request<Tenant[]>("/tenants"),
  createTenant: (
    tenant: Omit<Tenant, "id" | "createdAt"> & Partial<Pick<Tenant, "id" | "createdAt">>,
  ) => request<Tenant>("/tenants", { method: "POST", body: JSON.stringify(tenant) }),
  updateTenant: (tenant: Tenant) =>
    request<Tenant>(`/tenants/${encodeURIComponent(tenant.id)}`, {
      method: "PUT",
      body: JSON.stringify(tenant),
    }),
  deleteTenant: (id: string) =>
    request<void>(`/tenants/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
  educationStates: () => request<EducationState[]>("/education/states"),
  educationDistricts: (stateCode: string) =>
    request<EducationalDistrict[]>(`/education/districts?stateCode=${encodeURIComponent(stateCode)}`),
  educationBlocks: (districtCode: string) =>
    request<EducationBlock[]>(`/education/blocks?districtCode=${encodeURIComponent(districtCode)}`),
  decodeUdise: (code: string) =>
    request<EducationAssignment>(`/education/udise/decode?code=${encodeURIComponent(code)}`),
  createEducationReview: (payload: Record<string, unknown>) =>
    request<EducationAssignmentReview>("/education/assignment-reviews", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  educationReviews: () => request<EducationAssignmentReview[]>("/education/assignment-reviews"),
  syncKysEducationMasters: (stateCode?: string, yearId = 11) =>
    request<EducationKysSyncResult>(
      `/education/sync/kys?yearId=${encodeURIComponent(String(yearId))}${stateCode ? `&stateCode=${encodeURIComponent(stateCode)}` : ""}`,
      { method: "POST" },
    ),
  beoOverview: (tenantId?: string) =>
    request<BeoOverview>(
      `/education/overview/beo${tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : ""}`,
    ),
  deoOverview: (tenantId?: string) =>
    request<DeoOverview>(
      `/education/overview/deo${tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : ""}`,
    ),
  scenarios: (industry: IndustryKey) =>
    request<Scenario[]>(`/scenarios?industry=${encodeURIComponent(industry)}`),
  practiceForTenant: (tenantId: string) =>
    request<PracticeEntry[]>(`/tenants/${encodeURIComponent(tenantId)}/practice`),
  createPractice: (entry: Omit<PracticeEntry, "id" | "createdAt">) =>
    request<PracticeEntry>("/practice", { method: "POST", body: JSON.stringify(entry) }),
  runSandbox: (payload: SandboxRunRequest) =>
    request<SandboxRunResult>("/sandbox/run", { method: "POST", body: JSON.stringify(payload) }),
  journey: (tenantId: string, email: string, assignmentId?: string) =>
    request<Journey>(
      `/users/me/journey?tenantId=${encodeURIComponent(tenantId)}&email=${encodeURIComponent(email)}${assignmentId ? `&assignmentId=${encodeURIComponent(assignmentId)}` : ""}`,
    ),
  readinessCheck: (tenantId: string, email: string, assignmentId?: string) =>
    request<ReadinessCheck>(
      `/users/me/readiness-check?tenantId=${encodeURIComponent(tenantId)}&email=${encodeURIComponent(email)}${assignmentId ? `&assignmentId=${encodeURIComponent(assignmentId)}` : ""}`,
    ),
  submitReadiness: (
    tenantId: string,
    email: string,
    payload: { templateId: string; assignmentId?: string; answers: Record<string, unknown> },
  ) =>
    request<ReadinessAttempt>(
      `/users/me/readiness-check/attempts?tenantId=${encodeURIComponent(tenantId)}&email=${encodeURIComponent(email)}`,
      { method: "POST", body: JSON.stringify(payload) },
    ),
  learningPath: (tenantId: string, email: string, assignmentId?: string) =>
    request<LearningPath>(
      `/users/me/learning-path?tenantId=${encodeURIComponent(tenantId)}&email=${encodeURIComponent(email)}${assignmentId ? `&assignmentId=${encodeURIComponent(assignmentId)}` : ""}`,
    ),
  saveLearningProgress: (
    tenantId: string,
    email: string,
    payload: {
      assignmentId: string;
      moduleId: string;
      unitId: string;
      status: string;
      score?: number;
      timeSpentSeconds?: number;
    },
  ) =>
    request<LearningPath>(
      `/users/me/learning-progress?tenantId=${encodeURIComponent(tenantId)}&email=${encodeURIComponent(email)}`,
      { method: "POST", body: JSON.stringify(payload) },
    ),
  adminLearningModules: (tenantId: string) =>
    request<LearningModule[]>(`/admin/learning-modules?tenantId=${encodeURIComponent(tenantId)}`),
  adminCreateModule: (tenantId: string, body: Partial<LearningModule>) =>
    request<LearningModule>(`/admin/learning-modules?tenantId=${encodeURIComponent(tenantId)}`, { method: "POST", body: JSON.stringify(body) }),
  adminUpdateModule: (tenantId: string, moduleId: string, body: Partial<LearningModule>) =>
    request<LearningModule>(`/admin/learning-modules/${encodeURIComponent(moduleId)}?tenantId=${encodeURIComponent(tenantId)}`, { method: "PUT", body: JSON.stringify(body) }),
  adminDeleteModule: (tenantId: string, moduleId: string) =>
    request<void>(`/admin/learning-modules/${encodeURIComponent(moduleId)}?tenantId=${encodeURIComponent(tenantId)}`, { method: "DELETE" }),
  adminAddUnit: (moduleId: string, body: Partial<LearningUnit>) =>
    request<LearningUnit>(`/admin/learning-modules/${encodeURIComponent(moduleId)}/units`, { method: "POST", body: JSON.stringify(body) }),
  adminUpdateUnit: (unitId: string, body: Partial<LearningUnit>) =>
    request<LearningUnit>(`/admin/learning-units/${encodeURIComponent(unitId)}`, { method: "PUT", body: JSON.stringify(body) }),
  adminDeleteUnit: (unitId: string) =>
    request<void>(`/admin/learning-units/${encodeURIComponent(unitId)}`, { method: "DELETE" }),
  adminPlatformCatalog: (tenantId: string) =>
    request<LearningModule[]>(`/admin/platform-catalog?tenantId=${encodeURIComponent(tenantId)}`),
  adminAdoptModule: (tenantId: string, body: { moduleId: string; mandatory: boolean; sortOrder: number; targeting: LearningModuleTargeting }) =>
    request<TenantModuleAdoption>(`/admin/module-adoptions?tenantId=${encodeURIComponent(tenantId)}`, { method: "POST", body: JSON.stringify(body) }),
  adminUpdateAdoption: (tenantId: string, moduleId: string, body: { mandatory: boolean; sortOrder: number; targeting: LearningModuleTargeting }) =>
    request<TenantModuleAdoption>(`/admin/module-adoptions/${encodeURIComponent(moduleId)}?tenantId=${encodeURIComponent(tenantId)}`, { method: "PUT", body: JSON.stringify(body) }),
  adminRemoveAdoption: (tenantId: string, moduleId: string) =>
    request<void>(`/admin/module-adoptions/${encodeURIComponent(moduleId)}?tenantId=${encodeURIComponent(tenantId)}`, { method: "DELETE" }),
  platformContentModules: () =>
    request<LearningModule[]>(`/platform/content/modules`),
  platformCreateModule: (body: Partial<LearningModule>) =>
    request<LearningModule>(`/platform/content/modules`, { method: "POST", body: JSON.stringify(body) }),
  platformUpdateModule: (moduleId: string, body: Partial<LearningModule>) =>
    request<LearningModule>(`/platform/content/modules/${encodeURIComponent(moduleId)}`, { method: "PUT", body: JSON.stringify(body) }),
  platformDeleteModule: (moduleId: string) =>
    request<void>(`/platform/content/modules/${encodeURIComponent(moduleId)}`, { method: "DELETE" }),
  platformAddUnit: (moduleId: string, body: Partial<LearningUnit>) =>
    request<LearningUnit>(`/platform/content/modules/${encodeURIComponent(moduleId)}/units`, { method: "POST", body: JSON.stringify(body) }),
  platformUpdateUnit: (unitId: string, body: Partial<LearningUnit>) =>
    request<LearningUnit>(`/platform/content/units/${encodeURIComponent(unitId)}`, { method: "PUT", body: JSON.stringify(body) }),
  platformDeleteUnit: (unitId: string) =>
    request<void>(`/platform/content/units/${encodeURIComponent(unitId)}`, { method: "DELETE" }),
  workshopSession: (tenantId: string) =>
    request<WorkshopSession>(`/users/me/workshop?tenantId=${encodeURIComponent(tenantId)}`),
  knowledgeCheck: (tenantId: string, email: string, assignmentId?: string) =>
    request<KnowledgeCheck>(
      `/users/me/knowledge-check?tenantId=${encodeURIComponent(tenantId)}&email=${encodeURIComponent(email)}${assignmentId ? `&assignmentId=${encodeURIComponent(assignmentId)}` : ""}`,
    ),
  submitKnowledge: (
    tenantId: string,
    email: string,
    payload: { knowledgeCheckId: string; assignmentId?: string; answers: Record<string, unknown> },
  ) =>
    request<KnowledgeAttempt>(
      `/users/me/knowledge-check/attempts?tenantId=${encodeURIComponent(tenantId)}&email=${encodeURIComponent(email)}`,
      { method: "POST", body: JSON.stringify(payload) },
    ),
  adminUsers: (tenantId: string) =>
    request<AppUser[]>(`/admin/users?tenantId=${encodeURIComponent(tenantId)}`),
  saveAdminUser: (user: AppUser) =>
    request<AppUser>(user.id ? `/admin/users/${encodeURIComponent(user.id)}` : "/admin/users", {
      method: user.id ? "PUT" : "POST",
      body: JSON.stringify(user),
    }),
  adminAssignments: (tenantId: string) =>
    request<Assignment[]>(`/admin/assignments?tenantId=${encodeURIComponent(tenantId)}`),
  saveAdminAssignment: (assignment: Assignment) =>
    request<Assignment>(
      assignment.id ? `/admin/assignments/${encodeURIComponent(assignment.id)}` : "/admin/assignments",
      {
        method: assignment.id ? "PUT" : "POST",
        body: JSON.stringify(assignment),
      },
    ),
  readinessTemplates: (tenantId: string) =>
    request<ReadinessTemplate[]>(
      `/admin/readiness-templates?tenantId=${encodeURIComponent(tenantId)}`,
    ),
  saveReadinessTemplate: (template: ReadinessTemplate) =>
    request<ReadinessTemplate>(`/admin/readiness-templates`, {
      method: template.id ? "PUT" : "POST",
      body: JSON.stringify(template),
    }),
  completionRows: (tenantId: string) =>
    request<CompletionRow[]>(`/admin/completion?tenantId=${encodeURIComponent(tenantId)}`),
  markWorkshopComplete: (
    tenantId: string,
    payload: { userId: string; assignmentId: string; completedBy: string; notes?: string },
  ) =>
    request<CompletionRow>(`/admin/workshop-completions?tenantId=${encodeURIComponent(tenantId)}`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  generateCertificate: (
    tenantId: string,
    payload: { userId: string; assignmentId: string; generatedBy: string },
  ) =>
    request<CompletionRow>(`/admin/certificates/generate?tenantId=${encodeURIComponent(tenantId)}`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
