import clsx from "clsx";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "framer-motion";
import { PowerButton } from "./PowerButton";
import { useState } from "react";

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

const matchesPath = (
  pathname: string,
  item: NavItem,
) => {
  const currentPath = normalizePathname(pathname);
  const targetPath = normalizePathname(item.to);

  if (item.exact) {
    return currentPath === targetPath;
  }

  return (
    currentPath === targetPath || currentPath.startsWith(`${targetPath}/`)
  );
};

type NavbarLinkProps = {
  isActive: boolean;
  label: string;
  to: string;
};

const NavbarLink = ({ isActive, label, to }: NavbarLinkProps) => {
  return (
    <motion.li
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
      }}
      className="h-full"
    >
      <Link
        preload="intent"
        to={to}
        className={clsx(
          "flex h-9 min-w-[5.5rem] items-center justify-center border border-border px-3",
          "[font-family:var(--font-nav)] text-[0.7rem] font-bold uppercase tracking-[0.24em] transition-colors duration-200",
          isActive
            ? "bg-bg-secondary text-text"
            : "bg-transparent text-text-muted hover:bg-bg-secondary/50 hover:text-text",
        )}
      >
        {label}
      </Link>
    </motion.li>
  );
};

export const Navbar = () => {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const shouldReduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const [isHidden, setIsHidden] = useState(false);

  useMotionValueEvent(scrollY, "change", (current) => {
    const previous = scrollY.getPrevious();

    if (typeof previous !== "number") {
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
        y: isHidden ? -96 : 0,
      }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.28,
        ease: "easeOut",
      }}
      className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-8 lg:px-[100px]"
    >
      <div className="border border-border bg-bg/70 backdrop-blur-md">
        <div className="flex min-h-14 items-center justify-end px-3">
          <div className="flex items-center gap-2 py-2">
            <nav aria-label="Primary" className="h-full">
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
                className="flex items-center gap-2"
              >
                {NAV_ITEMS.map((item) => (
                  <NavbarLink
                    key={item.to}
                    isActive={matchesPath(pathname, item)}
                    label={item.label}
                    to={item.to}
                  />
                ))}
              </motion.ul>
            </nav>
            <div className="flex items-center">
              <PowerButton />
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};
