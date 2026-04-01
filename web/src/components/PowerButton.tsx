import { useTheme } from "@/providers/ThemeProvider";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
} from "react";

export const PowerButton = () => {
  const [showActions, setShowActions] = useState(false);
  const { theme, setTheme } = useTheme();
  const shouldReduceMotion = useReducedMotion();
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  const closeActions = () => {
    setShowActions(false);
  };

  const handlePointerDown = useEffectEvent((event: PointerEvent) => {
    const target = event.target;

    if (
      target instanceof Node &&
      containerRef.current &&
      !containerRef.current.contains(target)
    ) {
      closeActions();
    }
  });

  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      closeActions();
    }
  });

  useEffect(() => {
    if (!showActions) {
      return;
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showActions]);

  return (
    <div ref={containerRef} className="relative flex h-full items-center">
      <motion.button
        type="button"
        aria-controls={menuId}
        aria-expanded={showActions}
        aria-label={showActions ? "Close quick actions" : "Open quick actions"}
        onClick={() => setShowActions((current) => !current)}
        whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
        className="group flex h-full w-14 items-center justify-center rounded-full border-l border-border/80 text-[1.65rem] text-text/78 transition-colors duration-300 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35"
      >
        <motion.span
          animate={{
            rotate: showActions ? 90 : 0,
            scale: showActions ? 1.06 : 1,
          }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: "easeOut" }}
        >
          <Icon icon={showActions ? "fa6-solid:x" : "fa6-solid:otter"} />
        </motion.span>
      </motion.button>
      <AnimatePresence>
        {showActions ? (
          <motion.div
            id={menuId}
            role="menu"
            initial={
              shouldReduceMotion
                ? false
                : { opacity: 0, y: -12, scale: 0.96 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.96 }
            }
            transition={{ duration: shouldReduceMotion ? 0 : 0.18, ease: "easeOut" }}
            className="absolute right-0 top-[calc(100%+0.8rem)] flex w-56 flex-col gap-1 rounded-2xl border border-border/85 bg-bg-secondary/95 p-2 shadow-[0_28px_70px_-32px_rgba(15,23,42,0.95)] backdrop-blur-xl"
          >
            <button
              type="button"
              role="menuitem"
              className="flex h-11 items-center justify-between rounded-xl px-3 text-left [font-family:var(--font-nav)] text-[0.72rem] font-bold uppercase tracking-[0.24em] text-text/85 transition-colors duration-300 hover:bg-white/5 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35"
              onClick={() => {
                setTheme(theme === "dark" ? "light" : "dark");
                closeActions();
              }}
            >
              <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
              <Icon
                icon={theme === "dark" ? "fa6-solid:sun" : "fa6-solid:moon"}
                className="text-lg"
              />
            </button>
            <button
              type="button"
              role="menuitem"
              disabled
              title="Resume download coming soon"
              className="flex h-11 items-center justify-between rounded-xl px-3 text-left [font-family:var(--font-nav)] text-[0.72rem] font-bold uppercase tracking-[0.24em] text-text/45"
            >
              <span>Resume soon</span>
              <Icon icon="fa6-solid:file-arrow-down" className="text-lg" />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
