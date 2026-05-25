"use client";

import { useState } from "react";
import {
  ActionList,
  ActionMenu,
  Avatar,
  BranchName,
  Button,
  ButtonGroup,

  FormControl,
  Heading,
  Label,
  RelativeTime,
  Stack,
  Text,
  TextInput,
  Textarea,
} from "@primer/react";
import {
  ArrowSwitchIcon,
  GitCommitIcon,
  DiffAddedIcon,
  DiffRemovedIcon,
  DiffModifiedIcon,
  FileIcon,
  PeopleIcon,
  TriangleDownIcon,
  GitPullRequestIcon,

} from "@primer/octicons-react";
import { GearIcon } from "@primer/octicons-react";
import { useParams } from "next/navigation";

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const BRANCHES = [
  "main",
  "develop",
  "feat/compare-page",
  "feat/ssr-dashboard",
  "fix/auth-redirect",
  "chore/deps-update",
];

const BASE_BRANCH = "main";
const HEAD_BRANCH = "feat/compare-page";

interface Commit {
  sha: string;
  message: string;
  author: string;
  avatarUrl: string;
  date: string;
}

const COMMITS: Commit[] = [
  {
    sha: "a3f8b2c1d4e5",
    message: "feat: add branch selector components for compare view",
    author: "octocat",
    avatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4",
    date: "2025-05-24T14:30:00Z",
  },
  {
    sha: "b7e9d1a2f3c4",
    message: "feat: implement diff rendering with line numbers",
    author: "monalisa",
    avatarUrl: "https://avatars.githubusercontent.com/u/2?v=4",
    date: "2025-05-24T11:15:00Z",
  },
  {
    sha: "c2d4e6f8a1b3",
    message: "refactor: extract comparison stats into summary component",
    author: "octocat",
    avatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4",
    date: "2025-05-23T16:45:00Z",
  },
  {
    sha: "d5f7a9c1e3b2",
    message: "fix: handle edge case when branches have no diff",
    author: "hubot",
    avatarUrl: "https://avatars.githubusercontent.com/u/480938?v=4",
    date: "2025-05-23T10:20:00Z",
  },
];

interface DiffLine {
  type: "addition" | "deletion" | "context";
  oldNum: number | null;
  newNum: number | null;
  content: string;
}

interface FileDiff {
  path: string;
  status: "added" | "modified" | "deleted";
  additions: number;
  deletions: number;
  lines: DiffLine[];
}

