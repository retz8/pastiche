"use client";

import { useState } from "react";
import NextLink from "next/link";
import {
  ActionList,
  LinkButton,
  PageLayout,
  TextInput,
  UnderlineNav,
  StateLabel,
  IssueLabelToken,
  LabelGroup,
  RelativeTime,
  Text,
  Stack,
} from "@primer/react";
import { Blankslate } from "@primer/react/experimental";
import {
  IssueOpenedIcon,
  IssueClosedIcon,
  SearchIcon,
  CommentIcon,
} from "@primer/octicons-react";

interface IssueLabel {
  name: string;
  color: string;
}

interface Issue {
  id: number;
  title: string;
  status: "issueOpened" | "issueClosed";
  labels: IssueLabel[];
  author: string;
  createdAt: string;
  commentCount: number;
}

const MOCK_ISSUES: Issue[] = [
  {
    id: 142,
    title: "Fix broken link in README contributing section",
    status: "issueOpened",
    labels: [{ name: "bug", color: "#d73a4a" }],
    author: "octocat",
    createdAt: "2026-05-22T10:30:00Z",
    commentCount: 3,
  },
  {
    id: 141,
    title: "Add dark mode support for settings page",
    status: "issueOpened",
    labels: [
      { name: "enhancement", color: "#a2eeef" },
      { name: "design", color: "#d4c5f9" },
    ],
    author: "monalisa",
    createdAt: "2026-05-21T14:15:00Z",
    commentCount: 7,
  },
  {
    id: 140,
    title: "Upgrade Node.js to v22 LTS",
    status: "issueClosed",
    labels: [{ name: "dependencies", color: "#0075ca" }],
    author: "dependabot",
    createdAt: "2026-05-20T09:00:00Z",
    commentCount: 1,
  },
  {
    id: 139,
    title: "Implement pagination for issue list",
    status: "issueOpened",
    labels: [
      { name: "enhancement", color: "#a2eeef" },
      { name: "good first issue", color: "#7057ff" },
    ],
    author: "junior-dev",
    createdAt: "2026-05-19T16:45:00Z",
    commentCount: 5,
  },
  {
    id: 138,
    title: "CI pipeline fails on Windows runners",
    status: "issueClosed",
    labels: [
      { name: "bug", color: "#d73a4a" },
      { name: "CI/CD", color: "#fbca04" },
    ],
    author: "actions-bot",
    createdAt: "2026-05-17T11:20:00Z",
    commentCount: 12,
  },
  {
    id: 137,
    title: "Add CODEOWNERS file for automatic review assignment",
    status: "issueOpened",
    labels: [{ name: "documentation", color: "#0075ca" }],
    author: "octocat",
    createdAt: "2026-05-15T08:30:00Z",
    commentCount: 2,
  },
  {
    id: 136,
    title: "Memory leak in WebSocket connection handler",
    status: "issueOpened",
    labels: [
      { name: "bug", color: "#d73a4a" },
      { name: "priority: high", color: "#b60205" },
    ],
    author: "senior-eng",
    createdAt: "2026-05-12T20:10:00Z",
    commentCount: 9,
  },
  {
    id: 135,
    title: "Refactor authentication middleware to use JWT",
    status: "issueClosed",
    labels: [
      { name: "enhancement", color: "#a2eeef" },
      { name: "security", color: "#e4e669" },
    ],
    author: "monalisa",
    createdAt: "2026-05-10T13:00:00Z",
    commentCount: 4,
  },
  {
    id: 134,
    title: "Support multi-language translations",
    status: "issueOpened",
    labels: [
      { name: "enhancement", color: "#a2eeef" },
      { name: "i18n", color: "#c5def5" },
    ],
    author: "translator-bot",
    createdAt: "2026-05-08T07:45:00Z",
    commentCount: 0,
  },
  {
    id: 133,
    title: "Remove deprecated API endpoints from v1",
    status: "issueClosed",
    labels: [{ name: "breaking change", color: "#b60205" }],
    author: "senior-eng",
    createdAt: "2026-05-05T15:30:00Z",
    commentCount: 6,
  },
];

