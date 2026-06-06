"use client";

import * as React from "react";

/**
 * Returns true after the component has mounted on the client.
 * Useful for avoiding hydration mismatches when reading browser-only state.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return mounted;
}
