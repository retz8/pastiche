"use client";

import { useState } from "react";
import {
  Avatar,
  AvatarStack,
  Button,
  FormControl,
  Heading,
  Label,
  LabelGroup,
  PageHeader,
  RelativeTime,
  SplitPageLayout,
  Stack,
  StateLabel,
  Text,
  Textarea,
  Timeline,
} from "@primer/react";
import {
  TagIcon,
  IssueClosedIcon,
  CrossReferenceIcon,
  MilestoneIcon,
} from "@primer/octicons-react";

type IssueState = "open" | "closed";

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

type IssueLabel = {
  name: string;
  variant: LabelVariant;
};

type User = {
  login: string;
  avatar: string;
};

type CommentEntry = {
  kind: "comment";
  id: string;
  author: User;
  createdAt: string;
  body: string;
};

type EventEntry = {
  kind: "event";
  id: string;
  actor: User;
  icon: React.ElementType;
  description: React.ReactNode;
  createdAt: string;
};

type TimelineEntry = CommentEntry | EventEntry;

const DAY = 1000 * 60 * 60 * 24;
const HOUR = 1000 * 60 * 60;

function daysAgo(days: number): string {
  return new Date(Date.now() - days * DAY).toISOString();
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * HOUR).toISOString();
}

const USERS: Record<string, User> = {
  broccolinisoup: {
    login: "broccolinisoup",
    avatar: "https://avatars.githubusercontent.com/broccolinisoup",
  },
  siddharthkp: {
    login: "siddharthkp",
    avatar: "https://avatars.githubusercontent.com/siddharthkp",
  },
  langermank: {
    login: "langermank",
    avatar: "https://avatars.githubusercontent.com/langermank",
  },
  joshblack: {
    login: "joshblack",
    avatar: "https://avatars.githubusercontent.com/joshblack",
  },
  TylerJDev: {
    login: "TylerJDev",
    avatar: "https://avatars.githubusercontent.com/TylerJDev",
  },
};

const ISSUE = {
  number: 4798,
  title: "RelativeTime renders a hydration mismatch warning in Next.js",
  state: "open" as IssueState,
  author: USERS.broccolinisoup,
  createdAt: daysAgo(3),
  comments: 4,
  labels: [
    { name: "bug", variant: "danger" },
    { name: "ssr", variant: "attention" },
  ] as IssueLabel[],
  assignees: [USERS.siddharthkp, USERS.langermank] as User[],
  openingPost:
    "When `RelativeTime` is server-rendered in a Next.js app, the markup produced on the server doesn't match what React renders on the client, so the console fills with hydration mismatch warnings.\n\nReproduction: drop a `<RelativeTime date={...} />` into any Server Component page and load it — the warning fires on first paint.",
};

const TIMELINE: TimelineEntry[] = [
  {
    kind: "comment",
    id: "c1",
    author: USERS.siddharthkp,
    createdAt: daysAgo(2.5),
    body: "Confirmed on my end. The issue is that `Intl.RelativeTimeFormat` resolves against the user's locale, which the server can't know ahead of time.",
  },
  {
    kind: "event",
    id: "e1",
    actor: USERS.langermank,
    icon: TagIcon,
    description: (
      <>
        added the{" "}
        <Text weight="semibold">ssr</Text> label
      </>
    ),
    createdAt: daysAgo(2.4),
  },
  {
    kind: "comment",
    id: "c2",
    author: USERS.langermank,
    createdAt: daysAgo(2),
    body: "We can gate the relative formatting behind a `suppressHydrationWarning` on the wrapping element, or defer the relative rendering until after mount. Leaning toward the latter so the markup stays clean.",
  },
  {
    kind: "event",
    id: "e2",
    actor: USERS.joshblack,
    icon: CrossReferenceIcon,
    description: <>referenced this issue in pull request #4802</>,
    createdAt: daysAgo(1),
  },
  {
    kind: "comment",
    id: "c3",
    author: USERS.broccolinisoup,
    createdAt: hoursAgo(6),
    body: "#4802 looks great — defers to a `useEffect` and renders a stable absolute timestamp on the server. Testing locally now.",
  },
];

