'use client';

import * as React from "react"
import { cn } from "@/lib/utils"

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical" | "both"
}

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, orientation = "vertical", ...props }, forwardedRef) => {
    const viewportRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      const viewport = viewportRef.current;
      if (!viewport || orientation !== "horizontal") return;

      const handleWheel = (e: WheelEvent) => {
        // Translate vertical mouse scroll wheel directly into horizontal scrolling
        if (e.deltaY !== 0 && Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
          e.preventDefault();
          viewport.scrollLeft += e.deltaY;
        }
      };

      viewport.addEventListener("wheel", handleWheel, { passive: false });
      return () => viewport.removeEventListener("wheel", handleWheel);
    }, [orientation]);

    return (
      <div
        className={cn("relative overflow-hidden w-full", className)}
        {...props}
      >
        <div
          ref={(node) => {
            (viewportRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
            if (typeof forwardedRef === 'function') forwardedRef(node);
            else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          }}
          className={cn(
            "h-full w-full rounded-[inherit] transition-all",
            orientation === "horizontal"
              ? "overflow-x-auto overflow-y-hidden pb-2 pt-0.5 scroll-smooth"
              : "overflow-y-auto overflow-x-hidden no-scrollbar"
          )}
        >
          {children}
        </div>
      </div>
    );
  }
)
ScrollArea.displayName = "ScrollArea"

const ScrollBar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { orientation?: "vertical" | "horizontal" }
>(({ className, orientation = "vertical", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}
  />
))
ScrollBar.displayName = "ScrollBar"

export { ScrollArea, ScrollBar }
