"use client";

import { use } from "react";
import NextLink from "next/link";
import {
  Avatar,
  Button,
  FormControl,
  Heading,
  IssueLabelToken,
  Label,
  RelativeTime,
  SplitPageLayout,
  Stack,
  StateLabel,
  Text,
  Textarea,
  Timeline,
} from "@primer/react";
import {
  IssueOpenedIcon,
  IssueClosedIcon,
  SkipIcon,
  TagIcon,
  PersonIcon,
  XIcon,
  CommentIcon,
} from "@primer/octicons-react";

// ---------- Mock Data ----------

interface IssueLabel {
  name: string;
  color: string;
}

interface Comment {
  id: number;
  author: string;
  avatarUrl: string;
  createdAt: string;
  body: string;
}

interface TimelineEvent {
  id: number;
  type: "labeled" | "closed" | "reopened" | "assigned";
  actor: string;
  createdAt: string;
  detail: string;
}

type TimelineEntry =
  | { kind: "comment"; data: Comment }
  | { kind: "event"; data: TimelineEvent };

interface Assignee {
  login: string;
  avatarUrl: string;
}

const ISSUE = {
  number: 142,
  title: "Fix crash when uploading large files",
  status: "open" as const,
  author: "octocat",
  authorAvatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4",
  createdAt: "2026-05-22T10:30:00Z",
  commentCount: 4,
  labels: [
    { name: "bug", color: "#d73a4a" },
    { name: "priority: high", color: "#b60205" },
  ] as IssueLabel[],
  assignees: [
    {
      login: "octocat",
      avatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4",
    },
    {
      login: "monalisa",
      avatarUrl: "https://avatars.githubusercontent.com/u/104456405?v=4",
    },
  ] as Assignee[],
  body: `When uploading files larger than 100MB, the application crashes with an out-of-memory error. This happens consistently on both Chrome and Firefox.

**Steps to reproduce:**
1. Navigate to the upload page
2. Select a file larger than 100MB
3. Click "Upload"
4. Observe the crash

**Expected behavior:** The upload should either succeed or show a clear error message about file size limits.

**Actual behavior:** The browser tab crashes with no error message.`,
};

const TIMELINE_ENTRIES: TimelineEntry[] = [
  {
    kind: "event",
    data: {
      id: 1,
      type: "labeled",
      actor: "octocat",
      createdAt: "2026-05-22T10:31:00Z",
      detail: 'added the "bug" label',
    },
  },
  {
    kind: "event",
    data: {
      id: 2,
      type: "labeled",
      actor: "octocat",
      createdAt: "2026-05-22T10:31:30Z",
      detail: 'added the "priority: high" label',
    },
  },
  {
    kind: "event",
    data: {
      id: 3,
      type: "assigned",
      actor: "octocat",
      createdAt: "2026-05-22T10:32:00Z",
      detail: "assigned monalisa",
    },
  },
  {
    kind: "comment",
    data: {
      id: 4,
      author: "monalisa",
      avatarUrl:
        "https://avatars.githubusercontent.com/u/104456405?v=4",
      createdAt: "2026-05-22T14:00:00Z",
      body: "I can reproduce this. The issue is in the chunked upload handler — it loads the entire file into memory instead of streaming. I'll take a look at fixing this.",
    },
  },
  {
    kind: "comment",
    data: {
      id: 5,
      author: "hubot",
      avatarUrl: "https://avatars.githubusercontent.com/u/480938?v=4",
      createdAt: "2026-05-23T09:15:00Z",
      body: "This might be related to #128 — we saw similar memory issues with the export feature. The fix there was to use a ReadableStream. Could the same approach work here?",
    },
  },
  {
    kind: "comment",
    data: {
      id: 6,
      author: "monalisa",
      avatarUrl:
        "https://avatars.githubusercontent.com/u/104456405?v=4",
      createdAt: "2026-05-23T11:30:00Z",
      body: "Good call @hubot. I've started a PR (#143) that refactors the upload handler to use streaming. Initial tests look promising — memory usage stays flat even with 500MB files.",
    },
  },
  {
    kind: "comment",
    data: {
      id: 7,
      author: "octocat",
      avatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4",
      createdAt: "2026-05-24T08:00:00Z",
      body: "Great progress! Let's get that PR reviewed and merged. @monalisa can you also add a test case for the 100MB boundary?",
    },
  },
];

