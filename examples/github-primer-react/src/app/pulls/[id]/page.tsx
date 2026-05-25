"use client";

import {
  Avatar,
  BranchName,
  Button,
  FormControl,
  Label,
  LabelGroup,
  RelativeTime,
  SplitPageLayout,
  Stack,
  StateLabel,
  Text,
  Textarea,
  Timeline,
} from "@primer/react";
import { PageHeader } from "@primer/react";
import {
  CheckIcon,
  XIcon,
  DotFillIcon,
  GitCommitIcon,
  GitMergeIcon,
  PersonIcon,
  TagIcon,
  SyncIcon,
  FileDiffIcon,
  AlertIcon,
  CommentIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@primer/octicons-react";
import { useParams } from "next/navigation";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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

interface Reviewer {
  login: string;
  avatarUrl: string;
  status: "approved" | "changes_requested" | "pending" | "commented";
}

interface Comment {
  id: number;
  author: string;
  avatarUrl: string;
  createdAt: string;
  body: string;
}

interface ReviewSummary {
  id: number;
  author: string;
  avatarUrl: string;
  createdAt: string;
  status: "approved" | "changes_requested";
  body: string;
}

interface CommitPush {
  id: number;
  actor: string;
  createdAt: string;
  commits: { sha: string; message: string }[];
}

interface EventEntry {
  id: number;
  type: "reviewer_added" | "label_applied" | "branch_updated";
  actor: string;
  createdAt: string;
  detail?: string;
  labelVariant?: PRLabel["variant"];
}

interface CICheck {
  name: string;
  status: "passing" | "failing" | "pending";
}

interface PRDetail {
  id: number;
  title: string;
  status: "open" | "closed" | "merged";
  author: string;
  authorAvatarUrl: string;
  createdAt: string;
  body: string;
  sourceBranch: string;
  targetBranch: string;
  commitCount: number;
  filesChanged: number;
  labels: PRLabel[];
  reviewers: Reviewer[];
  assignees: { login: string; avatarUrl: string }[];
  linkedIssues: { id: number; title: string }[];
  milestone: string | null;
  ciChecks: CICheck[];
  hasConflicts: boolean;
  comments: Comment[];
  reviewSummaries: ReviewSummary[];
  commitPushes: CommitPush[];
  events: EventEntry[];
}

/* ------------------------------------------------------------------ */
/*  Mock data — PR #256 from the list page                             */
/* ------------------------------------------------------------------ */

const PR: PRDetail = {
  id: 256,
  title: "Add support for server-side rendering in dashboard components",
  status: "open",
  author: "octocat",
  authorAvatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4",
  createdAt: "2025-05-23T10:15:00Z",
  body: "This PR adds server-side rendering support to all dashboard components. The main changes include:\n\n- Refactored `DashboardGrid` to support both client and server rendering paths\n- Added `getServerSideProps` wrappers for data-fetching components\n- Updated hydration logic to avoid mismatches between server and client output\n- Added integration tests for SSR scenarios\n\nCloses #241.",
  sourceBranch: "feat/ssr-dashboard",
  targetBranch: "main",
  commitCount: 7,
  filesChanged: 14,
  labels: [
    { name: "enhancement", variant: "accent" },
    { name: "performance", variant: "success" },
  ],
  reviewers: [
    {
      login: "monalisa",
      avatarUrl: "https://avatars.githubusercontent.com/u/2?v=4",
      status: "approved",
    },
    {
      login: "hubot",
      avatarUrl: "https://avatars.githubusercontent.com/u/480938?v=4",
      status: "changes_requested",
    },
    {
      login: "security-bot",
      avatarUrl: "https://avatars.githubusercontent.com/u/27347476?v=4",
      status: "pending",
    },
  ],
  assignees: [
    {
      login: "octocat",
      avatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4",
    },
  ],
  linkedIssues: [{ id: 241, title: "Dashboard components break without JS" }],
  milestone: "v2.5.0",
  ciChecks: [
    { name: "build", status: "passing" },
    { name: "lint", status: "passing" },
    { name: "test-unit", status: "passing" },
    { name: "test-e2e", status: "failing" },
    { name: "typecheck", status: "passing" },
  ],
  hasConflicts: false,
  comments: [
    {
      id: 1,
      author: "monalisa",
      avatarUrl: "https://avatars.githubusercontent.com/u/2?v=4",
      createdAt: "2025-05-23T12:00:00Z",
      body: "Nice work on the hydration mismatch fixes. I tested locally and the dashboard loads correctly with JS disabled. One minor suggestion: could we lazy-load the chart widgets to reduce the initial SSR payload?",
    },
    {
      id: 2,
      author: "octocat",
      avatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4",
      createdAt: "2025-05-23T14:30:00Z",
      body: "Good call @monalisa — I've added lazy loading for the chart components in the latest push. The SSR payload is now ~40% smaller.",
    },
    {
      id: 3,
      author: "hubot",
      avatarUrl: "https://avatars.githubusercontent.com/u/480938?v=4",
      createdAt: "2025-05-24T09:15:00Z",
      body: "The E2E tests are failing because the test fixtures don't account for the new server-rendered markup. I've left inline comments on the specific test files. Once those are fixed this looks good to merge.",
    },
  ],
  reviewSummaries: [
    {
      id: 201,
      author: "monalisa",
      avatarUrl: "https://avatars.githubusercontent.com/u/2?v=4",
      createdAt: "2025-05-23T13:00:00Z",
      status: "approved",
      body: "LGTM! The SSR approach is solid.",
    },
    {
      id: 202,
      author: "hubot",
      avatarUrl: "https://avatars.githubusercontent.com/u/480938?v=4",
      createdAt: "2025-05-24T09:20:00Z",
      status: "changes_requested",
      body: "E2E test fixtures need updating — see inline comments.",
    },
  ],
  commitPushes: [
    {
      id: 301,
      actor: "octocat",
      createdAt: "2025-05-23T14:25:00Z",
      commits: [
        { sha: "a1b2c3d", message: "feat: add lazy loading for chart widgets" },
        { sha: "e4f5g6h", message: "perf: reduce SSR payload size" },
      ],
    },
  ],
  events: [
    {
      id: 401,
      type: "reviewer_added",
      actor: "octocat",
      createdAt: "2025-05-23T10:16:00Z",
      detail: "monalisa",
    },
    {
      id: 402,
      type: "label_applied",
      actor: "octocat",
      createdAt: "2025-05-23T10:17:00Z",
      detail: "enhancement",
      labelVariant: "accent",
    },
    {
      id: 403,
      type: "label_applied",
      actor: "octocat",
      createdAt: "2025-05-23T10:17:30Z",
      detail: "performance",
      labelVariant: "success",
    },
    {
      id: 404,
      type: "reviewer_added",
      actor: "monalisa",
      createdAt: "2025-05-23T15:00:00Z",
      detail: "hubot",
    },
    {
      id: 405,
      type: "branch_updated",
      actor: "octocat",
      createdAt: "2025-05-24T08:00:00Z",
      detail: "feat/ssr-dashboard",
    },
  ],
};

/* ------------------------------------------------------------------ */
/*  Build chronological timeline                                       */
/* ------------------------------------------------------------------ */

type TimelineEntry =
  | { kind: "comment"; data: Comment }
  | { kind: "review"; data: ReviewSummary }
  | { kind: "push"; data: CommitPush }
  | { kind: "event"; data: EventEntry };

function buildTimeline(pr: PRDetail): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    ...pr.comments.map((c) => ({ kind: "comment" as const, data: c })),
    ...pr.reviewSummaries.map((r) => ({ kind: "review" as const, data: r })),
    ...pr.commitPushes.map((p) => ({ kind: "push" as const, data: p })),
    ...pr.events.map((e) => ({ kind: "event" as const, data: e })),
  ];
  entries.sort(
    (a, b) =>
      new Date(a.data.createdAt).getTime() -
      new Date(b.data.createdAt).getTime()
  );
  return entries;
}