const FILE_DIFFS: FileDiff[] = [
  {
    path: "src/components/CompareView.tsx",
    status: "added",
    additions: 18,
    deletions: 0,
    lines: [
      { type: "addition", oldNum: null, newNum: 1, content: 'import React from "react";' },
      { type: "addition", oldNum: null, newNum: 2, content: "" },
      { type: "addition", oldNum: null, newNum: 3, content: "interface CompareViewProps {" },
      { type: "addition", oldNum: null, newNum: 4, content: "  base: string;" },
      { type: "addition", oldNum: null, newNum: 5, content: "  head: string;" },
      { type: "addition", oldNum: null, newNum: 6, content: "}" },
      { type: "addition", oldNum: null, newNum: 7, content: "" },
      { type: "addition", oldNum: null, newNum: 8, content: "export function CompareView({ base, head }: CompareViewProps) {" },
      { type: "addition", oldNum: null, newNum: 9, content: "  return (" },
      { type: "addition", oldNum: null, newNum: 10, content: "    <div>" },
      { type: "addition", oldNum: null, newNum: 11, content: "      <BranchSelector base={base} head={head} />" },
      { type: "addition", oldNum: null, newNum: 12, content: "      <DiffSummary />" },
      { type: "addition", oldNum: null, newNum: 13, content: "      <FileDiffs />" },
      { type: "addition", oldNum: null, newNum: 14, content: "    </div>" },
      { type: "addition", oldNum: null, newNum: 15, content: "  );" },
      { type: "addition", oldNum: null, newNum: 16, content: "}" },
    ],
  },
  {
    path: "src/utils/diff.ts",
    status: "modified",
    additions: 12,
    deletions: 5,
    lines: [
      { type: "context", oldNum: 1, newNum: 1, content: 'import { parsePatch } from "./patch";' },
      { type: "context", oldNum: 2, newNum: 2, content: "" },
      { type: "deletion", oldNum: 3, newNum: null, content: "export function computeDiff(a: string, b: string) {" },
      { type: "deletion", oldNum: 4, newNum: null, content: "  const patch = parsePatch(a, b);" },
      { type: "deletion", oldNum: 5, newNum: null, content: "  return patch;" },
      { type: "addition", oldNum: null, newNum: 3, content: "export function computeDiff(a: string, b: string, options?: DiffOptions) {" },
      { type: "addition", oldNum: null, newNum: 4, content: "  const { contextLines = 3, ignoreWhitespace = false } = options ?? {};" },
      { type: "addition", oldNum: null, newNum: 5, content: "  const patch = parsePatch(a, b, { contextLines, ignoreWhitespace });" },
      { type: "addition", oldNum: null, newNum: 6, content: "  return { patch, stats: computeStats(patch) };" },
      { type: "context", oldNum: 6, newNum: 7, content: "}" },
      { type: "context", oldNum: 7, newNum: 8, content: "" },
      { type: "deletion", oldNum: 8, newNum: null, content: "function computeStats(patch: Patch) {" },
      { type: "deletion", oldNum: 9, newNum: null, content: "  return { additions: 0, deletions: 0 };" },
      { type: "addition", oldNum: null, newNum: 9, content: "interface DiffOptions {" },
      { type: "addition", oldNum: null, newNum: 10, content: "  contextLines?: number;" },
      { type: "addition", oldNum: null, newNum: 11, content: "  ignoreWhitespace?: boolean;" },
      { type: "addition", oldNum: null, newNum: 12, content: "}" },
      { type: "addition", oldNum: null, newNum: 13, content: "" },
      { type: "addition", oldNum: null, newNum: 14, content: "function computeStats(patch: Patch): DiffStats {" },
      { type: "addition", oldNum: null, newNum: 15, content: "  let additions = 0;" },
      { type: "addition", oldNum: null, newNum: 16, content: "  let deletions = 0;" },
      { type: "addition", oldNum: null, newNum: 17, content: "  for (const hunk of patch.hunks) {" },
      { type: "addition", oldNum: null, newNum: 18, content: "    additions += hunk.additions;" },
      { type: "addition", oldNum: null, newNum: 19, content: "    deletions += hunk.deletions;" },
      { type: "addition", oldNum: null, newNum: 20, content: "  }" },
      { type: "addition", oldNum: null, newNum: 21, content: "  return { additions, deletions };" },
      { type: "context", oldNum: 10, newNum: 22, content: "}" },
    ],
  },
  {
    path: "src/hooks/useComparison.ts",
    status: "added",
    additions: 14,
    deletions: 0,
    lines: [
      { type: "addition", oldNum: null, newNum: 1, content: 'import { useMemo } from "react";' },
      { type: "addition", oldNum: null, newNum: 2, content: 'import { computeDiff } from "../utils/diff";' },
      { type: "addition", oldNum: null, newNum: 3, content: "" },
      { type: "addition", oldNum: null, newNum: 4, content: "export function useComparison(base: string, head: string) {" },
      { type: "addition", oldNum: null, newNum: 5, content: "  return useMemo(() => {" },
      { type: "addition", oldNum: null, newNum: 6, content: "    const diff = computeDiff(base, head);" },
      { type: "addition", oldNum: null, newNum: 7, content: "    return {" },
      { type: "addition", oldNum: null, newNum: 8, content: "      commits: diff.patch.commits," },
      { type: "addition", oldNum: null, newNum: 9, content: "      files: diff.patch.files," },
      { type: "addition", oldNum: null, newNum: 10, content: "      stats: diff.stats," },
      { type: "addition", oldNum: null, newNum: 11, content: "    };" },
      { type: "addition", oldNum: null, newNum: 12, content: "  }, [base, head]);" },
      { type: "addition", oldNum: null, newNum: 13, content: "}" },
    ],
  },
  {
    path: "src/legacy/oldCompare.ts",
    status: "deleted",
    additions: 0,
    deletions: 8,
    lines: [
      { type: "deletion", oldNum: 1, newNum: null, content: "// Legacy compare implementation" },
      { type: "deletion", oldNum: 2, newNum: null, content: 'import { diff } from "./diff";' },
      { type: "deletion", oldNum: 3, newNum: null, content: "" },
      { type: "deletion", oldNum: 4, newNum: null, content: "export function oldCompare(a: string, b: string) {" },
      { type: "deletion", oldNum: 5, newNum: null, content: "  console.warn('Deprecated: use computeDiff instead');" },
      { type: "deletion", oldNum: 6, newNum: null, content: "  return diff(a, b);" },
      { type: "deletion", oldNum: 7, newNum: null, content: "}" },
    ],
  },
];