// ---------- Sub-components ----------

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
      {/* Comment header */}
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
        <Text size="small" style={{ color: "var(--fgColor-muted)" }}>
          <Text>{"commented "}</Text>
          <RelativeTime datetime={createdAt} />
        </Text>
      </div>
      {/* Comment body */}
      <div
        style={{
          padding: "var(--base-size-16)",
        }}
      >
        <Text as="p" size="medium" style={{ whiteSpace: "pre-wrap", margin: 0 }}>
          {body}
        </Text>
      </div>
    </div>
  );
}

function EventEntry({
  actor,
  detail,
  createdAt,
  type,
}: {
  actor: string;
  detail: string;
  createdAt: string;
  type: TimelineEvent["type"];
}) {
  const badgeVariant =
    type === "closed"
      ? ("closed" as const)
      : type === "reopened"
        ? ("open" as const)
        : type === "labeled"
          ? ("accent" as const)
          : ("accent" as const);

  const icon =
    type === "labeled" ? (
      <TagIcon />
    ) : type === "closed" ? (
      <IssueClosedIcon />
    ) : type === "reopened" ? (
      <IssueOpenedIcon />
    ) : (
      <PersonIcon />
    );

  return (
    <Timeline.Item condensed>
      <Timeline.Badge variant={badgeVariant}>{icon}</Timeline.Badge>
      <Timeline.Body>
        <Text size="small" style={{ color: "var(--fgColor-muted)" }}>
          <Text weight="semibold" style={{ color: "var(--fgColor-default)" }}>
            {actor}
          </Text>
          {" "}
          {detail}
          {" "}
          <RelativeTime datetime={createdAt} />
        </Text>
      </Timeline.Body>
    </Timeline.Item>
  );
}

// ---------- Sidebar ----------

function Sidebar() {
  return (
    <Stack direction="vertical" gap="spacious">
      {/* Assignees */}
      <div>
        <Text
          size="small"
          weight="semibold"
          style={{
            color: "var(--fgColor-muted)",
            display: "block",
            marginBottom: "var(--base-size-8)",
          }}
        >
          <Text>{"Assignees"}</Text>
        </Text>
        <Stack direction="vertical" gap="condensed">
          {ISSUE.assignees.map((assignee) => (
            <Stack
              key={assignee.login}
              direction="horizontal"
              gap="condensed"
              align="center"
            >
              <Avatar
                src={assignee.avatarUrl}
                size={20}
                alt={assignee.login}
              />
              <Text size="small" weight="semibold">
                {assignee.login}
              </Text>
            </Stack>
          ))}
        </Stack>
      </div>

      {/* Labels */}
      <div>
        <Text
          size="small"
          weight="semibold"
          style={{
            color: "var(--fgColor-muted)",
            display: "block",
            marginBottom: "var(--base-size-8)",
          }}
        >
          <Text>{"Labels"}</Text>
        </Text>
        <Stack direction="horizontal" gap="condensed" wrap="wrap">
          {ISSUE.labels.map((label) => (
            <IssueLabelToken
              key={label.name}
              text={label.name}
              fillColor={label.color}
              size="small"
            />
          ))}
        </Stack>
      </div>

      {/* Projects placeholder */}
      <div>
        <Text
          size="small"
          weight="semibold"
          style={{
            color: "var(--fgColor-muted)",
            display: "block",
            marginBottom: "var(--base-size-8)",
          }}
        >
          <Text>{"Projects"}</Text>
        </Text>
        <Text size="small" style={{ color: "var(--fgColor-muted)" }}>
          <Text>{"None yet"}</Text>
        </Text>
      </div>

      {/* Milestone placeholder */}
      <div>
        <Text
          size="small"
          weight="semibold"
          style={{
            color: "var(--fgColor-muted)",
            display: "block",
            marginBottom: "var(--base-size-8)",
          }}
        >
          <Text>{"Milestone"}</Text>
        </Text>
        <Text size="small" style={{ color: "var(--fgColor-muted)" }}>
          <Text>{"No milestone"}</Text>
        </Text>
      </div>
    </Stack>
  );
}

// ---------- Page ----------

