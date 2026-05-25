"use client";

import {
  Avatar,
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
  CommentIcon,
  IssueClosedIcon,
  IssueOpenedIcon,
  SkipIcon,
  TagIcon,
} from "@primer/octicons-react";
import { useParams } from "next/navigation";

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

interface IssueLabel {
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

interface Comment {
  id: number;
  author: string;
  avatarUrl: string;
  createdAt: string;
  body: string;
}

interface TimelineEvent {
  id: number;
  type: "labeled" | "closed" | "reopened";
  actor: string;
  createdAt: string;
  detail?: string;
}

type TimelineEntry =
  | { kind: "comment"; data: Comment }
  | { kind: "event"; data: TimelineEvent };

interface Assignee {
  login: string;
  avatarUrl: string;
}

interface IssueDetail {
  id: number;
  title: string;
  status: "open" | "closed";
  author: string;
  authorAvatarUrl: string;
  createdAt: string;
  labels: IssueLabel[];
  assignees: Assignee[];
  commentCount: number;
  body: string;
  timeline: TimelineEntry[];
}

const MOCK_ISSUE: IssueDetail = {
  id: 142,
  title: "Navigation bar breaks on mobile viewport",
  status: "open",
  author: "octocat",
  authorAvatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4",
  createdAt: "2026-05-22T10:30:00Z",
  labels: [
    { name: "bug", variant: "danger" },
    { name: "priority: high", variant: "severe" },
  ],
  assignees: [
    {
      login: "octocat",
      avatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4",
    },
    {
      login: "monalisa",
      avatarUrl: "https://avatars.githubusercontent.com/u/104456405?v=4",
    },
  ],
  commentCount: 5,
  body: "When the viewport width is below 768px, the navigation bar items overflow and overlap each other. The hamburger menu icon does not appear, and the links are not wrapped or hidden.\n\nSteps to reproduce:\n1. Open the app in a browser\n2. Resize the window below 768px\n3. Observe the navigation bar\n\nExpected: A hamburger menu should appear and nav items should collapse.\nActual: Items overflow horizontally and overlap.",
  timeline: [
    {
      kind: "event",
      data: {
        id: 1,
        type: "labeled",
        actor: "octocat",
        createdAt: "2026-05-22T10:31:00Z",
        detail: "bug",
      },
    },
    {
      kind: "event",
      data: {
        id: 2,
        type: "labeled",
        actor: "octocat",
        createdAt: "2026-05-22T10:31:00Z",
        detail: "priority: high",
      },
    },
    {
      kind: "comment",
      data: {
        id: 3,
        author: "monalisa",
        avatarUrl:
          "https://avatars.githubusercontent.com/u/104456405?v=4",
        createdAt: "2026-05-22T14:00:00Z",
        body: "I can reproduce this on Chrome and Firefox. Looks like the media query for the responsive breakpoint is missing from the navbar component.",
      },
    },
    {
      kind: "comment",
      data: {
        id: 4,
        author: "contributor42",
        avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
        createdAt: "2026-05-23T09:15:00Z",
        body: "I think the issue is in `NavBar.tsx` — the flex-wrap property is set to `nowrap`. Changing it to `wrap` and adding a hamburger toggle should fix it. I can submit a PR if needed.",
      },
    },
    {
      kind: "event",
      data: {
        id: 5,
        type: "closed",
        actor: "octocat",
        createdAt: "2026-05-23T10:00:00Z",
      },
    },
    {
      kind: "event",
      data: {
        id: 6,
        type: "reopened",
        actor: "monalisa",
        createdAt: "2026-05-23T11:30:00Z",
      },
    },
    {
      kind: "comment",
      data: {
        id: 7,
        author: "octocat",
        avatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4",
        createdAt: "2026-05-24T08:00:00Z",
        body: "Good catch @contributor42. Go ahead and open that PR. Make sure to add tests for the responsive behavior.",
      },
    },
    {
      kind: "comment",
      data: {
        id: 8,
        author: "dependabot",
        avatarUrl: "https://avatars.githubusercontent.com/u/27347476?v=4",
        createdAt: "2026-05-24T16:45:00Z",
        body: "Related: there might also be a z-index stacking issue with the dropdown menu when the viewport is narrow. Worth checking in the same PR.",
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
        <Text size="small" weight="light">
          {"commented "}
          <RelativeTime datetime={createdAt} />
        </Text>
      </div>
      {/* Comment body */}
      <div style={{ padding: "var(--base-size-16)" }}>
        <Text as="p" size="medium">
          {body}
        </Text>
      </div>
    </div>
  );
}

function EventEntry({
  event,
}: {
  event: TimelineEvent;
}) {
  let icon;
  let description: string;

  switch (event.type) {
    case "labeled":
      icon = <TagIcon size={16} />;
      description = `${event.actor} added the ${event.detail} label`;
      break;
    case "closed":
      icon = <IssueClosedIcon size={16} />;
      description = `${event.actor} closed this`;
      break;
    case "reopened":
      icon = <IssueOpenedIcon size={16} />;
      description = `${event.actor} reopened this`;
      break;
    default:
      icon = <SkipIcon size={16} />;
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
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function IssueDetailPage() {
  const params = useParams();
  const _id = params.id;
  const issue = MOCK_ISSUE;

  return (
    <Stack direction="vertical" gap="spacious">
      {/* ---- Page header ---- */}
      <div>
        <Stack direction="vertical" gap="condensed">
          <Stack direction="horizontal" gap="condensed" align="start" wrap="wrap">
            <Heading as="h1">
              {issue.title}{" "}
              <Text weight="light" style={{ color: "var(--fgColor-muted)" }}>
                #{issue.id}
              </Text>
            </Heading>
          </Stack>

          <Stack direction="horizontal" gap="condensed" align="center">
            <StateLabel status={issue.status === "open" ? "issueOpened" : "issueClosed"}>
              {issue.status === "open" ? "Open" : "Closed"}
            </StateLabel>
            <Text size="small" weight="light">
              <Text size="small" weight="semibold">
                {issue.author}
              </Text>
              {" opened this issue "}
              <RelativeTime datetime={issue.createdAt} />
              {" · "}
              {issue.commentCount} comments
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
            {/* Opening post */}
            <Stack direction="horizontal" gap="normal" align="start">
              <Avatar
                src={issue.authorAvatarUrl}
                size={40}
                alt={issue.author}
              />
              <div style={{ flex: 1 }}>
                <CommentBlock
                  author={issue.author}
                  avatarUrl={issue.authorAvatarUrl}
                  createdAt={issue.createdAt}
                  body={issue.body}
                />
              </div>
            </Stack>

            {/* Timeline */}
            <Timeline>
              {issue.timeline.map((entry) => {
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
                } else {
                  const e = entry.data;
                  return (
                    <Timeline.Item key={e.id} condensed>
                      <Timeline.Badge>
                        {e.type === "labeled" && <TagIcon size={16} />}
                        {e.type === "closed" && (
                          <IssueClosedIcon size={16} />
                        )}
                        {e.type === "reopened" && (
                          <IssueOpenedIcon size={16} />
                        )}
                      </Timeline.Badge>
                      <Timeline.Body>
                        <EventEntry event={e} />
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
                    {issue.status === "open" ? (
                      <Button variant="default" leadingVisual={IssueClosedIcon}>
                        <Text>Close issue</Text>
                      </Button>
                    ) : (
                      <Button variant="default" leadingVisual={IssueOpenedIcon}>
                        <Text>Reopen issue</Text>
                      </Button>
                    )}
                    <Button variant="primary">
                      <Text>Comment</Text>
                    </Button>
                  </Stack>
                </Stack>
              </div>
            </Stack>
          </Stack>
        </SplitPageLayout.Content>

        <SplitPageLayout.Pane position="end">
          <Stack direction="vertical" gap="spacious">
            {/* Assignees */}
            <Stack direction="vertical" gap="condensed">
              <Text size="small" weight="semibold">
                Assignees
              </Text>
              {issue.assignees.map((a) => (
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
                {issue.labels.map((l) => (
                  <Label key={l.name} variant={l.variant}>
                    {l.name}
                  </Label>
                ))}
              </LabelGroup>
            </Stack>

            {/* Projects placeholder */}
            <Stack direction="vertical" gap="condensed">
              <Text size="small" weight="semibold">
                Projects
              </Text>
              <Text size="small" weight="light">
                None yet
              </Text>
            </Stack>

            {/* Milestone placeholder */}
            <Stack direction="vertical" gap="condensed">
              <Text size="small" weight="semibold">
                Milestone
              </Text>
              <Text size="small" weight="light">
                No milestone
              </Text>
            </Stack>
          </Stack>
        </SplitPageLayout.Pane>
      </SplitPageLayout>
    </Stack>
  );
}
