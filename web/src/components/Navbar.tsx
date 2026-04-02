import { useEffect, useEffectEvent, useRef, useState } from "react";
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
import { useTheme } from "@/providers/ThemeProvider";

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
  "flex h-full min-w-[5.75rem] items-center justify-center px-4 [font-family:var(--font-nav)] text-[0.7rem] font-bold uppercase tracking-[0.24em] transition-colors duration-200";
const actionButtonClass =
  "flex h-full w-10 shrink-0 items-center justify-center p-0 text-[1.05rem] text-text-muted transition-colors duration-200 hover:bg-white/8 hover:text-text-invert focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20";
const brandNameStyle = {
  fontFamily: "\"Montserrat\", var(--font-body)",
} as const;
const navbarSurfaceStyle = {
  backgroundColor: "color-mix(in srgb, var(--bg-dark) 82%, transparent)",
} as const;
const mobileMenuSurfaceStyle = {
  backgroundColor: "color-mix(in srgb, var(--bg-dark) 82%, transparent)",
} as const;

export const Navbar = () => {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const isHomePage = normalizePathname(pathname) === "/";
  const { theme, setTheme } = useTheme();
  const shouldReduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const [isHidden, setIsHidden] = useState(false);
  const [showShadow, setShowShadow] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handlePointerDown = useEffectEvent((event: PointerEvent) => {
    const target = event.target;

    if (
      target instanceof Node &&
      containerRef.current &&
      !containerRef.current.contains(target)
    ) {
      closeMenu();
    }
  });

  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  const handleScroll = useEffectEvent(() => {
    closeMenu();
  });

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isMenuOpen]);

  useMotionValueEvent(scrollY, "change", (current) => {
    const previous = scrollY.getPrevious();

    if (isMenuOpen) {
      closeMenu();
      setShowShadow(false);
      return;
    }

    if (typeof previous !== "number") {
      return;
    }

    if (current <= 12) {
      setIsHidden(false);
      setShowShadow(false);
      return;
    }

    if (Math.abs(current - previous) < 2) {
      return;
    }

    if (current < previous) {
      setIsHidden(false);
      setShowShadow(true);
      return;
    }

    setShowShadow(false);
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
      className="fixed inset-x-0 top-0 z-50 sm:px-6 sm:pt-4 lg:px-10"
    >
      <div
        ref={containerRef}
        style={navbarSurfaceStyle}
        className={clsx(
          "w-full py-2 text-text-invert backdrop-blur-2xl sm:mx-auto sm:w-[min(100%-(var(--page-gutter)*2),var(--page-width))] sm:px-5",
          showShadow ? "shadow-2xl" : "shadow-none",
        )}
      >
        <div className="relative flex min-h-[60px] items-stretch justify-between px-4 sm:px-0">
          <div className="flex items-center px-3 md:px-0">
            <span
              style={brandNameStyle}
              className="text-[1.08rem] font-bold tracking-[0.08em] text-white md:hidden"
            >
              Rakshit Gumber
            </span>
          </div>

          <motion.span
            initial={shouldReduceMotion ? false : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.24, ease: "easeOut" }}
            style={brandNameStyle}
            className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 text-[1.05rem] font-bold tracking-[0.12em] text-white md:block"
          >
            Rakshit Gumber
          </motion.span>

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
                            ? "bg-white/10 text-text-invert"
                            : "bg-transparent text-text-invert/68 hover:bg-white/8 hover:text-text-invert",
                        )}
                      >
                        {item.label}
                      </Link>
                    </motion.li>
                  );
                })}
              </motion.ul>
            </nav>

            <div className="flex h-full items-stretch gap-[2px] p-[2px]">
              {isHomePage ? null : (
                <button
                  type="button"
                  aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
                  className={actionButtonClass}
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  <motion.span
                    animate={{
                      rotate: theme === "dark" ? 0 : 180,
                      scale: theme === "dark" ? 1 : 1.08,
                    }}
                    transition={{
                      duration: shouldReduceMotion ? 0 : 0.22,
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
              )}
              <button
                type="button"
                aria-expanded={isMenuOpen}
                aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                className="flex h-full w-10 shrink-0 items-center justify-center p-0 text-[1.05rem] text-text-muted transition-colors duration-200 hover:bg-white/8 hover:text-text-invert focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20 md:hidden"
                onClick={() => setIsMenuOpen((current) => !current)}
              >
                <motion.span
                  animate={{
                    rotate: isMenuOpen ? 90 : 0,
                    scale: isMenuOpen ? 1.06 : 1,
                  }}
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.22,
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
              initial={shouldReduceMotion ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: "easeOut" }}
              className="overflow-hidden md:hidden"
            >
              <nav
                aria-label="Mobile primary"
                style={mobileMenuSurfaceStyle}
                className="grid backdrop-blur-2xl"
              >
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
                        "flex items-center px-7 py-4 text-[0.82rem] font-semibold uppercase tracking-[0.18em] transition-colors",
                        isActive
                          ? "bg-white/8 text-text-invert"
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
      </div>
    </motion.header>
  );
};
