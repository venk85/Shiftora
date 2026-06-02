import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/deo/")({
  beforeLoad: () => {
    throw redirect({ to: "/deo/overview" });
  },
});
