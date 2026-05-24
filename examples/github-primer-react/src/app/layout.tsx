import type { Metadata } from "next";
import { Providers } from "./providers";
import { AppShell } from "@/components/AppShell";
import "@primer/primitives/dist/css/primitives.css";
import "@primer/primitives/dist/css/functional/themes/light.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pastiche Issues",
  description: "Pastiche reference adoption — GitHub Primer React",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-color-mode="light" data-light-theme="light">
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
