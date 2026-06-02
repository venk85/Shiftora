import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/diet/")({
  beforeLoad: () => {
    throw redirect({ to: "/diet/overview" });
  },
});
