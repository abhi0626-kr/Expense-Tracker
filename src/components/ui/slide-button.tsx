"use client"

import React, {
  forwardRef,
  useCallback,
  useRef,
  useState,
} from "react"
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type PanInfo,
} from "framer-motion"
import { Check, Loader2, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const DRAG_CONSTRAINTS = { left: 0, right: 130 }
const DRAG_THRESHOLD = 0.85

const BUTTON_STATES = {
  initial: { width: "13rem" },
  completed: { width: "8.5rem" },
}

const ANIMATION_CONFIG = {
  spring: {
    type: "spring",
    stiffness: 400,
    damping: 40,
    mass: 0.8,
  },
}

export interface SlideButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onDoubleClick" | "onClick"> {
  label?: string;
  onSlideComplete?: () => void | Promise<void>;
  onDoubleClick?: () => void | Promise<void>;
  onClick?: (e: React.MouseEvent) => void;
  isSubmitting?: boolean;
  className?: string;
}

export const SlideButton = forwardRef<HTMLButtonElement, SlideButtonProps>(
  (
    {
      label = "Add Transaction",
      onSlideComplete,
      onDoubleClick,
      onClick,
      isSubmitting = false,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const [isDragging, setIsDragging] = useState(false)
    const [completed, setCompleted] = useState(false)
    const [clickCount, setClickCount] = useState(0)
    const clickTimerRef = useRef<NodeJS.Timeout | null>(null)
    const isActionLockedRef = useRef(false)

    const dragX = useMotionValue(0)
    const springX = useSpring(dragX, ANIMATION_CONFIG.spring)
    const dragProgress = useTransform(
      springX,
      [0, DRAG_CONSTRAINTS.right],
      [0, 1]
    )

    const executeAction = useCallback(async () => {
      if (isActionLockedRef.current || isSubmitting) return;
      isActionLockedRef.current = true;
      setCompleted(true);
      
      try {
        if (onSlideComplete) {
          await onSlideComplete();
        } else if (onDoubleClick) {
          await onDoubleClick();
        }
      } finally {
        setTimeout(() => {
          isActionLockedRef.current = false;
          setCompleted(false);
          dragX.set(0);
        }, 1200);
      }
    }, [onSlideComplete, onDoubleClick, isSubmitting, dragX]);

    const handleDragStart = useCallback(() => {
      if (completed || disabled || isSubmitting) return
      setIsDragging(true)
    }, [completed, disabled, isSubmitting])

    const handleDragEnd = () => {
      if (completed || disabled || isSubmitting) return
      setIsDragging(false)

      const progress = dragProgress.get()
      if (progress >= DRAG_THRESHOLD) {
        executeAction()
      } else {
        dragX.set(0)
      }
    }

    const handleDrag = (
      _event: MouseEvent | TouchEvent | PointerEvent,
      info: PanInfo
    ) => {
      if (completed || disabled || isSubmitting) return
      const newX = Math.max(0, Math.min(info.offset.x, DRAG_CONSTRAINTS.right))
      dragX.set(newX)
    }

    const handleClick = (e: React.MouseEvent) => {
      if (onClick) onClick(e);

      // Single click UI spring bounce effect
      springX.set(25);
      setTimeout(() => springX.set(0), 180);

      setClickCount((prev) => {
        const next = prev + 1;
        if (clickTimerRef.current) clearTimeout(clickTimerRef.current);

        if (next >= 2) {
          // Double click triggers single save!
          executeAction();
          return 0;
        } else {
          clickTimerRef.current = setTimeout(() => {
            setClickCount(0);
          }, 350);
          return next;
        }
      });
    };

    const handleDoubleClickEvent = (e: React.MouseEvent) => {
      e.preventDefault();
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
      setClickCount(0);
      executeAction();
    };

    const adjustedWidth = useTransform(springX, (x) => x + 24);

    return (
      <motion.div
        animate={completed ? BUTTON_STATES.completed : BUTTON_STATES.initial}
        transition={ANIMATION_CONFIG.spring}
        className={cn(
          "relative flex h-10 items-center justify-between rounded-full bg-emerald-950/80 border border-emerald-500/40 p-1 shadow-inner select-none overflow-hidden",
          className
        )}
      >
        {!completed && (
          <motion.div
            style={{ width: adjustedWidth }}
            className="absolute inset-y-0 left-0 z-0 rounded-full bg-emerald-500/30"
          />
        )}

        {!completed && (
          <span className="w-full text-center text-xs font-semibold text-emerald-300 pl-7 pr-2 tracking-wide z-0 pointer-events-none transition-opacity duration-200">
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" /> Saving...
              </span>
            ) : clickCount === 1 ? (
              "Click again or slide →"
            ) : (
              `${label} →`
            )}
          </span>
        )}

        <AnimatePresence mode="wait">
          {!completed && (
            <motion.div
              drag="x"
              dragConstraints={DRAG_CONSTRAINTS}
              dragElastic={0.05}
              dragMomentum={false}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDrag={handleDrag}
              style={{ x: springX }}
              className="absolute left-1 z-10 flex cursor-grab items-center justify-start active:cursor-grabbing"
            >
              <Button
                ref={ref}
                type="button"
                disabled={disabled || isSubmitting}
                onClick={handleClick}
                onDoubleClick={handleDoubleClickEvent}
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-md transition-transform",
                  isDragging && "scale-110"
                )}
                {...props}
              >
                <Plus className="w-4 h-4 stroke-[3]" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {completed && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-emerald-600 rounded-full text-white font-semibold text-xs shadow-md"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 stroke-[3]" /> Added
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }
)

SlideButton.displayName = "SlideButton"
export default SlideButton;
