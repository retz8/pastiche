import type { Metadata } from "next";
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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
