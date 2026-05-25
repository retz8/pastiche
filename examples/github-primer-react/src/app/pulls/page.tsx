"use client";

import { useState } from "react";
import {
  ActionList,
  BranchName,
  LinkButton,
  TextInput,
  Label,
  LabelGroup,
  RelativeTime,
  SegmentedControl,
  StateLabel,
  Text,
  Stack,
} from "@primer/react";
import { Blankslate } from "@primer/react/experimental";
import {
  GitPullRequestIcon,
  GitMergeIcon,
  GitPullRequestClosedIcon,
  GitPullRequestDraftIcon,
  SearchIcon,
  CommentIcon,
  CheckIcon,
  XIcon,
  DotFillIcon,
  GitBranchIcon,
  ShieldCheckIcon,
  FileDiffIcon,
} from "@primer/octicons-react";

interface PRLabel {
  name: string;
  variant:
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
}

type PRStatus = "open" | "closed" | "merged" | "draft";
type CIStatus = "passing" | "failing" | "pending" | null;
type ReviewStatus = "approved" | "changes_requested" | "review_requested" | null;

interface PullRequest {
  id: number;
  title: string;
  status: PRStatus;
  labels: PRLabel[];
  author: string;
  createdAt: string;
  commentCount: number;
  branch: string;
  ciStatus: CIStatus;
  reviewStatus: ReviewStatus;
}

const MOCK_PULLS: PullRequest[] = [
  {
    id: 287,
    title: "feat: Add user notification preferences page",
    status: "open",
    labels: [
      { name: "feature", variant: "accent" },
      { name: "frontend", variant: "primary" },
    ],
    author: "octocat",
    createdAt: "2026-05-24T09:15:00Z",
    commentCount: 4,
    branch: "feat/notification-prefs",
    ciStatus: "passing",
    reviewStatus: "approved",
  },
  {
    id: 286,
    title: "fix: Resolve race condition in WebSocket reconnection",
    status: "open",
    labels: [
      { name: "bug", variant: "danger" },
      { name: "priority: high", variant: "severe" },
    ],
    author: "monalisa",
    createdAt: "2026-05-23T16:40:00Z",
    commentCount: 8,
    branch: "fix/ws-reconnect",
    ciStatus: "failing",
    reviewStatus: "changes_requested",
  },
  {
    id: 285,
    title: "chore: Upgrade TypeScript to 5.6",
    status: "open",
    labels: [
      { name: "dependencies", variant: "primary" },
    ],
    author: "dependabot",
    createdAt: "2026-05-23T08:00:00Z",
    commentCount: 1,
    branch: "chore/ts-upgrade",
    ciStatus: "pending",
    reviewStatus: "review_requested",
  },
  {
    id: 284,
    title: "feat: Implement dark mode toggle in settings",
    status: "draft",
    labels: [
      { name: "enhancement", variant: "accent" },
      { name: "design", variant: "secondary" },
    ],
    author: "contributor42",
    createdAt: "2026-05-22T14:30:00Z",
    commentCount: 2,
    branch: "feat/dark-mode",
    ciStatus: "passing",
    reviewStatus: null,
  },
  {
    id: 283,
    title: "docs: Update API reference for v3 endpoints",
    status: "open",
    labels: [
      { name: "documentation", variant: "primary" },
    ],
    author: "janedoe",
    createdAt: "2026-05-21T11:00:00Z",
    commentCount: 0,
    branch: "docs/api-v3",
    ciStatus: "passing",
    reviewStatus: "review_requested",
  },
  {
    id: 282,
    title: "refactor: Extract auth middleware into shared package",
    status: "merged",
    labels: [
      { name: "refactor", variant: "secondary" },
      { name: "backend", variant: "default" },
    ],
    author: "devops-bot",
    createdAt: "2026-05-20T09:45:00Z",
    commentCount: 6,
    branch: "refactor/auth-middleware",
    ciStatus: "passing",
    reviewStatus: "approved",
  },
  {
    id: 281,
    title: "fix: Pagination offset error on filtered results",
    status: "merged",
    labels: [
      { name: "bug", variant: "danger" },
    ],
    author: "octocat",
    createdAt: "2026-05-19T15:20:00Z",
    commentCount: 3,
    branch: "fix/pagination-offset",
    ciStatus: "passing",
    reviewStatus: "approved",
  },
  {
    id: 280,
    title: "feat: Add CSV export for issue reports",
    status: "closed",
    labels: [
      { name: "feature", variant: "accent" },
    ],
    author: "i18n-team",
    createdAt: "2026-05-18T10:10:00Z",
    commentCount: 5,
    branch: "feat/csv-export",
    ciStatus: "failing",
    reviewStatus: "changes_requested",
  },
  {
    id: 279,
    title: "test: Add integration tests for OAuth flow",
    status: "merged",
    labels: [
      { name: "testing", variant: "secondary" },
      { name: "CI/CD", variant: "attention" },
    ],
    author: "janedoe",
    createdAt: "2026-05-17T08:30:00Z",
    commentCount: 2,
    branch: "test/oauth-integration",
    ciStatus: "passing",
    reviewStatus: "approved",
  },
  {
    id: 278,
    title: "fix: Memory leak in event listener cleanup",
    status: "open",
    labels: [
      { name: "bug", variant: "danger" },
      { name: "performance", variant: "attention" },
    ],
    author: "monalisa",
    createdAt: "2026-05-16T12:00:00Z",
    commentCount: 7,
    branch: "fix/memory-leak-events",
    ciStatus: null,
    reviewStatus: null,
  },
];

