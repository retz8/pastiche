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
  BranchName,
} from "@primer/react";
import { Blankslate } from "@primer/react/experimental";
import {
  CommentIcon,
  CheckCircleFillIcon,
  XCircleFillIcon,
  DotFillIcon,
  EyeIcon,
} from "@primer/octicons-react";

type PullState = "open" | "closed";
type PullDetailState = "open" | "closed" | "merged" | "draft";

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

type ReviewStatus = "requested" | "approved" | "changes_requested" | "none";
type CheckStatus = "passing" | "failing" | "pending" | "none";

type PullLabel = {
  name: string;
  variant: LabelVariant;
};

type PullRequest = {
  number: number;
  title: string;
  state: PullDetailState;
  author: string;
  createdAt: string;
  comments: number;
  branch: string;
  labels: PullLabel[];
  review: ReviewStatus;
  checks: CheckStatus;
};

const DAY = 1000 * 60 * 60 * 24;

function daysAgo(days: number): string {
  return new Date(Date.now() - days * DAY).toISOString();
}

const PULLS: PullRequest[] = [
  {
    number: 5102,
    title: "Add focus-visible polyfill fallback for ActionList rows",
    state: "open",
    author: "monalisa",
    createdAt: daysAgo(0.1),
    comments: 7,
    branch: "fix/actionlist-focus-visible",
    labels: [
      { name: "bug", variant: "danger" },
      { name: "accessibility", variant: "accent" },
    ],
    review: "changes_requested",
    checks: "failing",
  },
  {
    number: 5098,
    title: "Introduce SelectPanel async loading states",
    state: "open",
    author: "siddharthkp",
    createdAt: daysAgo(0.5),
    comments: 14,
    branch: "feat/selectpanel-async",
    labels: [
      { name: "enhancement", variant: "success" },
      { name: "needs review", variant: "attention" },
    ],
    review: "requested",
    checks: "pending",
  },
  {
    number: 5091,
    title: "Document RelativeTime SSR-safe rendering in Next.js",
    state: "open",
    author: "broccolinisoup",
    createdAt: daysAgo(1),
    comments: 3,
    branch: "docs/relativetime-ssr",
    labels: [{ name: "documentation", variant: "primary" }],
    review: "approved",
    checks: "passing",
  },
  {
    number: 5087,
    title: "WIP: experimental TreeView drag-and-drop reordering",
    state: "draft",
    author: "hubot",
    createdAt: daysAgo(2),
    comments: 1,
    branch: "spike/treeview-dnd",
    labels: [
      { name: "treeview", variant: "secondary" },
      { name: "do not merge", variant: "severe" },
    ],
    review: "none",
    checks: "pending",
  },
  {
    number: 5079,
    title: "Add CounterLabel scheme prop and deprecate variant",
    state: "open",
    author: "lukasoppermann",
    createdAt: daysAgo(3),
    comments: 9,
    branch: "feat/counterlabel-scheme",
    labels: [
      { name: "enhancement", variant: "success" },
      { name: "breaking change", variant: "attention" },
    ],
    review: "approved",
    checks: "passing",
  },
  {
    number: 5070,
    title: "Fix SegmentedControl keyboard focus order in dropdown variant",
    state: "open",
    author: "TylerJDev",
    createdAt: daysAgo(5),
    comments: 0,
    branch: "fix/segmentedcontrol-keyboard",
    labels: [{ name: "bug", variant: "danger" }],
    review: "requested",
    checks: "passing",
  },
  {
    number: 5061,
    title: "Migrate Button stories to the CSS modules pipeline",
    state: "merged",
    author: "mperrotti",
    createdAt: daysAgo(8),
    comments: 11,
    branch: "chore/button-css-modules",
    labels: [{ name: "internal", variant: "secondary" }],
    review: "approved",
    checks: "passing",
  },
  {
    number: 5054,
    title: "Add dark-dimmed danger surface tokens",
    state: "merged",
    author: "langermank",
    createdAt: daysAgo(12),
    comments: 6,
    branch: "feat/dark-dimmed-danger",
    labels: [
      { name: "tokens", variant: "severe" },
      { name: "theming", variant: "secondary" },
    ],
    review: "approved",
    checks: "passing",
  },
  {
    number: 5043,
    title: "Remove deprecated Box export from the entrypoint",
    state: "closed",
    author: "colebemis",
    createdAt: daysAgo(18),
    comments: 22,
    branch: "chore/remove-box-export",
    labels: [{ name: "breaking change", variant: "attention" }],
    review: "changes_requested",
    checks: "failing",
  },
  {
    number: 5031,
    title: "Prototype: virtualized ActionList for very long lists",
    state: "closed",
    author: "joshblack",
    createdAt: daysAgo(27),
    comments: 4,
    branch: "spike/actionlist-virtual",
    labels: [
      { name: "proposal", variant: "done" },
      { name: "wontfix", variant: "default" },
    ],
    review: "none",
    checks: "none",
  },
  {
    number: 5019,
    title: "Fix aria-current handling in NavList groups",
    state: "merged",
    author: "octocat",
    createdAt: daysAgo(34),
    comments: 8,
    branch: "fix/navlist-aria-current",
    labels: [
      { name: "bug", variant: "danger" },
      { name: "accessibility", variant: "accent" },
    ],
    review: "approved",
    checks: "passing",
  },
];

function stateLabelStatus(state: PullDetailState) {
  switch (state) {
    case "open":
      return "pullOpened" as const;
    case "draft":
      return "draft" as const;
    case "merged":
      return "pullMerged" as const;
    case "closed":
      return "pullClosed" as const;
  }
}

