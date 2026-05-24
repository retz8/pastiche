"use client";

import { useState } from "react";
import {
  PageHeader,
  SplitPageLayout,
  StateLabel,
  Text,
  Stack,
  Timeline,
  Avatar,
  Label,
  LabelGroup,
  RelativeTime,
  FormControl,
  Textarea,
  Button,
  IssueLabelToken,
} from "@primer/react";
import {
  IssueOpenedIcon,
  IssueClosedIcon,
  TagIcon,
  PersonIcon,
  XIcon,
} from "@primer/octicons-react";

// ---------------------------------------------------------------------------
// Mock data — matches a plausible issue from the list page
// ---------------------------------------------------------------------------

const issue = {
  id: 42,
  title: "Button component does not respect disabled state in Safari",
  status: "open" as const,
  author: {
    login: "monalisa",
    avatar: "https://avatars.githubusercontent.com/u/383316?v=4",
  },
  createdAt: "2026-05-21T10:30:00Z",
  body: "When rendering a `Button` with `disabled={true}` in Safari 17, click events still fire. This appears to be a browser-level quirk with custom elements. We should add an explicit `pointer-events: none` guard and `aria-disabled` attribute.\n\nSteps to reproduce:\n1. Open the Storybook in Safari 17.\n2. Navigate to Button > Disabled.\n3. Click the button — the `onClick` handler fires.",
  labels: [
    { name: "bug", color: "#d73a4a" },
    { name: "browser-compat", color: "#0075ca" },
  ],
  assignees: [
    {
      login: "monalisa",
      avatar: "https://avatars.githubusercontent.com/u/383316?v=4",
    },
    {
      login: "octocat",
      avatar: "https://avatars.githubusercontent.com/u/583231?v=4",
    },
  ],
  comments: [
    {
      id: 1,
      author: {
        login: "octocat",
        avatar: "https://avatars.githubusercontent.com/u/583231?v=4",
      },
      createdAt: "2026-05-21T14:12:00Z",
      body: "I can confirm this on Safari 17.4. The same issue does not occur on Firefox or Chrome. Adding `pointer-events: none` to the disabled style should be straightforward.",
    },
    {
      id: 2,
      author: {
        login: "monalisa",
        avatar: "https://avatars.githubusercontent.com/u/383316?v=4",
      },
      createdAt: "2026-05-22T09:00:00Z",
      body: "I pushed a fix in PR #43. Can someone verify on an actual Safari device?",
    },
  ],
  events: [
    {
      id: 101,
      type: "labeled" as const,
      actor: "octocat",
      label: "bug",
      createdAt: "2026-05-21T10:35:00Z",
    },
    {
      id: 102,
      type: "assigned" as const,
      actor: "monalisa",
      assignee: "octocat",
      createdAt: "2026-05-21T10:36:00Z",
    },
  ],
};

// Merge comments and events into a single timeline, sorted by date
type TimelineEntry =
  | { kind: "comment"; data: (typeof issue.comments)[number] }
  | { kind: "event"; data: (typeof issue.events)[number] };

