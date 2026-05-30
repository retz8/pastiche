"use client";

import { useState } from "react";
import {
  ActionList,
  Label,
  LabelGroup,
  Link,
  LinkButton,
  PageHeader,
  RelativeTime,
  SegmentedControl,
  Stack,
  StateLabel,
  Text,
  TextInput,
} from "@primer/react";
import { Blankslate } from "@primer/react/experimental";

type IssueState = "open" | "closed";

type LabelVariant =
  | "default"
  | "primary"
  | "secondary"
  | "accent"
  | "success"
  | "attention"
  | "severe"
  | "danger"
  | "done"
  | "sponsors";

type IssueLabel = {
  name: string;
  variant: LabelVariant;
};

type Issue = {
  number: number;
  title: string;
  state: IssueState;
  author: string;
  createdAt: string;
  comments: number;
  labels: IssueLabel[];
};

const DAY = 1000 * 60 * 60 * 24;

function daysAgo(days: number): string {
  return new Date(Date.now() - days * DAY).toISOString();
}

const ISSUES: Issue[] = [
  {
    number: 4821,
    title: "Focus ring is clipped inside ActionList rows on Safari",
    state: "open",
    author: "monalisa",
    createdAt: daysAgo(0.2),
    comments: 12,
    labels: [
      { name: "bug", variant: "danger" },
      { name: "accessibility", variant: "accent" },
    ],
  },
  {
    number: 4815,
    title: "Add support for keyboard reordering in TreeView",
    state: "open",
    author: "hubot",
    createdAt: daysAgo(1),
    comments: 4,
    labels: [
      { name: "enhancement", variant: "success" },
      { name: "treeview", variant: "secondary" },
    ],
  },
  {
    number: 4809,
    title: "Document the SegmentedControl responsive variants",
    state: "open",
    author: "octocat",
    createdAt: daysAgo(2),
    comments: 0,
    labels: [{ name: "documentation", variant: "primary" }],
  },
  {
    number: 4798,
    title: "RelativeTime renders a hydration mismatch warning in Next.js",
    state: "open",
    author: "broccolinisoup",
    createdAt: daysAgo(4),
    comments: 23,
    labels: [
      { name: "bug", variant: "danger" },
      { name: "ssr", variant: "attention" },
    ],
  },
  {
    number: 4790,
    title: "Proposal: a Blankslate variant with a compact spacing scale",
    state: "open",
    author: "siddharthkp",
    createdAt: daysAgo(7),
    comments: 8,
    labels: [
      { name: "proposal", variant: "done" },
      { name: "needs design", variant: "sponsors" },
    ],
  },
  {
    number: 4783,
    title: "Tokens are missing for the new dark-dimmed danger surfaces",
    state: "open",
    author: "langermank",
    createdAt: daysAgo(11),
    comments: 5,
    labels: [
      { name: "tokens", variant: "severe" },
      { name: "theming", variant: "secondary" },
    ],
  },
  {
    number: 4761,
    title: "LabelGroup overflowStyle=\"overlay\" traps focus when empty",
    state: "open",
    author: "joshblack",
    createdAt: daysAgo(19),
    comments: 2,
    labels: [{ name: "bug", variant: "danger" }],
  },
  {
    number: 4740,
    title: "Migrate Button stories to the new CSS modules pipeline",
    state: "closed",
    author: "mperrotti",
    createdAt: daysAgo(24),
    comments: 6,
    labels: [{ name: "internal", variant: "secondary" }],
  },
  {
    number: 4722,
    title: "Fix incorrect aria-current handling in NavList groups",
    state: "closed",
    author: "TylerJDev",
    createdAt: daysAgo(33),
    comments: 9,
    labels: [
      { name: "bug", variant: "danger" },
      { name: "accessibility", variant: "accent" },
    ],
  },
  {
    number: 4705,
    title: "Ship CounterLabel scheme prop and deprecate the old variant",
    state: "closed",
    author: "lukasoppermann",
    createdAt: daysAgo(45),
    comments: 14,
    labels: [
      { name: "enhancement", variant: "success" },
      { name: "breaking change", variant: "attention" },
    ],
  },
  {
    number: 4688,
    title: "Remove deprecated Box export from the package entrypoint",
    state: "closed",
    author: "colebemis",
    createdAt: daysAgo(58),
    comments: 31,
    labels: [{ name: "breaking change", variant: "attention" }],
  },
];