function stateLabelText(state: PullDetailState): string {
  switch (state) {
    case "open":
      return "Open";
    case "draft":
      return "Draft";
    case "merged":
      return "Merged";
    case "closed":
      return "Closed";
  }
}

const REVIEW_META: Record<
  Exclude<ReviewStatus, "none">,
  { label: string; color: string }
> = {
  requested: {
    label: "Review requested",
    color: "var(--fgColor-attention)",
  },
  approved: { label: "Approved", color: "var(--fgColor-success)" },
  changes_requested: {
    label: "Changes requested",
    color: "var(--fgColor-danger)",
  },
};

function CheckStatusVisual({ status }: { status: CheckStatus }) {
  switch (status) {
    case "passing":
      return (
        <Text
          size="small"
          weight="light"
          style={{ color: "var(--fgColor-success)" }}
        >
          <CheckCircleFillIcon size={14} aria-label="All checks passing" />
        </Text>
      );
    case "failing":
      return (
        <Text
          size="small"
          weight="light"
          style={{ color: "var(--fgColor-danger)" }}
        >
          <XCircleFillIcon size={14} aria-label="Some checks failing" />
        </Text>
      );
    case "pending":
      return (
        <Text
          size="small"
          weight="light"
          style={{ color: "var(--fgColor-attention)" }}
        >
          <DotFillIcon size={14} aria-label="Checks pending" />
        </Text>
      );
    case "none":
      return null;
  }
}

export default function PullsPage() {
  const [selectedTab, setSelectedTab] = useState<PullState>("open");

  // "Open" groups open + draft PRs; "Closed" groups merged + closed PRs.
  const isOpenBucket = (pr: PullRequest) =>
    pr.state === "open" || pr.state === "draft";

  const openCount = PULLS.filter(isOpenBucket).length;
  const closedCount = PULLS.length - openCount;
  const visiblePulls = PULLS.filter((pr) =>
    selectedTab === "open" ? isOpenBucket(pr) : !isOpenBucket(pr)
  );

  return (
    <Stack direction="vertical" gap="normal">
      <PageHeader role="banner" aria-label="Pull requests">
        <PageHeader.TitleArea>
          <PageHeader.Title as="h1">Pull requests</PageHeader.Title>
        </PageHeader.TitleArea>
        <PageHeader.Actions>
          <LinkButton href="/pulls/new" variant="primary">
            New pull request
          </LinkButton>
        </PageHeader.Actions>
      </PageHeader>

      <TextInput
        block
        type="search"
        placeholder="Search all pull requests"
        aria-label="Search all pull requests"
      />

      <SegmentedControl
        aria-label="Filter pull requests by state"
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

      {visiblePulls.length === 0 ? (
        <Blankslate>
          <Blankslate.Heading>No {selectedTab} pull requests</Blankslate.Heading>
          <Blankslate.Description>
            There aren&apos;t any {selectedTab} pull requests matching the
            current filter. Try the other tab or open a new pull request.
          </Blankslate.Description>
          <Blankslate.PrimaryAction href="/pulls/new">
            New pull request
          </Blankslate.PrimaryAction>
        </Blankslate>
      ) : (
        <ActionList showDividers>
          {visiblePulls.map((pr) => {
            const closed =
              pr.state === "closed" || pr.state === "merged";
            const review =
              pr.review !== "none" ? REVIEW_META[pr.review] : null;

            return (
              <ActionList.Item key={pr.number}>
                <ActionList.LeadingVisual>
                  <StateLabel
                    size="small"
                    status={stateLabelStatus(pr.state)}
                    variant="small"
                  >
                    {stateLabelText(pr.state)}
                  </StateLabel>
                </ActionList.LeadingVisual>

                <Stack
                  direction="horizontal"
                  gap="condensed"
                  align="baseline"
                  wrap="wrap"
                >
                  <Link href={`/pulls/${pr.number}`} muted={closed}>
                    <Text weight="semibold">{pr.title}</Text>
                  </Link>
                  {pr.labels.length > 0 && (
                    <LabelGroup overflowStyle="inline">
                      {pr.labels.map((label) => (
                        <Label key={label.name} variant={label.variant}>
                          {label.name}
                        </Label>
                      ))}
                    </LabelGroup>
                  )}
                </Stack>

                <ActionList.Description variant="block">
                  <Stack
                    direction="horizontal"
                    gap="condensed"
                    align="baseline"
                    wrap="wrap"
                  >
                    <Text size="small" weight="light">
                      #{pr.number} opened{" "}
                      <RelativeTime
                        date={new Date(pr.createdAt)}
                        threshold="P30D"
                      />{" "}
                      by {pr.author}
                    </Text>
                    <BranchName href={`/tree/${pr.branch}`}>
                      {pr.branch}
                    </BranchName>
                    {review && (
                      <Text
                        size="small"
                        weight="light"
                        style={{ color: review.color }}
                      >
                        <EyeIcon size={12} aria-hidden /> {review.label}
                      </Text>
                    )}
                  </Stack>
                </ActionList.Description>

                <ActionList.TrailingVisual>
                  <Stack
                    direction="horizontal"
                    gap="condensed"
                    align="center"
                  >
                    <CheckStatusVisual status={pr.checks} />
                    {pr.comments > 0 && (
                      <Text size="small" weight="light">
                        <CommentIcon size={14} aria-hidden /> {pr.comments}
                      </Text>
                    )}
                  </Stack>
                </ActionList.TrailingVisual>
              </ActionList.Item>
            );
          })}
        </ActionList>
      )}
    </Stack>
  );
}