/* ------------------------------------------------------------------ */
/*  Helper: review status icon                                         */
/* ------------------------------------------------------------------ */

function ReviewStatusIcon({
  status,
}: {
  status: "approved" | "changes_requested" | "pending" | "commented";
}) {
  switch (status) {
    case "approved":
      return (
        <span style={{ color: "var(--fgColor-success)", display: "inline-flex" }}>
          <CheckIcon size={16} />
        </span>
      );
    case "changes_requested":
      return (
        <span style={{ color: "var(--fgColor-danger)", display: "inline-flex" }}>
          <XIcon size={16} />
        </span>
      );
    case "pending":
      return (
        <span style={{ color: "var(--fgColor-muted)", display: "inline-flex" }}>
          <DotFillIcon size={16} />
        </span>
      );
    case "commented":
      return (
        <span style={{ color: "var(--fgColor-muted)", display: "inline-flex" }}>
          <CommentIcon size={16} />
        </span>
      );
  }
}

/* ------------------------------------------------------------------ */
/*  Helper: CI status icon                                             */
/* ------------------------------------------------------------------ */

function CIStatusIcon({ status }: { status: "passing" | "failing" | "pending" }) {
  switch (status) {
    case "passing":
      return (
        <span style={{ color: "var(--fgColor-success)", display: "inline-flex" }}>
          <CheckCircleIcon size={16} />
        </span>
      );
    case "failing":
      return (
        <span style={{ color: "var(--fgColor-danger)", display: "inline-flex" }}>
          <XCircleIcon size={16} />
        </span>
      );
    case "pending":
      return (
        <span style={{ color: "var(--fgColor-attention)", display: "inline-flex" }}>
          <DotFillIcon size={16} />
        </span>
      );
  }
}

