import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  type RoleKey,
  type Tenant,
  type Subdivision,
  newTenantId,
} from "./shiftora-config";
import { nanoid } from "nanoid";
import { shiftoraApi } from "./shiftora-api";
import type { LanguageKey } from "./i18n";

const DEFAULT_ENABLED_LANGUAGES: LanguageKey[] = ["en", "ta"];
const LANGUAGE_ORDER: LanguageKey[] = ["en", "ta", "hi"];
const LEGACY_STORE_KEYS = ["shiftora-store-v1"];
const EMPTY_TENANT: Tenant = {
  id: "",
  name: "No organisation selected",
  abbr: "--",
  type: "No organisation",
  size: 0,
  industry: "edu",
  aiName: "AI",
  subdivisionNoun: "Units",
  subdivisions: [],
  roleLabels: ["Platform", "Admin", "Executive", "Lead", "Learner"],
  personas: {
    admin: { name: "", title: "Admin", avatar: "--" },
    principal: { name: "", title: "Executive", avatar: "--" },
    hod: { name: "", title: "Lead", avatar: "--" },
    learner: { name: "", title: "Learner", avatar: "--" },
  },
  brandColor: "#4069F0",
  maturity: 0,
  adoption: 0,
  aiInstruction: "",
  createdAt: 0,
};

if (typeof window !== "undefined") {
  for (const key of LEGACY_STORE_KEYS) {
    window.localStorage.removeItem(key);
  }
}

function normalizeLanguages(languages?: LanguageKey[]) {
  const allowed = new Set<LanguageKey>(["en", ...(languages ?? DEFAULT_ENABLED_LANGUAGES)]);
  return LANGUAGE_ORDER.filter((language) => allowed.has(language));
}

function normalizeLanguageStrings(languages?: string[]) {
  return normalizeLanguages((languages ?? []).filter((item): item is LanguageKey =>
    LANGUAGE_ORDER.includes(item as LanguageKey),
  ));
}

export type PracticeEntry = {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  tenantId: string;
  inputs: Record<string, string>;
  output: string;
  scores: { label: string; value: number }[];
  createdAt: number;
};

export type AuthUser = {
  email: string;
  name: string;
  avatar: string;
  role: RoleKey;
  tenantId: string | null; // null for super users
  isSuper: boolean;
  allowedRoles: RoleKey[]; // roles this user can switch into
};

type Store = {
  role: RoleKey;
  activeTenantId: string;
  tenants: Tenant[];
  practiceLog: PracticeEntry[];
  currentUser: AuthUser | null;
  authToken: string | null;
  authExpiresAt: number | null;
  backendReady: boolean;
  tenantLoadStatus: "idle" | "loading" | "ready" | "error";
  tenantLoadError: string | null;
  language: LanguageKey;
  enabledLanguages: LanguageKey[];
  loadFromBackend: () => Promise<void>;
  setLanguage: (language: LanguageKey) => void;
  setEnabledLanguages: (languages: LanguageKey[]) => void;
  setRole: (r: RoleKey) => void;
  setActiveTenant: (id: string) => void;
  addTenant: (t: Omit<Tenant, "id" | "createdAt">) => string;
  updateTenant: (id: string, patch: Partial<Tenant>) => void;
  deleteTenant: (id: string) => void;
  addSubdivision: (tenantId: string, name: string, hod: string) => void;
  updateSubdivision: (tenantId: string, subId: string, patch: Partial<Subdivision>) => void;
  removeSubdivision: (tenantId: string, subId: string) => void;
  addPractice: (e: Omit<PracticeEntry, "id" | "createdAt">) => void;
  login: (user: AuthUser, token: string, expiresAt: number) => void;
  logout: () => void;
  resetDemo: () => void;
};

function persistTenantSnapshot(tenant: Tenant, context: string) {
  void shiftoraApi
    .updateTenant(tenant)
    .then((saved) =>
      useApp.setState((state) => ({
        tenants: state.tenants.map((t) => (t.id === tenant.id ? saved : t)),
        backendReady: true,
      })),
    )
    .catch((error) => console.warn(`Failed to persist ${context}`, error));
}