export default function IssueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <Stack direction="vertical" gap="normal">
      {/* Page header */}
      <div>
        <Stack direction="horizontal" gap="condensed" align="start">
          <Heading as="h1" style={{ flex: 1 }}>
            <Text weight="normal">{ISSUE.title}</Text>
            {" "}
            <Text
              weight="light"
              style={{ color: "var(--fgColor-muted)" }}
            >
              #{ISSUE.number}
            </Text>
          </Heading>
        </Stack>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--base-size-8)",
            marginTop: "var(--base-size-8)",
            paddingBottom: "var(--base-size-16)",
            borderBottom:
              "var(--borderWidth-thin) solid var(--borderColor-default)",
          }}
        >
          <StateLabel status={ISSUE.status === "open" ? "issueOpened" : "issueClosed"}>
            <Text>{ISSUE.status === "open" ? "Open" : "Closed"}</Text>
          </StateLabel>
          <Text size="small" style={{ color: "var(--fgColor-muted)" }}>
            <Text weight="semibold">{ISSUE.author}</Text>
            {" opened this issue "}
            <RelativeTime datetime={ISSUE.createdAt} />
            {" · "}
            {ISSUE.commentCount}
            {" comments"}
          </Text>
        </div>
      </div>

      {/* Main content area */}
      <SplitPageLayout>
        <SplitPageLayout.Content>
          {/* Opening post */}
          <Stack direction="vertical" gap="normal">
            <Stack direction="horizontal" gap="normal" align="start">
              <Avatar
                src={ISSUE.authorAvatarUrl}
                size={40}
                alt={ISSUE.author}
              />
              <div style={{ flex: 1 }}>
                <CommentBlock
                  author={ISSUE.author}
                  avatarUrl={ISSUE.authorAvatarUrl}
                  createdAt={ISSUE.createdAt}
                  body={ISSUE.body}
                />
              </div>
            </Stack>

            {/* Timeline */}
            <Timeline>
              {TIMELINE_ENTRIES.map((entry) => {
                if (entry.kind === "event") {
                  return (
                    <EventEntry
                      key={`event-${entry.data.id}`}
                      actor={entry.data.actor}
                      detail={entry.data.detail}
                      createdAt={entry.data.createdAt}
                      type={entry.data.type}
                    />
                  );
                }
                return (
                  <Timeline.Item key={`comment-${entry.data.id}`}>
                    <Timeline.Badge variant="accent">
                      <CommentIcon />
                    </Timeline.Badge>
                    <Timeline.Body>
                      <Stack
                        direction="horizontal"
                        gap="normal"
                        align="start"
                      >
                        <Avatar
                          src={entry.data.avatarUrl}
                          size={40}
                          alt={entry.data.author}
                        />
                        <div style={{ flex: 1 }}>
                          <CommentBlock
                            author={entry.data.author}
                            avatarUrl={entry.data.avatarUrl}
                            createdAt={entry.data.createdAt}
                            body={entry.data.body}
                          />
                        </div>
                      </Stack>
                    </Timeline.Body>
                  </Timeline.Item>
                );
              })}
            </Timeline>

            {/* Comment composer */}
            <div
              style={{
                border:
                  "var(--borderWidth-thin) solid var(--borderColor-default)",
                borderRadius: "var(--borderRadius-medium)",
                padding: "var(--base-size-16)",
              }}
            >
              <Stack direction="vertical" gap="normal">
                <FormControl>
                  <FormControl.Label>
                    <Text>{"Add a comment"}</Text>
                  </FormControl.Label>
                  <Textarea
                    block
                    placeholder="Leave a comment"
                    resize="vertical"
                    aria-label="Comment body"
                    rows={6}
                  />
                </FormControl>
                <Stack
                  direction="horizontal"
                  gap="condensed"
                  justify="end"
                >
                  <Button variant="default">
                    <Text>{"Close issue"}</Text>
                  </Button>
                  <Button variant="primary">
                    <Text>{"Comment"}</Text>
                  </Button>
                </Stack>
              </Stack>
            </div>
          </Stack>
        </SplitPageLayout.Content>

        <SplitPageLayout.Pane position="end">
          <Sidebar />
        </SplitPageLayout.Pane>
      </SplitPageLayout>
    </Stack>
  );
}
