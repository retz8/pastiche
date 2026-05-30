"use client";

import { useState } from "react";
import {
  Avatar,
  AvatarStack,
  Banner,
  BranchName,
  Button,
  FormControl,
  Heading,
  Label,
  LabelGroup,
  Link,
  PageHeader,
  RelativeTime,
  SplitPageLayout,
  Stack,
  StateLabel,
  Text,
  Textarea,
  Timeline,
} from "@primer/react";
import { InlineMessage } from "@primer/react/experimental";
import {
  CheckCircleFillIcon,
  XCircleFillIcon,
  GitMergeIcon,
  GitCommitIcon,
  EyeIcon,
  TagIcon,
  PersonIcon,
  GitBranchIcon,
  CrossReferenceIcon,
  MilestoneIcon,
  FileDiffIcon,
} from "@primer/octicons-react";

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

type ReviewState = "approved" | "changes_requested" | "requested";

type User = {
  login: string;
  avatar: string;
};

type CheckResult = {
  name: string;
  status: "passing" | "failing";
};

type Reviewer = {
  user: User;
  state: ReviewState;
};

type CommentEntry = {
  kind: "comment";
  id: string;
  author: User;
  createdAt: string;
  body: string;
};

type ReviewEntry = {
  kind: "review";
  id: string;
  author: User;
  state: "approved" | "changes_requested";
  createdAt: string;
  body: string;
};

type CommitEntry = {
  kind: "commit";
  id: string;
  actor: User;
  createdAt: string;
  commits: { sha: string; message: string }[];
};

type EventEntry = {
  kind: "event";
  id: string;
  actor: User;
  icon: React.ElementType;
  description: React.ReactNode;
  createdAt: string;
};

type TimelineEntry = CommentEntry | ReviewEntry | CommitEntry | EventEntry;

const DAY = 1000 * 60 * 60 * 24;
const HOUR = 1000 * 60 * 60;

function daysAgo(days: number): string {
  return new Date(Date.now() - days * DAY).toISOString();
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * HOUR).toISOString();
}

const USERS: Record<string, User> = {
  monalisa: {
    login: "monalisa",
    avatar: "https://avatars.githubusercontent.com/monalisa",
  },
  siddharthkp: {
    login: "siddharthkp",
    avatar: "https://avatars.githubusercontent.com/siddharthkp",
  },
  langermank: {
    login: "langermank",
    avatar: "https://avatars.githubusercontent.com/langermank",
  },
  TylerJDev: {
    login: "TylerJDev",
    avatar: "https://avatars.githubusercontent.com/TylerJDev",
  },
  joshblack: {
    login: "joshblack",
    avatar: "https://avatars.githubusercontent.com/joshblack",
  },
};

// Mock PR — mirrors PR #5102 from the pull requests list page.
const PULL = {
  number: 5102,
  title: "Add focus-visible polyfill fallback for ActionList rows",
  state: "open" as const,
  author: USERS.monalisa,
  createdAt: hoursAgo(2.4),
  baseBranch: "main",
  headBranch: "fix/actionlist-focus-visible",
  commitCount: 4,
  filesChanged: 7,
  hasConflicts: false,
  labels: [
    { name: "bug", variant: "danger" },
    { name: "accessibility", variant: "accent" },
  ] as { name: string; variant: LabelVariant }[],
  reviewers: [
    { user: USERS.langermank, state: "changes_requested" },
    { user: USERS.siddharthkp, state: "approved" },
    { user: USERS.TylerJDev, state: "requested" },
  ] as Reviewer[],
  assignees: [USERS.monalisa] as User[],
  linkedIssues: [{ number: 5077, title: "ActionList focus ring missing in Safari" }],
  milestone: "v37.0.0",
  description:
    "Safari's lack of `:focus-visible` support means ActionList rows show no focus ring when navigated by keyboard. This adds a small runtime fallback that applies a `data-focus-visible` attribute on keyboard focus, scoped to ActionList rows only.\n\nThe polyfill is tree-shakeable and only registers its listeners when an ActionList mounts, so there's no cost for pages that don't use it.",
  checks: [
    { name: "lint", status: "passing" },
    { name: "unit (react 18)", status: "passing" },
    { name: "unit (react 19)", status: "passing" },
    { name: "visual regression", status: "failing" },
    { name: "type-check", status: "passing" },
  ] as CheckResult[],
};