function buildTimeline(): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    ...issue.comments.map(
      (c) => ({ kind: "comment", data: c }) as TimelineEntry
    ),
    ...issue.events.map(
      (e) => ({ kind: "event", data: e }) as TimelineEntry
    ),
  ];
  entries.sort(
    (a, b) =>
      new Date(a.data.createdAt).getTime() -
      new Date(b.data.createdAt).getTime()
  );
  return entries;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function IssueDetailPage() {
  const [isOpen, setIsOpen] = useState(issue.status === "open");
  const [commentText, setCommentText] = useState("");
  const timelineEntries = buildTimeline();

  return (
    <Stack direction="vertical" gap="normal">
      {/* ---- Page header ---- */}
      <div>
        <PageHeader>
          <PageHeader.TitleArea>
            <PageHeader.Title as="h1">
              {issue.title}{" "}
              <Text size="large" weight="light" style={{ color: "var(--fgColor-muted)" }}>
                #{issue.id}
              </Text>
            </PageHeader.Title>
          </PageHeader.TitleArea>
        </PageHeader>

        <Stack direction="horizontal" gap="condensed" align="center" style={{ marginTop: "var(--spacing-condensed)" }}>
          <StateLabel status={isOpen ? "issueOpened" : "issueClosed"}>
            {isOpen ? "Open" : "Closed"}
          </StateLabel>
          <Text size="small" weight="light" style={{ color: "var(--fgColor-muted)" }}>
            <Text weight="semibold">{issue.author.login}</Text> opened this issue{" "}
            <RelativeTime datetime={issue.createdAt} /> &middot;{" "}
            {issue.comments.length} comment{issue.comments.length !== 1 ? "s" : ""}
          </Text>
        </Stack>
      </div>

      <hr style={{ border: "none", borderTop: "1px solid var(--borderColor-default)", margin: 0 }} />

      {/* ---- Two-column layout ---- */}
      <SplitPageLayout>
        {/* ---- Main content: conversation thread ---- */}
        <SplitPageLayout.Content>
          <Timeline>
            {/* Opening post (looks like a comment) */}
            <Timeline.Item>
              <Timeline.Badge>
                <Avatar src={issue.author.avatar} size={20} alt={issue.author.login} />
              </Timeline.Badge>
              <Timeline.Body>
                <div
                  style={{
                    border: "1px solid var(--borderColor-default)",
                    borderRadius: "var(--borderRadius-medium)",
                  }}
                >
                  <div
                    style={{
                      padding: "var(--spacing-condensed) var(--spacing-normal)",
                      backgroundColor: "var(--bgColor-accent-muted)",
                      borderBottom: "1px solid var(--borderColor-default)",
                      borderRadius: "var(--borderRadius-medium) var(--borderRadius-medium) 0 0",
                    }}
                  >
                    <Text size="small">
                      <Text weight="semibold">{issue.author.login}</Text>{" "}
                      <Text weight="light" style={{ color: "var(--fgColor-muted)" }}>
                        commented <RelativeTime datetime={issue.createdAt} />
                      </Text>
                    </Text>
                  </div>
                  <div style={{ padding: "var(--spacing-normal)" }}>
                    <Text as="p" size="medium" style={{ whiteSpace: "pre-wrap" }}>
                      {issue.body}
                    </Text>
                  </div>
                </div>
              </Timeline.Body>
            </Timeline.Item>

            {/* Timeline entries (comments + events, chronological) */}
            {timelineEntries.map((entry) => {
              if (entry.kind === "comment") {
                const c = entry.data;
                return (
                  <Timeline.Item key={`comment-${c.id}`}>
                    <Timeline.Badge>
                      <Avatar src={c.author.avatar} size={20} alt={c.author.login} />
                    </Timeline.Badge>
                    <Timeline.Body>
                      <div
                        style={{
                          border: "1px solid var(--borderColor-default)",
                          borderRadius: "var(--borderRadius-medium)",
                        }}
                      >
                        <div
                          style={{
                            padding: "var(--spacing-condensed) var(--spacing-normal)",
                            backgroundColor: "var(--bgColor-muted)",
                            borderBottom: "1px solid var(--borderColor-default)",
                            borderRadius: "var(--borderRadius-medium) var(--borderRadius-medium) 0 0",
                          }}
                        >
                          <Text size="small">
                            <Text weight="semibold">{c.author.login}</Text>{" "}
                            <Text weight="light" style={{ color: "var(--fgColor-muted)" }}>
                              commented <RelativeTime datetime={c.createdAt} />
                            </Text>
                          </Text>
                        </div>
                        <div style={{ padding: "var(--spacing-normal)" }}>
                          <Text as="p" size="medium" style={{ whiteSpace: "pre-wrap" }}>
                            {c.body}
                          </Text>
                        </div>
                      </div>
                    </Timeline.Body>
                  </Timeline.Item>
                );
              }

              // Event entry
              const ev = entry.data;
              return (
                <Timeline.Item key={`event-${ev.id}`} condensed>
                  <Timeline.Badge>
                    {ev.type === "labeled" ? (
                      <TagIcon size={16} />
                    ) : (
                      <PersonIcon size={16} />
                    )}
                  </Timeline.Badge>
                  <Timeline.Body>
                    <Text size="small" style={{ color: "var(--fgColor-muted)" }}>
                      <Text weight="semibold">{ev.actor}</Text>{" "}
                      {ev.type === "labeled"
                        ? `added the ${ev.label} label`
                        : `assigned ${ev.assignee}`}{" "}
                      <RelativeTime datetime={ev.createdAt} />
                    </Text>
                  </Timeline.Body>
                </Timeline.Item>
              );
            })}
          </Timeline>

          {/* ---- Comment composer ---- */}
          <div style={{ marginTop: "var(--spacing-normal)" }}>
            <Stack direction="vertical" gap="condensed">
              <FormControl>
                <FormControl.Label>Add a comment</FormControl.Label>
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Leave a comment"
                  block
                  resize="vertical"
                  rows={6}
                />
              </FormControl>

              <Stack direction="horizontal" gap="condensed" justify="end">
                <Button
                  variant="default"
                  leadingVisual={isOpen ? XIcon : IssueOpenedIcon}
                  onClick={() => setIsOpen((o) => !o)}
                >
                  {isOpen ? "Close issue" : "Reopen issue"}
                </Button>
                <Button variant="primary">Comment</Button>
              </Stack>
            </Stack>
          </div>
        </SplitPageLayout.Content>

        {/* ---- Sidebar ---- */}
        <SplitPageLayout.Pane position="end">
          <Stack direction="vertical" gap="normal">
            {/* Assignees */}
            <div
              style={{
                paddingBottom: "var(--spacing-condensed)",
                borderBottom: "1px solid var(--borderColor-muted)",
              }}
            >
              <Text as="h3" size="small" weight="semibold">
                Assignees
              </Text>
              <Stack direction="vertical" gap="condensed" style={{ marginTop: "var(--spacing-condensed)" }}>
                {issue.assignees.map((a) => (
                  <Stack key={a.login} direction="horizontal" gap="condensed" align="center">
                    <Avatar src={a.avatar} size={20} alt={a.login} />
                    <Text size="small" weight="semibold">
                      {a.login}
                    </Text>
                  </Stack>
                ))}
              </Stack>
            </div>

            {/* Labels */}
            <div
              style={{
                paddingBottom: "var(--spacing-condensed)",
                borderBottom: "1px solid var(--borderColor-muted)",
              }}
            >
              <Text as="h3" size="small" weight="semibold">
                Labels
              </Text>
              <div style={{ marginTop: "var(--spacing-condensed)" }}>
                <LabelGroup>
                  {issue.labels.map((l) => (
                    <IssueLabelToken
                      key={l.name}
                      text={l.name}
                      fillColor={l.color}
                    />
                  ))}
                </LabelGroup>
              </div>
            </div>

            {/* Projects */}
            <div
              style={{
                paddingBottom: "var(--spacing-condensed)",
                borderBottom: "1px solid var(--borderColor-muted)",
              }}
            >
              <Text as="h3" size="small" weight="semibold">
                Projects
              </Text>
              <Text size="small" weight="light">
                None yet
              </Text>
            </div>

            {/* Milestone */}
            <div
              style={{
                paddingBottom: "var(--spacing-condensed)",
                borderBottom: "1px solid var(--borderColor-muted)",
              }}
            >
              <Text as="h3" size="small" weight="semibold">
                Milestone
              </Text>
              <Text size="small" weight="light">
                No milestone
              </Text>
            </div>
          </Stack>
        </SplitPageLayout.Pane>
      </SplitPageLayout>
    </Stack>
  );
}
