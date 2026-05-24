"use client";

import { UnderlineNav } from "@primer/react";
import {
  MarkGithubIcon,
  IssueOpenedIcon,
  CodeIcon,
} from "@primer/octicons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppHeader() {
  const pathname = usePathname();

  return (
    <div style={{ backgroundColor: "#f6f8fa" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "16px 32px 0",
        }}
      >
        <MarkGithubIcon size={32} />
        <Link
          href="/issues"
          style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "#1F2328",
            textDecoration: "none",
          }}
        >
          pastiche-issues
        </Link>
      </div>
      <UnderlineNav aria-label="Repository navigation">
        <UnderlineNav.Item
          as={Link}
          href="/issues"
          icon={CodeIcon}
          aria-current={pathname === "/" ? "page" : undefined}
        >
          Code
        </UnderlineNav.Item>
        <UnderlineNav.Item
          as={Link}
          href="/issues"
          icon={IssueOpenedIcon}
          aria-current={pathname.startsWith("/issues") ? "page" : undefined}
        >
          Issues
        </UnderlineNav.Item>
      </UnderlineNav>
    </div>
  );
}
