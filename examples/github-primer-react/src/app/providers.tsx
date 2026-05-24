"use client";

import { ThemeProvider, BaseStyles } from "@primer/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider colorMode="day">
      <BaseStyles>{children}</BaseStyles>
    </ThemeProvider>
  );
}