type FilterStatus = "open" | "closed";

function CIStatusIndicator({ status }: { status: CIStatus }) {
  if (!status) return null;
  switch (status) {
    case "passing":
      return (
        <span style={{ color: "var(--fgColor-success)" }}>
          <CheckIcon size={16} />
        </span>
      );
    case "failing":
      return (
        <span style={{ color: "var(--fgColor-danger)" }}>
          <XIcon size={16} />
        </span>
      );
    case "pending":
      return (
        <span style={{ color: "var(--fgColor-attention)" }}>
          <DotFillIcon size={16} />
        </span>
      );
  }
}

function ReviewStatusIndicator({ status }: { status: ReviewStatus }) {
  if (!status) return null;
  switch (status) {
    case "approved":
      return (
        <span style={{ color: "var(--fgColor-success)" }}>
          <ShieldCheckIcon size={16} />
        </span>
      );
    case "changes_requested":
      return (
        <span style={{ color: "var(--fgColor-danger)" }}>
          <FileDiffIcon size={16} />
        </span>
      );
    case "review_requested":
      return (
        <span style={{ color: "var(--fgColor-muted)" }}>
          <DotFillIcon size={16} />
        </span>
      );
  }
}

function getPRIcon(status: PRStatus) {
  switch (status) {
    case "open":
      return (
        <span style={{ color: "var(--fgColor-success)" }}>
          <GitPullRequestIcon size={16} />
        </span>
      );
    case "merged":
      return (
        <span style={{ color: "var(--fgColor-done)" }}>
          <GitMergeIcon size={16} />
        </span>
      );
    case "closed":
      return (
        <span style={{ color: "var(--fgColor-danger)" }}>
          <GitPullRequestClosedIcon size={16} />
        </span>
      );
    case "draft":
      return (
        <span style={{ color: "var(--fgColor-muted)" }}>
          <GitPullRequestDraftIcon size={16} />
        </span>
      );
  }
}

