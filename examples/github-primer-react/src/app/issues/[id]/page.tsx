"use client";

import {
  Avatar,
  Heading,
  Text,
  Button,
  StateLabel,
  Timeline,
  FormControl,
  Textarea,
  IssueLabelToken,
  RelativeTime,
  Stack,
  PageHeader,
  SplitPageLayout,
} from "@primer/react";
import {
  IssueOpenedIcon,
  IssueClosedIcon,
  TagIcon,
  PersonIcon,
  XIcon,
  SkipIcon,
  CommentIcon,
} from "@primer/octicons-react";
import { useParams } from "next/navigation";

/* ------------------------------------------------------------------ */
/*  Mock data                                                         */
/* ------------------------------------------------------------------ */

const ISSUE = {
  id: 42,
  title: "Autocomplete dropdown clips on narrow viewports",
  status: "open" as const,
  author: {
    login: "monalisa",
    avatarUrl: "https://avatars.githubusercontent.com/u/2030605?v=4",
  },
  createdAt: "2025-05-21T10:30:00Z",
  commentCount: 4,
  body: `When the viewport is narrower than 480px, the autocomplete dropdown extends beyond the right edge of the screen. This makes it impossible to select items that are partially hidden.\n\n**Steps to reproduce:**\n1. Open the issue creation form on a narrow viewport\n2. Click the assignee picker\n3. Observe the dropdown overflows the viewport\n\n**Expected:** The dropdown repositions itself to stay within bounds.`,
  labels: [
    { name: "bug", color: "#d73a4a" },
    { name: "component: Autocomplete", color: "#0075ca" },
    { name: "priority: high", color: "#e4e669" },
  ],
  assignees: [
    {
      login: "monalisa",
      avatarUrl: "https://avatars.githubusercontent.com/u/2030605?v=4",
    },
    {
      login: "octocat",
      avatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4",
    },
  ],
  timeline: [
    {
      type: "comment" as const,
      author: {
        login: "octocat",
        avatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4",
      },
      createdAt: "2025-05-21T11:15:00Z",
      body: "I can reproduce this on Chrome and Firefox. Looks like the overlay isn't using `AnchoredOverlay` with the correct `align` prop.",
    },
    {
      type: "event" as const,
      actor: "monalisa",
      action: 'added the "bug" label',
      createdAt: "2025-05-21T11:20:00Z",
      icon: "tag" as const,
    },
    {
      type: "event" as const,
      actor: "monalisa",
      action: 'added the "priority: high" label',
      createdAt: "2025-05-21T11:20:00Z",
      icon: "tag" as const,
    },
    {
      type: "comment" as const,
      author: {
        login: "monalisa",
        avatarUrl: "https://avatars.githubusercontent.com/u/2030605?v=4",
      },
      createdAt: "2025-05-21T14:00:00Z",
      body: "Good catch. I'll look into switching to `AnchoredOverlay` with `align=\"end\"` so the dropdown anchors to the right edge instead of the left.",
    },
    {
      type: "event" as const,
      actor: "monalisa",
      action: "self-assigned this",
      createdAt: "2025-05-21T14:05:00Z",
      icon: "person" as const,
    },
    {
      type: "comment" as const,
      author: {
        login: "hubot",
        avatarUrl: "https://avatars.githubusercontent.com/u/480938?v=4",
      },
      createdAt: "2025-05-22T09:30:00Z",
      body: "Also worth checking if `SelectPanel` has the same issue — it uses a similar overlay pattern.",
    },
    {
      type: "comment" as const,
      author: {
        login: "octocat",
        avatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4",
      },
      createdAt: "2025-05-22T16:45:00Z",
      body: "Confirmed — `SelectPanel` is fine because it already uses viewport-aware positioning. The fix should be straightforward for `Autocomplete`.",
    },
  ],
};

const EVENT_ICONS = {
  tag: TagIcon,
  person: PersonIcon,
  close: XIcon,
  skip: SkipIcon,
};

/* ------------------------------------------------------------------ */
/*  Comment component                                                  */
/* ------------------------------------------------------------------ */

function Comment({
  avatarUrl,
  login,
  createdAt,
  body,
}: {
  avatarUrl: string;
  login: string;
  createdAt: string;
  body: string;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--borderColor-default)",
        borderRadius: "var(--borderRadius-medium)",
      }}
    >
      <Stack
        direction="horizontal"
        gap="condensed"
        align="center"
        style={{
          padding: "var(--base-size-8) var(--base-size-16)",
          backgroundColor: "var(--bgColor-muted)",
          borderBottom: "1px solid var(--borderColor-default)",
          borderRadius:
            "var(--borderRadius-medium) var(--borderRadius-medium) 0 0",
        }}
      >
        <Avatar src={avatarUrl} size={20} alt={login} />
        <Text size="small" weight="semibold">
          {login}
        </Text>
        <Text size="small" weight="light">
          commented{" "}
          <RelativeTime datetime={createdAt} />
        </Text>
      </Stack>
      <div style={{ padding: "var(--base-size-16)" }}>
        <Text as="p" size="medium">
          {body.split("\n").map((line, i) => (
            <span key={i}>
              {line}
              {i < body.split("\n").length - 1 && <br />}
            </span>
          ))}
        </Text>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar                                                            */
/* ------------------------------------------------------------------ */

