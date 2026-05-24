"use client";

import { ThemeProvider, BaseStyles } from "@primer/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider colorMode="day">
      <BaseStyles
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        {children}
      </BaseStyles>
    </ThemeProvider>
  );
}
