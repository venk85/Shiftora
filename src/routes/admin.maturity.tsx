import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/maturity")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/overview" });
  },
});
