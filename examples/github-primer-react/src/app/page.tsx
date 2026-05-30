"use client";

import {
  ActionList,
  ActionMenu,
  Avatar,
  AvatarStack,
  Button,
  Heading,
  Label,
  LabelGroup,
  Link,
  PageHeader,
  RelativeTime,
  SplitPageLayout,
  Stack,
  Text,
} from "@primer/react";
import {
  BookIcon,
  CodeIcon,
  CopyIcon,
  EyeIcon,
  FileDirectoryFillIcon,
  FileIcon,
  GitBranchIcon,
  LawIcon,
  RepoForkedIcon,
  SearchIcon,
  StarIcon,
  TagIcon,
} from "@primer/octicons-react";

const DAY = 1000 * 60 * 60 * 24;
const HOUR = 1000 * 60 * 60;

function daysAgo(days: number): string {
  return new Date(Date.now() - days * DAY).toISOString();
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * HOUR).toISOString();
}

type EntryKind = "dir" | "file";

type TreeEntry = {
  name: string;
  kind: EntryKind;
  message: string;
  updatedAt: string;
};

type Contributor = {
  login: string;
  avatar: string;
};

const REPO = {
  owner: "primer",
  name: "react",
  visibility: "public" as "public" | "private",
  defaultBranch: "main",
  description:
    "An implementation of GitHub's Primer Design System using React.",
  stars: "3.1k",
  forks: 612,
  watchers: 84,
  commitCount: 8421,
  topics: [
    "react",
    "design-system",
    "components",
    "typescript",
    "accessibility",
    "ui",
  ],
  license: "MIT License",
  release: { tag: "v38.24.0", publishedAt: daysAgo(6) },
  httpsUrl: "https://github.com/primer/react.git",
  sshUrl: "git@github.com:primer/react.git",
  cliUrl: "gh repo clone primer/react",
};

const LATEST_COMMIT = {
  sha: "a1b2c3d",
  message: "Ref-count ActionList mounts; tear down listener at zero",
  author: { login: "monalisa", avatar: "https://avatars.githubusercontent.com/monalisa" },
  authoredAt: hoursAgo(5.2),
};

// Mock file tree — directories first, then files (sorted before render below).
const TREE: TreeEntry[] = [
  { name: ".github", kind: "dir", message: "Pin CI runners to ubuntu-22.04", updatedAt: daysAgo(9) },
  { name: "docs", kind: "dir", message: "Document the SegmentedControl responsive variants", updatedAt: daysAgo(2) },
  { name: "e2e", kind: "dir", message: "Add visual regression suite for ActionList", updatedAt: daysAgo(12) },
  { name: "examples", kind: "dir", message: "Add a Next.js app-router example", updatedAt: daysAgo(4) },
  { name: "packages", kind: "dir", message: "Split primitives into its own workspace", updatedAt: daysAgo(1) },
  { name: "script", kind: "dir", message: "Speed up the release verification script", updatedAt: daysAgo(18) },
  { name: "src", kind: "dir", message: "Ref-count ActionList mounts; tear down listener at zero", updatedAt: hoursAgo(5.2) },
  { name: ".editorconfig", kind: "file", message: "Standardize on 2-space indentation", updatedAt: daysAgo(60) },
  { name: ".gitignore", kind: "file", message: "Ignore generated token CSS", updatedAt: daysAgo(33) },
  { name: "LICENSE", kind: "file", message: "Initial commit", updatedAt: daysAgo(420) },
  { name: "README.md", kind: "file", message: "Refresh the installation instructions for v38", updatedAt: daysAgo(6) },
  { name: "package.json", kind: "file", message: "Bump to v38.24.0", updatedAt: daysAgo(6) },
  { name: "tsconfig.json", kind: "file", message: "Enable verbatimModuleSyntax", updatedAt: daysAgo(15) },
];

