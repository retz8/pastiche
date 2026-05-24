"use client";

import { useState } from "react";
import NextLink from "next/link";
import {
  ActionList,
  Button,
  TextInput,
  StateLabel,
  IssueLabelToken,
  RelativeTime,
  CounterLabel,
  Text,
  LinkButton,
  Stack,
  Link,
  SegmentedControl,
} from "@primer/react";
import { Blankslate } from "@primer/react/experimental";
import {
  SearchIcon,
  IssueOpenedIcon,
  IssueClosedIcon,
  SkipIcon,
  CommentIcon,
  TagIcon,
  MilestoneIcon,
} from "@primer/octicons-react";

// ---------- Mock Data ----------

interface IssueLabel {
  name: string;
  color: string;
}

interface Issue {
  id: number;
  title: string;
  number: number;
  status: "open" | "closed";
  labels: IssueLabel[];
  author: string;
  createdAt: string;
  commentCount: number;
}

const ISSUES: Issue[] = [
  {
    id: 1,
    title: "Fix crash when uploading large files",
    number: 142,
    status: "open",
    labels: [
      { name: "bug", color: "#d73a4a" },
      { name: "priority: high", color: "#b60205" },
    ],
    author: "octocat",
    createdAt: "2026-05-22T10:30:00Z",
    commentCount: 5,
  },
  {
    id: 2,
    title: "Add dark mode support for settings page",
    number: 141,
    status: "open",
    labels: [
      { name: "enhancement", color: "#a2eeef" },
      { name: "design", color: "#d4c5f9" },
    ],
    author: "monalisa",
    createdAt: "2026-05-21T14:15:00Z",
    commentCount: 12,
  },
  {
    id: 3,
    title: "Improve search performance for large repositories",
    number: 140,
    status: "open",
    labels: [{ name: "performance", color: "#fbca04" }],
    author: "hubot",
    createdAt: "2026-05-20T09:00:00Z",
    commentCount: 3,
  },
  {
    id: 4,
    title: "Update dependencies to latest versions",
    number: 139,
    status: "open",
    labels: [{ name: "dependencies", color: "#0075ca" }],
    author: "dependabot",
    createdAt: "2026-05-19T16:45:00Z",
    commentCount: 1,
  },
  {
    id: 5,
    title: "Broken layout on mobile devices",
    number: 138,
    status: "open",
    labels: [
      { name: "bug", color: "#d73a4a" },
      { name: "responsive", color: "#c5def5" },
    ],
    author: "junior-dev",
    createdAt: "2026-05-18T11:20:00Z",
    commentCount: 7,
  },
  {
    id: 6,
    title: "Add keyboard shortcuts documentation",
    number: 137,
    status: "closed",
    labels: [{ name: "documentation", color: "#0075ca" }],
    author: "techwriter",
    createdAt: "2026-05-15T08:00:00Z",
    commentCount: 2,
  },
  {
    id: 7,
    title: "Fix incorrect timezone handling in notifications",
    number: 136,
    status: "closed",
    labels: [
      { name: "bug", color: "#d73a4a" },
    ],
    author: "octocat",
    createdAt: "2026-05-12T13:30:00Z",
    commentCount: 4,
  },
  {
    id: 8,
    title: "Implement OAuth2 PKCE flow for third-party apps",
    number: 135,
    status: "closed",
    labels: [
      { name: "enhancement", color: "#a2eeef" },
      { name: "security", color: "#e4e669" },
    ],
    author: "securitybot",
    createdAt: "2026-05-10T17:00:00Z",
    commentCount: 15,
  },
  {
    id: 9,
    title: "Refactor CI pipeline to use reusable workflows",
    number: 134,
    status: "closed",
    labels: [{ name: "infrastructure", color: "#d4c5f9" }],
    author: "devops-lead",
    createdAt: "2026-05-08T10:00:00Z",
    commentCount: 6,
  },
  {
    id: 10,
    title: "Add support for CODEOWNERS file validation",
    number: 133,
    status: "open",
    labels: [
      { name: "feature request", color: "#008672" },
    ],
    author: "monalisa",
    createdAt: "2026-05-06T14:30:00Z",
    commentCount: 9,
  },
];

// ---------- Component ----------

type FilterTab = "open" | "closed";

