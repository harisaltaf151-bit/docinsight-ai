"use client";

import * as React from "react";

interface UseDisclosure {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onToggle: () => void;
  setOpen: (v: boolean) => void;
}

export function useDisclosure(initial = false): UseDisclosure {
  const [open, setOpen] = React.useState(initial);
  return {
    open,
    setOpen,
    onOpen: () => setOpen(true),
    onClose: () => setOpen(false),
    onToggle: () => setOpen((v) => !v),
  };
}
