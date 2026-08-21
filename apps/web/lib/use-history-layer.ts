"use client";

import { useEffect, useRef } from "react";

const FLAG = "plHistoryLayer";

type LayerState = { [FLAG]?: true };

/**
 * While `active`, push one history entry so browser/mouse Back closes the overlay
 * instead of leaving the current page position (e.g. jumping to a prior hash section).
 * Closing via UI removes that entry with history.back().
 */
export function useHistoryLayer(active: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const closingViaUi = useRef(false);
  const pushed = useRef(false);

  useEffect(() => {
    if (!active) return;

    const prev = (window.history.state as LayerState | null) ?? null;
    window.history.pushState({ ...(prev ?? {}), [FLAG]: true } satisfies LayerState, "");
    pushed.current = true;

    const onPop = () => {
      pushed.current = false;
      if (closingViaUi.current) {
        closingViaUi.current = false;
        return;
      }
      onCloseRef.current();
    };

    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      if (pushed.current) {
        pushed.current = false;
        closingViaUi.current = true;
        window.history.back();
      }
    };
  }, [active]);
}
