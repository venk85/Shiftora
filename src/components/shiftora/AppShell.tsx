import { Link, useRouterState, useNavigate, Outlet } from "@tanstack/react-router";
import { useApp, useActiveTenant, type AuthUser } from "@/lib/shiftora-store";
import {
  INDUSTRY_LABELS,
  ROLE_ACCENT,
  type AccentKey,
  type IndustryKey,
  type RoleKey,
} from "@/lib/shiftora-config";
import { cn } from "@/lib/utils";
import { adminVocabulary } from "@/lib/admin-vocabulary";
import { LANGUAGE_LABELS, type LanguageKey } from "@/lib/i18n";
import { useI18n } from "@/lib/use-i18n";
import { useEffect, useState, type ComponentType } from "react";
import {
  IconBuilding,
  IconUsers,
  IconChartBar,
  IconLayoutGrid,
  IconShieldCheck,
  IconBook,
  IconSettings,
  IconCalendarEvent,
  IconSparkles,
  IconClipboardList,
  IconClipboardCheck,
  IconHeartHandshake,
  IconActivity,
  IconWand,
  IconBrandHipchat,
  IconBolt,
  IconChevronDown,
  IconCheck,
  IconPlus,
  IconLogout,
  IconCrown,
  IconMap2,
  IconReportAnalytics,
  IconSchool,
} from "@tabler/icons-react";

const ROLE_DEFAULT: Record<RoleKey, string> = {
  platform: "/platform/tenants",
  admin: "/admin/overview",
  principal: "/principal/dashboard",
  hod: "/hod/dashboard",
  learner: "/learner/dashboard",
  beo: "/beo/overview",
  deo: "/deo/overview",
  diet: "/diet/overview",
};

type NavItem = { to: string; label: string; icon: ComponentType<{ className?: string }> };

const NAV: Record<RoleKey, NavItem[]> = {
  platform: [
    { to: "/platform/tenants", label: "Organizations", icon: IconBuilding },
    { to: "/platform/create", label: "Create organization", icon: IconWand },
    { to: "/platform/officers", label: "Education officers", icon: IconMap2 },
    { to: "/platform/content", label: "Content library", icon: IconBook },
  ],
  admin: [
    { to: "/admin/overview", label: "Overview", icon: IconLayoutGrid },
    { to: "/admin/people", label: "Teachers", icon: IconUsers },
    { to: "/admin/content", label: "Content library", icon: IconBook },
    { to: "/admin/readiness", label: "Readiness checks", icon: IconClipboardCheck },
    { to: "/admin/completion", label: "Workshop & certificates", icon: IconShieldCheck },
    { to: "/admin/config", label: "School config", icon: IconSettings },
  ],
  principal: [
    { to: "/principal/dashboard", label: "Executive dashboard", icon: IconChartBar },
    { to: "/principal/heatmap", label: "Department heatmap", icon: IconLayoutGrid },
    { to: "/principal/roi", label: "ROI & impact", icon: IconHeartHandshake },
  ],
  hod: [
    { to: "/hod/dashboard", label: "Department overview", icon: IconUsers },
    { to: "/hod/analytics", label: "Analytics", icon: IconActivity },
  ],
  learner: [
    { to: "/learner/assessment", label: "Readiness check", icon: IconShieldCheck },
    { to: "/learner/dashboard", label: "My journey", icon: IconBolt },
    { to: "/learner/learning", label: "Learning path", icon: IconBook },
    { to: "/learner/workshop", label: "Workshop", icon: IconCalendarEvent },
    { to: "/learner/sandbox", label: "AI Sandbox", icon: IconSparkles },
    { to: "/learner/practice", label: "Practice log", icon: IconClipboardList },
    { to: "/learner/check", label: "Knowledge check", icon: IconBrandHipchat },
  ],
  beo: [{ to: "/beo/overview", label: "Block overview", icon: IconMap2 }],
  deo: [{ to: "/deo/overview", label: "District overview", icon: IconReportAnalytics }],
  diet: [{ to: "/diet/overview", label: "Training batches", icon: IconSchool }],
};

const ROLE_LABELS: Record<RoleKey, string> = {
  platform: "Platform",
  admin: "School Admin",
  principal: "Principal",
  hod: "HOD",
  learner: "Teacher",
  beo: "BEO",
  deo: "DEO",
  diet: "DIET",
};

const BASE_ROLE_ORDER: RoleKey[] = ["admin", "principal", "hod", "learner"];
const EDUCATION_ROLE_ORDER: RoleKey[] = [
  "admin",
  "principal",
  "hod",
  "learner",
  "beo",
  "deo",
  "diet",
];

