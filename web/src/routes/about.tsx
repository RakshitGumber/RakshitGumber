import { Navbar } from "@/components/Navbar";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <Navbar />
      Hello "/about"!
    </div>
  );
}
