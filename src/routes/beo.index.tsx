import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/beo/")({
  beforeLoad: () => {
    throw redirect({ to: "/beo/overview" });
  },
});