const TOTAL_ADDITIONS = FILE_DIFFS.reduce((s, f) => s + f.additions, 0);
const TOTAL_DELETIONS = FILE_DIFFS.reduce((s, f) => s + f.deletions, 0);
const CONTRIBUTORS = [...new Set(COMMITS.map((c) => c.author))];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function DiffStatusIcon({ status }: { status: FileDiff["status"] }) {
  switch (status) {
    case "added":
      return (
        <span style={{ color: "var(--fgColor-success)", display: "inline-flex" }}>
          <DiffAddedIcon size={16} />
        </span>
      );
    case "deleted":
      return (
        <span style={{ color: "var(--fgColor-danger)", display: "inline-flex" }}>
          <DiffRemovedIcon size={16} />
        </span>
      );
    case "modified":
      return (
        <span style={{ color: "var(--fgColor-attention)", display: "inline-flex" }}>
          <DiffModifiedIcon size={16} />
        </span>
      );
  }
}

/* ------------------------------------------------------------------ */
/*  Sidebar section (reused from new-issue pattern)                    */
/* ------------------------------------------------------------------ */

function SidebarSection({
  title,
  placeholder,
}: {
  title: string;
  placeholder: string;
}) {
  return (
    <div
      style={{
        paddingBlockEnd: "var(--stack-gap-spacious)",
        borderBlockEnd: "var(--borderWidth-thin) solid var(--borderColor-muted)",
      }}
    >
      <Stack gap="condensed">
        <Stack direction="horizontal" align="center" justify="space-between">
          <Text size="small" weight="semibold">
            {title}
          </Text>
          <GearIcon size={16} />
        </Stack>
        <Text size="small" weight="light">
          {placeholder}
        </Text>
      </Stack>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function ComparePage() {
  const params = useParams();
  const _range = params.range as string;

  const [baseBranch, setBaseBranch] = useState(BASE_BRANCH);
  const [headBranch, setHeadBranch] = useState(HEAD_BRANCH);
  const [prTitle, setPrTitle] = useState(COMMITS[0].message);
  const [prDescription, setPrDescription] = useState("");

  const comparable = baseBranch !== headBranch;

  return (
    <Stack gap="normal">
      {/* Page heading */}
      <Stack gap="none">
        <Heading as="h1" variant="large">
          Comparing changes
        </Heading>
        <Text as="p" size="medium">
          Choose two branches to see what&apos;s changed or to start a new pull
          request. If you need to, you can also compare across forks.
        </Text>
      </Stack>

      {/* Branch selectors */}
      <Stack
        direction="horizontal"
        align="center"
        gap="normal"
        wrap="wrap"
      >
        {/* Base branch picker */}
        <ActionMenu>
          <ActionMenu.Button leadingVisual={GitCommitIcon}>
            <Text size="small">
              base: <Text weight="semibold">{baseBranch}</Text>
            </Text>
          </ActionMenu.Button>
          <ActionMenu.Overlay>
            <ActionList>
              <ActionList.Group>
                <ActionList.GroupHeading>
                  Choose a base branch
                </ActionList.GroupHeading>
                {BRANCHES.map((b) => (
                  <ActionList.Item
                    key={b}
                    selected={b === baseBranch}
                    onSelect={() => setBaseBranch(b)}
                  >
                    {b}
                  </ActionList.Item>
                ))}
              </ActionList.Group>
            </ActionList>
          </ActionMenu.Overlay>
        </ActionMenu>

        {/* Direction indicator */}
        <span style={{ color: "var(--fgColor-muted)", display: "inline-flex" }}>
          <ArrowSwitchIcon size={16} />
        </span>

        {/* Head branch picker */}
        <ActionMenu>
          <ActionMenu.Button leadingVisual={GitCommitIcon}>
            <Text size="small">
              compare: <Text weight="semibold">{headBranch}</Text>
            </Text>
          </ActionMenu.Button>
          <ActionMenu.Overlay>
            <ActionList>
              <ActionList.Group>
                <ActionList.GroupHeading>
                  Choose a head branch
                </ActionList.GroupHeading>
                {BRANCHES.map((b) => (
                  <ActionList.Item
                    key={b}
                    selected={b === headBranch}
                    onSelect={() => setHeadBranch(b)}
                  >
                    {b}
                  </ActionList.Item>
                ))}
              </ActionList.Group>
            </ActionList>
          </ActionMenu.Overlay>
        </ActionMenu>
      </Stack>

      {!comparable && (
        <div
          style={{
            padding: "var(--stack-gap-spacious)",
            border: "1px solid var(--borderColor-default)",
            borderRadius: "var(--borderRadius-medium)",
            textAlign: "center",
          }}
        >
          <Text size="medium" weight="light">
            Choose different branches to compare.
          </Text>
        </div>
      )}

      {comparable && (
        <Stack gap="spacious">
          {/* Comparison summary */}
          <div
            style={{
              padding: "var(--stack-gap-normal)",
              border: "1px solid var(--borderColor-default)",
              borderRadius: "var(--borderRadius-medium)",
              backgroundColor: "var(--bgColor-muted)",
            }}
          >
            <Stack direction="horizontal" gap="spacious" wrap="wrap">
              <Stack direction="horizontal" align="center" gap="condensed">
                <GitCommitIcon size={16} />
                <Text size="small" weight="semibold">
                  {COMMITS.length}
                </Text>
                <Text size="small" weight="light">
                  commits
                </Text>
              </Stack>
              <Stack direction="horizontal" align="center" gap="condensed">
                <FileIcon size={16} />
                <Text size="small" weight="semibold">
                  {FILE_DIFFS.length}
                </Text>
                <Text size="small" weight="light">
                  files changed
                </Text>
              </Stack>
              <Stack direction="horizontal" align="center" gap="condensed">
                <PeopleIcon size={16} />
                <Text size="small" weight="semibold">
                  {CONTRIBUTORS.length}
                </Text>
                <Text size="small" weight="light">
                  contributors
                </Text>
              </Stack>
              <Stack direction="horizontal" align="center" gap="condensed">
                <Text size="small" weight="semibold" style={{ color: "var(--fgColor-success)" }}>
                  +{TOTAL_ADDITIONS}
                </Text>
                <Text size="small" weight="semibold" style={{ color: "var(--fgColor-danger)" }}>
                  -{TOTAL_DELETIONS}
                </Text>
              </Stack>
            </Stack>
          </div>

          {/* Open pull request form */}
          <div
            style={{
              border: "1px solid var(--borderColor-default)",
              borderRadius: "var(--borderRadius-medium)",
              padding: "var(--stack-gap-normal)",
            }}
          >
            <Stack gap="normal">
              <Stack direction="horizontal" align="center" gap="condensed">
                <span style={{ color: "var(--fgColor-success)", display: "inline-flex" }}>
                  <GitPullRequestIcon size={16} />
                </span>
                <Heading as="h2" variant="medium">
                  Open a pull request
                </Heading>
              </Stack>

              <Text as="p" size="small" weight="light">
                Create a pull request to merge{" "}
                <BranchName as="span">{headBranch}</BranchName> into{" "}
                <BranchName as="span">{baseBranch}</BranchName>.
              </Text>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: "var(--stack-gap-normal)",
                }}
              >
                <Stack gap="normal">
                  <FormControl required>
                    <FormControl.Label>Title</FormControl.Label>
                    <TextInput
                      block
                      value={prTitle}
                      onChange={(e) => setPrTitle(e.target.value)}
                    />
                  </FormControl>

                  <FormControl>
                    <FormControl.Label>Description</FormControl.Label>
                    <Textarea
                      block
                      placeholder="Add a description..."
                      value={prDescription}
                      onChange={(e) => setPrDescription(e.target.value)}
                      rows={6}
                      resize="vertical"
                    />
                    <FormControl.Caption>
                      Describe your changes in detail. Markdown is supported.
                    </FormControl.Caption>
                  </FormControl>

                  <Stack direction="horizontal" gap="condensed">
                    <ButtonGroup>
                      <Button variant="primary" leadingVisual={GitPullRequestIcon}>
                        Create pull request
                      </Button>
                      <ActionMenu>
                        <ActionMenu.Button
                          variant="default"
                          aria-label="Pull request options"
                          trailingAction={TriangleDownIcon}
                        />
                        <ActionMenu.Overlay>
                          <ActionList>
                            <ActionList.Item onSelect={() => {}}>
                              <ActionList.LeadingVisual>
                                <GitPullRequestIcon />
                              </ActionList.LeadingVisual>
                              Create pull request
                              <ActionList.Description variant="block">
                                Open a pull request that is ready for review.
                              </ActionList.Description>
                            </ActionList.Item>
                            <ActionList.Item onSelect={() => {}}>
                              <ActionList.LeadingVisual>
                                <GitPullRequestIcon />
                              </ActionList.LeadingVisual>
                              Create draft pull request
                              <ActionList.Description variant="block">
                                Cannot be merged until marked ready for review.
                              </ActionList.Description>
                            </ActionList.Item>
                          </ActionList>
                        </ActionMenu.Overlay>
                      </ActionMenu>
                    </ButtonGroup>
                  </Stack>
                </Stack>

                {/* Sidebar controls */}
                <div style={{ width: 240 }}>
                  <Stack gap="condensed">
                    <SidebarSection title="Reviewers" placeholder="No one — assign yourself" />
                    <SidebarSection title="Assignees" placeholder="No one — assign yourself" />
                    <SidebarSection title="Labels" placeholder="None yet" />
                    <SidebarSection title="Milestone" placeholder="No milestone" />
                  </Stack>
                </div>
              </div>
            </Stack>
          </div>

          {/* Commit list */}
          <Stack gap="condensed">
            <Heading as="h3" variant="small">
              Commits
            </Heading>
            <div
              style={{
                border: "1px solid var(--borderColor-default)",
                borderRadius: "var(--borderRadius-medium)",
              }}
            >
              {COMMITS.map((commit, i) => (
                <div
                  key={commit.sha}
                  style={{
                    padding: "var(--stack-gap-normal)",
                    borderBottom:
                      i < COMMITS.length - 1
                        ? "1px solid var(--borderColor-default)"
                        : undefined,
                  }}
                >
                  <Stack direction="horizontal" align="center" justify="space-between">
                    <Stack direction="horizontal" align="center" gap="condensed">
                      <Avatar
                        src={commit.avatarUrl}
                        alt={commit.author}
                        size={20}
                      />
                      <Stack gap="none">
                        <Text size="small" weight="semibold">
                          {commit.message}
                        </Text>
                        <Stack direction="horizontal" gap="condensed" align="center">
                          <Text size="small" weight="light">
                            {commit.author}
                          </Text>
                          <Text size="small" weight="light">
                            committed{" "}
                            <RelativeTime
                              datetime={commit.date}
                              threshold="P30D"
                            />
                          </Text>
                        </Stack>
                      </Stack>
                    </Stack>
                    <Text
                      size="small"
                      weight="light"
                      style={{ fontFamily: "var(--fontStack-monospace)" }}
                    >
                      {commit.sha.slice(0, 7)}
                    </Text>
                  </Stack>
                </div>
              ))}
            </div>
          </Stack>

          {/* File diffs */}
          <Stack gap="condensed">
            <Heading as="h3" variant="small">
              Files changed
            </Heading>

            {/* Diff summary bar */}
            <div
              style={{
                padding: "var(--stack-gap-condensed) var(--stack-gap-normal)",
                backgroundColor: "var(--bgColor-muted)",
                border: "1px solid var(--borderColor-default)",
                borderRadius: "var(--borderRadius-medium)",
              }}
            >
              <Stack direction="horizontal" gap="normal" align="center">
                <Text size="small" weight="semibold">
                  {FILE_DIFFS.length} files
                </Text>
                <Text size="small" weight="semibold" style={{ color: "var(--fgColor-success)" }}>
                  +{TOTAL_ADDITIONS}
                </Text>
                <Text size="small" weight="semibold" style={{ color: "var(--fgColor-danger)" }}>
                  -{TOTAL_DELETIONS}
                </Text>
              </Stack>
            </div>

            {/* Per-file diffs */}
            {FILE_DIFFS.map((file) => (
              <div
                key={file.path}
                style={{
                  border: "1px solid var(--borderColor-default)",
                  borderRadius: "var(--borderRadius-medium)",
                  overflow: "hidden",
                }}
              >
                {/* File header */}
                <div
                  style={{
                    padding: "var(--stack-gap-condensed) var(--stack-gap-normal)",
                    backgroundColor: "var(--bgColor-muted)",
                    borderBottom: "1px solid var(--borderColor-default)",
                  }}
                >
                  <Stack direction="horizontal" align="center" gap="condensed">
                    <DiffStatusIcon status={file.status} />
                    <Text size="small" weight="semibold" style={{ fontFamily: "var(--fontStack-monospace)" }}>
                      {file.path}
                    </Text>
                    <Text size="small" weight="light" style={{ color: "var(--fgColor-success)" }}>
                      +{file.additions}
                    </Text>
                    <Text size="small" weight="light" style={{ color: "var(--fgColor-danger)" }}>
                      -{file.deletions}
                    </Text>
                    <Label
                      variant={
                        file.status === "added"
                          ? "success"
                          : file.status === "deleted"
                            ? "danger"
                            : "attention"
                      }
                      size="small"
                    >
                      {file.status}
                    </Label>
                  </Stack>
                </div>

                {/* Diff lines */}
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontFamily: "var(--fontStack-monospace)",
                      fontSize: "var(--text-body-size-small)",
                      lineHeight: "20px",
                    }}
                  >
                    <tbody>
                      {file.lines.map((line, lineIdx) => {
                        let bgColor: string | undefined;
                        let prefix = " ";

                        if (line.type === "addition") {
                          bgColor = "var(--diffBlob-additionLine-bgColor)";
                          prefix = "+";
                        } else if (line.type === "deletion") {
                          bgColor = "var(--diffBlob-deletionLine-bgColor)";
                          prefix = "-";
                        }

                        return (
                          <tr
                            key={lineIdx}
                            style={{ backgroundColor: bgColor }}
                          >
                            <td
                              style={{
                                padding: "0 var(--stack-padding-normal)",
                                textAlign: "right",
                                userSelect: "none",
                                color: "var(--fgColor-muted)",
                                width: 1,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {line.oldNum ?? ""}
                            </td>
                            <td
                              style={{
                                padding: "0 var(--stack-padding-normal)",
                                textAlign: "right",
                                userSelect: "none",
                                color: "var(--fgColor-muted)",
                                width: 1,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {line.newNum ?? ""}
                            </td>
                            <td
                              style={{
                                padding: "0 var(--stack-padding-normal)",
                                whiteSpace: "pre",
                              }}
                            >
                              {prefix} {line.content}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </Stack>
        </Stack>
      )}
    </Stack>
  );
}
