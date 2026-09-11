import React, { createContext, useContext, useState, useRef } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const ConfirmContext = createContext(null);

/**
 * Provider component that wraps the application to enable imperative `confirm()` dialogs.
 */
export function ConfirmProvider({ children }) {
  const [dialogConfig, setDialogConfig] = useState(null);
  const [open, setOpen] = useState(false);
  const resolverRef = useRef(null);

  const confirm = (options = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialogConfig(options);
      setOpen(true);
    });
  };

  const handleConfirm = async () => {
    if (dialogConfig?.onConfirm) {
      try {
        await dialogConfig.onConfirm();
      } catch (error) {
        console.error("Confirm error:", error);
      }
    }
    if (resolverRef.current) {
      resolverRef.current(true);
    }
    setOpen(false);
  };

  const handleCancel = () => {
    if (dialogConfig?.onCancel) {
      dialogConfig.onCancel();
    }
    if (resolverRef.current) {
      resolverRef.current(false);
    }
    setOpen(false);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {dialogConfig && (
        <ConfirmDialog
          open={open}
          onOpenChange={(val) => {
            if (!val) handleCancel();
          }}
          {...dialogConfig}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ConfirmContext.Provider>
  );
}

/**
 * Hook to access imperative confirmation dialogs anywhere in components.
 * 
 * Example usage:
 * ```jsx
 * const confirm = useConfirm();
 * const handleDelete = async () => {
 *   const confirmed = await confirm({
 *     title: "Delete Brand",
 *     description: "Are you sure you want to delete this brand?",
 *     variant: "danger",
 *     confirmText: "Delete"
 *   });
 *   if (confirmed) {
 *     // Run delete action
 *   }
 * }
 * ```
 */
export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
}

export default useConfirm;
