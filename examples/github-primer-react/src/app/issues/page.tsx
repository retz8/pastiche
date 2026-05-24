"use client";

import { useState } from "react";
import {
  ActionList,
  LinkButton,
  TextInput,
  Label,
  LabelGroup,
  RelativeTime,
  SegmentedControl,
  Text,
  Stack,
} from "@primer/react";
import { Blankslate } from "@primer/react/experimental";
import {
  IssueOpenedIcon,
  IssueClosedIcon,
  SearchIcon,
  CommentIcon,
  CheckIcon,
} from "@primer/octicons-react";

interface IssueLabel {
  name: string;
  color: string;
  variant: "default" | "primary" | "secondary" | "accent" | "success" | "attention" | "severe" | "danger" | "done" | "sponsors";
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

const MOCK_ISSUES: Issue[] = [
  {
    id: 142,
    title: "Navigation bar breaks on mobile viewport",
    status: "open",
    labels: [
      { name: "bug", color: "#d73a4a", variant: "danger" },
      { name: "priority: high", color: "#b60205", variant: "severe" },
    ],
    author: "octocat",
    createdAt: "2026-05-22T10:30:00Z",
    commentCount: 5,
  },
  {
    id: 141,
    title: "Add dark mode support to settings page",
    status: "open",
    labels: [
      { name: "enhancement", color: "#a2eeef", variant: "accent" },
      { name: "design", color: "#d4c5f9", variant: "secondary" },
    ],
    author: "monalisa",
    createdAt: "2026-05-21T14:15:00Z",
    commentCount: 12,
  },
  {
    id: 140,
    title: "Update dependency: react to v19",
    status: "open",
    labels: [
      { name: "dependencies", color: "#0075ca", variant: "primary" },
    ],
    author: "dependabot",
    createdAt: "2026-05-20T09:00:00Z",
    commentCount: 2,
  },
  {
    id: 139,
    title: "Implement pagination for issue list",
    status: "open",
    labels: [
      { name: "enhancement", color: "#a2eeef", variant: "accent" },
    ],
    author: "contributor42",
    createdAt: "2026-05-18T16:45:00Z",
    commentCount: 0,
  },
  {
    id: 138,
    title: "Fix: Dropdown menu not closing on outside click",
    status: "closed",
    labels: [
      { name: "bug", color: "#d73a4a", variant: "danger" },
    ],
    author: "octocat",
    createdAt: "2026-05-15T11:20:00Z",
    commentCount: 3,
  },
  {
    id: 137,
    title: "Add unit tests for authentication module",
    status: "closed",
    labels: [
      { name: "testing", color: "#bfd4f2", variant: "secondary" },
      { name: "good first issue", color: "#7057ff", variant: "done" },
    ],
    author: "janedoe",
    createdAt: "2026-05-14T08:30:00Z",
    commentCount: 7,
  },
  {
    id: 136,
    title: "Refactor API client to use fetch instead of axios",
    status: "closed",
    labels: [
      { name: "refactor", color: "#d4c5f9", variant: "secondary" },
    ],
    author: "devops-bot",
    createdAt: "2026-05-12T13:00:00Z",
    commentCount: 4,
  },
  {
    id: 135,
    title: "Documentation: Add contributing guide",
    status: "open",
    labels: [
      { name: "documentation", color: "#0075ca", variant: "primary" },
      { name: "good first issue", color: "#7057ff", variant: "done" },
    ],
    author: "monalisa",
    createdAt: "2026-05-10T17:30:00Z",
    commentCount: 1,
  },
  {
    id: 134,
    title: "Support for multi-language i18n",
    status: "open",
    labels: [
      { name: "enhancement", color: "#a2eeef", variant: "accent" },
      { name: "priority: high", color: "#b60205", variant: "severe" },
    ],
    author: "i18n-team",
    createdAt: "2026-05-08T10:00:00Z",
    commentCount: 9,
  },
  {
    id: 133,
    title: "CI pipeline failing on Node 22",
    status: "closed",
    labels: [
      { name: "bug", color: "#d73a4a", variant: "danger" },
      { name: "CI/CD", color: "#fbca04", variant: "attention" },
    ],
    author: "devops-bot",
    createdAt: "2026-05-05T07:45:00Z",
    commentCount: 6,
  },
];

type FilterStatus = "open" | "closed";

export default function IssuesPage() {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("open");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredIssues = MOCK_ISSUES.filter((issue) => {
    const matchesStatus = issue.status === filterStatus;
    const matchesSearch =
      searchQuery === "" ||
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.labels.some((l) =>
        l.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesStatus && matchesSearch;
  });

  const openCount = MOCK_ISSUES.filter((i) => i.status === "open").length;
  const closedCount = MOCK_ISSUES.filter((i) => i.status === "closed").length;

  return (
    <Stack direction="vertical" gap="normal">
      {/* Search bar and New Issue button */}
      <Stack direction="horizontal" gap="condensed" align="center">
        <div style={{ flex: 1 }}>
          <TextInput
            aria-label="Search all issues"
            placeholder="Search all issues"
            leadingVisual={SearchIcon}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            block
          />
        </div>
        <LinkButton href="/issues/new" variant="primary">
          <Text>New issue</Text>
        </LinkButton>
      </Stack>

      {/* Issue list container */}
      <div
        style={{
          border: "var(--borderWidth-thin) solid var(--borderColor-default)",
          borderRadius: "var(--borderRadius-medium)",
          overflow: "hidden",
        }}
      >
        {/* Open / Closed toggle bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--stack-gap-normal)",
            padding: "var(--stack-gap-normal)",
            backgroundColor: "var(--bgColor-muted)",
            borderBottom:
              "var(--borderWidth-thin) solid var(--borderColor-default)",
          }}
        >
          <SegmentedControl
            aria-label="Filter issues by status"
            onChange={(selectedIndex) =>
              setFilterStatus(selectedIndex === 0 ? "open" : "closed")
            }
          >
            <SegmentedControl.Button
              selected={filterStatus === "open"}
              leadingIcon={IssueOpenedIcon}
              count={openCount}
            >
              Open
            </SegmentedControl.Button>
            <SegmentedControl.Button
              selected={filterStatus === "closed"}
              leadingIcon={CheckIcon}
              count={closedCount}
            >
              Closed
            </SegmentedControl.Button>
          </SegmentedControl>
        </div>

        {/* Issue rows */}
        {filteredIssues.length > 0 ? (
          <ActionList showDividers>
            {filteredIssues.map((issue) => (
              <ActionList.LinkItem
                key={issue.id}
                href={`/issues/${issue.id}`}
              >
                <ActionList.LeadingVisual>
                  {issue.status === "open" ? (
                    <span style={{ color: "var(--fgColor-success)" }}>
                      <IssueOpenedIcon size={16} />
                    </span>
                  ) : (
                    <span style={{ color: "var(--fgColor-done)" }}>
                      <IssueClosedIcon size={16} />
                    </span>
                  )}
                </ActionList.LeadingVisual>
                <Stack direction="vertical" gap="condensed">
                  <Stack direction="horizontal" gap="condensed" align="center" wrap="wrap">
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
                    <RelativeTime datetime={issue.createdAt} /> by{" "}
                    {issue.author}
                  </Text>
                </Stack>
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
        ) : (
          <Blankslate>
            <Blankslate.Visual>
              <IssueOpenedIcon size={24} />
            </Blankslate.Visual>
            <Blankslate.Heading>
              No issues match your search
            </Blankslate.Heading>
            <Blankslate.Description>
              <Text>Try a different search term or clear the filter to see all {filterStatus} issues.</Text>
            </Blankslate.Description>
            <Blankslate.PrimaryAction href="/issues/new">
              Create a new issue
            </Blankslate.PrimaryAction>
          </Blankslate>
        )}
      </div>
    </Stack>
  );
}
