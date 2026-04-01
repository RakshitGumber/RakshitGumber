import clsx from "clsx";
import { Link, useRouterState } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
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
          "group relative flex h-full min-w-[7.25rem] items-center justify-center overflow-hidden rounded-full px-5",
          "[font-family:var(--font-nav)] text-[0.72rem] font-bold uppercase tracking-[0.28em] transition-colors duration-300",
          isActive ? "text-text" : "text-text/70 hover:text-text",
        )}
      >
        {isActive ? (
          <motion.span
            layoutId="navbar-active-pill"
            className="absolute inset-0 rounded-full border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.16),rgba(255,255,255,0.05))] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_18px_36px_-28px_rgba(15,23,42,0.95)]"
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          />
        ) : null}
        <span className="relative z-10 flex items-center gap-2.5">
          <span
            className={clsx(
              "h-1.5 w-1.5 rounded-full transition-colors duration-300",
              isActive
                ? "bg-accent"
                : "bg-text/20 group-hover:bg-accent/75",
            )}
          />
          <span>{label}</span>
        </span>
      </Link>
    </motion.li>
  );
};

export const Navbar = () => {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.header
      initial={shouldReduceMotion ? false : { opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.45, ease: "easeOut" }}
      className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6"
    >
      <div className="flex w-full justify-end">
        <div className="rounded-full border border-border/70 bg-bg/25 p-[1px] shadow-[0_24px_60px_-32px_rgba(15,23,42,0.8)] backdrop-blur-xl">
          <div className="flex h-12 items-stretch rounded-full border border-white/5 bg-bg-secondary/85 pr-1">
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
                className="flex h-full items-center gap-1 px-1"
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
            <div className="flex h-full items-center pl-1">
              <PowerButton />
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};
