"use client";

import { useEffect, useState, type ComponentProps } from "react";
import { ResponsiveContainer } from "recharts";

/**
 * A wrapper around recharts ResponsiveContainer that only renders on the client.
 * During SSR, recharts cannot measure the container dimensions (returns -1),
 * which produces noisy console warnings. This component renders nothing on
 * the server and mounts the chart only after hydration.
 */
export function ClientResponsiveContainer(props: ComponentProps<typeof ResponsiveContainer>) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <ResponsiveContainer {...props} />;
}