/* ------------------------------------------------------------------ */
/*  Helper: StateLabel status mapping                                  */
/* ------------------------------------------------------------------ */

function getStateLabelStatus(status: "open" | "closed" | "merged") {
  switch (status) {
    case "open":
      return "pullOpened" as const;
    case "closed":
      return "pullClosed" as const;
    case "merged":
      return "pullMerged" as const;
  }
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function PullRequestDetailPage() {
  const params = useParams();
  const _id = params.id;
  const pr = PR;
  const timeline = buildTimeline(pr);

  const passingChecks = pr.ciChecks.filter((c) => c.status === "passing").length;
  const failingChecks = pr.ciChecks.filter((c) => c.status === "failing").length;
  const pendingChecks = pr.ciChecks.filter((c) => c.status === "pending").length;
  const allChecksPassing = failingChecks === 0 && pendingChecks === 0;
  const approvalCount = pr.reviewers.filter((r) => r.status === "approved").length;
  const changesRequestedCount = pr.reviewers.filter(
    (r) => r.status === "changes_requested"
  ).length;

  const canMerge =
    allChecksPassing && !pr.hasConflicts && changesRequestedCount === 0;

  return (
    <Stack gap="normal">
      {/* Page header */}
      <PageHeader>
        <PageHeader.TitleArea>
          <PageHeader.Title as="h1">
            {pr.title}{" "}
            <Text size="large" weight="light">
              #{pr.id}
            </Text>
          </PageHeader.Title>
        </PageHeader.TitleArea>
        <PageHeader.Description>
          <Stack direction="horizontal" align="center" gap="condensed" wrap="wrap">
            <StateLabel status={getStateLabelStatus(pr.status)}>
              {pr.status.charAt(0).toUpperCase() + pr.status.slice(1)}
            </StateLabel>
            <Text size="small" weight="light">
              <Text size="small" weight="semibold">
                {pr.author}
              </Text>{" "}
              wants to merge{" "}
              <Text size="small" weight="semibold">
                {pr.commitCount} commits
              </Text>{" "}
              into <BranchName as="span">{pr.targetBranch}</BranchName> from{" "}
              <BranchName as="span">{pr.sourceBranch}</BranchName>
            </Text>
            <Text size="small" weight="light">
              &middot;{" "}
              <RelativeTime datetime={pr.createdAt} threshold="P30D" /> &middot;{" "}
              {pr.filesChanged} files changed
            </Text>
          </Stack>
        </PageHeader.Description>
      </PageHeader>

      <hr
        style={{
          border: "none",
          borderTop: "1px solid var(--borderColor-default)",
          margin: 0,
        }}
      />

      {/* Main layout: content + sidebar */}
      <SplitPageLayout>
        <SplitPageLayout.Content>
          <Stack gap="normal">
            {/* Merge status area */}
            <div
              style={{
                border: "1px solid var(--borderColor-default)",
                borderRadius: "var(--borderRadius-medium)",
                padding: "var(--stack-gap-normal)",
              }}
            >
              <Stack gap="normal">
                {/* CI checks summary */}
                <Stack gap="condensed">
                  <Text size="small" weight="semibold">
                    Checks
                  </Text>
                  {pr.ciChecks.map((check) => (
                    <Stack
                      key={check.name}
                      direction="horizontal"
                      align="center"
                      gap="condensed"
                    >
                      <CIStatusIcon status={check.status} />
                      <Text size="small">{check.name}</Text>
                    </Stack>
                  ))}
                  <Text size="small" weight="light">
                    {passingChecks} passing
                    {failingChecks > 0 && `, ${failingChecks} failing`}
                    {pendingChecks > 0 && `, ${pendingChecks} pending`}
                  </Text>
                </Stack>

                <hr
                  style={{
                    border: "none",
                    borderTop: "1px solid var(--borderColor-default)",
                    margin: 0,
                  }}
                />

                {/* Review status */}
                <Stack gap="condensed">
                  <Text size="small" weight="semibold">
                    Reviews
                  </Text>
                  <Text size="small" weight="light">
                    {approvalCount > 0 && (
                      <span style={{ color: "var(--fgColor-success)" }}>
                        {approvalCount} approving
                      </span>
                    )}
                    {approvalCount > 0 && changesRequestedCount > 0 && ", "}
                    {changesRequestedCount > 0 && (
                      <span style={{ color: "var(--fgColor-danger)" }}>
                        {changesRequestedCount} requesting changes
                      </span>
                    )}
                  </Text>
                </Stack>

                <hr
                  style={{
                    border: "none",
                    borderTop: "1px solid var(--borderColor-default)",
                    margin: 0,
                  }}
                />

                {/* Conflicts */}
                <Stack direction="horizontal" align="center" gap="condensed">
                  {pr.hasConflicts ? (
                    <>
                      <span
                        style={{
                          color: "var(--fgColor-danger)",
                          display: "inline-flex",
                        }}
                      >
                        <AlertIcon size={16} />
                      </span>
                      <Text size="small" weight="light">
                        This branch has conflicts that must be resolved
                      </Text>
                    </>
                  ) : (
                    <>
                      <span
                        style={{
                          color: "var(--fgColor-success)",
                          display: "inline-flex",
                        }}
                      >
                        <CheckIcon size={16} />
                      </span>
                      <Text size="small" weight="light">
                        This branch has no conflicts with the base branch
                      </Text>
                    </>
                  )}
                </Stack>

                <hr
                  style={{
                    border: "none",
                    borderTop: "1px solid var(--borderColor-default)",
                    margin: 0,
                  }}
                />

                {/* Merge button */}
                <Stack direction="horizontal" justify="end">
                  <Button
                    variant="primary"
                    disabled={!canMerge}
                    leadingVisual={GitMergeIcon}
                  >
                    {canMerge ? "Merge pull request" : "Merge blocked"}
                  </Button>
                </Stack>
              </Stack>
            </div>

            {/* Conversation thread */}
            <Timeline>
              {/* Opening post — PR description */}
              <Timeline.Item>
                <Timeline.Badge>
                  <Avatar
                    src={pr.authorAvatarUrl}
                    alt={pr.author}
                    size={20}
                  />
                </Timeline.Badge>
                <Timeline.Body>
                  <Stack gap="condensed">
                    <Stack
                      direction="horizontal"
                      align="center"
                      gap="condensed"
                    >
                      <Text size="small" weight="semibold">
                        {pr.author}
                      </Text>
                      <Text size="small" weight="light">
                        commented{" "}
                        <RelativeTime
                          datetime={pr.createdAt}
                          threshold="P30D"
                        />
                      </Text>
                    </Stack>
                    <Text as="p" size="medium">
                      {pr.body.split("\n").map((line, i) => (
                        <span key={i}>
                          {line}
                          <br />
                        </span>
                      ))}
                    </Text>
                  </Stack>
                </Timeline.Body>
              </Timeline.Item>

              {/* Chronological timeline entries */}
              {timeline.map((entry) => {
                if (entry.kind === "comment") {
                  const c = entry.data;
                  return (
                    <Timeline.Item key={`comment-${c.id}`}>
                      <Timeline.Badge>
                        <Avatar src={c.avatarUrl} alt={c.author} size={20} />
                      </Timeline.Badge>
                      <Timeline.Body>
                        <Stack gap="condensed">
                          <Stack
                            direction="horizontal"
                            align="center"
                            gap="condensed"
                          >
                            <Text size="small" weight="semibold">
                              {c.author}
                            </Text>
                            <Text size="small" weight="light">
                              commented{" "}
                              <RelativeTime
                                datetime={c.createdAt}
                                threshold="P30D"
                              />
                            </Text>
                          </Stack>
                          <Text as="p" size="medium">
                            {c.body}
                          </Text>
                        </Stack>
                      </Timeline.Body>
                    </Timeline.Item>
                  );
                }

                if (entry.kind === "review") {
                  const r = entry.data;
                  return (
                    <Timeline.Item key={`review-${r.id}`}>
                      <Timeline.Badge>
                        {r.status === "approved" ? (
                          <span style={{ color: "var(--fgColor-success)" }}>
                            <CheckIcon size={16} />
                          </span>
                        ) : (
                          <span style={{ color: "var(--fgColor-danger)" }}>
                            <FileDiffIcon size={16} />
                          </span>
                        )}
                      </Timeline.Badge>
                      <Timeline.Body>
                        <Stack gap="condensed">
                          <Stack
                            direction="horizontal"
                            align="center"
                            gap="condensed"
                          >
                            <Avatar
                              src={r.avatarUrl}
                              alt={r.author}
                              size={20}
                            />
                            <Text size="small" weight="semibold">
                              {r.author}
                            </Text>
                            <Text size="small" weight="light">
                              {r.status === "approved"
                                ? "approved these changes"
                                : "requested changes"}{" "}
                              <RelativeTime
                                datetime={r.createdAt}
                                threshold="P30D"
                              />
                            </Text>
                          </Stack>
                          {r.body && (
                            <Text as="p" size="small" weight="light">
                              {r.body}
                            </Text>
                          )}
                        </Stack>
                      </Timeline.Body>
                    </Timeline.Item>
                  );
                }

                if (entry.kind === "push") {
                  const p = entry.data;
                  return (
                    <Timeline.Item key={`push-${p.id}`} condensed>
                      <Timeline.Badge>
                        <GitCommitIcon size={16} />
                      </Timeline.Badge>
                      <Timeline.Body>
                        <Stack gap="condensed">
                          <Stack
                            direction="horizontal"
                            align="center"
                            gap="condensed"
                          >
                            <Text size="small" weight="semibold">
                              {p.actor}
                            </Text>
                            <Text size="small" weight="light">
                              pushed {p.commits.length} commit
                              {p.commits.length !== 1 ? "s" : ""}{" "}
                              <RelativeTime
                                datetime={p.createdAt}
                                threshold="P30D"
                              />
                            </Text>
                          </Stack>
                          {p.commits.map((commit) => (
                            <Stack
                              key={commit.sha}
                              direction="horizontal"
                              align="center"
                              gap="condensed"
                            >
                              <Text
                                size="small"
                                weight="light"
                                style={{ fontFamily: "monospace" }}
                              >
                                {commit.sha.slice(0, 7)}
                              </Text>
                              <Text size="small">{commit.message}</Text>
                            </Stack>
                          ))}
                        </Stack>
                      </Timeline.Body>
                    </Timeline.Item>
                  );
                }

                // event
                const e = entry.data;
                return (
                  <Timeline.Item key={`event-${e.id}`} condensed>
                    <Timeline.Badge>
                      {e.type === "reviewer_added" && <PersonIcon size={16} />}
                      {e.type === "label_applied" && <TagIcon size={16} />}
                      {e.type === "branch_updated" && <SyncIcon size={16} />}
                    </Timeline.Badge>
                    <Timeline.Body>
                      <Stack
                        direction="horizontal"
                        align="center"
                        gap="condensed"
                      >
                        <Text size="small" weight="semibold">
                          {e.actor}
                        </Text>
                        {e.type === "reviewer_added" && (
                          <>
                            <Text size="small" weight="light">
                              requested review from
                            </Text>
                            <Text size="small" weight="semibold">
                              {e.detail}
                            </Text>
                          </>
                        )}
                        {e.type === "label_applied" && (
                          <>
                            <Text size="small" weight="light">
                              added the
                            </Text>
                            <Label
                              variant={e.labelVariant ?? "default"}
                              size="small"
                            >
                              {e.detail}
                            </Label>
                            <Text size="small" weight="light">
                              label
                            </Text>
                          </>
                        )}
                        {e.type === "branch_updated" && (
                          <Text size="small" weight="light">
                            force-pushed the{" "}
                            <BranchName as="span">{e.detail}</BranchName> branch
                          </Text>
                        )}
                        <Text size="small" weight="light">
                          <RelativeTime
                            datetime={e.createdAt}
                            threshold="P30D"
                          />
                        </Text>
                      </Stack>
                    </Timeline.Body>
                  </Timeline.Item>
                );
              })}
            </Timeline>

            {/* Comment composer */}
            <div
              style={{
                padding: "var(--stack-gap-normal)",
                border: "1px solid var(--borderColor-default)",
                borderRadius: "var(--borderRadius-medium)",
              }}
            >
              <Stack gap="normal">
                <FormControl>
                  <FormControl.Label>Add a comment</FormControl.Label>
                  <Textarea
                    block
                    placeholder="Leave a comment"
                    aria-label="Comment body"
                    resize="vertical"
                  />
                </FormControl>
                <Stack direction="horizontal" justify="end" gap="condensed">
                  <Button variant="default" leadingVisual={CheckIcon}>
                    Approve
                  </Button>
                  <Button variant="default" leadingVisual={FileDiffIcon}>
                    Request changes
                  </Button>
                  <Button variant="default">Comment</Button>
                </Stack>
              </Stack>
            </div>
          </Stack>
        </SplitPageLayout.Content>

        {/* Sidebar */}
        <SplitPageLayout.Pane position="end">
          <Stack gap="spacious">
            {/* Reviewers */}
            <Stack gap="condensed">
              <Text size="small" weight="semibold">
                Reviewers
              </Text>
              {pr.reviewers.map((r) => (
                <Stack
                  key={r.login}
                  direction="horizontal"
                  align="center"
                  gap="condensed"
                >
                  <Avatar src={r.avatarUrl} alt={r.login} size={20} />
                  <Text size="small" weight="medium">
                    {r.login}
                  </Text>
                  <ReviewStatusIcon status={r.status} />
                </Stack>
              ))}
            </Stack>

            {/* Assignees */}
            <Stack gap="condensed">
              <Text size="small" weight="semibold">
                Assignees
              </Text>
              {pr.assignees.map((a) => (
                <Stack
                  key={a.login}
                  direction="horizontal"
                  align="center"
                  gap="condensed"
                >
                  <Avatar src={a.avatarUrl} alt={a.login} size={20} />
                  <Text size="small" weight="medium">
                    {a.login}
                  </Text>
                </Stack>
              ))}
            </Stack>

            {/* Labels */}
            <Stack gap="condensed">
              <Text size="small" weight="semibold">
                Labels
              </Text>
              <LabelGroup>
                {pr.labels.map((l) => (
                  <Label key={l.name} variant={l.variant}>
                    {l.name}
                  </Label>
                ))}
              </LabelGroup>
            </Stack>

            {/* Linked issues */}
            <Stack gap="condensed">
              <Text size="small" weight="semibold">
                Linked issues
              </Text>
              {pr.linkedIssues.map((issue) => (
                <Text key={issue.id} size="small" weight="light">
                  #{issue.id} {issue.title}
                </Text>
              ))}
            </Stack>

            {/* Milestone */}
            <Stack gap="condensed">
              <Text size="small" weight="semibold">
                Milestone
              </Text>
              <Text size="small" weight="light">
                {pr.milestone ?? "No milestone"}
              </Text>
            </Stack>
          </Stack>
        </SplitPageLayout.Pane>
      </SplitPageLayout>
    </Stack>
  );
}
