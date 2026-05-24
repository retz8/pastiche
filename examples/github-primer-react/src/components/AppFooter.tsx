"use client";

import { Stack, Text, Link } from "@primer/react";
import { MarkGithubIcon } from "@primer/octicons-react";

export function AppFooter() {
  return (
    <footer
      style={{
        paddingBlock: "var(--base-size-40)",
        paddingInline: "var(--base-size-32)",
      }}
    >
      <Stack
        direction="horizontal"
        gap="normal"
        wrap="wrap"
        align="center"
        justify="center"
      >
        <Link href="/" style={{ color: "var(--fgColor-muted)" }}>
          <MarkGithubIcon size={24} />
        </Link>
        <Text style={{ fontSize: 12, color: "var(--fgColor-muted)" }}>
          &copy; 2026 GitHub, Inc.
        </Text>
        <Link href="#" muted style={{ fontSize: 12 }}>
          Terms
        </Link>
        <Link href="#" muted style={{ fontSize: 12 }}>
          Privacy
        </Link>
        <Link href="#" muted style={{ fontSize: 12 }}>
          Security
        </Link>
        <Link href="#" muted style={{ fontSize: 12 }}>
          Status
        </Link>
        <Link href="#" muted style={{ fontSize: 12 }}>
          Docs
        </Link>
        <Link href="#" muted style={{ fontSize: 12 }}>
          Contact
        </Link>
        <Link href="#" muted style={{ fontSize: 12 }}>
          Manage cookies
        </Link>
        <Link href="#" muted style={{ fontSize: 12 }}>
          Do not share my personal information
        </Link>
      </Stack>
    </footer>
  );
}
