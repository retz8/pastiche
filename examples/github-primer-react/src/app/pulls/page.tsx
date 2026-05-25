"use client";

import { useState } from "react";
import {
  ActionList,
  BranchName,
  Label,
  LabelGroup,
  LinkButton,
  SegmentedControl,
  Stack,
  StateLabel,
  Text,
  TextInput,
  RelativeTime,
  Token,
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
  EyeIcon,
} from "@primer/octicons-react";

// --- Types ---

type PRStatus = "open" | "closed" | "merged" | "draft";
type ReviewStatus = "approved" | "changes_requested" | "review_requested" | "none";
type CIStatus = "passing" | "failing" | "pending" | "none";

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

interface PullRequest {
  id: number;
  title: string;
  status: PRStatus;
  branch: string;
  labels: PRLabel[];
  author: string;
  createdAt: string;
  commentCount: number;
  reviewStatus: ReviewStatus;
  ciStatus: CIStatus;
}

// --- Mock Data ---

const PULL_REQUESTS: PullRequest[] = [
  {
    id: 256,
    title: "Add support for server-side rendering in dashboard components",
    status: "open",
    branch: "feat/ssr-dashboard",
    labels: [
      { name: "enhancement", variant: "accent" },
      { name: "performance", variant: "success" },
    ],
    author: "octocat",
    createdAt: "2025-05-23T10:15:00Z",
    commentCount: 8,
    reviewStatus: "approved",
    ciStatus: "passing",
  },
  {
    id: 255,
    title: "Fix memory leak in WebSocket connection handler",
    status: "open",
    branch: "fix/ws-memory-leak",
    labels: [
      { name: "bug", variant: "danger" },
      { name: "critical", variant: "severe" },
    ],
    author: "monalisa",
    createdAt: "2025-05-22T16:30:00Z",
    commentCount: 14,
    reviewStatus: "changes_requested",
    ciStatus: "failing",
  },
  {
    id: 254,
    title: "Migrate authentication module to OAuth 2.1",
    status: "open",
    branch: "feat/oauth-2.1-migration",
    labels: [
      { name: "security", variant: "danger" },
      { name: "breaking change", variant: "attention" },
    ],
    author: "security-bot",
    createdAt: "2025-05-21T09:00:00Z",
    commentCount: 22,
    reviewStatus: "review_requested",
    ciStatus: "pending",
  },
  {
    id: 253,
    title: "Update README with new contribution guidelines",
    status: "draft",
    branch: "docs/contribution-guide",
    labels: [{ name: "documentation", variant: "done" }],
    author: "hubot",
    createdAt: "2025-05-20T14:45:00Z",
    commentCount: 2,
    reviewStatus: "none",
    ciStatus: "none",
  },
  {
    id: 252,
    title: "Implement dark mode toggle in settings panel",
    status: "merged",
    branch: "feat/dark-mode-settings",
    labels: [
      { name: "enhancement", variant: "accent" },
      { name: "design", variant: "secondary" },
    ],
    author: "monalisa",
    createdAt: "2025-05-19T11:20:00Z",
    commentCount: 6,
    reviewStatus: "approved",
    ciStatus: "passing",
  },
  {
    id: 251,
    title: "Refactor API client to use fetch instead of axios",
    status: "merged",
    branch: "refactor/fetch-api-client",
    labels: [{ name: "refactor", variant: "secondary" }],
    author: "octocat",
    createdAt: "2025-05-18T08:30:00Z",
    commentCount: 11,
    reviewStatus: "approved",
    ciStatus: "passing",
  },
  {
    id: 250,
    title: "Add rate limiting middleware for API endpoints",
    status: "open",
    branch: "feat/rate-limiting",
    labels: [
      { name: "security", variant: "danger" },
      { name: "enhancement", variant: "accent" },
    ],
    author: "security-bot",
    createdAt: "2025-05-17T15:10:00Z",
    commentCount: 4,
    reviewStatus: "review_requested",
    ciStatus: "passing",
  },
  {
    id: 249,
    title: "Fix pagination offset calculation in search results",
    status: "closed",
    branch: "fix/pagination-offset",
    labels: [{ name: "bug", variant: "danger" }],
    author: "hubot",
    createdAt: "2025-05-16T10:00:00Z",
    commentCount: 3,
    reviewStatus: "none",
    ciStatus: "failing",
  },
  {
    id: 248,
    title: "Add E2E tests for user registration flow",
    status: "open",
    branch: "test/e2e-registration",
    labels: [
      { name: "testing", variant: "accent" },
      { name: "good first issue", variant: "sponsors" },
    ],
    author: "a11y-bot",
    createdAt: "2025-05-15T13:25:00Z",
    commentCount: 1,
    reviewStatus: "none",
    ciStatus: "pending",
  },
  {
    id: 247,
    title: "Upgrade TypeScript to 5.5 and fix type errors",
    status: "merged",
    branch: "chore/typescript-5.5",
    labels: [
      { name: "dependencies", variant: "accent" },
      { name: "maintenance", variant: "attention" },
    ],
    author: "dependabot",
    createdAt: "2025-05-14T07:50:00Z",
    commentCount: 5,
    reviewStatus: "approved",
    ciStatus: "passing",
  },
  {
    id: 246,
    title: "Implement lazy loading for image gallery component",
    status: "draft",
    branch: "feat/lazy-image-gallery",
    labels: [
      { name: "enhancement", variant: "accent" },
      { name: "performance", variant: "success" },
    ],
    author: "monalisa",
    createdAt: "2025-05-13T16:40:00Z",
    commentCount: 0,
    reviewStatus: "none",
    ciStatus: "none",
  },
];

