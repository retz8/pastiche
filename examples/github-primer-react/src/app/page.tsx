"use client";

import { useState } from "react";
import {
  ActionMenu,
  ActionList,
  Avatar,
  AvatarStack,
  BranchName,
  Button,
  ButtonGroup,
  CounterLabel,
  Heading,
  IconButton,
  Label,
  Link,
  RelativeTime,
  SplitPageLayout,
  Stack,
  Text,
  Token,
} from "@primer/react";
import {
  RepoIcon,
  StarIcon,
  RepoForkedIcon,
  EyeIcon,
  GitBranchIcon,
  TagIcon,
  FileIcon,
  FileDirectoryFillIcon,
  HistoryIcon,
  CodeIcon,
  CopyIcon,
  TerminalIcon,
  CheckIcon,
  LawIcon,
  PulseIcon,
  PeopleIcon,
  SearchIcon,
  PlusIcon,
  ChevronDownIcon,
  BookIcon,
} from "@primer/octicons-react";
import NextLink from "next/link";

/* ─── Mock data ─── */

interface FileEntry {
  name: string;
  type: "dir" | "file";
  commitMessage: string;
  updatedAt: string;
}

const FILES: FileEntry[] = [
  { name: ".github", type: "dir", commitMessage: "Add CI workflow for automated testing", updatedAt: "2025-05-10T08:00:00Z" },
  { name: "docs", type: "dir", commitMessage: "Update API reference documentation", updatedAt: "2025-05-18T14:30:00Z" },
  { name: "src", type: "dir", commitMessage: "Refactor auth module to use OAuth 2.1", updatedAt: "2025-05-22T10:00:00Z" },
  { name: "tests", type: "dir", commitMessage: "Add integration tests for user endpoints", updatedAt: "2025-05-20T09:15:00Z" },
  { name: "public", type: "dir", commitMessage: "Add favicon and OpenGraph images", updatedAt: "2025-04-28T11:00:00Z" },
  { name: ".eslintrc.json", type: "file", commitMessage: "Configure stricter linting rules", updatedAt: "2025-05-05T16:45:00Z" },
  { name: ".gitignore", type: "file", commitMessage: "Ignore coverage and build output dirs", updatedAt: "2025-03-15T12:00:00Z" },
  { name: "LICENSE", type: "file", commitMessage: "Initial commit", updatedAt: "2025-01-10T09:00:00Z" },
  { name: "README.md", type: "file", commitMessage: "Improve installation instructions", updatedAt: "2025-05-23T08:30:00Z" },
  { name: "next.config.ts", type: "file", commitMessage: "Enable standalone output for Docker builds", updatedAt: "2025-05-12T13:00:00Z" },
  { name: "package.json", type: "file", commitMessage: "Bump @primer/react to v38.24.0", updatedAt: "2025-05-21T17:00:00Z" },
  { name: "tsconfig.json", type: "file", commitMessage: "Enable strict mode and path aliases", updatedAt: "2025-04-02T10:30:00Z" },
  { name: "docker-compose.yml", type: "file", commitMessage: "Add Redis service for caching layer", updatedAt: "2025-05-15T14:20:00Z" },
];

const LATEST_COMMIT = {
  author: "octocat",
  avatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4",
  message: "Refactor auth module to use OAuth 2.1",
  hash: "a1b2c3d",
  date: "2025-05-22T10:00:00Z",
  totalCommits: 247,
};

