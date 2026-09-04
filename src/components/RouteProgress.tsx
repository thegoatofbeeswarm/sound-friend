import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

/**
 * Thin bar at the top of the screen while a route is loading, so navigation
 * always feels responsive even when data is still on the way.
 */
export function RouteProgress() {
  const isLoading = useRouterState({ select: (s) => s.status === "pending" });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setVisible(true);
      return;
    }
    const timer = setTimeout(() => setVisible(false), 300);
    return () => clearTimeout(timer);
  }, [isLoading]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden">
      <div
        className="h-full bg-primary transition-[width,opacity] duration-300 ease-out"
        style={{ width: isLoading ? "70%" : "100%", opacity: isLoading ? 1 : 0 }}
      />
    </div>
  );
}
