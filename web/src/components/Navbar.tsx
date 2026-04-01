import { useState } from "react";
import clsx from "clsx";
import { Icon } from "@iconify/react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "framer-motion";

import { PowerButton } from "./PowerButton";

type NavItem = {
  label: string;
  to: string;
  exact?: boolean;
};

const NAV_ITEMS: readonly NavItem[] = [
  { label: "Work", to: "/", exact: true },
  { label: "Blogs", to: "/blog" },
  { label: "Projects", to: "/projects" },
] as const;

const normalizePathname = (pathname: string) =>
  pathname === "/" ? pathname : pathname.replace(/\/+$/, "");

const matchesPath = (pathname: string, item: NavItem) => {
  const currentPath = normalizePathname(pathname);
  const targetPath = normalizePathname(item.to);

  if (item.exact) {
    return currentPath === targetPath;
  }

  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
};

const desktopLinkClass =
  "flex h-full min-w-[5.75rem] items-center justify-center border-y border-border px-4 border-r first:border-l [font-family:var(--font-nav)] text-[0.7rem] font-bold uppercase tracking-[0.24em] transition-colors duration-200";

export const Navbar = () => {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const shouldReduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const [isHidden, setIsHidden] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (current) => {
    const previous = scrollY.getPrevious();

    if (typeof previous !== "number" || isMenuOpen) {
      return;
    }

    if (current <= 12) {
      setIsHidden(false);
      return;
    }

    if (Math.abs(current - previous) < 2) {
      return;
    }

    setIsHidden(current > previous && current > 96);
  });

  return (
    <motion.header
      initial={shouldReduceMotion ? false : { opacity: 0, y: -18 }}
      animate={{
        opacity: 1,
        y: isHidden && !isMenuOpen ? -96 : 0,
      }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.28,
        ease: "easeOut",
      }}
      className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 lg:px-10"
    >
      <div className="page-shell w-full border border-border bg-bg/75 backdrop-blur-md">
        <div className="flex min-h-14 items-stretch justify-between">
          <Link
            to="/"
            className="flex items-center gap-3 border-r border-border px-4 text-sm font-semibold uppercase tracking-[0.18em] text-text transition-colors hover:bg-bg-secondary/60"
          >
            <span className="flex h-8 w-8 items-center justify-center border border-border bg-bg-card text-[0.72rem]">
              RG
            </span>
            <span className="hidden text-[0.72rem] sm:inline">Always curious</span>
          </Link>

          <div className="flex items-stretch">
            <nav aria-label="Primary" className="hidden h-full md:block">
              <motion.ul
                initial={shouldReduceMotion ? false : "hidden"}
                animate="visible"
                variants={{
                  hidden: {},
                  visible: {
                    transition: {
                      staggerChildren: 0.06,
                      delayChildren: 0.04,
                    },
                  },
                }}
                className="flex h-full items-stretch"
              >
                {NAV_ITEMS.map((item) => {
                  const isActive = matchesPath(pathname, item);

                  return (
                    <motion.li
                      key={item.to}
                      variants={{
                        hidden: { opacity: 0, y: 10 },
                        visible: { opacity: 1, y: 0 },
                      }}
                      className="h-full"
                    >
                      <Link
                        preload="intent"
                        to={item.to}
                        {...(item.to === "/blog"
                          ? { search: { q: "", sort: "newest" as const } }
                          : {})}
                        className={clsx(
                          desktopLinkClass,
                          isActive
                            ? "bg-bg-secondary text-text"
                            : "bg-transparent text-text-muted hover:bg-bg-secondary/50 hover:text-text",
                        )}
                      >
                        {item.label}
                      </Link>
                    </motion.li>
                  );
                })}
              </motion.ul>
            </nav>

            <div className="flex h-full items-stretch">
              <PowerButton />
              <button
                type="button"
                aria-expanded={isMenuOpen}
                aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                className="flex h-full min-w-12 items-center justify-center border-y border-r border-border px-3 text-lg text-text-muted transition-colors duration-200 hover:bg-bg-secondary/50 hover:text-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border md:hidden"
                onClick={() => setIsMenuOpen((current) => !current)}
              >
                <Icon icon={isMenuOpen ? "fa6-solid:xmark" : "fa6-solid:bars"} />
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isMenuOpen ? (
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: "easeOut" }}
              className="overflow-hidden border-t border-border md:hidden"
            >
              <nav aria-label="Mobile primary" className="grid gap-px bg-border">
                {NAV_ITEMS.map((item) => {
                  const isActive = matchesPath(pathname, item);

                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      {...(item.to === "/blog"
                        ? { search: { q: "", sort: "newest" as const } }
                        : {})}
                      onClick={() => setIsMenuOpen(false)}
                      className={clsx(
                        "flex items-center justify-between bg-bg px-4 py-4 text-sm font-semibold uppercase tracking-[0.2em] transition-colors",
                        isActive
                          ? "text-text"
                          : "text-text-muted hover:bg-bg-secondary hover:text-text",
                      )}
                    >
                      <span>{item.label}</span>
                      <Icon icon="fa6-solid:arrow-right-long" className="text-base" />
                    </Link>
                  );
                })}
              </nav>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};
