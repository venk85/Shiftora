import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/learner/")({ beforeLoad: () => { throw redirect({ to: "/learner/dashboard" }); } });