const CONTRIBUTORS: Contributor[] = [
  { login: "monalisa", avatar: "https://avatars.githubusercontent.com/monalisa" },
  { login: "siddharthkp", avatar: "https://avatars.githubusercontent.com/siddharthkp" },
  { login: "langermank", avatar: "https://avatars.githubusercontent.com/langermank" },
  { login: "joshblack", avatar: "https://avatars.githubusercontent.com/joshblack" },
  { login: "broccolinisoup", avatar: "https://avatars.githubusercontent.com/broccolinisoup" },
  { login: "TylerJDev", avatar: "https://avatars.githubusercontent.com/TylerJDev" },
  { login: "mperrotti", avatar: "https://avatars.githubusercontent.com/mperrotti" },
  { login: "lukasoppermann", avatar: "https://avatars.githubusercontent.com/lukasoppermann" },
];

const CLONE_OPTIONS: { label: string; value: string }[] = [
  { label: "HTTPS", value: REPO.httpsUrl },
  { label: "SSH", value: REPO.sshUrl },
  { label: "GitHub CLI", value: REPO.cliUrl },
];

function sortedTree(entries: TreeEntry[]): TreeEntry[] {
  return [...entries].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

const sectionBorder = {
  borderBottom: "var(--borderWidth-thin) solid var(--borderColor-muted)",
};

export default function RepositoryHomePage() {
  const entries = sortedTree(TREE);

  return (
    <SplitPageLayout>
      <SplitPageLayout.Content width="xlarge">
        <Stack direction="vertical" gap="normal">
          {/* Repository metadata + social actions */}
          <PageHeader role="banner" aria-label="Repository header">
            <PageHeader.TitleArea>
              <PageHeader.Title as="h1">
                <Stack direction="horizontal" gap="condensed" align="center" wrap="wrap">
                  <Text>
                    <Link href={`/${REPO.owner}`} muted>
                      {REPO.owner}
                    </Link>
                    <Text style={{ color: "var(--fgColor-muted)" }}> / </Text>
                    <Link href={`/${REPO.owner}/${REPO.name}`}>{REPO.name}</Link>
                  </Text>
                  <Label variant="secondary">
                    {REPO.visibility === "public" ? "Public" : "Private"}
                  </Label>
                </Stack>
              </PageHeader.Title>
            </PageHeader.TitleArea>
            <PageHeader.Actions>
              <Stack direction="horizontal" gap="condensed" align="center" wrap="wrap">
                <Button size="small" leadingVisual={EyeIcon} count={REPO.watchers}>
                  Watch
                </Button>
                <Button size="small" leadingVisual={RepoForkedIcon} count={REPO.forks}>
                  Fork
                </Button>
                <Button size="small" leadingVisual={StarIcon} count={REPO.stars}>
                  Star
                </Button>
              </Stack>
            </PageHeader.Actions>
          </PageHeader>

          {/* Branch / file actions bar */}
          <Stack
            direction="horizontal"
            gap="condensed"
            align="center"
            justify="space-between"
            wrap="wrap"
          >
            <Stack direction="horizontal" gap="condensed" align="center" wrap="wrap">
              <ActionMenu>
                <ActionMenu.Button size="small" leadingVisual={GitBranchIcon}>
                  {REPO.defaultBranch}
                </ActionMenu.Button>
                <ActionMenu.Overlay width="medium">
                  <ActionList selectionVariant="single">
                    <ActionList.Group>
                      <ActionList.GroupHeading>Branches</ActionList.GroupHeading>
                      <ActionList.Item selected>
                        <ActionList.LeadingVisual>
                          <GitBranchIcon />
                        </ActionList.LeadingVisual>
                        {REPO.defaultBranch}
                      </ActionList.Item>
                      <ActionList.Item>
                        <ActionList.LeadingVisual>
                          <GitBranchIcon />
                        </ActionList.LeadingVisual>
                        next
                      </ActionList.Item>
                    </ActionList.Group>
                    <ActionList.Group>
                      <ActionList.GroupHeading>Tags</ActionList.GroupHeading>
                      <ActionList.Item>
                        <ActionList.LeadingVisual>
                          <TagIcon />
                        </ActionList.LeadingVisual>
                        {REPO.release.tag}
                      </ActionList.Item>
                    </ActionList.Group>
                  </ActionList>
                </ActionMenu.Overlay>
              </ActionMenu>
            </Stack>

            <Stack direction="horizontal" gap="condensed" align="center" wrap="wrap">
              <Button size="small" leadingVisual={SearchIcon}>Go to file</Button>
              <Button size="small" leadingVisual={CodeIcon}>Add file</Button>
              <ActionMenu>
                <ActionMenu.Button size="small" variant="primary" leadingVisual={CodeIcon}>
                  Code
                </ActionMenu.Button>
                <ActionMenu.Overlay width="medium">
                  <ActionList>
                    <ActionList.Group>
                      <ActionList.GroupHeading>Clone</ActionList.GroupHeading>
                      {CLONE_OPTIONS.map((option) => (
                        <ActionList.Item key={option.label}>
                          <ActionList.LeadingVisual>
                            <CopyIcon />
                          </ActionList.LeadingVisual>
                          {option.label}
                          <ActionList.Description variant="block">
                            {option.value}
                          </ActionList.Description>
                        </ActionList.Item>
                      ))}
                    </ActionList.Group>
                  </ActionList>
                </ActionMenu.Overlay>
              </ActionMenu>
            </Stack>
          </Stack>

          {/* File listing — bordered container with a latest-commit summary header */}
          <div
            style={{
              border: "var(--borderWidth-thin) solid var(--borderColor-default)",
              borderRadius: "var(--borderRadius-medium)",
              overflow: "hidden",
            }}
          >
            <Stack
              direction="horizontal"
              gap="normal"
              align="center"
              justify="space-between"
              wrap="wrap"
              padding="condensed"
              style={{
                borderBottom: "var(--borderWidth-thin) solid var(--borderColor-muted)",
                backgroundColor: "var(--bgColor-muted)",
              }}
            >
              <Stack direction="horizontal" gap="condensed" align="center" wrap="wrap">
                <Avatar src={LATEST_COMMIT.author.avatar} alt="" size={24} />
                <Link href={`/${REPO.owner}/${REPO.name}/commits`} muted>
                  <Text size="small" weight="semibold">
                    {LATEST_COMMIT.author.login}
                  </Text>
                </Link>
                <Link href={`/commit/${LATEST_COMMIT.sha}`} muted>
                  <Text size="small">{LATEST_COMMIT.message}</Text>
                </Link>
              </Stack>

              <Stack direction="horizontal" gap="condensed" align="baseline" wrap="wrap">
                <Link
                  href={`/commit/${LATEST_COMMIT.sha}`}
                  muted
                  style={{ fontFamily: "var(--fontStack-monospace)" }}
                >
                  <Text size="small">{LATEST_COMMIT.sha}</Text>
                </Link>
                <Text size="small" weight="light">
                  <RelativeTime
                    date={new Date(LATEST_COMMIT.authoredAt)}
                    threshold="P30D"
                  />
                </Text>
                <Text size="small" weight="light">
                  {REPO.commitCount.toLocaleString()} Commits
                </Text>
              </Stack>
            </Stack>

            <table style={{ borderCollapse: "collapse", width: "100%" }}>
              <caption style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
                Files in {REPO.defaultBranch}
              </caption>
              <thead>
                <tr>
                  <th scope="col" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
                    Name
                  </th>
                  <th scope="col" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
                    Last commit message
                  </th>
                  <th scope="col" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
                    Last commit date
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => {
                  const Icon = entry.kind === "dir" ? FileDirectoryFillIcon : FileIcon;
                  const href =
                    entry.kind === "dir"
                      ? `/tree/${REPO.defaultBranch}/${entry.name}`
                      : `/blob/${REPO.defaultBranch}/${entry.name}`;
                  return (
                    <tr
                      key={entry.name}
                      style={
                        index < entries.length - 1
                          ? {
                              borderBottom:
                                "var(--borderWidth-thin) solid var(--borderColor-muted)",
                            }
                          : undefined
                      }
                    >
                      <td
                        style={{
                          padding: "var(--stack-padding-condensed)",
                          width: "30%",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <Stack direction="horizontal" gap="condensed" align="center">
                          <span
                            style={{
                              display: "flex",
                              color:
                                entry.kind === "dir"
                                  ? "var(--fgColor-accent)"
                                  : "var(--fgColor-muted)",
                            }}
                            aria-hidden
                          >
                            <Icon size={16} />
                          </span>
                          <Link href={href}>
                            <Text size="small">{entry.name}</Text>
                          </Link>
                        </Stack>
                      </td>
                      <td
                        style={{
                          padding: "var(--stack-padding-condensed)",
                          width: "55%",
                        }}
                      >
                        <Link
                          href={`/commit/${LATEST_COMMIT.sha}`}
                          muted
                        >
                          <Text size="small" weight="light">
                            {entry.message}
                          </Text>
                        </Link>
                      </td>
                      <td
                        style={{
                          padding: "var(--stack-padding-condensed)",
                          textAlign: "right",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <Text size="small" weight="light">
                          <RelativeTime
                            date={new Date(entry.updatedAt)}
                            threshold="P30D"
                          />
                        </Text>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* README */}
          <section
            aria-label="README"
            style={{
              border: "var(--borderWidth-thin) solid var(--borderColor-default)",
              borderRadius: "var(--borderRadius-medium)",
              overflow: "hidden",
            }}
          >
            <Stack
              direction="horizontal"
              gap="condensed"
              align="center"
              padding="condensed"
              style={{
                borderBottom: "var(--borderWidth-thin) solid var(--borderColor-muted)",
                backgroundColor: "var(--bgColor-muted)",
              }}
            >
              <span style={{ display: "flex", color: "var(--fgColor-muted)" }} aria-hidden>
                <BookIcon size={16} />
              </span>
              <Heading as="h2" variant="small">
                README.md
              </Heading>
            </Stack>

            <Stack direction="vertical" gap="normal" padding="normal">
              <Stack direction="vertical" gap="none">
                <Heading as="h1" variant="large">
                  Primer React
                </Heading>
                <Text as="p" size="medium" weight="light">
                  An implementation of GitHub&apos;s Primer Design System using
                  React. Primer React gives you a set of accessible,
                  battle-tested components for building GitHub-quality
                  interfaces.
                </Text>
              </Stack>

              <Stack direction="vertical" gap="none">
                <Heading as="h2" variant="medium">
                  Installation
                </Heading>
                <Text as="p" size="medium">
                  Install Primer React and its peer dependencies with your
                  package manager of choice:
                </Text>
                <pre
                  style={{
                    margin: 0,
                    marginTop: "var(--space-md)",
                    padding: "var(--stack-padding-condensed)",
                    backgroundColor: "var(--bgColor-muted)",
                    borderRadius: "var(--borderRadius-medium)",
                    overflowX: "auto",
                    fontFamily: "var(--fontStack-monospace)",
                    fontSize: "var(--text-codeBlock-size)",
                    lineHeight: "var(--text-codeBlock-lineHeight)",
                    color: "var(--fgColor-default)",
                  }}
                >
                  <code>npm install @primer/react @primer/octicons-react</code>
                </pre>
              </Stack>

              <Stack direction="vertical" gap="none">
                <Heading as="h2" variant="medium">
                  Usage
                </Heading>
                <Text as="p" size="medium">
                  Wrap your application in the <Text weight="semibold">ThemeProvider</Text>{" "}
                  and start composing with Primer components:
                </Text>
                <pre
                  style={{
                    margin: 0,
                    marginTop: "var(--space-md)",
                    padding: "var(--stack-padding-condensed)",
                    backgroundColor: "var(--bgColor-muted)",
                    borderRadius: "var(--borderRadius-medium)",
                    overflowX: "auto",
                    fontFamily: "var(--fontStack-monospace)",
                    fontSize: "var(--text-codeBlock-size)",
                    lineHeight: "var(--text-codeBlock-lineHeight)",
                    color: "var(--fgColor-default)",
                  }}
                >
                  <code>{`import { ThemeProvider, Button } from "@primer/react";

export default function App() {
  return (
    <ThemeProvider>
      <Button variant="primary">Hello, Primer</Button>
    </ThemeProvider>
  );
}`}</code>
                </pre>
              </Stack>

              <Stack direction="vertical" gap="none">
                <Heading as="h2" variant="medium">
                  Contributing
                </Heading>
                <Text as="p" size="medium">
                  We welcome contributions. Read the contributing guide to learn
                  about our development process, and open an issue or pull
                  request to get started.
                </Text>
              </Stack>
            </Stack>
          </section>
        </Stack>
      </SplitPageLayout.Content>

      <SplitPageLayout.Sidebar position="end" aria-label="About this repository">
        <Stack direction="vertical" gap="none" padding="normal">
          {/* About */}
          <Stack direction="vertical" gap="condensed" paddingBlock="normal" style={sectionBorder}>
            <Heading as="h2" variant="small">
              About
            </Heading>
            <Text as="p" size="medium">
              {REPO.description}
            </Text>
            <LabelGroup>
              {REPO.topics.map((topic) => (
                <Label key={topic} variant="accent">
                  {topic}
                </Label>
              ))}
            </LabelGroup>
            <Stack direction="horizontal" gap="condensed" align="center">
              <span style={{ display: "flex", color: "var(--fgColor-muted)" }} aria-hidden>
                <LawIcon size={16} />
              </span>
              <Link href={`/${REPO.owner}/${REPO.name}/blob/${REPO.defaultBranch}/LICENSE`} muted>
                <Text size="small">{REPO.license}</Text>
              </Link>
            </Stack>
          </Stack>

          {/* Activity stats */}
          <Stack direction="vertical" gap="condensed" paddingBlock="normal" style={sectionBorder}>
            <Heading as="h2" variant="small">
              Activity
            </Heading>
            <Link href={`/${REPO.owner}/${REPO.name}/stargazers`} muted>
              <Stack direction="horizontal" gap="condensed" align="center">
                <span style={{ display: "flex" }} aria-hidden>
                  <StarIcon size={16} />
                </span>
                <Text size="small">
                  <Text weight="semibold">{REPO.stars}</Text> stars
                </Text>
              </Stack>
            </Link>
            <Link href={`/${REPO.owner}/${REPO.name}/watchers`} muted>
              <Stack direction="horizontal" gap="condensed" align="center">
                <span style={{ display: "flex" }} aria-hidden>
                  <EyeIcon size={16} />
                </span>
                <Text size="small">
                  <Text weight="semibold">{REPO.watchers}</Text> watching
                </Text>
              </Stack>
            </Link>
            <Link href={`/${REPO.owner}/${REPO.name}/forks`} muted>
              <Stack direction="horizontal" gap="condensed" align="center">
                <span style={{ display: "flex" }} aria-hidden>
                  <RepoForkedIcon size={16} />
                </span>
                <Text size="small">
                  <Text weight="semibold">{REPO.forks}</Text> forks
                </Text>
              </Stack>
            </Link>
          </Stack>

          {/* Releases */}
          <Stack direction="vertical" gap="condensed" paddingBlock="normal" style={sectionBorder}>
            <Heading as="h2" variant="small">
              Releases
            </Heading>
            <Stack direction="horizontal" gap="condensed" align="center" wrap="wrap">
              <span style={{ display: "flex", color: "var(--fgColor-success)" }} aria-hidden>
                <TagIcon size={16} />
              </span>
              <Link href={`/${REPO.owner}/${REPO.name}/releases/tag/${REPO.release.tag}`}>
                <Text size="small" weight="semibold">
                  {REPO.release.tag}
                </Text>
              </Link>
              <Label variant="success">Latest</Label>
            </Stack>
            <Text size="small" weight="light">
              Published{" "}
              <RelativeTime date={new Date(REPO.release.publishedAt)} threshold="P30D" />
            </Text>
          </Stack>

          {/* Contributors */}
          <Stack direction="vertical" gap="condensed" paddingBlock="normal">
            <Stack direction="horizontal" gap="condensed" align="center">
              <Heading as="h2" variant="small">
                Contributors
              </Heading>
              <Text size="small" weight="light">
                {CONTRIBUTORS.length}
              </Text>
            </Stack>
            <AvatarStack>
              {CONTRIBUTORS.map((person) => (
                <Avatar key={person.login} src={person.avatar} alt={person.login} />
              ))}
            </AvatarStack>
          </Stack>
        </Stack>
      </SplitPageLayout.Sidebar>
    </SplitPageLayout>
  );
}
