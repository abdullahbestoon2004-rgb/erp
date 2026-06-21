import { useDialogComposition } from "@/components/ui/dialog";
import { useComposition } from "@/hooks/useComposition";
import { cn } from "@/lib/utils";
import * as React from "react";

function Input({
  className,
  type,
  onKeyDown,
  onCompositionStart,
  onCompositionEnd,
  ...props
}: React.ComponentProps<"input">) {
  const dialogComposition = useDialogComposition();

  const {
    onCompositionStart: handleCompositionStart,
    onCompositionEnd: handleCompositionEnd,
    onKeyDown: handleKeyDown,
  } = useComposition<HTMLInputElement>({
    onKeyDown: (e) => {
      const isComposing =
        (e.nativeEvent as any).isComposing || dialogComposition.justEndedComposing();
      if (e.key === "Enter" && isComposing) return;
      onKeyDown?.(e);
    },
    onCompositionStart: (e) => {
      dialogComposition.setComposing(true);
      onCompositionStart?.(e);
    },
    onCompositionEnd: (e) => {
      dialogComposition.markCompositionEnd();
      setTimeout(() => {
        dialogComposition.setComposing(false);
      }, 100);
      onCompositionEnd?.(e);
    },
  });

  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Layout & shape
        "h-10 w-full min-w-0 rounded-xl px-3.5 py-2 text-sm",
        // Colors — soft muted bg, hairline border
        "border border-input bg-muted/60 text-foreground",
        "placeholder:text-muted-foreground",
        // File input resets
        "file:text-foreground selection:bg-primary selection:text-primary-foreground",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        // Transition
        "transition-all duration-150 ease-out",
        // Focus — clear white bg + Apple-blue ring
        "focus-visible:bg-card focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none",
        // Dark mode bg
        "dark:bg-input/20 dark:focus-visible:bg-input/40",
        // Disabled
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        // Validation
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className
      )}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
}

export { Input };
