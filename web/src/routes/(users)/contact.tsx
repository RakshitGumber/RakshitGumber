import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(users)/contact")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div></div>;
}
