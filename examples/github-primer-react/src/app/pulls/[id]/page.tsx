"use client";

import {
  Avatar,
  BranchName,
  Button,
  FormControl,
  Heading,
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
import {
  CheckIcon,
  CommentIcon,
  GitCommitIcon,
  GitMergeIcon,
  GitPullRequestIcon,
  PersonIcon,
  TagIcon,
  XIcon,
  AlertIcon,
  ShieldCheckIcon,
  FileDiffIcon,
  SyncIcon,
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
  status: "approved" | "changes_requested" | "pending";
}

interface Assignee {
  login: string;
  avatarUrl: string;
}

interface LinkedIssue {
  id: number;
  title: string;
}

interface CICheck {
  name: string;
  status: "passing" | "failing" | "pending";
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
  verdict: "approved" | "changes_requested";
  body?: string;
}

interface CommitPush {
  id: number;
  author: string;
  createdAt: string;
  commits: { sha: string; message: string }[];
}

interface EventEntry {
  id: number;
  type: "reviewer_added" | "label_applied" | "branch_updated";
  actor: string;
  createdAt: string;
  detail?: string;
}

type TimelineEntry =
  | { kind: "comment"; data: Comment }
  | { kind: "review"; data: ReviewSummary }
  | { kind: "commit_push"; data: CommitPush }
  | { kind: "event"; data: EventEntry };

interface PRDetail {
  id: number;
  title: string;
  status: "open" | "closed" | "merged";
  author: string;
  authorAvatarUrl: string;
  createdAt: string;
  sourceBranch: string;
  targetBranch: string;
  commitCount: number;
  filesChanged: number;
  body: string;
  labels: PRLabel[];
  assignees: Assignee[];
  reviewers: Reviewer[];
  linkedIssues: LinkedIssue[];
  milestone: string | null;
  ciChecks: CICheck[];
  hasConflicts: boolean;
  timeline: TimelineEntry[];
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const MOCK_PR: PRDetail = {
  id: 287,
  title: "feat: Add user notification preferences page",
  status: "open",
  author: "octocat",
  authorAvatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4",
  createdAt: "2026-05-24T09:15:00Z",
  sourceBranch: "feat/notification-prefs",
  targetBranch: "main",
  commitCount: 5,
  filesChanged: 12,
  body: "This PR adds a new user notification preferences page that allows users to configure their notification settings per-channel (email, in-app, push).\n\n## Changes\n- Added `NotificationPreferences` component with channel toggles\n- Created API endpoint for persisting preferences\n- Added unit tests for the preferences reducer\n- Updated the settings navigation to include the new page\n\n## Screenshots\nDesktop and mobile layouts have been verified manually.\n\nCloses #245",
  labels: [
    { name: "feature", variant: "accent" },
    { name: "frontend", variant: "primary" },
  ],
  assignees: [
    {
      login: "octocat",
      avatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4",
    },
  ],
  reviewers: [
    {
      login: "monalisa",
      avatarUrl: "https://avatars.githubusercontent.com/u/104456405?v=4",
      status: "approved",
    },
    {
      login: "contributor42",
      avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
      status: "changes_requested",
    },
    {
      login: "janedoe",
      avatarUrl: "https://avatars.githubusercontent.com/u/2?v=4",
      status: "pending",
    },
  ],
  linkedIssues: [
    { id: 245, title: "Add notification preferences UI" },
  ],
  milestone: "v2.4 Release",
  ciChecks: [
    { name: "build", status: "passing" },
    { name: "lint", status: "passing" },
    { name: "test-unit", status: "passing" },
    { name: "test-e2e", status: "failing" },
    { name: "deploy-preview", status: "pending" },
  ],
  hasConflicts: false,
  timeline: [
    {
      kind: "event",
      data: {
        id: 1,
        type: "label_applied",
        actor: "octocat",
        createdAt: "2026-05-24T09:16:00Z",
        detail: "feature",
      },
    },
    {
      kind: "event",
      data: {
        id: 2,
        type: "reviewer_added",
        actor: "octocat",
        createdAt: "2026-05-24T09:17:00Z",
        detail: "monalisa",
      },
    },
    {
      kind: "event",
      data: {
        id: 3,
        type: "reviewer_added",
        actor: "octocat",
        createdAt: "2026-05-24T09:17:00Z",
        detail: "contributor42",
      },
    },
    {
      kind: "comment",
      data: {
        id: 4,
        author: "monalisa",
        avatarUrl: "https://avatars.githubusercontent.com/u/104456405?v=4",
        createdAt: "2026-05-24T11:30:00Z",
        body: "Looks great overall! The component structure is clean. Just a couple of minor suggestions on the styling of the toggle switches.",
      },
    },
    {
      kind: "review",
      data: {
        id: 5,
        author: "monalisa",
        avatarUrl: "https://avatars.githubusercontent.com/u/104456405?v=4",
        createdAt: "2026-05-24T11:35:00Z",
        verdict: "approved",
        body: "LGTM! Nice work on the accessibility attributes.",
      },
    },
    {
      kind: "commit_push",
      data: {
        id: 6,
        author: "octocat",
        createdAt: "2026-05-24T14:00:00Z",
        commits: [
          { sha: "a1b2c3d", message: "fix: address review feedback on toggle styling" },
          { sha: "e4f5g6h", message: "test: add missing test for email channel" },
        ],
      },
    },
    {
      kind: "comment",
      data: {
        id: 7,
        author: "contributor42",
        avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
        createdAt: "2026-05-24T15:20:00Z",
        body: "The API endpoint should validate the channel type before persisting. Right now it accepts any string value. Also, the error handling in the reducer doesn't reset the loading state on failure.",
      },
    },
    {
      kind: "review",
      data: {
        id: 8,
        author: "contributor42",
        avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
        createdAt: "2026-05-24T15:25:00Z",
        verdict: "changes_requested",
        body: "Needs validation on the API side and error handling fix in the reducer.",
      },
    },
    {
      kind: "event",
      data: {
        id: 9,
        type: "branch_updated",
        actor: "octocat",
        createdAt: "2026-05-24T18:00:00Z",
      },
    },
    {
      kind: "comment",
      data: {
        id: 10,
        author: "octocat",
        avatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4",
        createdAt: "2026-05-24T18:30:00Z",
        body: "Good catches @contributor42! I've added input validation for the channel types and fixed the reducer to properly reset loading state on error. Ready for another look.",
      },
    },
  ],
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function CommentBlock({
  author,
  avatarUrl,
  createdAt,
  body,
}: {
  author: string;
  avatarUrl: string;
  createdAt: string;
  body: string;
}) {
  return (
    <div
      style={{
        border: "var(--borderWidth-thin) solid var(--borderColor-default)",
        borderRadius: "var(--borderRadius-medium)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--base-size-8)",
          padding: "var(--base-size-8) var(--base-size-16)",
          backgroundColor: "var(--bgColor-muted)",
          borderBottom:
            "var(--borderWidth-thin) solid var(--borderColor-default)",
        }}
      >
        <Avatar src={avatarUrl} size={20} alt={author} />
        <Text size="small" weight="semibold">
          {author}
        </Text>
        <Text size="small" weight="light">
          {"commented "}
          <RelativeTime datetime={createdAt} />
        </Text>
      </div>
      <div style={{ padding: "var(--base-size-16)" }}>
        <Text as="p" size="medium">
          {body}
        </Text>
      </div>
    </div>
  );
}

function ReviewBlock({
  review,
}: {
  review: ReviewSummary;
}) {
  const isApproved = review.verdict === "approved";
  return (
    <div
      style={{
        border: "var(--borderWidth-thin) solid var(--borderColor-default)",
        borderRadius: "var(--borderRadius-medium)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--base-size-8)",
          padding: "var(--base-size-8) var(--base-size-16)",
          backgroundColor: isApproved
            ? "var(--bgColor-success-muted)"
            : "var(--bgColor-attention-muted)",
          borderBottom:
            "var(--borderWidth-thin) solid var(--borderColor-default)",
        }}
      >
        <Avatar src={review.avatarUrl} size={20} alt={review.author} />
        <Text size="small" weight="semibold">
          {review.author}
        </Text>
        <Text size="small" weight="light">
          {isApproved ? "approved these changes" : "requested changes"}
          {" "}
          <RelativeTime datetime={review.createdAt} />
        </Text>
      </div>
      {review.body && (
        <div style={{ padding: "var(--base-size-16)" }}>
          <Text as="p" size="medium">
            {review.body}
          </Text>
        </div>
      )}
    </div>
  );
}

function TimelineEventEntry({ event }: { event: EventEntry }) {
  let icon;
  let description: string;

  switch (event.type) {
    case "reviewer_added":
      icon = <PersonIcon size={16} />;
      description = `${event.actor} requested review from ${event.detail}`;
      break;
    case "label_applied":
      icon = <TagIcon size={16} />;
      description = `${event.actor} added the ${event.detail} label`;
      break;
    case "branch_updated":
      icon = <SyncIcon size={16} />;
      description = `${event.actor} force-pushed the branch`;
      break;
    default:
      icon = <GitPullRequestIcon size={16} />;
      description = "Unknown event";
  }

  return (
    <Stack direction="horizontal" gap="condensed" align="center">
      <span style={{ color: "var(--fgColor-muted)" }}>{icon}</span>
      <Text size="small" weight="light">
        {description}
      </Text>
      <Text size="small" weight="light">
        <RelativeTime datetime={event.createdAt} />
      </Text>
    </Stack>
  );
}

/* ------------------------------------------------------------------ */
/*  Merge status area                                                  */
/* ------------------------------------------------------------------ */

function MergeStatusArea({
  ciChecks,
  reviewers,
  hasConflicts,
}: {
  ciChecks: CICheck[];
  reviewers: Reviewer[];
  hasConflicts: boolean;
}) {
  const passing = ciChecks.filter((c) => c.status === "passing").length;
  const failing = ciChecks.filter((c) => c.status === "failing").length;
  const pending = ciChecks.filter((c) => c.status === "pending").length;
  const approvals = reviewers.filter((r) => r.status === "approved").length;
  const changesRequested = reviewers.filter(
    (r) => r.status === "changes_requested"
  ).length;

  const canMerge = failing === 0 && !hasConflicts && changesRequested === 0;

  return (
    <div
      style={{
        border: "var(--borderWidth-thin) solid var(--borderColor-default)",
        borderRadius: "var(--borderRadius-medium)",
        overflow: "hidden",
      }}
    >
      {/* CI checks */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--base-size-8)",
          padding: "var(--base-size-12) var(--base-size-16)",
          borderBottom:
            "var(--borderWidth-thin) solid var(--borderColor-default)",
        }}
      >
        <ShieldCheckIcon size={16} />
        <Text size="small" weight="medium">
          {passing} passing
        </Text>
        {failing > 0 && (
          <Text size="small" style={{ color: "var(--fgColor-danger)" }}>
            {failing} failing
          </Text>
        )}
        {pending > 0 && (
          <Text size="small" style={{ color: "var(--fgColor-attention)" }}>
            {pending} pending
          </Text>
        )}
      </div>

      {/* Review status */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--base-size-8)",
          padding: "var(--base-size-12) var(--base-size-16)",
          borderBottom:
            "var(--borderWidth-thin) solid var(--borderColor-default)",
        }}
      >
        <CheckIcon size={16} />
        <Text size="small" weight="medium">
          {approvals} approving review{approvals !== 1 ? "s" : ""}
        </Text>
        {changesRequested > 0 && (
          <Text size="small" style={{ color: "var(--fgColor-attention)" }}>
            {changesRequested} requesting changes
          </Text>
        )}
      </div>

      {/* Conflicts */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--base-size-8)",
          padding: "var(--base-size-12) var(--base-size-16)",
          borderBottom:
            "var(--borderWidth-thin) solid var(--borderColor-default)",
        }}
      >
        {hasConflicts ? (
          <>
            <AlertIcon size={16} />
            <Text size="small" style={{ color: "var(--fgColor-danger)" }}>
              This branch has conflicts that must be resolved
            </Text>
          </>
        ) : (
          <>
            <CheckIcon size={16} />
            <Text size="small" weight="medium">
              This branch has no conflicts with the base branch
            </Text>
          </>
        )}
      </div>

      {/* Merge button */}
      <div
        style={{
          padding: "var(--base-size-12) var(--base-size-16)",
          backgroundColor: "var(--bgColor-muted)",
        }}
      >
        <Button
          variant={canMerge ? "primary" : "default"}
          disabled={!canMerge}
          leadingVisual={GitMergeIcon}
        >
          {canMerge ? "Merge pull request" : "Merge blocked"}
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function PullRequestDetailPage() {
  const params = useParams();
  const _id = params.id;
  const pr = MOCK_PR;

  const statusMap = {
    open: "pullOpened" as const,
    closed: "pullClosed" as const,
    merged: "pullMerged" as const,
  };

  return (
    <Stack direction="vertical" gap="spacious">
      {/* ---- Page header ---- */}
      <div>
        <Stack direction="vertical" gap="condensed">
          <Stack direction="horizontal" gap="condensed" align="start" wrap="wrap">
            <Heading as="h1">
              {pr.title}{" "}
              <span style={{ fontWeight: "var(--base-text-weight-light)", color: "var(--fgColor-muted)" }}>
                #{pr.id}
              </span>
            </Heading>
          </Stack>

          <Stack direction="horizontal" gap="condensed" align="center" wrap="wrap">
            <StateLabel status={statusMap[pr.status]}>
              {pr.status.charAt(0).toUpperCase() + pr.status.slice(1)}
            </StateLabel>
            <Text size="small" weight="light">
              <Text size="small" weight="semibold">
                {pr.author}
              </Text>
              {" wants to merge "}
              {pr.commitCount} commit{pr.commitCount !== 1 ? "s" : ""} into{" "}
              <BranchName>{pr.targetBranch}</BranchName>
              {" from "}
              <BranchName>{pr.sourceBranch}</BranchName>
            </Text>
            <Text size="small" weight="light">
              {" · "}
              <FileDiffIcon size={12} /> {pr.filesChanged} files changed
            </Text>
          </Stack>
        </Stack>
      </div>

      <hr
        style={{
          border: "none",
          borderTop:
            "var(--borderWidth-thin) solid var(--borderColor-default)",
          margin: 0,
        }}
      />

      {/* ---- Two-column layout ---- */}
      <SplitPageLayout>
        <SplitPageLayout.Content>
          <Stack direction="vertical" gap="normal">
            {/* Merge status area */}
            <MergeStatusArea
              ciChecks={pr.ciChecks}
              reviewers={pr.reviewers}
              hasConflicts={pr.hasConflicts}
            />

            {/* Opening post (PR description) */}
            <Stack direction="horizontal" gap="normal" align="start">
              <Avatar
                src={pr.authorAvatarUrl}
                size={40}
                alt={pr.author}
              />
              <div style={{ flex: 1 }}>
                <CommentBlock
                  author={pr.author}
                  avatarUrl={pr.authorAvatarUrl}
                  createdAt={pr.createdAt}
                  body={pr.body}
                />
              </div>
            </Stack>

            {/* Timeline */}
            <Timeline>
              {pr.timeline.map((entry) => {
                if (entry.kind === "comment") {
                  const c = entry.data;
                  return (
                    <Timeline.Item key={c.id}>
                      <Timeline.Badge>
                        <CommentIcon size={16} />
                      </Timeline.Badge>
                      <Timeline.Body>
                        <Stack direction="horizontal" gap="normal" align="start">
                          <Avatar src={c.avatarUrl} size={40} alt={c.author} />
                          <div style={{ flex: 1 }}>
                            <CommentBlock
                              author={c.author}
                              avatarUrl={c.avatarUrl}
                              createdAt={c.createdAt}
                              body={c.body}
                            />
                          </div>
                        </Stack>
                      </Timeline.Body>
                    </Timeline.Item>
                  );
                } else if (entry.kind === "review") {
                  const r = entry.data;
                  return (
                    <Timeline.Item key={r.id}>
                      <Timeline.Badge>
                        {r.verdict === "approved" ? (
                          <CheckIcon size={16} />
                        ) : (
                          <XIcon size={16} />
                        )}
                      </Timeline.Badge>
                      <Timeline.Body>
                        <Stack direction="horizontal" gap="normal" align="start">
                          <Avatar src={r.avatarUrl} size={40} alt={r.author} />
                          <div style={{ flex: 1 }}>
                            <ReviewBlock review={r} />
                          </div>
                        </Stack>
                      </Timeline.Body>
                    </Timeline.Item>
                  );
                } else if (entry.kind === "commit_push") {
                  const cp = entry.data;
                  return (
                    <Timeline.Item key={cp.id} condensed>
                      <Timeline.Badge>
                        <GitCommitIcon size={16} />
                      </Timeline.Badge>
                      <Timeline.Body>
                        <Stack direction="vertical" gap="condensed">
                          <Text size="small" weight="light">
                            <Text size="small" weight="semibold">
                              {cp.author}
                            </Text>
                            {" pushed "}
                            {cp.commits.length} commit{cp.commits.length !== 1 ? "s" : ""}
                            {" "}
                            <RelativeTime datetime={cp.createdAt} />
                          </Text>
                          {cp.commits.map((commit) => (
                            <Stack
                              key={commit.sha}
                              direction="horizontal"
                              gap="condensed"
                              align="center"
                            >
                              <Text
                                size="small"
                                style={{
                                  fontFamily: "var(--fontStack-monospace)",
                                  color: "var(--fgColor-accent)",
                                }}
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
                } else {
                  const e = entry.data;
                  return (
                    <Timeline.Item key={e.id} condensed>
                      <Timeline.Badge>
                        {e.type === "reviewer_added" && <PersonIcon size={16} />}
                        {e.type === "label_applied" && <TagIcon size={16} />}
                        {e.type === "branch_updated" && <SyncIcon size={16} />}
                      </Timeline.Badge>
                      <Timeline.Body>
                        <TimelineEventEntry event={e} />
                      </Timeline.Body>
                    </Timeline.Item>
                  );
                }
              })}
            </Timeline>

            {/* Comment composer */}
            <Stack direction="horizontal" gap="normal" align="start">
              <Avatar
                src="https://avatars.githubusercontent.com/u/583231?v=4"
                size={40}
                alt="You"
              />
              <div style={{ flex: 1 }}>
                <Stack direction="vertical" gap="condensed">
                  <FormControl>
                    <FormControl.Label visuallyHidden>
                      Leave a comment
                    </FormControl.Label>
                    <Textarea
                      placeholder="Leave a comment"
                      block
                      resize="vertical"
                      rows={6}
                    />
                  </FormControl>
                  <Stack direction="horizontal" gap="condensed" justify="end">
                    <Button variant="default" leadingVisual={CheckIcon}>
                      Approve
                    </Button>
                    <Button variant="default" leadingVisual={XIcon}>
                      Request changes
                    </Button>
                    <Button variant="default">
                      Comment
                    </Button>
                  </Stack>
                </Stack>
              </div>
            </Stack>
          </Stack>
        </SplitPageLayout.Content>

        <SplitPageLayout.Sidebar position="end">
          <div
            style={{
              paddingLeft: "var(--base-size-24)",
              borderLeft: "var(--borderWidth-thin) solid var(--borderColor-default)",
            }}
          >
          <Stack direction="vertical" gap="normal" divider="line">
            {/* Reviewers */}
            <Stack direction="vertical" gap="condensed">
              <Text size="small" weight="semibold">
                Reviewers
              </Text>
              {pr.reviewers.map((r) => (
                <Stack
                  key={r.login}
                  direction="horizontal"
                  gap="condensed"
                  align="center"
                >
                  <Avatar src={r.avatarUrl} size={20} alt={r.login} />
                  <Text size="small" weight="semibold">
                    {r.login}
                  </Text>
                  {r.status === "approved" && (
                    <span style={{ color: "var(--fgColor-success)" }}>
                      <CheckIcon size={12} />
                    </span>
                  )}
                  {r.status === "changes_requested" && (
                    <span style={{ color: "var(--fgColor-attention)" }}>
                      <XIcon size={12} />
                    </span>
                  )}
                </Stack>
              ))}
            </Stack>

            {/* Assignees */}
            <Stack direction="vertical" gap="condensed">
              <Text size="small" weight="semibold">
                Assignees
              </Text>
              {pr.assignees.map((a) => (
                <Stack
                  key={a.login}
                  direction="horizontal"
                  gap="condensed"
                  align="center"
                >
                  <Avatar src={a.avatarUrl} size={20} alt={a.login} />
                  <Text size="small" weight="semibold">
                    {a.login}
                  </Text>
                </Stack>
              ))}
            </Stack>

            {/* Labels */}
            <Stack direction="vertical" gap="condensed">
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
            <Stack direction="vertical" gap="condensed">
              <Text size="small" weight="semibold">
                Linked issues
              </Text>
              {pr.linkedIssues.map((issue) => (
                <Text key={issue.id} size="small">
                  #{issue.id} {issue.title}
                </Text>
              ))}
            </Stack>

            {/* Milestone */}
            <Stack direction="vertical" gap="condensed">
              <Text size="small" weight="semibold">
                Milestone
              </Text>
              <Text size="small" weight="light">
                {pr.milestone ?? "No milestone"}
              </Text>
            </Stack>
          </Stack>
          </div>
        </SplitPageLayout.Sidebar>
      </SplitPageLayout>
    </Stack>
  );
}
