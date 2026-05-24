"use client";

import React, { useState } from "react";
import {
  Box,
  Button,
  LinkButton,
  TextInput,
  UnderlineNav,
  StateLabel,
  IssueLabelToken,
  LabelGroup,
  Blankslate,
  Text,
  Link,
} from "@primer/react";
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

const mockIssues: Issue[] = [
  {
    id: 142,
    title: "Search results not updating when filters are cleared",
    status: "open",
    labels: [{ name: "bug", color: "#d73a4a" }],
    author: "octocat",
    createdAt: "2 hours ago",
    commentCount: 3,
  },
  {
    id: 141,
    title: "Add dark mode support for the settings page",
    status: "open",
    labels: [
      { name: "enhancement", color: "#a2eeef" },
      { name: "design", color: "#7057ff" },
    ],
    author: "monalisa",
    createdAt: "5 hours ago",
    commentCount: 12,
  },
  {
    id: 140,
    title: "Improve accessibility of navigation menu",
    status: "open",
    labels: [
      { name: "accessibility", color: "#0075ca" },
      { name: "good first issue", color: "#7057ff" },
    ],
    author: "hubot",
    createdAt: "1 day ago",
    commentCount: 7,
  },
  {
    id: 139,
    title: "Memory leak in WebSocket connection handler",
    status: "open",
    labels: [
      { name: "bug", color: "#d73a4a" },
      { name: "priority: high", color: "#b60205" },
    ],
    author: "dependabot",
    createdAt: "2 days ago",
    commentCount: 5,
  },
  {
    id: 138,
    title: "Document the REST API rate limiting behavior",
    status: "open",
    labels: [{ name: "documentation", color: "#0075ca" }],
    author: "octocat",
    createdAt: "3 days ago",
    commentCount: 1,
  },
  {
    id: 137,
    title: "TypeError when submitting empty form",
    status: "closed",
    labels: [{ name: "bug", color: "#d73a4a" }],
    author: "monalisa",
    createdAt: "4 days ago",
    commentCount: 4,
  },
  {
    id: 136,
    title: "Add pagination to the repository list",
    status: "closed",
    labels: [{ name: "enhancement", color: "#a2eeef" }],
    author: "hubot",
    createdAt: "5 days ago",
    commentCount: 8,
  },
  {
    id: 135,
    title: "Update dependencies to fix security vulnerabilities",
    status: "closed",
    labels: [
      { name: "dependencies", color: "#0366d6" },
      { name: "security", color: "#e4e669" },
    ],
    author: "dependabot",
    createdAt: "1 week ago",
    commentCount: 2,
  },
  {
    id: 134,
    title: "Migrate CI pipeline from Travis to GitHub Actions",
    status: "closed",
    labels: [{ name: "infrastructure", color: "#d4c5f9" }],
    author: "octocat",
    createdAt: "1 week ago",
    commentCount: 6,
  },
  {
    id: 133,
    title: "Fix broken link in README contributing section",
    status: "closed",
    labels: [{ name: "documentation", color: "#0075ca" }],
    author: "monalisa",
    createdAt: "2 weeks ago",
    commentCount: 0,
  },
];

export default function IssuesPage() {
  const [filter, setFilter] = useState("");
  const [tab, setTab] = useState<"open" | "closed">("open");

  const openIssues = mockIssues.filter((i) => i.status === "open");
  const closedIssues = mockIssues.filter((i) => i.status === "closed");

  const displayedIssues = (tab === "open" ? openIssues : closedIssues).filter(
    (issue) =>
      filter === "" ||
      issue.title.toLowerCase().includes(filter.toLowerCase()) ||
      issue.labels.some((l) =>
        l.name.toLowerCase().includes(filter.toLowerCase())
      )
  );

  return (
    <Box sx={{ maxWidth: 1280, mx: "auto", p: 4 }}>
      {/* Search bar + New issue button */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          mb: 3,
          alignItems: "center",
        }}
      >
        <Box sx={{ flexGrow: 1 }}>
          <TextInput
            leadingVisual={SearchIcon}
            placeholder="Search all issues"
            value={filter}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilter(e.target.value)}
            sx={{ width: "100%" }}
            aria-label="Search issues"
          />
        </Box>
        <LinkButton variant="primary" href="/issues/new">
          New issue
        </LinkButton>
      </Box>

      {/* Open/Closed tabs */}
      <UnderlineNav aria-label="Issue status">
        <UnderlineNav.Item
          aria-current={tab === "open" ? "page" : undefined}
          onSelect={(e: React.MouseEvent | React.KeyboardEvent) => {
            e.preventDefault();
            setTab("open");
          }}
          icon={IssueOpenedIcon}
          counter={openIssues.length}
        >
          Open
        </UnderlineNav.Item>
        <UnderlineNav.Item
          aria-current={tab === "closed" ? "page" : undefined}
          onSelect={(e: React.MouseEvent | React.KeyboardEvent) => {
            e.preventDefault();
            setTab("closed");
          }}
          icon={CheckIcon}
          counter={closedIssues.length}
        >
          Closed
        </UnderlineNav.Item>
      </UnderlineNav>

      {/* Issue list or empty state */}
      {displayedIssues.length === 0 ? (
        <Box sx={{ mt: 5 }}>
          <Blankslate>
            <Blankslate.Visual>
              <IssueOpenedIcon size={24} />
            </Blankslate.Visual>
            <Blankslate.Heading>No issues found</Blankslate.Heading>
            <Blankslate.Description>
              {filter
                ? "No issues match your search. Try a different filter."
                : `There are no ${tab} issues. ${tab === "open" ? "Great job!" : "Open issues will appear here when closed."}`}
            </Blankslate.Description>
            {filter && (
              <Blankslate.PrimaryAction onClick={() => setFilter("")}>
                Clear search
              </Blankslate.PrimaryAction>
            )}
          </Blankslate>
        </Box>
      ) : (
        <Box
          as="ul"
          sx={{
            listStyle: "none",
            p: 0,
            m: 0,
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "border.default",
            borderRadius: 2,
            mt: 3,
          }}
        >
          {displayedIssues.map((issue, idx) => (
            <Box
              as="li"
              key={issue.id}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 2,
                px: 3,
                py: 2,
                borderTopWidth: idx === 0 ? 0 : 1,
                borderTopStyle: "solid",
                borderTopColor: "border.muted",
                "&:hover": { bg: "canvas.subtle" },
              }}
            >
              {/* Status icon */}
              <Box sx={{ pt: "2px", flexShrink: 0 }}>
                <StateLabel
                  status={
                    issue.status === "open" ? "issueOpened" : "issueClosed"
                  }
                  variant="small"
                />
              </Box>

              {/* Main content */}
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Link
                    href={`/issues/${issue.id}`}
                    sx={{
                      fontWeight: "semibold",
                      color: "fg.default",
                      "&:hover": { color: "accent.fg" },
                    }}
                  >
                    {issue.title}
                  </Link>
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
                </Box>
                <Text size="small" sx={{ color: "fg.muted", mt: 1 }}>
                  #{issue.id} opened {issue.createdAt} by {issue.author}
                </Text>
              </Box>

              {/* Comment count */}
              {issue.commentCount > 0 && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    flexShrink: 0,
                    pt: "2px",
                  }}
                >
                  <CommentIcon size={16} />
                  <Text size="small" sx={{ color: "fg.muted" }}>
                    {issue.commentCount}
                  </Text>
                </Box>
              )}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
