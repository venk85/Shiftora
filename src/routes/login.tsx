import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { useApp } from "@/lib/shiftora-store";
import { type RoleKey } from "@/lib/shiftora-config";
import { shiftoraApi } from "@/lib/shiftora-api";
import { useI18n } from "@/lib/use-i18n";
import { Btn, Chip } from "@/components/shiftora/primitives";
import { IconShieldLock, IconSparkles, IconSchool } from "@tabler/icons-react";

export const Route = createFileRoute("/login")({ component: LoginPage });

const destinationForRole = (role: RoleKey) => {
  if (role === "platform") return "/platform/tenants";
  if (role === "admin") return "/admin/overview";
  if (role === "principal") return "/principal/dashboard";
  if (role === "hod") return "/hod/dashboard";
  if (role === "beo") return "/beo/overview";
  if (role === "deo") return "/deo/overview";
  if (role === "diet") return "/diet/overview";
  return "/learner/dashboard";
};

function LoginPage() {
  const { currentUser, login, loadFromBackend } = useApp();
  const { t } = useI18n();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busyEmail, setBusyEmail] = useState<string | null>(null);

  if (currentUser) return <Navigate to={destinationForRole(currentUser.role)} />;

  const authenticate = async (accountEmail: string, accountPassword: string) => {
    setError("");
    setBusyEmail(accountEmail);
    try {
      const response = await shiftoraApi.login(accountEmail, accountPassword);
      login(response.user, response.token, response.expiresAt);
      await loadFromBackend();
      nav({ to: destinationForRole(response.user.role) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in. Please try again.");
    } finally {
      setBusyEmail(null);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    void authenticate(email.trim(), password);
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-[1.05fr_1fr] bg-bg">
      {/* Brand panel */}
      <div
        className="hidden lg:flex flex-col justify-between p-10 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #4069F0 0%, #7C3AED 100%)" }}
      >
        <div className="flex items-center gap-2">
          <div className="size-9 rounded-lg grid place-items-center bg-white/15 backdrop-blur font-bold">
            Sh
          </div>
          <div className="text-[16px] font-bold tracking-tight">
            Shiftora <span className="italic font-semibold opacity-90">AI</span>
          </div>
        </div>
        <div className="relative z-10">
          <Chip tone="violet" className="!bg-white/15 !text-white !border-white/20">
            <IconSparkles className="size-3" /> {t("brandTagline")}
          </Chip>
          <h1 className="text-[34px] leading-[1.1] font-extrabold tracking-tight mt-4 max-w-[460px]">
            Move every team from <span className="italic">AI-curious</span> to{" "}
            <span className="italic">AI-fluent</span>.
          </h1>
          <p className="text-[13px] opacity-90 mt-3 max-w-[460px]">
            Sign in with your assigned platform or organisation account.
          </p>
          <div className="grid grid-cols-2 gap-3 mt-6 max-w-[460px]">
            {["Education", "BFSI", "GCC / IT", "Healthcare"].map((label) => (
              <div key={label} className="rounded-[10px] bg-white/10 backdrop-blur px-3 py-2.5 border border-white/10">
                <IconSchool className="size-5" />
                <div className="text-[12px] font-semibold">{label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-[11px] opacity-75 relative z-10">
          © Shiftora
        </div>
        <div
          className="absolute -right-32 -bottom-32 size-[420px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,.18), transparent 60%)" }}
        />
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-[420px]">
          <div className="flex items-center gap-2 lg:hidden mb-6">
            <div
              className="size-8 rounded-lg grid place-items-center text-white font-bold text-[12px]"
              style={{ background: "linear-gradient(135deg, #4069F0, #7C3AED)" }}
            >
              Sh
            </div>
            <div className="text-[15px] font-bold tracking-tight">Shiftora AI</div>
          </div>
          <h2 className="text-[22px] font-bold tracking-tight">{t("signIn")}</h2>
          <p className="text-[12.5px] text-text-muted mt-1">
            Use your organisation credentials.
          </p>

          <form onSubmit={submit} className="mt-5 space-y-3">
            <div>
              <label className="block text-[11.5px] font-semibold text-text-muted mb-1">
                Work email
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@organisation.com"
                className="w-full rounded-[8px] border border-border bg-white px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-text-muted mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full rounded-[8px] border border-border bg-white px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {error && (
              <div className="text-[12px] text-[color:var(--er)] bg-[color:var(--erl)] border border-[color:var(--erl)] rounded-md px-3 py-2">
                {error}
              </div>
            )}
            <Btn type="submit" className="w-full justify-center" disabled={busyEmail !== null}>
              <IconShieldLock className="size-4" /> {busyEmail === email.trim() ? "Signing in..." : "Sign in"}
            </Btn>
          </form>
        </div>
      </div>
    </div>
  );
}