export default function PullRequestsPage() {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("open");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPulls = MOCK_PULLS.filter((pr) => {
    const matchesStatus =
      filterStatus === "open"
        ? pr.status === "open" || pr.status === "draft"
        : pr.status === "closed" || pr.status === "merged";
    const matchesSearch =
      searchQuery === "" ||
      pr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pr.labels.some((l) =>
        l.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      pr.branch.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const openCount = MOCK_PULLS.filter(
    (pr) => pr.status === "open" || pr.status === "draft"
  ).length;
  const closedCount = MOCK_PULLS.filter(
    (pr) => pr.status === "closed" || pr.status === "merged"
  ).length;

  return (
    <Stack direction="vertical" gap="normal">
      {/* Search bar and New pull request button */}
      <Stack direction="horizontal" gap="condensed" align="center">
        <div style={{ flex: 1 }}>
          <TextInput
            aria-label="Search all pull requests"
            placeholder="Search all pull requests"
            leadingVisual={SearchIcon}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            block
          />
        </div>
        <LinkButton href="/pulls/new" variant="primary">
          <Text>New pull request</Text>
        </LinkButton>
      </Stack>

      {/* Pull request list container */}
      <div
        style={{
          border: "var(--borderWidth-thin) solid var(--borderColor-default)",
          borderRadius: "var(--borderRadius-medium)",
          overflow: "hidden",
        }}
      >
        {/* Open / Closed toggle bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--stack-gap-normal)",
            padding: "var(--stack-gap-normal)",
            backgroundColor: "var(--bgColor-muted)",
            borderBottom:
              "var(--borderWidth-thin) solid var(--borderColor-default)",
          }}
        >
          <SegmentedControl
            aria-label="Filter pull requests by status"
            onChange={(selectedIndex) =>
              setFilterStatus(selectedIndex === 0 ? "open" : "closed")
            }
          >
            <SegmentedControl.Button
              selected={filterStatus === "open"}
              leadingIcon={GitPullRequestIcon}
              count={openCount}
            >
              Open
            </SegmentedControl.Button>
            <SegmentedControl.Button
              selected={filterStatus === "closed"}
              leadingIcon={CheckIcon}
              count={closedCount}
            >
              Closed
            </SegmentedControl.Button>
          </SegmentedControl>
        </div>

        {/* Pull request rows */}
        {filteredPulls.length > 0 ? (
          <ActionList showDividers>
            {filteredPulls.map((pr) => (
              <ActionList.LinkItem
                key={pr.id}
                href={`/pulls/${pr.id}`}
              >
                <ActionList.LeadingVisual>
                  {getPRIcon(pr.status)}
                </ActionList.LeadingVisual>
                <Stack direction="vertical" gap="condensed">
                  <Stack
                    direction="horizontal"
                    gap="condensed"
                    align="center"
                    wrap="wrap"
                  >
                    <Text weight="semibold">{pr.title}</Text>
                    <CIStatusIndicator status={pr.ciStatus} />
                    {pr.labels.length > 0 && (
                      <LabelGroup>
                        {pr.labels.map((label) => (
                          <Label
                            key={label.name}
                            variant={label.variant}
                            size="small"
                          >
                            {label.name}
                          </Label>
                        ))}
                      </LabelGroup>
                    )}
                  </Stack>
                  <Stack
                    direction="horizontal"
                    gap="condensed"
                    align="center"
                    wrap="wrap"
                  >
                    <Text size="small" weight="light">
                      #{pr.id} opened{" "}
                      <RelativeTime datetime={pr.createdAt} /> by {pr.author}
                    </Text>
                    <GitBranchIcon size={12} />
                    <BranchName as="span">
                      {pr.branch}
                    </BranchName>
                    <ReviewStatusIndicator status={pr.reviewStatus} />
                  </Stack>
                </Stack>
                {pr.commentCount > 0 && (
                  <ActionList.TrailingVisual>
                    <Stack
                      direction="horizontal"
                      gap="condensed"
                      align="center"
                    >
                      <CommentIcon size={16} />
                      <Text size="small">{pr.commentCount}</Text>
                    </Stack>
                  </ActionList.TrailingVisual>
                )}
              </ActionList.LinkItem>
            ))}
          </ActionList>
        ) : (
          <Blankslate>
            <Blankslate.Visual>
              <GitPullRequestIcon size={24} />
            </Blankslate.Visual>
            <Blankslate.Heading>
              No pull requests match your search
            </Blankslate.Heading>
            <Blankslate.Description>
              <Text>
                Try a different search term or clear the filter to see all{" "}
                {filterStatus} pull requests.
              </Text>
            </Blankslate.Description>
            <Blankslate.PrimaryAction href="/pulls/new">
              Create a new pull request
            </Blankslate.PrimaryAction>
          </Blankslate>
        )}
      </div>
    </Stack>
  );
}