const TIMELINE: TimelineEntry[] = [
  {
    kind: "event",
    id: "e1",
    actor: USERS.monalisa,
    icon: PersonIcon,
    description: (
      <>
        requested a review from <Text weight="semibold">langermank</Text>
      </>
    ),
    createdAt: hoursAgo(2.3),
  },
  {
    kind: "event",
    id: "e2",
    actor: USERS.monalisa,
    icon: TagIcon,
    description: (
      <>
        added the <Text weight="semibold">accessibility</Text> label
      </>
    ),
    createdAt: hoursAgo(2.2),
  },
  {
    kind: "review",
    id: "r1",
    author: USERS.langermank,
    state: "changes_requested",
    createdAt: hoursAgo(2),
    body: "The fallback works, but the global listener should be removed on the last ActionList unmount. Right now it leaks if every ActionList is removed from the page.",
  },
  {
    kind: "commit",
    id: "p1",
    actor: USERS.monalisa,
    createdAt: hoursAgo(1.5),
    commits: [
      {
        sha: "a1b2c3d",
        message: "Ref-count ActionList mounts; tear down listener at zero",
      },
      { sha: "e4f5g6h", message: "Add unmount cleanup test" },
    ],
  },
  {
    kind: "comment",
    id: "c1",
    author: USERS.monalisa,
    createdAt: hoursAgo(1.4),
    body: "Good catch — switched to a mount ref-count so the listener is torn down once the last ActionList unmounts. Added a regression test for it.",
  },
  {
    kind: "review",
    id: "r2",
    author: USERS.siddharthkp,
    state: "approved",
    createdAt: hoursAgo(1),
    body: "Ref-counting approach looks solid and the test covers the leak. Approving.",
  },
  {
    kind: "event",
    id: "e3",
    actor: USERS.monalisa,
    icon: GitBranchIcon,
    description: <>updated the base branch from main</>,
    createdAt: hoursAgo(0.6),
  },
];

const REVIEW_META: Record<
  ReviewState,
  { label: string; color: string }
> = {
  approved: { label: "Approved", color: "var(--fgColor-success)" },
  changes_requested: {
    label: "Requested changes",
    color: "var(--fgColor-danger)",
  },
  requested: { label: "Awaiting review", color: "var(--fgColor-attention)" },
};

const SECTION_BORDER = {
  borderBottom: "var(--borderWidth-thin) solid var(--borderColor-muted)",
} as const;

function CommentCard({
  author,
  createdAt,
  verb,
  children,
}: {
  author: User;
  createdAt: string;
  verb: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Timeline.Item>
      <Timeline.Badge>
        <Avatar src={author.avatar} alt="" size={24} />
      </Timeline.Badge>
      <Timeline.Body>
        <Stack direction="vertical" gap="condensed">
          <Stack
            direction="horizontal"
            gap="condensed"
            align="baseline"
            wrap="wrap"
          >
            <Text weight="semibold">{author.login}</Text>
            <Text size="small" weight="light">
              {verb}{" "}
              <RelativeTime date={new Date(createdAt)} threshold="P30D" />
            </Text>
          </Stack>
          {children}
        </Stack>
      </Timeline.Body>
    </Timeline.Item>
  );
}