// --- Helpers ---

function getStateLabelStatus(status: PRStatus) {
  switch (status) {
    case "open":
      return "pullOpened" as const;
    case "closed":
      return "pullClosed" as const;
    case "merged":
      return "pullMerged" as const;
    case "draft":
      return "draft" as const;
  }
}

function CIStatusIndicator({ status }: { status: CIStatus }) {
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
    default:
      return null;
  }
}

function ReviewStatusIndicator({ status }: { status: ReviewStatus }) {
  switch (status) {
    case "approved":
      return (
        <span
          title="Approved"
          style={{
            color: "var(--fgColor-success)",
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--stack-gap-condensed)",
          }}
        >
          <CheckIcon size={16} />
        </span>
      );
    case "changes_requested":
      return (
        <span
          title="Changes requested"
          style={{
            color: "var(--fgColor-danger)",
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--stack-gap-condensed)",
          }}
        >
          <XIcon size={16} />
        </span>
      );
    case "review_requested":
      return (
        <span
          title="Review requested"
          style={{
            color: "var(--fgColor-muted)",
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--stack-gap-condensed)",
          }}
        >
          <EyeIcon size={16} />
        </span>
      );
    default:
      return null;
  }
}

// --- Page ---

export default function PullRequestsPage() {
  const [filter, setFilter] = useState<"open" | "closed">("open");
  const [searchQuery, setSearchQuery] = useState("");

  const openPRs = PULL_REQUESTS.filter(
    (pr) => pr.status === "open" || pr.status === "draft"
  );
  const closedPRs = PULL_REQUESTS.filter(
    (pr) => pr.status === "closed" || pr.status === "merged"
  );

  const openCount = openPRs.length;
  const closedCount = closedPRs.length;

  const basePRs = filter === "open" ? openPRs : closedPRs;

  const filteredPRs = basePRs.filter((pr) => {
    if (searchQuery === "") return true;
    const q = searchQuery.toLowerCase();
    return (
      pr.title.toLowerCase().includes(q) ||
      pr.branch.toLowerCase().includes(q) ||
      pr.labels.some((l) => l.name.toLowerCase().includes(q)) ||
      pr.author.toLowerCase().includes(q)
    );
  });

  return (
    <Stack gap="normal">
      {/* Search bar + New pull request button */}
      <Stack direction="horizontal" gap="condensed" align="center">
        <TextInput
          aria-label="Search all pull requests"
          placeholder="Search all pull requests"
          leadingVisual={SearchIcon}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1 }}
          contrast
        />
        <LinkButton href="/pulls/new" variant="primary">
          New pull request
        </LinkButton>
      </Stack>

      {/* Open / Closed toggle */}
      <div>
        <SegmentedControl
          aria-label="Pull request status filter"
          onChange={(index) => setFilter(index === 0 ? "open" : "closed")}
        >
          <SegmentedControl.Button
            selected={filter === "open"}
            leadingIcon={GitPullRequestIcon}
            count={openCount}
          >
            Open
          </SegmentedControl.Button>
          <SegmentedControl.Button
            selected={filter === "closed"}
            leadingIcon={GitMergeIcon}
            count={closedCount}
          >
            Closed
          </SegmentedControl.Button>
        </SegmentedControl>
      </div>

      {/* Pull request list */}
      {filteredPRs.length === 0 ? (
        <Blankslate>
          <Blankslate.Visual>
            <GitPullRequestIcon size={24} />
          </Blankslate.Visual>
          <Blankslate.Heading>No pull requests found</Blankslate.Heading>
          <Blankslate.Description>
            {searchQuery
              ? "No pull requests match your search. Try a different query."
              : filter === "open"
                ? "There are no open pull requests."
                : "There are no closed pull requests."}
          </Blankslate.Description>
          {searchQuery && (
            <Blankslate.PrimaryAction onClick={() => setSearchQuery("")}>
              Clear search
            </Blankslate.PrimaryAction>
          )}
        </Blankslate>
      ) : (
        <ActionList showDividers>
          {filteredPRs.map((pr) => (
            <ActionList.LinkItem key={pr.id} href={`/pulls/${pr.id}`}>
              <ActionList.LeadingVisual>
                <StateLabel
                  status={getStateLabelStatus(pr.status)}
                  size="small"
                />
              </ActionList.LeadingVisual>
              <div>
                <Stack
                  direction="horizontal"
                  align="center"
                  gap="condensed"
                  wrap="wrap"
                >
                  <Text weight="semibold">{pr.title}</Text>
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
                  align="center"
                  gap="condensed"
                  wrap="wrap"
                >
                  <Text size="small" weight="light">
                    #{pr.id} opened{" "}
                    <RelativeTime
                      datetime={pr.createdAt}
                      threshold="P30D"
                    />{" "}
                    by {pr.author}
                  </Text>
                  <BranchName as="span">{pr.branch}</BranchName>
                </Stack>
              </div>
              <ActionList.TrailingVisual>
                <Stack direction="horizontal" align="center" gap="condensed">
                  <CIStatusIndicator status={pr.ciStatus} />
                  <ReviewStatusIndicator status={pr.reviewStatus} />
                  {pr.commentCount > 0 && (
                    <Stack
                      direction="horizontal"
                      align="center"
                      gap="condensed"
                    >
                      <CommentIcon size={16} />
                      <Text size="small">{pr.commentCount}</Text>
                    </Stack>
                  )}
                </Stack>
              </ActionList.TrailingVisual>
            </ActionList.LinkItem>
          ))}
        </ActionList>
      )}
    </Stack>
  );
}
