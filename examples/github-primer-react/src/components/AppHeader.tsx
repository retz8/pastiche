"use client";

import {
  Header,
  UnderlineNav,
  TextInput,
  IconButton,
  CounterLabel,
} from "@primer/react";
import {
  MarkGithubIcon,
  CodeIcon,
  IssueOpenedIcon,
  GitPullRequestIcon,
  PlayIcon,
  ProjectIcon,
  GearIcon,
  BellIcon,
  PlusIcon,
} from "@primer/octicons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppHeader() {
  const pathname = usePathname() ?? "";

  return (
    <div>
      {/* Global header bar */}
      <Header>
        <Header.Item>
          <Header.Link href="/" aria-label="Homepage">
            <MarkGithubIcon size={32} />
          </Header.Link>
        </Header.Item>
        <Header.Item>
          <Header.Link href="/">
            acme-corp
          </Header.Link>
          <span style={{ color: "var(--fgColor-onEmphasis)", margin: "0 var(--base-size-4)" }}>
            /
          </span>
          <Header.Link href="/">
            issue-tracker
          </Header.Link>
        </Header.Item>
        <Header.Item full />
        <Header.Item>
          <TextInput
            aria-label="Search"
            placeholder="Search or jump to..."
            size="small"
            contrast
            style={{ width: 240 }}
          />
        </Header.Item>
        <Header.Item>
          <IconButton
            icon={PlusIcon}
            aria-label="Create new"
            variant="invisible"
            size="small"
          />
        </Header.Item>
        <Header.Item>
          <IconButton
            icon={BellIcon}
            aria-label="Notifications"
            variant="invisible"
            size="small"
          />
        </Header.Item>
      </Header>

      {/* Repository tab navigation */}
      <nav
        style={{
          backgroundColor: "var(--bgColor-default)",
          borderBottom: "var(--borderWidth-thin) solid var(--borderColor-default)",
        }}
      >
        <UnderlineNav aria-label="Repository navigation">
          <UnderlineNav.Item
            as={Link}
            href="/blob/main/src/components/Button.tsx"
            icon={CodeIcon}
            aria-current={
              pathname === "/" || pathname.startsWith("/blob")
                ? "page"
                : undefined
            }
          >
            Code
          </UnderlineNav.Item>
          <UnderlineNav.Item
            as={Link}
            href="/issues"
            icon={IssueOpenedIcon}
            counter={24}
            aria-current={pathname.startsWith("/issues") ? "page" : undefined}
          >
            Issues
          </UnderlineNav.Item>
          <UnderlineNav.Item
            as={Link}
            href="/pulls"
            icon={GitPullRequestIcon}
            counter={3}
            aria-current={pathname.startsWith("/pulls") ? "page" : undefined}
          >
            Pull requests
          </UnderlineNav.Item>
          <UnderlineNav.Item
            as={Link}
            href="/actions"
            icon={PlayIcon}
            aria-current={pathname.startsWith("/actions") ? "page" : undefined}
          >
            Actions
          </UnderlineNav.Item>
          <UnderlineNav.Item
            as={Link}
            href="/"
            icon={ProjectIcon}
            aria-current={undefined}
          >
            Projects
          </UnderlineNav.Item>
          <UnderlineNav.Item
            as={Link}
            href="/"
            icon={GearIcon}
            aria-current={undefined}
          >
            Settings
          </UnderlineNav.Item>
        </UnderlineNav>
      </nav>
    </div>
  );
}
