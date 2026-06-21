import { cn } from "@/lib/utils";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import * as React from "react";

// Context to track composition state across dialog children
const DialogCompositionContext = React.createContext<{
  isComposing: () => boolean;
  setComposing: (composing: boolean) => void;
  justEndedComposing: () => boolean;
  markCompositionEnd: () => void;
}>({
  isComposing: () => false,
  setComposing: () => {},
  justEndedComposing: () => false,
  markCompositionEnd: () => {},
});

export const useDialogComposition = () =>
  React.useContext(DialogCompositionContext);

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  const composingRef = React.useRef(false);
  const justEndedRef = React.useRef(false);
  const endTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const contextValue = React.useMemo(
    () => ({
      isComposing: () => composingRef.current,
      setComposing: (composing: boolean) => {
        composingRef.current = composing;
      },
      justEndedComposing: () => justEndedRef.current,
      markCompositionEnd: () => {
        justEndedRef.current = true;
        if (endTimerRef.current) clearTimeout(endTimerRef.current);
        endTimerRef.current = setTimeout(() => {
          justEndedRef.current = false;
        }, 150);
      },
    }),
    []
  );

  return (
    <DialogCompositionContext.Provider value={contextValue}>
      <DialogPrimitive.Root data-slot="dialog" {...props} />
    </DialogCompositionContext.Provider>
  );
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        // Soft frosted backdrop — lighter than before, with subtle blur
        "fixed inset-0 z-50 bg-black/30 backdrop-blur-[3px]",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  );
}

DialogOverlay.displayName = "DialogOverlay";

function DialogContent({
  className,
  children,
  showCloseButton = true,
  onEscapeKeyDown,
  fullScreen = false,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
  fullScreen?: boolean;
}) {
  const { isComposing } = useDialogComposition();

  const handleEscapeKeyDown = React.useCallback(
    (e: KeyboardEvent) => {
      const isCurrentlyComposing = (e as any).isComposing || isComposing();
      if (isCurrentlyComposing) {
        e.preventDefault();
        return;
      }
      onEscapeKeyDown?.(e);
    },
    [isComposing, onEscapeKeyDown]
  );

  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          // Shared animation
          "bg-card data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200",
          fullScreen
            ? // Full-screen — no rounding, fills viewport
              "fixed inset-0 z-50 flex flex-col w-screen h-screen max-w-none translate-x-0 translate-y-0 rounded-none border-none p-0"
            : // Centered sheet — rounded, shadowed, scale-in
              [
                "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                "fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)]",
                "translate-x-[-50%] translate-y-[-50%] gap-4 rounded-2xl border-0 p-6",
                // Layered shadow — Apple-style depth
                "shadow-[0_8px_30px_rgba(0,0,0,0.10),0_2px_8px_rgba(0,0,0,0.06),0_0_0_0.5px_rgba(0,0,0,0.06)]",
                "dark:shadow-[0_8px_30px_rgba(0,0,0,0.6),0_2px_8px_rgba(0,0,0,0.4),0_0_0_0.5px_rgba(255,255,255,0.05)]",
                "sm:max-w-lg",
              ],
          className
        )}
        onEscapeKeyDown={handleEscapeKeyDown}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className={cn(
              "absolute top-4 right-4 rounded-lg p-1.5",
              "opacity-60 transition-all duration-150 hover:opacity-100 hover:bg-muted",
              "focus:outline-none focus:ring-2 focus:ring-ring/40",
              "disabled:pointer-events-none",
              "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
            )}
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-1.5 text-center sm:text-left", className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg font-semibold leading-tight tracking-tight", className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm leading-relaxed", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
