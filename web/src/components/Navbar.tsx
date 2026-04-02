import { useEffect, useEffectEvent, useRef, useState } from "react";
import clsx from "clsx";
import { Icon } from "@iconify/react";
import { Link, useMatchRoute } from "@tanstack/react-router";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "framer-motion";

import { useTheme } from "@/providers/ThemeProvider";

type NavItem = {
  label: string;
  to: string;
  exact?: boolean;
};

const parentVariants = {
  visible: { opacity: 1, y: 0 },
  hidden: { opacity: 0, y: "-4rem" },
};

const NAV_ITEMS: readonly NavItem[] = [
  { label: "Work", to: "/", exact: true },
  { label: "Blogs", to: "/blog" },
  { label: "Projects", to: "/projects" },
] as const;

export const Navbar = () => {
  const matchRoute = useMatchRoute();
  const { theme, setTheme } = useTheme();
  // Mobile menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Navbar Position
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [prevScroll, setPrevScroll] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useEffectEvent((event: PointerEvent) => {
    const target = event.target;

    if (
      target instanceof Node &&
      containerRef.current &&
      !containerRef.current.contains(target)
    ) {
      setIsMenuOpen(false);
    }
  });

  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      setIsMenuOpen(false);
    }
  });

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  useMotionValueEvent(scrollY, "change", (latest: number) => {
    if (isMenuOpen) {
      setIsMenuOpen(false);
      setHidden(false);
      setPrevScroll(latest);
      return;
    }

    if (latest < prevScroll) {
      setHidden(false);
    } else if (latest > 100 && latest > prevScroll) {
      setHidden(true);
    }

    setPrevScroll(latest);
  });

  return (
    <motion.header
      className="fixed top-0 z-50 w-full py-2 backdrop-blur-3xl bg-[color-mix(in_srgb,var(--bg-dark)_63%,transparent)]"
      animate={hidden ? "hidden" : "visible"}
      variants={parentVariants}
      transition={{
        ease: [0.1, 0.25, 0.3, 1],
        duration: 0.6,
      }}
    >
      <div className="flex min-h-15 items-stretch justify-between px-4 sm:px-0">
        <div className="flex items-center px-3 md:px-0">
          <span
            style={{ fontFamily: '"Montserrat", var(--font-body)' }}
            className="text-lg font-bold tracking-wider text-text"
          >
            Rakshit Gumber
          </span>
        </div>

        <div className="flex items-stretch">
          <nav aria-label="Primary" className="hidden h-full md:block">
            <ul className="flex h-full items-stretch">
              {NAV_ITEMS.map((item) => {
                const isActive = Boolean(
                  matchRoute({
                    to: item.to,
                    fuzzy: !item.exact,
                  }),
                );

                return (
                  <li key={item.to} className="h-full">
                    <Link
                      preload="intent"
                      to={item.to}
                      className={clsx(
                        "flex h-full min-w-23 items-center justify-center px-4 [font-family:var(--font-nav)] text-[0.7rem] font-semibold uppercase tracking-[0.24em] transition-colors duration-200",
                        isActive
                          ? "font-bold text-text-invert underline decoration-current decoration-1 underline-offset-[0.2rem]"
                          : "bg-transparent text-text-invert/68 hover:bg-white/8 hover:text-text-invert",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex h-full items-stretch gap-0.5 p-0.5">
            <button
              type="button"
              aria-label={
                theme === "dark"
                  ? "Switch to light theme"
                  : "Switch to dark theme"
              }
              className="flex h-full w-10 shrink-0 items-center justify-center p-0 text-[1.05rem] text-text-muted transition-colors duration-200 hover:bg-white/8 hover:text-text-invert focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <motion.span
                animate={{
                  rotate: theme === "dark" ? 0 : 180,
                  scale: theme === "dark" ? 1 : 1.08,
                }}
                transition={{
                  duration: 0.22,
                  ease: "easeOut",
                }}
              >
                <Icon
                  icon={
                    theme === "dark"
                      ? "material-symbols:light-mode-outline-rounded"
                      : "material-symbols:dark-mode-outline-rounded"
                  }
                />
              </motion.span>
            </button>

            <button
              type="button"
              aria-expanded={isMenuOpen}
              aria-label={
                isMenuOpen ? "Close navigation menu" : "Open navigation menu"
              }
              className="flex h-full w-10 shrink-0 items-center justify-center p-0 text-[1.05rem] text-text-muted transition-colors duration-200 hover:bg-white/8 hover:text-text-invert focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20 md:hidden"
              onClick={() => setIsMenuOpen((current) => !current)}
            >
              <motion.span
                animate={{
                  rotate: isMenuOpen ? 90 : 0,
                  scale: isMenuOpen ? 1.06 : 1,
                }}
                transition={{
                  duration: 0.22,
                  ease: "easeOut",
                }}
              >
                <Icon
                  icon={
                    isMenuOpen
                      ? "material-symbols:close-rounded"
                      : "material-symbols:menu-rounded"
                  }
                />
              </motion.span>
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{
              duration: 0.2,
              ease: "easeOut",
            }}
            className="overflow-hidden md:hidden"
          >
            <nav
              aria-label="Mobile primary"
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--bg-dark) 82%, transparent)",
              }}
              className="grid backdrop-blur-2xl"
            >
              {NAV_ITEMS.map((item) => {
                const isActive = Boolean(
                  matchRoute({
                    to: item.to,
                    fuzzy: !item.exact,
                  }),
                );

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsMenuOpen(false)}
                    className={clsx(
                      "flex items-center px-7 py-4 text-[0.82rem] font-semibold uppercase tracking-[0.18em] transition-colors",
                      isActive
                        ? "font-bold text-text-invert underline decoration-current decoration-1 underline-offset-[0.2rem]"
                        : "text-text-invert/72 hover:bg-white/6 hover:text-text-invert",
                    )}
                  >
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.header>
  );
};
