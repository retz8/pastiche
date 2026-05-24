"use client";

import { Header } from "@primer/react";
import Link from "next/link";

export function AppHeader() {
  return (
    <Header>
      <Header.Item full>
        <Header.Link as={Link} href="/issues" style={{ fontSize: "16px", fontWeight: "bold" }}>
          Pastiche Issues
        </Header.Link>
      </Header.Item>
    </Header>
  );
}
