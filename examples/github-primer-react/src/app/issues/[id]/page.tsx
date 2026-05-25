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
import { PageHeader } from "@primer/react";
import {
  IssueClosedIcon,
  IssueOpenedIcon,
  TagIcon,
} from "@primer/octicons-react";
import { useParams } from "next/navigation";

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

interface IssueLabel {
  name: string;
  color: string;
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
  label?: string;
  labelVariant?: IssueLabel["variant"];
}

interface IssueDetail {
  id: number;
  title: string;
  status: "open" | "closed";
  author: string;
  authorAvatarUrl: string;
  createdAt: string;
  body: string;
  labels: IssueLabel[];
  assignees: { login: string; avatarUrl: string }[];
  commentCount: number;
  comments: Comment[];
  events: TimelineEvent[];
}

const ISSUE: IssueDetail = {
  id: 142,
  title: "Navigation bar overlaps content on mobile viewports",
  status: "open",
  author: "octocat",
  authorAvatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4",
  createdAt: "2025-05-20T09:30:00Z",
  body: "When viewing any page on a viewport narrower than 480px, the top navigation bar overlaps the page content. The hamburger menu icon is also not tappable because it sits beneath the header z-index layer.\n\nSteps to reproduce:\n1. Open the app in Chrome DevTools responsive mode.\n2. Set the viewport width to 375px.\n3. Scroll down — the nav bar covers the first ~60px of content.",
  labels: [
    { name: "bug", color: "#d73a49", variant: "danger" },
    { name: "mobile", color: "#0075ca", variant: "accent" },
  ],
  assignees: [
    {
      login: "monalisa",
      avatarUrl: "https://avatars.githubusercontent.com/u/2?v=4",
    },
    {
      login: "hubot",
      avatarUrl: "https://avatars.githubusercontent.com/u/480938?v=4",
    },
  ],
  commentCount: 5,
  comments: [
    {
      id: 1,
      author: "monalisa",
      avatarUrl: "https://avatars.githubusercontent.com/u/2?v=4",
      createdAt: "2025-05-20T11:00:00Z",
      body: "I can reproduce this on Safari as well. Looks like the nav has `position: fixed` but the content area doesn't account for its height.",
    },
    {
      id: 2,
      author: "hubot",
      avatarUrl: "https://avatars.githubusercontent.com/u/480938?v=4",
      createdAt: "2025-05-21T08:15:00Z",
      body: "Confirmed. The root cause is the missing `padding-top` on the main content wrapper. I'll put up a fix today.",
    },
    {
      id: 3,
      author: "octocat",
      avatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4",
      createdAt: "2025-05-22T14:30:00Z",
      body: "Thanks @hubot! Also, could you check if the hamburger menu z-index needs to be bumped? It's untappable on iOS Safari.",
    },
  ],
  events: [
    {
      id: 101,
      type: "labeled",
      actor: "octocat",
      createdAt: "2025-05-20T09:31:00Z",
      label: "bug",
      labelVariant: "danger",
    },
    {
      id: 102,
      type: "labeled",
      actor: "octocat",
      createdAt: "2025-05-20T09:31:30Z",
      label: "mobile",
      labelVariant: "accent",
    },
  ],
};

/* ------------------------------------------------------------------ */
/*  Merge comments + events into a chronological timeline              */
/* ------------------------------------------------------------------ */

type TimelineEntry =
  | { kind: "comment"; data: Comment }
  | { kind: "event"; data: TimelineEvent };

function buildTimeline(issue: IssueDetail): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    ...issue.comments.map(
      (c) => ({ kind: "comment" as const, data: c }),
    ),
    ...issue.events.map(
      (e) => ({ kind: "event" as const, data: e }),
    ),
  ];
  entries.sort(
    (a, b) =>
      new Date(a.data.createdAt).getTime() -
      new Date(b.data.createdAt).getTime(),
  );
  return entries;
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function IssueDetailPage() {
  const params = useParams();
  const _id = params.id;
  const issue = ISSUE;
  const timeline = buildTimeline(issue);

  return (
    <Stack gap="normal">
      {/* Page header: title + status */}
      <PageHeader>
        <PageHeader.TitleArea>
          <PageHeader.Title as="h1">
            {issue.title}{" "}
            <Text size="large" weight="light">
              #{issue.id}
            </Text>
          </PageHeader.Title>
        </PageHeader.TitleArea>
        <PageHeader.Description>
          <Stack direction="horizontal" align="center" gap="condensed" wrap="wrap">
            <StateLabel
              status={issue.status === "open" ? "issueOpened" : "issueClosed"}
            >
              {issue.status === "open" ? "Open" : "Closed"}
            </StateLabel>
            <Text size="small" weight="light">
              <Text size="small" weight="semibold">
                {issue.author}
              </Text>{" "}
              opened this issue{" "}
              <RelativeTime datetime={issue.createdAt} threshold="P30D" /> &middot;{" "}
              {issue.commentCount} comments
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
          <Timeline>
            {/* Opening post */}
            <Timeline.Item>
              <Timeline.Badge>
                <Avatar
                  src={issue.authorAvatarUrl}
                  alt={issue.author}
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
                      {issue.author}
                    </Text>
                    <Text size="small" weight="light">
                      commented{" "}
                      <RelativeTime
                        datetime={issue.createdAt}
                        threshold="P30D"
                      />
                    </Text>
                  </Stack>
                  <Text as="p" size="medium">
                    {issue.body.split("\n").map((line, i) => (
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
                      <Avatar
                        src={c.avatarUrl}
                        alt={c.author}
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
              } else {
                const e = entry.data;
                return (
                  <Timeline.Item key={`event-${e.id}`} condensed>
                    <Timeline.Badge>
                      {e.type === "labeled" && <TagIcon size={16} />}
                      {e.type === "closed" && <IssueClosedIcon size={16} />}
                      {e.type === "reopened" && <IssueOpenedIcon size={16} />}
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
                        {e.type === "labeled" && (
                          <>
                            <Text size="small" weight="light">
                              added the
                            </Text>
                            <Label
                              variant={e.labelVariant ?? "default"}
                              size="small"
                            >
                              {e.label}
                            </Label>
                            <Text size="small" weight="light">
                              label
                            </Text>
                          </>
                        )}
                        {e.type === "closed" && (
                          <Text size="small" weight="light">
                            closed this
                          </Text>
                        )}
                        {e.type === "reopened" && (
                          <Text size="small" weight="light">
                            reopened this
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
              }
            })}
          </Timeline>

          {/* Comment composer */}
          <div
            style={{
              marginTop: "var(--stack-gap-spacious)",
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
                <Button variant="default">
                  {issue.status === "open"
                    ? "Close issue"
                    : "Reopen issue"}
                </Button>
                <Button variant="primary">Comment</Button>
              </Stack>
            </Stack>
          </div>
        </SplitPageLayout.Content>

        {/* Sidebar */}
        <SplitPageLayout.Pane position="end">
          <Stack gap="spacious">
            {/* Assignees */}
            <Stack gap="condensed">
              <Text size="small" weight="semibold">
                Assignees
              </Text>
              {issue.assignees.map((a) => (
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
                {issue.labels.map((l) => (
                  <Label key={l.name} variant={l.variant}>
                    {l.name}
                  </Label>
                ))}
              </LabelGroup>
            </Stack>

            {/* Projects placeholder */}
            <Stack gap="condensed">
              <Text size="small" weight="semibold">
                Projects
              </Text>
              <Text size="small" weight="light">
                None yet
              </Text>
            </Stack>

            {/* Milestone placeholder */}
            <Stack gap="condensed">
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
