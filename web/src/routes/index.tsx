import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    // TODO: Balanced use of black and white on the homepage
    // TODO: Light almost invisible borders
    // Slate gray light outlines
    // TODO: Gradient home screen starting from black to white
    // TODO: Hero Section:
    // Heading: I am Rakshit Gumber: sans and bold font- montserrat- white color
    // SubHeading: Always Curious: handwriting font: accent color
    // Side photo: black and white the new one but clear with AI.
    // TODO: Currently Working on Section
    // Main Highlight Project
    // TODO: Selected Work
    // Display all the top 4 projects on the page
    // background can be light theme in this section.
    // TODO: I wrote about
    // TODO: Few Kind Words
    // TODO: Contact
    // TODO: Footer
    // left: bright text - Caffeine overdose did this.
    // Right: Github Link.
    // TODO: Add trail effect for mouse
    // TODO: Add borders for all the sections.

    <div className="flex">
      <Navbar />
      <Hero />
    </div>
  );
}