export default function PullConversationPage() {
  const [draft, setDraft] = useState("");

  const passingChecks = PULL.checks.filter((c) => c.status === "passing").length;
  const failingChecks = PULL.checks.filter((c) => c.status === "failing").length;
  const approvals = PULL.reviewers.filter((r) => r.state === "approved").length;
  const changesRequested = PULL.reviewers.filter(
    (r) => r.state === "changes_requested"
  ).length;

  const mergeBlocked =
    PULL.hasConflicts || failingChecks > 0 || changesRequested > 0;

  return (
    <SplitPageLayout>
      <SplitPageLayout.Content width="xlarge">
        <Stack direction="vertical" gap="normal">
          <PageHeader aria-label="Pull request header">
            <PageHeader.TitleArea>
              <PageHeader.Title as="h1">
                {PULL.title}{" "}
                <Text weight="light" style={{ color: "var(--fgColor-muted)" }}>
                  #{PULL.number}
                </Text>
              </PageHeader.Title>
            </PageHeader.TitleArea>
            <PageHeader.Description>
              <Stack
                direction="horizontal"
                gap="condensed"
                align="baseline"
                wrap="wrap"
              >
                <StateLabel status="pullOpened">Open</StateLabel>
                <Text size="small" weight="light">
                  <Text weight="semibold">{PULL.author.login}</Text> wants to
                  merge {PULL.commitCount} commits into{" "}
                  <BranchName href={`/tree/${PULL.baseBranch}`}>
                    {PULL.baseBranch}
                  </BranchName>{" "}
                  from{" "}
                  <BranchName href={`/tree/${PULL.headBranch}`}>
                    {PULL.headBranch}
                  </BranchName>{" "}
                  · opened{" "}
                  <RelativeTime
                    date={new Date(PULL.createdAt)}
                    threshold="P30D"
                  />{" "}
                  · {PULL.filesChanged} files changed
                </Text>
              </Stack>
            </PageHeader.Description>
          </PageHeader>

          {/* Merge status summary */}
          <div
            style={{
              border:
                "var(--borderWidth-thin) solid var(--borderColor-default)",
              borderRadius: "var(--borderRadius-medium)",
              padding: "var(--stack-padding-normal)",
            }}
          >
            <Stack direction="vertical" gap="condensed">
              <InlineMessage
                variant={failingChecks > 0 ? "critical" : "success"}
                leadingVisual={
                  failingChecks > 0 ? XCircleFillIcon : CheckCircleFillIcon
                }
                size="small"
              >
                {passingChecks} passing, {failingChecks} failing —{" "}
                {failingChecks > 0
                  ? "some checks were not successful"
                  : "all checks have passed"}
              </InlineMessage>

              <InlineMessage
                variant={changesRequested > 0 ? "critical" : "success"}
                leadingVisual={EyeIcon}
                size="small"
              >
                {approvals} approval{approvals === 1 ? "" : "s"}
                {changesRequested > 0
                  ? `, ${changesRequested} requesting changes`
                  : ""}
              </InlineMessage>

              {PULL.hasConflicts ? (
                <Banner
                  variant="critical"
                  title="This branch has conflicts that must be resolved"
                  description="Resolve the conflicts with the base branch before this pull request can be merged."
                  hideTitle
                />
              ) : (
                <InlineMessage
                  variant="success"
                  leadingVisual={CheckCircleFillIcon}
                  size="small"
                >
                  This branch has no conflicts with the base branch
                </InlineMessage>
              )}

              <Stack direction="horizontal" gap="condensed">
                <Button
                  variant={mergeBlocked ? "default" : "primary"}
                  leadingVisual={GitMergeIcon}
                >
                  {mergeBlocked ? "Merge when ready" : "Merge pull request"}
                </Button>
              </Stack>
            </Stack>
          </div>

          {/* Conversation thread */}
          <Timeline>
            {/* Opening post — the PR description */}
            <CommentCard
              author={PULL.author}
              createdAt={PULL.createdAt}
              verb="commented"
            >
              {PULL.description.split("\n\n").map((paragraph, index) => (
                <Text as="p" key={index} size="medium">
                  {paragraph}
                </Text>
              ))}
            </CommentCard>

            {TIMELINE.map((entry) => {
              if (entry.kind === "comment") {
                return (
                  <CommentCard
                    key={entry.id}
                    author={entry.author}
                    createdAt={entry.createdAt}
                    verb="commented"
                  >
                    <Text as="p" size="medium">
                      {entry.body}
                    </Text>
                  </CommentCard>
                );
              }

              if (entry.kind === "review") {
                const approved = entry.state === "approved";
                return (
                  <CommentCard
                    key={entry.id}
                    author={entry.author}
                    createdAt={entry.createdAt}
                    verb={
                      <Text
                        size="small"
                        style={{
                          color: approved
                            ? "var(--fgColor-success)"
                            : "var(--fgColor-danger)",
                        }}
                      >
                        {approved
                          ? "approved these changes"
                          : "requested changes"}
                      </Text>
                    }
                  >
                    <Text as="p" size="medium">
                      {entry.body}
                    </Text>
                  </CommentCard>
                );
              }

              if (entry.kind === "commit") {
                return (
                  <Timeline.Item key={entry.id}>
                    <Timeline.Badge>
                      <GitCommitIcon />
                    </Timeline.Badge>
                    <Timeline.Body>
                      <Stack direction="vertical" gap="condensed">
                        <Text size="small">
                          <Text weight="semibold">{entry.actor.login}</Text>{" "}
                          pushed {entry.commits.length} commit
                          {entry.commits.length === 1 ? "" : "s"}{" "}
                          <RelativeTime
                            date={new Date(entry.createdAt)}
                            threshold="P30D"
                          />
                        </Text>
                        <Stack direction="vertical" gap="none">
                          {entry.commits.map((commit) => (
                            <Stack
                              key={commit.sha}
                              direction="horizontal"
                              gap="condensed"
                              align="baseline"
                              wrap="wrap"
                            >
                              <Link
                                href={`/commit/${commit.sha}`}
                                muted
                                style={{ fontFamily: "var(--fontStack-monospace)" }}
                              >
                                <Text size="small">{commit.sha}</Text>
                              </Link>
                              <Text size="small">{commit.message}</Text>
                            </Stack>
                          ))}
                        </Stack>
                      </Stack>
                    </Timeline.Body>
                  </Timeline.Item>
                );
              }

              // event
              return (
                <Timeline.Item key={entry.id} condensed>
                  <Timeline.Badge>
                    <entry.icon />
                  </Timeline.Badge>
                  <Timeline.Body>
                    <Stack
                      direction="horizontal"
                      gap="condensed"
                      align="baseline"
                      wrap="wrap"
                    >
                      <Text size="small">
                        <Text weight="semibold">{entry.actor.login}</Text>{" "}
                        {entry.description}
                      </Text>
                      <Text size="small" weight="light">
                        <RelativeTime
                          date={new Date(entry.createdAt)}
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
          <Stack direction="vertical" gap="condensed">
            <FormControl>
              <FormControl.Label>Add a comment</FormControl.Label>
              <Textarea
                block
                resize="vertical"
                rows={6}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Leave a comment"
              />
            </FormControl>
            <Stack direction="horizontal" gap="condensed" justify="end">
              <Button variant="default" leadingVisual={XCircleFillIcon}>
                Request changes
              </Button>
              <Button variant="default" leadingVisual={CheckCircleFillIcon}>
                Approve
              </Button>
              <Button variant="primary">Comment</Button>
            </Stack>
          </Stack>
        </Stack>
      </SplitPageLayout.Content>

      <SplitPageLayout.Pane position="end" aria-label="Pull request metadata">
        <Stack direction="vertical" gap="none">
          <Stack
            direction="vertical"
            gap="condensed"
            paddingBlock="normal"
            style={SECTION_BORDER}
          >
            <Heading as="h2" variant="small">
              Reviewers
            </Heading>
            {PULL.reviewers.map((reviewer) => {
              const meta = REVIEW_META[reviewer.state];
              return (
                <Stack
                  key={reviewer.user.login}
                  direction="horizontal"
                  gap="condensed"
                  align="center"
                >
                  <Avatar src={reviewer.user.avatar} alt="" size={20} />
                  <Text size="small">{reviewer.user.login}</Text>
                  <Text
                    size="small"
                    weight="light"
                    style={{ color: meta.color }}
                  >
                    {meta.label}
                  </Text>
                </Stack>
              );
            })}
          </Stack>

          <Stack
            direction="vertical"
            gap="condensed"
            paddingBlock="normal"
            style={SECTION_BORDER}
          >
            <Heading as="h2" variant="small">
              Assignees
            </Heading>
            {PULL.assignees.length > 0 ? (
              <Stack direction="horizontal" gap="condensed" align="center">
                <AvatarStack>
                  {PULL.assignees.map((user) => (
                    <Avatar
                      key={user.login}
                      src={user.avatar}
                      alt={user.login}
                    />
                  ))}
                </AvatarStack>
                <Text size="small">
                  {PULL.assignees.map((user) => user.login).join(", ")}
                </Text>
              </Stack>
            ) : (
              <Text size="small" weight="light">
                No one assigned
              </Text>
            )}
          </Stack>

          <Stack
            direction="vertical"
            gap="condensed"
            paddingBlock="normal"
            style={SECTION_BORDER}
          >
            <Heading as="h2" variant="small">
              Labels
            </Heading>
            {PULL.labels.length > 0 ? (
              <LabelGroup>
                {PULL.labels.map((label) => (
                  <Label key={label.name} variant={label.variant}>
                    {label.name}
                  </Label>
                ))}
              </LabelGroup>
            ) : (
              <Text size="small" weight="light">
                None yet
              </Text>
            )}
          </Stack>

          <Stack
            direction="vertical"
            gap="condensed"
            paddingBlock="normal"
            style={SECTION_BORDER}
          >
            <Stack direction="horizontal" gap="condensed" align="center">
              <CrossReferenceIcon />
              <Heading as="h2" variant="small">
                Linked issues
              </Heading>
            </Stack>
            {PULL.linkedIssues.length > 0 ? (
              <Stack direction="vertical" gap="condensed">
                {PULL.linkedIssues.map((issue) => (
                  <Link key={issue.number} href={`/issues/${issue.number}`} muted>
                    <Text size="small">
                      #{issue.number} {issue.title}
                    </Text>
                  </Link>
                ))}
              </Stack>
            ) : (
              <Text size="small" weight="light">
                None yet
              </Text>
            )}
          </Stack>

          <Stack direction="vertical" gap="condensed" paddingBlock="normal">
            <Stack direction="horizontal" gap="condensed" align="center">
              <MilestoneIcon />
              <Heading as="h2" variant="small">
                Milestone
              </Heading>
            </Stack>
            {PULL.milestone ? (
              <Stack direction="horizontal" gap="condensed" align="baseline">
                <FileDiffIcon size={14} aria-hidden />
                <Text size="small">{PULL.milestone}</Text>
              </Stack>
            ) : (
              <Text size="small" weight="light">
                No milestone
              </Text>
            )}
          </Stack>
        </Stack>
      </SplitPageLayout.Pane>
    </SplitPageLayout>
  );
}
