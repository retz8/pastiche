"use client";

import { useState } from "react";
import {
  ActionList,
  LinkButton,
  TextInput,
  Label,
  LabelGroup,
  StateLabel,
  SegmentedControl,
  Stack,
  Text,
  RelativeTime,
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

interface Issue {
  id: number;
  title: string;
  status: "open" | "closed";
  labels: IssueLabel[];
  author: string;
  createdAt: string;
  commentCount: number;
}

const ISSUES: Issue[] = [
  {
    id: 142,
    title: "Navigation bar overlaps content on mobile viewports",
    status: "open",
    labels: [
      { name: "bug", color: "#d73a49", variant: "danger" },
      { name: "mobile", color: "#0075ca", variant: "accent" },
    ],
    author: "octocat",
    createdAt: "2025-05-20T09:30:00Z",
    commentCount: 5,
  },
  {
    id: 141,
    title: "Add dark mode support for settings page",
    status: "open",
    labels: [
      { name: "enhancement", color: "#a2eeef", variant: "accent" },
      { name: "design", color: "#d4c5f9", variant: "secondary" },
    ],
    author: "monalisa",
    createdAt: "2025-05-18T14:15:00Z",
    commentCount: 12,
  },
  {
    id: 140,
    title: "Improve error messages for form validation",
    status: "open",
    labels: [{ name: "enhancement", color: "#a2eeef", variant: "accent" }],
    author: "hubot",
    createdAt: "2025-05-15T11:00:00Z",
    commentCount: 3,
  },
  {
    id: 139,
    title: "Update dependencies to latest major versions",
    status: "closed",
    labels: [
      { name: "dependencies", color: "#0366d6", variant: "accent" },
      { name: "maintenance", color: "#fbca04", variant: "attention" },
    ],
    author: "dependabot",
    createdAt: "2025-05-14T08:45:00Z",
    commentCount: 1,
  },
  {
    id: 138,
    title: "Search returns no results for queries with special characters",
    status: "open",
    labels: [{ name: "bug", color: "#d73a49", variant: "danger" }],
    author: "octocat",
    createdAt: "2025-05-12T16:20:00Z",
    commentCount: 7,
  },
  {
    id: 137,
    title: "Add keyboard shortcuts documentation",
    status: "closed",
    labels: [
      { name: "documentation", color: "#0075ca", variant: "done" },
      { name: "good first issue", color: "#7057ff", variant: "sponsors" },
    ],
    author: "monalisa",
    createdAt: "2025-05-10T10:30:00Z",
    commentCount: 2,
  },
  {
    id: 136,
    title: "Implement pagination for repository list",
    status: "open",
    labels: [{ name: "enhancement", color: "#a2eeef", variant: "accent" }],
    author: "hubot",
    createdAt: "2025-05-08T13:00:00Z",
    commentCount: 9,
  },
  {
    id: 135,
    title: "Fix accessibility issues in dropdown menus",
    status: "closed",
    labels: [
      { name: "bug", color: "#d73a49", variant: "danger" },
      { name: "accessibility", color: "#d93f0b", variant: "severe" },
    ],
    author: "a11y-bot",
    createdAt: "2025-05-05T09:15:00Z",
    commentCount: 4,
  },
  {
    id: 134,
    title: "Rate limiting not enforced on API endpoints",
    status: "open",
    labels: [
      { name: "bug", color: "#d73a49", variant: "danger" },
      { name: "security", color: "#e11d48", variant: "danger" },
    ],
    author: "security-team",
    createdAt: "2025-05-01T07:45:00Z",
    commentCount: 15,
  },
  {
    id: 133,
    title: "Refactor authentication module to use OAuth 2.1",
    status: "closed",
    labels: [
      { name: "enhancement", color: "#a2eeef", variant: "accent" },
      { name: "security", color: "#e11d48", variant: "danger" },
    ],
    author: "octocat",
    createdAt: "2025-04-28T11:30:00Z",
    commentCount: 8,
  },
];

export default function IssuesPage() {
  const [filter, setFilter] = useState<"open" | "closed">("open");
  const [searchQuery, setSearchQuery] = useState("");

  const openCount = ISSUES.filter((i) => i.status === "open").length;
  const closedCount = ISSUES.filter((i) => i.status === "closed").length;

  const filteredIssues = ISSUES.filter((issue) => {
    const matchesStatus = issue.status === filter;
    const matchesSearch =
      searchQuery === "" ||
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.labels.some((l) =>
        l.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesStatus && matchesSearch;
  });

  return (
    <Stack gap="normal">
      {/* Search bar + New issue button */}
      <Stack direction="horizontal" gap="condensed" align="center">
        <TextInput
          aria-label="Search all issues"
          placeholder="Search all issues"
          leadingVisual={SearchIcon}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1 }}
          contrast
        />
        <LinkButton href="/issues/new" variant="primary">
          New issue
        </LinkButton>
      </Stack>

      {/* Open / Closed toggle */}
      <div>
        <SegmentedControl
          aria-label="Issue status filter"
          onChange={(index) => setFilter(index === 0 ? "open" : "closed")}
        >
          <SegmentedControl.Button
            selected={filter === "open"}
            leadingIcon={IssueOpenedIcon}
            count={openCount}
          >
            Open
          </SegmentedControl.Button>
          <SegmentedControl.Button
            selected={filter === "closed"}
            leadingIcon={IssueClosedIcon}
            count={closedCount}
          >
            Closed
          </SegmentedControl.Button>
        </SegmentedControl>
      </div>

      {/* Issue list */}
      {filteredIssues.length === 0 ? (
        <Blankslate>
          <Blankslate.Visual>
            <IssueOpenedIcon size={24} />
          </Blankslate.Visual>
          <Blankslate.Heading>No issues found</Blankslate.Heading>
          <Blankslate.Description>
            {searchQuery
              ? "No issues match your search. Try a different query."
              : filter === "open"
                ? "There are no open issues. Great work!"
                : "There are no closed issues yet."}
          </Blankslate.Description>
          {searchQuery && (
            <Blankslate.PrimaryAction onClick={() => setSearchQuery("")}>
              Clear search
            </Blankslate.PrimaryAction>
          )}
        </Blankslate>
      ) : (
        <ActionList showDividers>
          {filteredIssues.map((issue) => (
            <ActionList.LinkItem key={issue.id} href={`/issues/${issue.id}`}>
              <ActionList.LeadingVisual>
                <StateLabel
                  status={issue.status === "open" ? "issueOpened" : "issueClosed"}
                  size="small"
                />
              </ActionList.LeadingVisual>
              <div>
                <Stack direction="horizontal" align="center" gap="condensed" wrap="wrap">
                  <Text weight="semibold">{issue.title}</Text>
                  {issue.labels.length > 0 && (
                    <LabelGroup>
                      {issue.labels.map((label) => (
                        <Label key={label.name} variant={label.variant} size="small">
                          {label.name}
                        </Label>
                      ))}
                    </LabelGroup>
                  )}
                </Stack>
                <Text size="small" weight="light">
                  #{issue.id} opened{" "}
                  <RelativeTime datetime={issue.createdAt} threshold="P30D" /> by{" "}
                  {issue.author}
                </Text>
              </div>
              {issue.commentCount > 0 && (
                <ActionList.TrailingVisual>
                  <Stack direction="horizontal" align="center" gap="condensed">
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