export default function IssuesPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("open");
  const [searchQuery, setSearchQuery] = useState("");

  const openIssues = ISSUES.filter((i) => i.status === "open");
  const closedIssues = ISSUES.filter((i) => i.status === "closed");

  const displayedIssues = (activeTab === "open" ? openIssues : closedIssues).filter(
    (issue) =>
      searchQuery === "" ||
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.labels.some((l) => l.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Stack direction="vertical" gap="normal">
      {/* Search bar + New issue button */}
      <Stack direction="horizontal" gap="condensed" align="center">
        <div style={{ flex: 1 }}>
          <TextInput
            leadingVisual={SearchIcon}
            aria-label="Search all issues"
            placeholder="Search all issues"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            block
          />
        </div>
        <LinkButton variant="primary" href="/issues/new">
          New issue
        </LinkButton>
      </Stack>

      {/* Issues list container */}
      <div
        style={{
          border: "var(--borderWidth-thin) solid var(--borderColor-default)",
          borderRadius: "var(--borderRadius-medium)",
          overflow: "hidden",
        }}
      >
        {/* Open / Closed tab header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--base-size-16)",
            padding: "var(--base-size-8) var(--base-size-16)",
            backgroundColor: "var(--bgColor-muted)",
            borderBottom: "var(--borderWidth-thin) solid var(--borderColor-default)",
          }}
        >
          <SegmentedControl
            aria-label="Issue status filter"
            onChange={(index) => setActiveTab(index === 0 ? "open" : "closed")}
          >
            <SegmentedControl.Button
              selected={activeTab === "open"}
              leadingVisual={IssueOpenedIcon}
            >
              {`${openIssues.length} Open`}
            </SegmentedControl.Button>
            <SegmentedControl.Button
              selected={activeTab === "closed"}
              leadingVisual={IssueClosedIcon}
            >
              {`${closedIssues.length} Closed`}
            </SegmentedControl.Button>
          </SegmentedControl>
        </div>

        {/* Issue rows or empty state */}
        {displayedIssues.length === 0 ? (
          <div style={{ padding: "var(--base-size-48) var(--base-size-16)" }}>
            <Blankslate>
              <Blankslate.Visual>
                <IssueOpenedIcon size={24} />
              </Blankslate.Visual>
              <Blankslate.Heading>No issues match your search</Blankslate.Heading>
              <Blankslate.Description>
                Try a different search term or clear your filters to see all {activeTab} issues.
              </Blankslate.Description>
              <Blankslate.PrimaryAction href="/issues/new">
                Create a new issue
              </Blankslate.PrimaryAction>
            </Blankslate>
          </div>
        ) : (
          <ActionList>
            {displayedIssues.map((issue, index) => (
              <ActionList.Item
                key={issue.id}
                style={{
                  borderBottom:
                    index < displayedIssues.length - 1
                      ? "var(--borderWidth-thin) solid var(--borderColor-muted)"
                      : "none",
                }}
                size="large"
              >
                <ActionList.LeadingVisual>
                  {issue.status === "open" ? (
                    <span style={{ color: "var(--fgColor-success)", display: "flex" }}>
                      <IssueOpenedIcon />
                    </span>
                  ) : (
                    <span style={{ color: "var(--fgColor-done)", display: "flex" }}>
                      <IssueClosedIcon />
                    </span>
                  )}
                </ActionList.LeadingVisual>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--base-size-4)" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--base-size-4)" }}>
                    <Link
                      as={NextLink}
                      href={`/issues/${issue.number}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Text size="medium" weight="semibold">{issue.title}</Text>
                    </Link>
                    {issue.labels.map((label) => (
                      <IssueLabelToken
                        key={label.name}
                        text={<Text size="small" weight="medium">{label.name}</Text>}
                        fillColor={label.color}
                        size="small"
                      />
                    ))}
                  </div>
                  <Text size="small" style={{ color: "var(--fgColor-muted)" }}>
                    #{issue.number} opened{" "}
                    <RelativeTime datetime={issue.createdAt} /> by {issue.author}
                  </Text>
                </div>
                {issue.commentCount > 0 && (
                  <ActionList.TrailingVisual>
                    <Text
                      size="small"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "var(--base-size-4)",
                        color: "var(--fgColor-muted)",
                      }}
                    >
                      <CommentIcon size={16} />
                      {issue.commentCount}
                    </Text>
                  </ActionList.TrailingVisual>
                )}
              </ActionList.Item>
            ))}
          </ActionList>
        )}
      </div>
    </Stack>
  );
}