export default function IssueDetailPage() {
  const [issueState, setIssueState] = useState<IssueState>(ISSUE.state);
  const [draft, setDraft] = useState("");

  const isOpen = issueState === "open";

  return (
    <SplitPageLayout>
      <SplitPageLayout.Content width="xlarge">
        <Stack direction="vertical" gap="normal">
          <PageHeader aria-label="Issue header">
            <PageHeader.TitleArea>
              <PageHeader.Title as="h1">
                {ISSUE.title}{" "}
                <Text weight="light" style={{ color: "var(--fgColor-muted)" }}>
                  #{ISSUE.number}
                </Text>
              </PageHeader.Title>
            </PageHeader.TitleArea>
            <PageHeader.Description>
              <Stack direction="horizontal" gap="condensed" align="baseline" wrap="wrap">
                <StateLabel status={isOpen ? "issueOpened" : "issueClosed"}>
                  {isOpen ? "Open" : "Closed"}
                </StateLabel>
                <Text size="small" weight="light">
                  <Text weight="semibold">{ISSUE.author.login}</Text> opened this
                  issue{" "}
                  <RelativeTime
                    date={new Date(ISSUE.createdAt)}
                    threshold="P30D"
                  />{" "}
                  · {ISSUE.comments} comments
                </Text>
              </Stack>
            </PageHeader.Description>
          </PageHeader>

          <Timeline>
            {/* Opening post — rendered as a comment */}
            <Timeline.Item>
              <Timeline.Badge>
                <Avatar src={ISSUE.author.avatar} alt="" size={24} />
              </Timeline.Badge>
              <Timeline.Body>
                <Stack direction="vertical" gap="condensed">
                  <Stack
                    direction="horizontal"
                    gap="condensed"
                    align="baseline"
                    wrap="wrap"
                  >
                    <Text weight="semibold">{ISSUE.author.login}</Text>
                    <Text size="small" weight="light">
                      commented{" "}
                      <RelativeTime
                        date={new Date(ISSUE.createdAt)}
                        threshold="P30D"
                      />
                    </Text>
                  </Stack>
                  {ISSUE.openingPost.split("\n\n").map((paragraph, index) => (
                    <Text as="p" key={index} size="medium">
                      {paragraph}
                    </Text>
                  ))}
                </Stack>
              </Timeline.Body>
            </Timeline.Item>

            {TIMELINE.map((entry) =>
              entry.kind === "comment" ? (
                <Timeline.Item key={entry.id}>
                  <Timeline.Badge>
                    <Avatar src={entry.author.avatar} alt="" size={24} />
                  </Timeline.Badge>
                  <Timeline.Body>
                    <Stack direction="vertical" gap="condensed">
                      <Stack
                        direction="horizontal"
                        gap="condensed"
                        align="baseline"
                        wrap="wrap"
                      >
                        <Text weight="semibold">{entry.author.login}</Text>
                        <Text size="small" weight="light">
                          commented{" "}
                          <RelativeTime
                            date={new Date(entry.createdAt)}
                            threshold="P30D"
                          />
                        </Text>
                      </Stack>
                      <Text as="p" size="medium">
                        {entry.body}
                      </Text>
                    </Stack>
                  </Timeline.Body>
                </Timeline.Item>
              ) : (
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
              )
            )}
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
              <Button
                variant="default"
                leadingVisual={isOpen ? IssueClosedIcon : undefined}
                onClick={() =>
                  setIssueState((prev) => (prev === "open" ? "closed" : "open"))
                }
              >
                {isOpen ? "Close issue" : "Reopen issue"}
              </Button>
              <Button variant="primary">Comment</Button>
            </Stack>
          </Stack>
        </Stack>
      </SplitPageLayout.Content>

      <SplitPageLayout.Pane position="end" aria-label="Issue metadata">
        <Stack direction="vertical" gap="none">
          <Stack
            direction="vertical"
            gap="condensed"
            paddingBlock="normal"
            style={{
              borderBottom:
                "var(--borderWidth-thin) solid var(--borderColor-muted)",
            }}
          >
            <Heading as="h2" variant="small">
              Assignees
            </Heading>
            {ISSUE.assignees.length > 0 ? (
              <Stack direction="horizontal" gap="condensed" align="center">
                <AvatarStack>
                  {ISSUE.assignees.map((user) => (
                    <Avatar key={user.login} src={user.avatar} alt={user.login} />
                  ))}
                </AvatarStack>
                <Text size="small">
                  {ISSUE.assignees.map((user) => user.login).join(", ")}
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
            style={{
              borderBottom:
                "var(--borderWidth-thin) solid var(--borderColor-muted)",
            }}
          >
            <Heading as="h2" variant="small">
              Labels
            </Heading>
            {ISSUE.labels.length > 0 ? (
              <LabelGroup>
                {ISSUE.labels.map((label) => (
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
            style={{
              borderBottom:
                "var(--borderWidth-thin) solid var(--borderColor-muted)",
            }}
          >
            <Heading as="h2" variant="small">
              Projects
            </Heading>
            <Text size="small" weight="light">
              None yet
            </Text>
          </Stack>

          <Stack direction="vertical" gap="condensed" paddingBlock="normal">
            <Stack direction="horizontal" gap="condensed" align="center">
              <MilestoneIcon />
              <Heading as="h2" variant="small">
                Milestone
              </Heading>
            </Stack>
            <Text size="small" weight="light">
              No milestone
            </Text>
          </Stack>
        </Stack>
      </SplitPageLayout.Pane>
    </SplitPageLayout>
  );
}