export default function IssuesPage() {
  const [selectedTab, setSelectedTab] = useState<IssueState>("open");

  const openCount = ISSUES.filter((issue) => issue.state === "open").length;
  const closedCount = ISSUES.filter((issue) => issue.state === "closed").length;
  const visibleIssues = ISSUES.filter((issue) => issue.state === selectedTab);

  return (
    <Stack direction="vertical" gap="normal">
      <PageHeader role="banner" aria-label="Issues">
        <PageHeader.TitleArea>
          <PageHeader.Title as="h1">Issues</PageHeader.Title>
        </PageHeader.TitleArea>
        <PageHeader.Actions>
          <LinkButton href="/issues/new" variant="primary">
            New issue
          </LinkButton>
        </PageHeader.Actions>
      </PageHeader>

      <TextInput
        block
        type="search"
        placeholder="Search all issues"
        aria-label="Search all issues"
      />

      <SegmentedControl
        aria-label="Filter issues by state"
        onChange={(index) => setSelectedTab(index === 0 ? "open" : "closed")}
      >
        <SegmentedControl.Button
          selected={selectedTab === "open"}
          count={openCount}
        >
          Open
        </SegmentedControl.Button>
        <SegmentedControl.Button
          selected={selectedTab === "closed"}
          count={closedCount}
        >
          Closed
        </SegmentedControl.Button>
      </SegmentedControl>

      {visibleIssues.length === 0 ? (
        <Blankslate>
          <Blankslate.Heading>
            No {selectedTab} issues
          </Blankslate.Heading>
          <Blankslate.Description>
            There aren&apos;t any {selectedTab} issues matching the current
            filter. Try the other tab or open a new issue.
          </Blankslate.Description>
          <Blankslate.PrimaryAction href="/issues/new">
            New issue
          </Blankslate.PrimaryAction>
        </Blankslate>
      ) : (
        <ActionList showDividers>
          {visibleIssues.map((issue) => (
            <ActionList.Item key={issue.number}>
              <ActionList.LeadingVisual>
                <StateLabel
                  size="small"
                  status={issue.state === "open" ? "issueOpened" : "issueClosed"}
                  variant="small"
                >
                  {issue.state === "open" ? "Open" : "Closed"}
                </StateLabel>
              </ActionList.LeadingVisual>

              <Stack direction="horizontal" gap="condensed" align="center" wrap="wrap">
                <Link
                  href={`/issues/${issue.number}`}
                  muted={issue.state === "closed"}
                >
                  <Text weight="semibold">{issue.title}</Text>
                </Link>
                {issue.labels.length > 0 && (
                  <LabelGroup overflowStyle="inline">
                    {issue.labels.map((label) => (
                      <Label key={label.name} variant={label.variant}>
                        {label.name}
                      </Label>
                    ))}
                  </LabelGroup>
                )}
              </Stack>

              <ActionList.Description variant="block">
                <Text size="small" weight="light">
                  #{issue.number} opened{" "}
                  <RelativeTime date={new Date(issue.createdAt)} threshold="P30D" />{" "}
                  by {issue.author}
                </Text>
              </ActionList.Description>

              {issue.comments > 0 && (
                <ActionList.TrailingVisual>
                  <Text size="small" weight="light">
                    {issue.comments} comments
                  </Text>
                </ActionList.TrailingVisual>
              )}
            </ActionList.Item>
          ))}
        </ActionList>
      )}
    </Stack>
  );
}