function Sidebar() {
  return (
    <Stack direction="vertical" gap="spacious">
      {/* Assignees */}
      <Stack direction="vertical" gap="condensed">
        <Text size="small" weight="semibold">
          Assignees
        </Text>
        <Stack direction="vertical" gap="condensed">
          {ISSUE.assignees.map((a) => (
            <Stack key={a.login} direction="horizontal" gap="condensed" align="center">
              <Avatar src={a.avatarUrl} size={20} alt={a.login} />
              <Text size="small" weight="medium">
                {a.login}
              </Text>
            </Stack>
          ))}
        </Stack>
      </Stack>

      {/* Labels */}
      <Stack direction="vertical" gap="condensed">
        <Text size="small" weight="semibold">
          Labels
        </Text>
        <Stack direction="horizontal" gap="condensed" wrap="wrap">
          {ISSUE.labels.map((l) => (
            <IssueLabelToken
              key={l.name}
              text={l.name}
              fillColor={l.color}
              size="medium"
            />
          ))}
        </Stack>
      </Stack>

      {/* Projects placeholder */}
      <Stack direction="vertical" gap="condensed">
        <Text size="small" weight="semibold">
          Projects
        </Text>
        <Text as="p" size="small" weight="light">
          None yet
        </Text>
      </Stack>

      {/* Milestone placeholder */}
      <Stack direction="vertical" gap="condensed">
        <Text size="small" weight="semibold">
          Milestone
        </Text>
        <Text as="p" size="small" weight="light">
          No milestone
        </Text>
      </Stack>
    </Stack>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function IssueDetailPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <SplitPageLayout>
      <SplitPageLayout.Header>
        <PageHeader>
          <PageHeader.TitleArea>
            <StateLabel status={ISSUE.status === "open" ? "issueOpened" : "issueClosed"}>
              {ISSUE.status === "open" ? "Open" : "Closed"}
            </StateLabel>
            <PageHeader.Title as="h1">
              {ISSUE.title}{" "}
              <Text size="large" weight="light" style={{ color: "var(--fgColor-muted)" }}>
                #{id}
              </Text>
            </PageHeader.Title>
          </PageHeader.TitleArea>
          <PageHeader.Actions>
            <Stack direction="horizontal" gap="condensed" align="center">
              <Text size="small" weight="light">
                <Text size="small" weight="semibold">
                  {ISSUE.author.login}
                </Text>{" "}
                opened this issue{" "}
                <RelativeTime datetime={ISSUE.createdAt} /> &middot;{" "}
                {ISSUE.commentCount} comments
              </Text>
            </Stack>
          </PageHeader.Actions>
        </PageHeader>
      </SplitPageLayout.Header>

      <SplitPageLayout.Content>
        {/* Opening post */}
        <Comment
          avatarUrl={ISSUE.author.avatarUrl}
          login={ISSUE.author.login}
          createdAt={ISSUE.createdAt}
          body={ISSUE.body}
        />

        {/* Timeline */}
        <Timeline style={{ marginTop: "var(--base-size-16)" }}>
          {ISSUE.timeline.map((item, idx) => {
            if (item.type === "comment") {
              return (
                <Timeline.Item key={idx}>
                  <Timeline.Badge>
                    <Avatar
                      src={item.author.avatarUrl}
                      size={16}
                      alt={item.author.login}
                    />
                  </Timeline.Badge>
                  <Timeline.Body>
                    <Comment
                      avatarUrl={item.author.avatarUrl}
                      login={item.author.login}
                      createdAt={item.createdAt}
                      body={item.body}
                    />
                  </Timeline.Body>
                </Timeline.Item>
              );
            }

            // Event item
            const IconComponent = EVENT_ICONS[item.icon];
            return (
              <Timeline.Item key={idx} condensed>
                <Timeline.Badge>
                  <IconComponent size={16} />
                </Timeline.Badge>
                <Timeline.Body>
                  <Text size="small">
                    <Text size="small" weight="semibold">
                      {item.actor}
                    </Text>{" "}
                    {item.action}{" "}
                    <RelativeTime datetime={item.createdAt} />
                  </Text>
                </Timeline.Body>
              </Timeline.Item>
            );
          })}
          <Timeline.Break />
        </Timeline>

        {/* Comment composer */}
        <div
          style={{
            marginTop: "var(--base-size-24)",
            border: "1px solid var(--borderColor-default)",
            borderRadius: "var(--borderRadius-medium)",
            padding: "var(--base-size-16)",
          }}
        >
          <FormControl>
            <FormControl.Label>Add a comment</FormControl.Label>
            <Textarea
              block
              placeholder="Leave a comment"
              resize="vertical"
              rows={4}
            />
          </FormControl>
          <Stack
            direction="horizontal"
            gap="normal"
            justify="end"
            style={{ marginTop: "var(--base-size-12)" }}
          >
            {ISSUE.status === "open" ? (
              <Button variant="default" leadingVisual={IssueClosedIcon}>
                Close issue
              </Button>
            ) : (
              <Button variant="default" leadingVisual={IssueOpenedIcon}>
                Reopen issue
              </Button>
            )}
            <Button variant="primary" leadingVisual={CommentIcon}>
              Comment
            </Button>
          </Stack>
        </div>
      </SplitPageLayout.Content>

      <SplitPageLayout.Pane position="end">
        <Sidebar />
      </SplitPageLayout.Pane>
    </SplitPageLayout>
  );
}
