"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * React Query provider — لایه state سرور/ریموت (بخش ۲ سند v19).
 * فقط یک‌بار در root layout نصب می‌شود؛ هوک‌های src/data/* از آن عبور می‌کنند.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  // useState initializer → client ثابت در طول عمر تب (بدون ساخت مجدد در re-render)
  const [client] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
