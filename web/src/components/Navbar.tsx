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

type NavItem = {
  label: string;
  to: string;
  exact?: boolean;
};

const parentVariants = {
  visible: { opacity: 1, y: 0 },
  hidden: { opacity: 0, y: "-4rem" },
};

const navItems: readonly NavItem[] = [
  { label: "Work", to: "/", exact: true },
  { label: "Blogs", to: "/blog" },
  { label: "Projects", to: "/projects" },
] as const;

export const Navbar = () => {
  const matchRoute = useMatchRoute();
  // const { theme, setTheme } = useTheme();
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
      className="fixed top-0 z-50 w-full backdrop-blur-3xl bg-[color-mix(in_srgb,var(--bg-dark)_82%,transparent)]"
      animate={hidden ? "hidden" : "visible"}
      variants={parentVariants}
      transition={{
        ease: [0.1, 0.25, 0.3, 1],
        duration: 0.6,
      }}
    >
      <div className="flex h-24 items-center justify-between px-24">
        <div className="flex items-center px-3">
          <span className="font-bold tracking-wider text-text font-heading cursor-pointer text-2xl">
            Rakshit Gumber
          </span>
        </div>
        <nav className="hidden h-full sm:flex items-center">
          {navItems.map((item) => {
            const isActive = Boolean(
              matchRoute({
                to: item.to,
                fuzzy: !item.exact,
              }),
            );

            return (
              <div key={item.to} className="">
                <Link
                  preload="intent"
                  to={item.to}
                  className={clsx(
                    "flex min-w-23 justify-center text-muted px-4 font-semibold tracking-wide text-lg",
                    isActive &&
                      "font-bold underline text-text decoration-[1.5px] underline-offset-4",
                  )}
                >
                  {item.label}
                </Link>
              </div>
            );
          })}
        </nav>

        <div className="flex sm:hidden">
          <button
            type="button"
            className="flex p-3 text-xl text-muted hover:text-text-invert "
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
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{
              duration: 0.2,
              ease: "circIn",
            }}
            className="overflow-hidden sm:hidden"
          >
            <nav className="flex flex-col">
              {navItems.map((item) => {
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
                      "flex items-center px-7 py-3 text-sm font-semibold tracking-wide",
                      isActive &&
                        "font-bold underline decoration-1 underline-offset-3",
                    )}
                  >
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};
