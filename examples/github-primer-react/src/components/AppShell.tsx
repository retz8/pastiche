"use client";

import { usePathname } from "next/navigation";
import { AppHeader } from "./AppHeader";
import { AppFooter } from "./AppFooter";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullbleed = pathname.startsWith("/blob");

  return (
    <>
      <AppHeader />
      <main
        style={
          isFullbleed
            ? {
                flex: 1,
                width: "100%",
                paddingTop: "var(--stack-padding-normal)",
                paddingBottom: "var(--stack-padding-normal)",
              }
            : {
                flex: 1,
                maxWidth: "1400px",
                width: "100%",
                marginLeft: "auto",
                marginRight: "auto",
                paddingLeft: "var(--stack-padding-spacious)",
                paddingRight: "var(--stack-padding-spacious)",
                paddingTop: "var(--stack-padding-normal)",
                paddingBottom: "var(--stack-padding-normal)",
              }
        }
      >
        {children}
      </main>
      <AppFooter />
    </>
  );
}
