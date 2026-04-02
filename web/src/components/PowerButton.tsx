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
        aria-haspopup="dialog"
        aria-label={showActions ? "Close quick actions" : "Open quick actions"}
        onClick={() => setShowActions((current) => !current)}
        whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
        className="flex h-full w-[60px] shrink-0 items-center justify-center border-l border-border bg-transparent px-0 text-[1.25rem] text-text-muted transition-colors duration-200 hover:bg-bg-secondary/50 hover:text-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border md:min-w-12 md:w-auto md:border-y md:border-r md:border-l-0 md:px-3"
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
            aria-label="Quick actions"
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
            className="absolute right-0 top-[calc(100%+0.5rem)] flex w-44 flex-col gap-2 border border-border bg-bg/80 p-2 backdrop-blur-md"
          >
            <button
              type="button"
              className="flex h-9 items-center justify-between border border-border px-3 text-left [font-family:var(--font-nav)] text-[0.68rem] font-bold uppercase tracking-[0.2em] text-text-muted transition-colors duration-200 hover:bg-bg-secondary/50 hover:text-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border"
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
              disabled
              title="Resume download coming soon"
              className="flex h-9 items-center justify-between border border-border px-3 text-left [font-family:var(--font-nav)] text-[0.68rem] font-bold uppercase tracking-[0.2em] text-text-muted/60"
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
