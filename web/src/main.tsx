import { StrictMode } from "react";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { createRoot } from "react-dom/client";

import "./main.css";

import { routeTree } from "./routeTree.gen";

const router = createRouter({ routeTree });

import { lenis } from "@/libs/SmoothScroll";
import { ThemeProvider } from "./providers/ThemeProvider";

function raf(time: any) {
  lenis.raf(time);

  requestAnimationFrame(raf);
}

requestAnimationFrame(raf);

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Render the app
const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <ThemeProvider defaultTheme="dark" storageKey="ui-theme">
        <RouterProvider router={router} />
      </ThemeProvider>
    </StrictMode>,
  );
}
