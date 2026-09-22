import { createFileRoute } from "@tanstack/react-router";
import { HeadspaceApp } from "@/components/headspace-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <HeadspaceApp />;
}