const CONTRIBUTORS = [
  { login: "octocat", avatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4" },
  { login: "monalisa", avatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4" },
  { login: "hubot", avatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4" },
  { login: "dependabot", avatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4" },
  { login: "a11y-bot", avatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4" },
];

const TOPICS = ["react", "nextjs", "primer", "design-system", "typescript"];

/* ─── Clone dropdown options ─── */
type CloneTab = "https" | "ssh" | "cli";

/* ─── Page component ─── */

export default function RepoHomePage() {
  const [cloneTab, setCloneTab] = useState<CloneTab>("https");
  const [copied, setCopied] = useState(false);

  const cloneUrls: Record<CloneTab, string> = {
    https: "https://github.com/acme-corp/issue-tracker.git",
    ssh: "git@github.com:acme-corp/issue-tracker.git",
    cli: "gh repo clone acme-corp/issue-tracker",
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(cloneUrls[cloneTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sortedFiles = [...FILES].sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === "dir" ? -1 : 1;
  });

  return (
    <Stack gap="normal">
      {/* ─── Repo header: name, visibility, action buttons ─── */}
      <Stack direction="horizontal" align="center" justify="space-between" wrap="wrap" gap="condensed">
        <Stack direction="horizontal" align="center" gap="condensed">
          <RepoIcon size={16} />
          <Link as={NextLink} href="/" muted>
            <Text weight="semibold">acme-corp</Text>
          </Link>
          <Text size="small" weight="light">/</Text>
          <Link as={NextLink} href="/">
            <Text weight="semibold">issue-tracker</Text>
          </Link>
          <Label variant="secondary" size="small">Public</Label>
        </Stack>

        <ButtonGroup>
          <Button size="small" leadingVisual={EyeIcon} count={12}>
            Watch
          </Button>
          <Button size="small" leadingVisual={RepoForkedIcon} count={34}>
            Fork
          </Button>
          <Button size="small" leadingVisual={StarIcon} count={189}>
            Star
          </Button>
        </ButtonGroup>
      </Stack>

      {/* ─── Main content + sidebar ─── */}
      <SplitPageLayout>
        <SplitPageLayout.Content padding="none">
        <Stack gap="normal" style={{ minWidth: 0 }}>
          {/* Branch bar */}
          <Stack direction="horizontal" align="center" justify="space-between" gap="condensed" wrap="wrap">
            <Stack direction="horizontal" align="center" gap="condensed">
              <ActionMenu>
                <ActionMenu.Button size="small" leadingVisual={GitBranchIcon}>
                  main
                </ActionMenu.Button>
                <ActionMenu.Overlay width="medium">
                  <ActionList>
                    <ActionList.Group title="Branches">
                      <ActionList.Item>main</ActionList.Item>
                      <ActionList.Item>develop</ActionList.Item>
                      <ActionList.Item>feature/oauth-2.1</ActionList.Item>
                    </ActionList.Group>
                    <ActionList.Group title="Tags">
                      <ActionList.Item>v2.1.0</ActionList.Item>
                      <ActionList.Item>v2.0.0</ActionList.Item>
                    </ActionList.Group>
                  </ActionList>
                </ActionMenu.Overlay>
              </ActionMenu>

              <Link as={NextLink} href="/" muted>
                <Stack direction="horizontal" align="center" gap="condensed">
                  <GitBranchIcon size={16} />
                  <Text size="small">4 branches</Text>
                </Stack>
              </Link>
              <Link as={NextLink} href="/" muted>
                <Stack direction="horizontal" align="center" gap="condensed">
                  <TagIcon size={16} />
                  <Text size="small">12 tags</Text>
                </Stack>
              </Link>
            </Stack>

            <Stack direction="horizontal" align="center" gap="condensed">
              <Button size="small" leadingVisual={SearchIcon}>
                Go to file
              </Button>
              <Button size="small" leadingVisual={PlusIcon}>
                Add file
              </Button>
              <ActionMenu>
                <ActionMenu.Button size="small" variant="primary" leadingVisual={CodeIcon}>
                  Code
                </ActionMenu.Button>
                <ActionMenu.Overlay width="large">
                  <div style={{ padding: "var(--stack-padding-normal)" }}>
                    <Stack gap="condensed">
                      <Stack direction="horizontal" gap="condensed">
                        <Button
                          size="small"
                          variant={cloneTab === "https" ? "default" : "invisible"}
                          onClick={() => setCloneTab("https")}
                        >
                          HTTPS
                        </Button>
                        <Button
                          size="small"
                          variant={cloneTab === "ssh" ? "default" : "invisible"}
                          onClick={() => setCloneTab("ssh")}
                        >
                          SSH
                        </Button>
                        <Button
                          size="small"
                          variant={cloneTab === "cli" ? "default" : "invisible"}
                          onClick={() => setCloneTab("cli")}
                        >
                          GitHub CLI
                        </Button>
                      </Stack>
                      <Stack direction="horizontal" align="center" gap="condensed">
                        <div
                          style={{
                            flex: 1,
                            padding: "6px 12px",
                            backgroundColor: "var(--bgColor-muted)",
                            border: "var(--borderWidth-thin) solid var(--borderColor-default)",
                            borderRadius: "var(--borderRadius-medium)",
                            fontFamily: "monospace",
                            fontSize: "var(--text-body-size-small)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <Text size="small">{cloneUrls[cloneTab]}</Text>
                        </div>
                        <IconButton
                          icon={copied ? CheckIcon : CopyIcon}
                          aria-label="Copy URL to clipboard"
                          size="small"
                          onClick={handleCopy}
                        />
                      </Stack>
                    </Stack>
                  </div>
                </ActionMenu.Overlay>
              </ActionMenu>
            </Stack>
          </Stack>

          {/* Latest commit summary */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "var(--stack-padding-condensed) var(--stack-padding-normal)",
              backgroundColor: "var(--bgColor-muted)",
              border: "var(--borderWidth-thin) solid var(--borderColor-default)",
              borderRadius: "var(--borderRadius-medium)",
            }}
          >
            <Stack direction="horizontal" align="center" gap="condensed">
              <Avatar src={LATEST_COMMIT.avatarUrl} size={20} alt={LATEST_COMMIT.author} />
              <Text weight="semibold" size="small">{LATEST_COMMIT.author}</Text>
              <Text size="small">{LATEST_COMMIT.message}</Text>
            </Stack>
            <Stack direction="horizontal" align="center" gap="condensed">
              <Link as={NextLink} href="/" muted>
                <Text size="small" weight="light">{LATEST_COMMIT.hash}</Text>
              </Link>
              <Text size="small" weight="light">
                <RelativeTime datetime={LATEST_COMMIT.date} threshold="P30D" />
              </Text>
              <Link as={NextLink} href="/" muted>
                <Stack direction="horizontal" align="center" gap="condensed">
                  <HistoryIcon size={16} />
                  <Text size="small" weight="semibold">{LATEST_COMMIT.totalCommits} Commits</Text>
                </Stack>
              </Link>
            </Stack>
          </div>

          {/* File listing table */}
          <div
            style={{
              border: "var(--borderWidth-thin) solid var(--borderColor-default)",
              borderRadius: "var(--borderRadius-medium)",
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {sortedFiles.map((file) => (
                  <tr
                    key={file.name}
                    style={{
                      borderBottom: "var(--borderWidth-thin) solid var(--borderColor-muted)",
                    }}
                  >
                    <td style={{ padding: "8px 16px", width: "24px" }}>
                      {file.type === "dir" ? (
                        <span style={{ color: "var(--fgColor-accent)", display: "inline-flex" }}><FileDirectoryFillIcon size={16} /></span>
                      ) : (
                        <FileIcon size={16} />
                      )}
                    </td>
                    <td style={{ padding: "8px 0" }}>
                      <Link
                        as={NextLink}
                        href={file.type === "dir" ? `/` : `/blob/${file.name}`}
                        muted={file.type === "file"}
                      >
                        <Text size="small" weight={file.type === "dir" ? "semibold" : "normal"}>
                          {file.name}
                        </Text>
                      </Link>
                    </td>
                    <td style={{ padding: "8px 16px" }}>
                      <Link as={NextLink} href="/" muted>
                        <Text size="small">{file.commitMessage}</Text>
                      </Link>
                    </td>
                    <td style={{ padding: "8px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                      <Text size="small" weight="light">
                        <RelativeTime datetime={file.updatedAt} threshold="P30D" />
                      </Text>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* README */}
          <div
            style={{
              border: "var(--borderWidth-thin) solid var(--borderColor-default)",
              borderRadius: "var(--borderRadius-medium)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--stack-gap-condensed)",
                padding: "var(--stack-padding-condensed) var(--stack-padding-normal)",
                backgroundColor: "var(--bgColor-muted)",
                borderBottom: "var(--borderWidth-thin) solid var(--borderColor-default)",
              }}
            >
              <BookIcon size={16} />
              <Text weight="semibold" size="small">README.md</Text>
            </div>
            <div style={{ padding: "var(--stack-padding-spacious)" }}>
              <Stack gap="normal">
                <Heading as="h1">Issue Tracker</Heading>
                <Text as="p" size="medium">
                  A modern, full-featured issue tracking application built with Next.js and GitHub
                  Primer. Designed for teams that want a clean, accessible, and performant project
                  management experience.
                </Text>

                <Heading as="h2">Installation</Heading>
                <div
                  style={{
                    backgroundColor: "var(--bgColor-muted)",
                    borderRadius: "var(--borderRadius-medium)",
                    padding: "var(--stack-padding-normal)",
                    fontFamily: "monospace",
                    fontSize: "var(--text-body-size-small)",
                    overflowX: "auto",
                  }}
                >
                  <Text as="p" size="small">git clone https://github.com/acme-corp/issue-tracker.git</Text>
                  <Text as="p" size="small">cd issue-tracker</Text>
                  <Text as="p" size="small">npm install</Text>
                  <Text as="p" size="small">npm run dev</Text>
                </div>

                <Heading as="h2">Usage</Heading>
                <Text as="p" size="medium">
                  After starting the development server, open{" "}
                  <Link href="http://localhost:3000" inline>http://localhost:3000</Link>{" "}
                  in your browser. You can create issues, manage pull requests, browse code, and
                  configure project settings through the web interface.
                </Text>

                <Heading as="h2">Features</Heading>
                <ul style={{ paddingLeft: "var(--stack-padding-spacious)", margin: 0 }}>
                  <li><Text size="medium">Issue tracking with labels, milestones, and assignees</Text></li>
                  <li><Text size="medium">Pull request management with review workflows</Text></li>
                  <li><Text size="medium">Code browsing with syntax highlighting</Text></li>
                  <li><Text size="medium">Full keyboard navigation and screen reader support</Text></li>
                  <li><Text size="medium">Dark mode support via Primer color modes</Text></li>
                </ul>

                <Heading as="h2">License</Heading>
                <Text as="p" size="medium">
                  This project is licensed under the MIT License. See the{" "}
                  <Link href="/" inline>LICENSE</Link> file for details.
                </Text>
              </Stack>
            </div>
          </div>
        </Stack>
        </SplitPageLayout.Content>

        {/* ─── Sidebar ─── */}
        <SplitPageLayout.Sidebar position="end">
        <Stack gap="normal" style={{ padding: "var(--stack-padding-normal)" }}>
          {/* About */}
          <Stack gap="condensed">
            <Heading as="h3" variant="small">About</Heading>
            <Text as="p" size="medium">
              A modern issue tracking application built with Next.js and Primer Design System.
              Fast, accessible, and ready for teams of any size.
            </Text>
            <Stack direction="horizontal" gap="condensed" wrap="wrap">
              {TOPICS.map((topic) => (
                <Token key={topic} text={topic} size="medium" as="span" />
              ))}
            </Stack>
            <Stack direction="horizontal" align="center" gap="condensed">
              <LawIcon size={16} />
              <Text size="small">MIT License</Text>
            </Stack>
          </Stack>

          <div style={{ borderTop: "var(--borderWidth-thin) solid var(--borderColor-muted)" }} />

          {/* Activity */}
          <Stack gap="condensed">
            <Stack direction="horizontal" align="center" justify="space-between">
              <Heading as="h3" variant="small">Activity</Heading>
            </Stack>
            <Stack gap="condensed">
              <Stack direction="horizontal" align="center" gap="condensed">
                <StarIcon size={16} />
                <Text size="small" weight="semibold">189</Text>
                <Text size="small">stars</Text>
              </Stack>
              <Stack direction="horizontal" align="center" gap="condensed">
                <EyeIcon size={16} />
                <Text size="small" weight="semibold">12</Text>
                <Text size="small">watching</Text>
              </Stack>
              <Stack direction="horizontal" align="center" gap="condensed">
                <RepoForkedIcon size={16} />
                <Text size="small" weight="semibold">34</Text>
                <Text size="small">forks</Text>
              </Stack>
            </Stack>
          </Stack>

          <div style={{ borderTop: "var(--borderWidth-thin) solid var(--borderColor-muted)" }} />

          {/* Releases */}
          <Stack gap="condensed">
            <Heading as="h3" variant="small">Releases</Heading>
            <Stack direction="horizontal" align="center" gap="condensed">
              <Link as={NextLink} href="/">
                <Text size="small" weight="semibold">v2.1.0</Text>
              </Link>
              <Label variant="success" size="small">Latest</Label>
            </Stack>
            <Text size="small" weight="light">
              <RelativeTime datetime="2025-05-20T12:00:00Z" threshold="P30D" />
            </Text>
          </Stack>

          <div style={{ borderTop: "var(--borderWidth-thin) solid var(--borderColor-muted)" }} />

          {/* Contributors */}
          <Stack gap="condensed">
            <Heading as="h3" variant="small">Contributors</Heading>
            <CounterLabel scheme="secondary">{CONTRIBUTORS.length}</CounterLabel>
            <AvatarStack>
              {CONTRIBUTORS.map((c) => (
                <Avatar key={c.login} src={c.avatarUrl} alt={c.login} size={32} />
              ))}
            </AvatarStack>
          </Stack>
        </Stack>
        </SplitPageLayout.Sidebar>
      </SplitPageLayout>
    </Stack>
  );
}
