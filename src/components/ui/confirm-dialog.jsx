import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Info,
  Loader2,
  Trash2,
} from "lucide-react";

/**
 * Variant configurations for icon, badge styling, action button styling, and default texts.
 */
const VARIANT_CONFIGS = {
  danger: {
    icon: Trash2,
    badgeBg: "bg-destructive/10 text-destructive dark:bg-destructive/20",
    buttonVariant: "destructive",
    buttonClass: "",
    defaultTitle: "Are you sure?",
    defaultConfirmText: "Delete",
  },
  warning: {
    icon: AlertTriangle,
    badgeBg: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
    buttonVariant: "default",
    buttonClass: "bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-600 dark:hover:bg-amber-700",
    defaultTitle: "Warning",
    defaultConfirmText: "Proceed",
  },
  info: {
    icon: Info,
    badgeBg: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
    buttonVariant: "default",
    buttonClass: "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700",
    defaultTitle: "Confirm Information",
    defaultConfirmText: "Confirm",
  },
  success: {
    icon: CheckCircle2,
    badgeBg: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
    buttonVariant: "default",
    buttonClass: "bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700",
    defaultTitle: "Confirm Action",
    defaultConfirmText: "Submit",
  },
  primary: {
    icon: HelpCircle,
    badgeBg: "bg-primary/10 text-primary dark:bg-primary/20",
    buttonVariant: "default",
    buttonClass: "",
    defaultTitle: "Are you sure?",
    defaultConfirmText: "Confirm",
  },
};

const SIZE_CLASSES = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

/**
 * Reusable & Theme-Aware Confirmation Dialog Component
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  trigger,
  title,
  description = "This action cannot be undone.",
  children,
  variant = "danger",
  icon: CustomIcon,
  showIcon = true,
  confirmText,
  cancelText = "Cancel",
  confirmVariant,
  cancelVariant = "outline",
  confirmClassName,
  cancelClassName,
  contentClassName,
  size = "md",
  isLoading: externalIsLoading,
  isPending: externalIsPending,
  confirmDisabled = false,
  onConfirm,
  onCancel,
}) {
  const [internalLoading, setInternalLoading] = React.useState(false);

  const isExecuting =
    externalIsLoading || externalIsPending || internalLoading;

  const config = VARIANT_CONFIGS[variant] || VARIANT_CONFIGS.danger;
  const IconComponent = CustomIcon || config.icon;
  const resolvedTitle = title || config.defaultTitle;
  const resolvedConfirmText = confirmText || config.defaultConfirmText;
  const resolvedConfirmVariant = confirmVariant || config.buttonVariant;

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!onConfirm) {
      if (onOpenChange) onOpenChange(false);
      return;
    }

    try {
      setInternalLoading(true);
      const result = onConfirm(e);
      if (result && typeof result.then === "function") {
        await result;
      }
      if (onOpenChange) {
        onOpenChange(false);
      }
    } catch (err) {
      console.error("Error executing confirm action:", err);
    } finally {
      setInternalLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    if (onOpenChange) onOpenChange(false);
  };

  const dialogBody = (
    <AlertDialogContent
      className={cn(
        SIZE_CLASSES[size] || SIZE_CLASSES.md,
        "border border-border bg-background p-6 shadow-xl transition-all sm:rounded-xl",
        contentClassName
      )}
    >
      <AlertDialogHeader className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-start sm:text-left">
        {showIcon && IconComponent && (
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors",
              config.badgeBg
            )}
          >
            <IconComponent className="h-6 w-6" />
          </div>
        )}
        <div className="space-y-1">
          <AlertDialogTitle className="text-lg font-semibold text-foreground">
            {resolvedTitle}
          </AlertDialogTitle>
          {description && (
            <AlertDialogDescription className="text-sm text-muted-foreground">
              {description}
            </AlertDialogDescription>
          )}
        </div>
      </AlertDialogHeader>

      {children && <div className="py-2 text-sm text-foreground">{children}</div>}

      <AlertDialogFooter className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <AlertDialogCancel
          asChild
          disabled={isExecuting}
          onClick={handleCancel}
        >
          <Button
            type="button"
            variant={cancelVariant}
            disabled={isExecuting}
            className={cn("w-full sm:w-auto", cancelClassName)}
          >
            {cancelText}
          </Button>
        </AlertDialogCancel>

        <AlertDialogAction
          asChild
          disabled={isExecuting || confirmDisabled}
          onClick={handleConfirm}
        >
          <Button
            type="button"
            variant={resolvedConfirmVariant}
            disabled={isExecuting || confirmDisabled}
            className={cn(
              "w-full sm:w-auto min-w-[80px]",
              config.buttonClass,
              confirmClassName
            )}
          >
            {isExecuting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing...</span>
              </span>
            ) : (
              resolvedConfirmText
            )}
          </Button>
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );

  if (trigger) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
        {dialogBody}
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {dialogBody}
    </AlertDialog>
  );
}

export default ConfirmDialog;