export default function IssuesPage() {
  const [filter, setFilter] = useState("");
  const [tab, setTab] = useState<"open" | "closed">("open");

  const filteredIssues = MOCK_ISSUES.filter((issue) => {
    const matchesTab =
      tab === "open"
        ? issue.status === "issueOpened"
        : issue.status === "issueClosed";
    const matchesFilter =
      filter === "" ||
      issue.title.toLowerCase().includes(filter.toLowerCase()) ||
      issue.labels.some((l) =>
        l.name.toLowerCase().includes(filter.toLowerCase())
      );
    return matchesTab && matchesFilter;
  });

  const openCount = MOCK_ISSUES.filter(
    (i) => i.status === "issueOpened"
  ).length;
  const closedCount = MOCK_ISSUES.filter(
    (i) => i.status === "issueClosed"
  ).length;

  return (
    <PageLayout containerWidth="xlarge" padding="normal" rowGap="normal">
    <PageLayout.Content>
    <Stack direction="vertical" gap="normal">
      {/* Search bar + New issue button */}
      <Stack direction="horizontal" gap="normal" align="center">
        <div style={{ flex: 1 }}>
          <TextInput
            leadingVisual={SearchIcon}
            placeholder="Search all issues"
            value={filter}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFilter(e.target.value)
            }
            aria-label="Search issues"
            block
          />
        </div>
        <LinkButton href="/issues/new" variant="primary">
          New issue
        </LinkButton>
      </Stack>

      {/* Open / Closed tabs */}
      <UnderlineNav aria-label="Issue status">
        <UnderlineNav.Item
          aria-current={tab === "open" ? "page" : undefined}
          onSelect={(e) => {
            e.preventDefault();
            setTab("open");
          }}
          counter={openCount}
          icon={IssueOpenedIcon}
        >
          Open
        </UnderlineNav.Item>
        <UnderlineNav.Item
          aria-current={tab === "closed" ? "page" : undefined}
          onSelect={(e) => {
            e.preventDefault();
            setTab("closed");
          }}
          counter={closedCount}
          icon={IssueClosedIcon}
        >
          Closed
        </UnderlineNav.Item>
      </UnderlineNav>

      {/* Issue list or empty state */}
      {filteredIssues.length === 0 ? (
        <div>
          <Blankslate>
            <Blankslate.Visual>
              <IssueOpenedIcon size={24} />
            </Blankslate.Visual>
            <Blankslate.Heading>No issues found</Blankslate.Heading>
            <Blankslate.Description>
              {filter
                ? "No issues match your search. Try a different filter."
                : tab === "open"
                  ? "There are no open issues."
                  : "There are no closed issues."}
            </Blankslate.Description>
          </Blankslate>
        </div>
      ) : (
        <ActionList showDividers>
          {filteredIssues.map((issue) => (
            <ActionList.LinkItem
              key={issue.id}
              href={`/issues/${issue.id}`}
            >
              <ActionList.LeadingVisual>
                <StateLabel status={issue.status} variant="small" />
              </ActionList.LeadingVisual>
              <span style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
                {issue.title}
                {issue.labels.length > 0 && (
                  <LabelGroup>
                    {issue.labels.map((label) => (
                      <IssueLabelToken
                        key={label.name}
                        text={label.name}
                        fillColor={label.color}
                        size="small"
                      />
                    ))}
                  </LabelGroup>
                )}
              </span>
              <ActionList.Description variant="block">
                #{issue.id} opened{" "}
                <RelativeTime datetime={issue.createdAt} /> by{" "}
                {issue.author}
              </ActionList.Description>
              {issue.commentCount > 0 && (
                <ActionList.TrailingVisual>
                  <Stack direction="horizontal" gap="condensed" align="center">
                    <CommentIcon size={16} />
                    <Text size="small">{issue.commentCount}</Text>
                  </Stack>
                </ActionList.TrailingVisual>
              )}
            </ActionList.LinkItem>
          ))}
        </ActionList>
      )}
    </Stack>
  );
}