export const useApp = create<Store>()(
  persist(
    (set, get) => ({
      role: "learner",
      activeTenantId: "",
      tenants: [],
      practiceLog: [],
      currentUser: null,
      authToken: null,
      authExpiresAt: null,
      backendReady: false,
      tenantLoadStatus: "idle",
      tenantLoadError: null,
      language: "en",
      enabledLanguages: DEFAULT_ENABLED_LANGUAGES,
      loadFromBackend: async () => {
        set({ tenantLoadStatus: "loading", tenantLoadError: null });
        try {
          const [tenants, settings] = await Promise.all([
            shiftoraApi.tenants(),
            shiftoraApi.platformSettings(),
          ]);
          const enabledLanguages = normalizeLanguageStrings(settings.enabledLanguages);
          const activeLanguage = enabledLanguages.includes(settings.activeLanguage as LanguageKey)
            ? (settings.activeLanguage as LanguageKey)
            : "en";
          set((s) => ({
            tenants,
            activeTenantId: tenants.some((t) => t.id === s.activeTenantId)
              ? s.activeTenantId
              : (tenants[0]?.id ?? ""),
            backendReady: true,
            tenantLoadStatus: "ready",
            tenantLoadError: null,
            enabledLanguages,
            language: enabledLanguages.includes(s.language) ? s.language : activeLanguage,
          }));
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unable to load tenants";
          console.warn("Shiftora API unavailable; tenant data requires the backend DB", error);
          set({ tenants: [], backendReady: false, tenantLoadStatus: "error", tenantLoadError: message });
        }
      },
      setRole: (role) => set({ role }),
      setLanguage: (language) =>
        set((s) => ({
          language: s.enabledLanguages.includes(language) ? language : s.language,
        })),
      setEnabledLanguages: (languages) =>
        set((s) => {
          const unique = normalizeLanguages(languages);
          const nextLanguage = unique.includes(s.language) ? s.language : "en";
          void shiftoraApi
            .updatePlatformSettings({ enabledLanguages: unique, activeLanguage: nextLanguage })
            .catch((error) => console.warn("Failed to persist language settings", error));
          return {
            enabledLanguages: unique,
            language: nextLanguage,
          };
        }),
      setActiveTenant: (id) => set({ activeTenantId: id }),

      addTenant: (t) => {
        const id = newTenantId();
        const tenant: Tenant = { ...t, id, createdAt: Date.now() };
        set((s) => ({ tenants: [...s.tenants, tenant], activeTenantId: id }));
        void shiftoraApi
          .createTenant(tenant)
          .then((saved) =>
            set((s) => ({
              tenants: s.tenants.map((existing) => (existing.id === id ? saved : existing)),
              activeTenantId: saved.id,
              backendReady: true,
            })),
          )
          .catch((error) => console.warn("Failed to persist tenant", error));
        return id;
      },
      updateTenant: (id, patch) =>
        set((s) => {
          const tenants = s.tenants.map((t) => (t.id === id ? { ...t, ...patch } : t));
          const updated = tenants.find((t) => t.id === id);
          if (updated) {
            void shiftoraApi
              .updateTenant(updated)
              .then((saved) =>
                set((state) => ({
                  tenants: state.tenants.map((t) => (t.id === id ? saved : t)),
                  backendReady: true,
                })),
              )
              .catch((error) => console.warn("Failed to persist tenant update", error));
          }
          return { tenants };
        }),
      deleteTenant: (id) =>
        set((s) => {
          const tenants = s.tenants.filter((t) => t.id !== id);
          const activeTenantId =
            s.activeTenantId === id ? (tenants[0]?.id ?? "") : s.activeTenantId;
          void shiftoraApi
            .deleteTenant(id)
            .catch((error) => console.warn("Failed to delete tenant", error));
          return { tenants, activeTenantId };
        }),
      addSubdivision: (tenantId, name, hod) =>
        set((s) => {
          let updatedTenant: Tenant | undefined;
          const tenants = s.tenants.map((t) => {
            if (t.id !== tenantId) return t;
            updatedTenant = {
              ...t,
              subdivisions: [
                ...t.subdivisions,
                { id: nanoid(8), name, hod, maturity: 30, adoption: 22, staff: 8 },
              ],
            };
            return updatedTenant;
          });
          if (updatedTenant) persistTenantSnapshot(updatedTenant, "subdivision create");
          return { tenants };
        }),
      updateSubdivision: (tenantId, subId, patch) =>
        set((s) => {
          let updatedTenant: Tenant | undefined;
          const tenants = s.tenants.map((t) => {
            if (t.id !== tenantId) return t;
            updatedTenant = {
              ...t,
              subdivisions: t.subdivisions.map((sd) =>
                sd.id === subId ? { ...sd, ...patch } : sd,
              ),
            };
            return updatedTenant;
          });
          if (updatedTenant) persistTenantSnapshot(updatedTenant, "subdivision update");
          return { tenants };
        }),
      removeSubdivision: (tenantId, subId) =>
        set((s) => {
          let updatedTenant: Tenant | undefined;
          const tenants = s.tenants.map((t) => {
            if (t.id !== tenantId) return t;
            updatedTenant = {
              ...t,
              subdivisions: t.subdivisions.filter((sd) => sd.id !== subId),
            };
            return updatedTenant;
          });
          if (updatedTenant) persistTenantSnapshot(updatedTenant, "subdivision delete");
          return { tenants };
        }),
      addPractice: (e) =>
        set((s) => {
          const local = { ...e, id: nanoid(8), createdAt: Date.now() };
          void shiftoraApi
            .createPractice(e)
            .then((saved) =>
              set((state) => ({
                practiceLog: state.practiceLog.map((entry) =>
                  entry.id === local.id ? saved : entry,
                ),
                backendReady: true,
              })),
            )
            .catch((error) => console.warn("Failed to persist practice entry", error));
          return { practiceLog: [local, ...s.practiceLog].slice(0, 50) };
        }),
      login: (user, token, expiresAt) =>
        set(() => ({
          currentUser: user,
          authToken: token,
          authExpiresAt: expiresAt,
          role: user.role,
          activeTenantId: user.tenantId ?? get().activeTenantId,
        })),
      logout: () => set({ currentUser: null, authToken: null, authExpiresAt: null }),
      resetDemo: () =>
        set({
          tenants: [],
          activeTenantId: "",
          practiceLog: [],
          role: "learner",
          currentUser: null,
          authToken: null,
          authExpiresAt: null,
          backendReady: false,
          tenantLoadStatus: "idle",
          tenantLoadError: null,
        }),
    }),
    {
      name: "shiftora-store-db-v1",
      version: 1,
      migrate: (persisted) => {
        const state = persisted as Partial<Store>;
        const enabledLanguages = normalizeLanguages(state.enabledLanguages);
        return {
          ...state,
          tenants: [],
          activeTenantId: "",
          backendReady: false,
          tenantLoadStatus: "idle",
          tenantLoadError: null,
          enabledLanguages,
          language: state.language && enabledLanguages.includes(state.language) ? state.language : "en",
        };
      },
      partialize: (state) => ({
        role: state.role,
        practiceLog: state.practiceLog,
        currentUser: state.currentUser,
        authToken: state.authToken,
        authExpiresAt: state.authExpiresAt,
        language: state.language,
        enabledLanguages: state.enabledLanguages,
      }),
    },
  ),
);

export function useActiveTenant(): Tenant {
  const id = useApp((s) => s.activeTenantId);
  const tenants = useApp((s) => s.tenants);
  return tenants.find((t) => t.id === id) ?? tenants[0] ?? EMPTY_TENANT;
}