function requiredRoleForPath(pathname: string): RoleKey | null {
  const match = pathname.match(/^\/([^/]+)/);
  const area = match?.[1];
  if (!area) return null;
  if (
    area === "platform" ||
    area === "admin" ||
    area === "principal" ||
    area === "hod" ||
    area === "learner" ||
    area === "beo" ||
    area === "deo" ||
    area === "diet"
  ) {
    return area;
  }
  return null;
}

function canAccessPath(
  pathname: string,
  allowedRoles: RoleKey[],
  isSuper: boolean,
  tenantIndustry: IndustryKey,
) {
  const required = requiredRoleForPath(pathname);
  if (!required) return true;
  if (isSuper) {
    if (!allowedRoles.includes(required)) return false;
    if (["beo", "deo", "diet"].includes(required) && tenantIndustry !== "edu") return false;
    return true;
  }
  if (!allowedRoles.includes(required)) return false;
  if (["beo", "deo", "diet"].includes(required) && tenantIndustry !== "edu") return false;
  return true;
}

function effectiveAllowedRoles(user: AuthUser | null, tenantIndustry: IndustryKey): RoleKey[] {
  if (!user) return ["learner"];
  if (!user.isSuper) return [user.role];
  const superRoles: RoleKey[] = ["platform", ...(tenantIndustry === "edu" ? EDUCATION_ROLE_ORDER : BASE_ROLE_ORDER)];
  return superRoles.filter(
    (role) => tenantIndustry === "edu" || !["beo", "deo", "diet"].includes(role),
  );
}

function roleLabelFor(role: RoleKey, tenant: ReturnType<typeof useActiveTenant>) {
  const labelIdx: Partial<Record<RoleKey, number>> = {
    platform: 0,
    admin: 1,
    principal: 2,
    hod: 3,
    learner: 4,
  };
  const idx = labelIdx[role];
  return idx === undefined ? ROLE_LABELS[role] : tenant.roleLabels[idx];
}

function navItemsFor(role: RoleKey, tenant: ReturnType<typeof useActiveTenant>): NavItem[] {
  const items = NAV[role];
  if (role !== "admin") return items;
  const vocab = adminVocabulary(tenant.industry);
  return items.map((item) => {
    if (item.to === "/admin/people") return { ...item, label: vocab.peopleNav };
    if (item.to === "/admin/readiness") return { ...item, label: vocab.readinessNav };
    if (item.to === "/admin/completion") return { ...item, label: vocab.completionNav };
    if (item.to === "/admin/config") return { ...item, label: vocab.configTitle };
    return item;
  });
}

function translatedNavItems(items: NavItem[], t: ReturnType<typeof useI18n>["t"]): NavItem[] {
  return items.map((item) => {
    const label = {
      "Tenants": t("tenants"),
      "Configure tenant": t("configureTenant"),
      "Readiness check": t("readinessCheck"),
      "My journey": t("myJourney"),
      "Learning path": t("learningPath"),
      "Workshop": t("workshop"),
      "AI Sandbox": t("aiSandbox"),
      "Practice log": t("practiceLog"),
      "Knowledge check": t("knowledgeCheck"),
    }[item.label];
    return label ? { ...item, label } : item;
  });
}

function ShiftoraLogo() {
  return (
    <div className="flex items-center gap-2">
      <div
        className="size-7 rounded-lg grid place-items-center text-white font-bold text-[12px]"
        style={{
          background: "linear-gradient(135deg, #4069F0, #7C3AED)",
          boxShadow: "0 2px 8px rgba(64,105,240,.25)",
        }}
      >
        Sh
      </div>
      <div className="text-[15px] font-bold tracking-tight">
        Shiftora{" "}
        <span className="italic font-semibold" style={{ color: "var(--b)" }}>
          AI
        </span>
      </div>
    </div>
  );
}

