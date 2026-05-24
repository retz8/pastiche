"use client";

import { AppHeader } from "./AppHeader";
import { AppFooter } from "./AppFooter";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      <main
        style={{
          flex: 1,
          maxWidth: "var(--breakpoint-xlarge)",
          width: "100%",
          marginLeft: "auto",
          marginRight: "auto",
          paddingLeft: "var(--base-size-32)",
          paddingRight: "var(--base-size-32)",
          paddingTop: "var(--base-size-24)",
          paddingBottom: "var(--base-size-24)",
        }}
      >
        {children}
      </main>
      <AppFooter />
    </>
  );
}