function UserMenu() {
  const { currentUser, logout } = useApp();
  const { t } = useI18n();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  if (!currentUser) return null;
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-surface-3 transition-colors"
      >
        <div
          className="size-8 rounded-full grid place-items-center text-[11px] font-bold"
          style={{
            background: currentUser.isSuper
              ? "linear-gradient(135deg,#4069F0,#7C3AED)"
              : "var(--bl)",
            color: currentUser.isSuper ? "#fff" : "var(--bt)",
          }}
        >
          {currentUser.isSuper ? <IconCrown className="size-4" /> : currentUser.avatar}
        </div>
        <IconChevronDown className="size-3.5 text-text-subtle" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-[240px] rounded-[12px] bg-white border border-border shadow-card-hover z-40 overflow-hidden">
            <div className="px-3 py-3 border-b border-border">
              <div className="text-[12.5px] font-semibold truncate">{currentUser.name}</div>
              <div className="text-[11px] text-text-muted truncate">{currentUser.email}</div>
              {currentUser.isSuper && (
                <div
                  className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: "var(--vil)", color: "var(--vi)" }}
                >
                  <IconCrown className="size-3" /> {t("superUser")}
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setOpen(false);
                logout();
                nav({ to: "/login" });
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-[12.5px] hover:bg-surface-3 text-left"
            >
              <IconLogout className="size-4" /> {t("logout")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function TenantSwitcher() {
  const { tenants, activeTenantId, setActiveTenant, setRole } = useApp();
  const active = tenants.find((t) => t.id === activeTenantId) ?? tenants[0];
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold bg-white border border-border shadow-card hover:shadow-card-hover transition-shadow"
      >
        <span>{INDUSTRY_LABELS[active.industry].emoji}</span>
        <span className="text-text">{active.name}</span>
        <IconChevronDown className="size-3.5 text-text-subtle" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-[280px] rounded-[12px] bg-white border border-border shadow-card-hover z-40 overflow-hidden">
            <div className="max-h-[360px] overflow-y-auto p-1">
              {(["edu", "bfsi", "gcc", "health"] as IndustryKey[]).map((ind) => {
                const list = tenants.filter((t) => t.industry === ind);
                if (!list.length) return null;
                return (
                  <div key={ind} className="py-1">
                    <div className="section-label px-3 pb-1">
                      {INDUSTRY_LABELS[ind].emoji} {INDUSTRY_LABELS[ind].label}
                    </div>
                    {list.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setActiveTenant(t.id);
                          setOpen(false);
                        }}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md hover:bg-surface-3 text-left"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="size-8 shrink-0 overflow-hidden rounded-md bg-surface-3 grid place-items-center text-[10px] font-bold text-text-muted">
                            {t.schoolPhotoDataUrl ? <img src={t.schoolPhotoDataUrl} alt={t.name} className="h-full w-full object-cover" /> : t.abbr}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[12px] font-semibold text-text truncate">
                              {t.name}
                            </div>
                            <div className="text-[11px] text-text-muted truncate">
                              {t.industry === "edu" && t.board ? t.board : t.type} · {t.size.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        {t.id === active.id && (
                          <IconCheck className="size-4 text-primary shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
            <div className="border-t border-border p-2">
              <button
                onClick={() => {
                  setOpen(false);
                  setRole("platform");
                  nav({ to: "/platform/create" });
                }}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-[12px] font-semibold bg-primary-soft text-primary-strong hover:bg-[color:var(--bb)]"
              >
                <IconPlus className="size-4" /> Add new tenant
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function LanguageSwitcher() {
  const { language, enabledLanguages, setLanguage } = useApp();
  const [open, setOpen] = useState(false);
  if (enabledLanguages.length <= 1) return null;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-[12px] font-semibold hover:bg-surface-3"
      >
        {LANGUAGE_LABELS[language]}
        <IconChevronDown className="size-3.5 text-text-subtle" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 min-w-[150px] rounded-[10px] border border-border bg-white shadow-card-hover z-40 p-1">
            {enabledLanguages.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setLanguage(item);
                  setOpen(false);
                }}
                className="w-full flex items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-[12px] font-semibold hover:bg-surface-3"
              >
                <span>{LANGUAGE_LABELS[item]}</span>
                {item === language && <IconCheck className="size-3.5 text-primary" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Topbar() {
  const { currentUser, role } = useApp();
  const canSwitchTenant = currentUser?.isSuper && role !== "platform";
  const showLanguageSwitcher = !(currentUser?.isSuper && role === "platform");
  return (
    <div
      className="h-[52px] bg-surface border-b border-border flex items-center justify-between px-5 gap-3 sticky top-0 z-20"
      style={{ boxShadow: "0 1px 0 rgba(15,23,42,.04)" }}
    >
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <ShiftoraLogo />
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {canSwitchTenant && <TenantSwitcher />}
        {showLanguageSwitcher && <LanguageSwitcher />}
        <UserMenu />
      </div>
    </div>
  );
}

function Sidebar() {
  const { role, currentUser } = useApp();
  const tenant = useActiveTenant();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useI18n();
  const baseItems = translatedNavItems(navItemsFor(role, tenant), t);
  // For super users on a non-platform role, surface a top-level link back to Platform.
  const items =
    currentUser?.isSuper && role !== "platform"
      ? [{ to: "/platform/tenants", label: "Platform console", icon: IconCrown }, ...baseItems]
      : baseItems;
  const accent = ROLE_ACCENT[role];
  const accentColors: Record<AccentKey, string> = {
    blue: "var(--b)",
    gold: "var(--g)",
    teal: "var(--tl)",
    violet: "var(--vi)",
  };
  const accentColor = accentColors[accent];

  return (
    <aside className="w-[208px] shrink-0 bg-surface border-r border-border flex flex-col min-h-[calc(100vh-52px)] sticky top-[52px] self-start">
      <div className="px-3 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div
            className="size-9 rounded-md grid place-items-center text-white font-bold text-[12px] shrink-0 overflow-hidden"
            style={{ background: accentColor }}
          >
            {role === "platform" ? <IconCrown className="size-4" /> : tenant.schoolPhotoDataUrl ? <img src={tenant.schoolPhotoDataUrl} alt={tenant.name} className="h-full w-full object-cover" /> : tenant.abbr}
          </div>
          <div className="min-w-0">
            <div className="text-[12px] font-semibold text-text truncate">
              {role === "platform" ? "Platform Console" : tenant.name}
            </div>
            <div className="text-[10px] text-text-muted truncate">
              {role === "platform" ? "Multi-sector control" : tenant.industry === "edu" && tenant.board ? tenant.board : tenant.type}
            </div>
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        <div className="section-label px-2 pb-1.5 pt-1">
          {role === "platform" ? "Super Admin" : `${roleLabelFor(role, tenant)} ${t("adminWorkspace")}`}
        </div>
        {items.map((it) => {
          const active = pathname === it.to;
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2 text-[12.5px] rounded-[7px] transition-colors",
                active ? "font-semibold" : "text-text-muted hover:bg-surface-3 hover:text-text",
              )}
              style={active ? { background: "var(--bl)", color: "var(--bt)" } : undefined}
            >
              <Icon className="size-[15px] shrink-0" />
              <span className="truncate">{it.label}</span>
            </Link>
          );
        })}
      </nav>
      {role !== "platform" && (
        <div className="px-3 py-3 border-t border-border">
          <div className="section-label mb-1.5">{t("aiAdoption")}</div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-text">{tenant.aiName}</span>
            <span className="text-[11px] font-bold" style={{ color: accentColor }}>
              {tenant.adoption}%
            </span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${tenant.adoption}%` }} />
          </div>
        </div>
      )}
    </aside>
  );
}

export function AppShell() {
  const currentUser = useApp((s) => s.currentUser);
  const role = useApp((s) => s.role);
  const setRole = useApp((s) => s.setRole);
  const loadFromBackend = useApp((s) => s.loadFromBackend);
  const tenant = useActiveTenant();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const nav = useNavigate();
  const isLoginRoute = pathname === "/login";

  // Hydration-safe auth gate: only redirect after mount so SSR HTML matches client.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated && currentUser) {
      void loadFromBackend();
    }
  }, [currentUser, hydrated, loadFromBackend]);
  useEffect(() => {
    if (hydrated && !currentUser && !isLoginRoute) {
      nav({ to: "/login" });
    }
  }, [hydrated, currentUser, isLoginRoute, nav]);
  useEffect(() => {
    if (!hydrated || !currentUser || isLoginRoute) return;

    const allowedRoles = effectiveAllowedRoles(currentUser, tenant.industry);
    const requiredRole = requiredRoleForPath(pathname);
    if (currentUser.isSuper && requiredRole && role !== requiredRole) {
      setRole(requiredRole);
      return;
    }
    if (!allowedRoles.includes(role)) {
      const fallbackRole = allowedRoles[0] ?? "learner";
      setRole(fallbackRole);
      nav({ to: ROLE_DEFAULT[fallbackRole] });
      return;
    }

    if (!canAccessPath(pathname, allowedRoles, currentUser.isSuper, tenant.industry)) {
      nav({ to: ROLE_DEFAULT[role] });
    }
  }, [hydrated, currentUser, isLoginRoute, nav, pathname, role, setRole, tenant.industry]);

  if (isLoginRoute) return <Outlet />;
  if (!currentUser) {
    // Render a neutral placeholder until the redirect lands; avoids flashing protected UI.
    return <div className="min-h-screen bg-bg" />;
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Topbar />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-x-hidden p-6 lg:px-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
