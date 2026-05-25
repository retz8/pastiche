"use client";

import { useState } from "react";
import {
  Button,
  Checkbox,
  CheckboxGroup,
  FormControl,
  Heading,
  Label,
  NavList,
  SplitPageLayout,
  Stack,
  Text,
  TextInput,
  Textarea,
  ToggleSwitch,
} from "@primer/react";
import {
  GearIcon,
  KeyIcon,
  GitBranchIcon,
  TagIcon,
  PlayIcon,
  FileIcon,
  PackageIcon,
  WebhookIcon,
  ShieldLockIcon,
  CodeSquareIcon,
  PeopleIcon,
  MailIcon,
} from "@primer/octicons-react";

// ---------- Sidebar nav sections ----------

const SETTINGS_NAV = [
  { id: "general", label: "General", icon: GearIcon, current: true },
  { id: "access", label: "Access", icon: PeopleIcon },
  { id: "branches", label: "Branches", icon: GitBranchIcon },
  { id: "tags", label: "Tags", icon: TagIcon },
  { id: "actions", label: "Actions", icon: PlayIcon },
  { id: "webhooks", label: "Webhooks", icon: WebhookIcon },
  { id: "environments", label: "Environments", icon: CodeSquareIcon },
  { id: "pages", label: "Pages", icon: FileIcon },
  { id: "packages", label: "Packages", icon: PackageIcon },
  { id: "security", label: "Security", icon: ShieldLockIcon },
  { id: "keys", label: "Deploy keys", icon: KeyIcon },
  { id: "notifications", label: "Notifications", icon: MailIcon },
];

// ---------- Component ----------

export default function SettingsPage() {
  const [repoName, setRepoName] = useState("issue-tracker");
  const [description, setDescription] = useState(
    "A full-featured issue tracking application for teams."
  );
  const [website, setWebsite] = useState("https://issue-tracker.example.com");

  // Feature toggles
  const [wikisEnabled, setWikisEnabled] = useState(true);
  const [issuesEnabled, setIssuesEnabled] = useState(true);
  const [projectsEnabled, setProjectsEnabled] = useState(true);
  const [discussionsEnabled, setDiscussionsEnabled] = useState(false);

  // Merge strategy checkboxes
  const [mergeCommits, setMergeCommits] = useState(true);
  const [squashMerge, setSquashMerge] = useState(true);
  const [rebaseMerge, setRebaseMerge] = useState(true);
  const [autoDeleteBranch, setAutoDeleteBranch] = useState(false);

  return (
    <SplitPageLayout>
      {/* ---- Sidebar ---- */}
      <SplitPageLayout.Sidebar position="start" padding="none">
        <Stack padding="normal" gap="condensed">
          <NavList aria-label="Settings sections">
            {SETTINGS_NAV.map((item) => (
              <NavList.Item
                key={item.id}
                href="#"
                aria-current={item.current ? "page" : undefined}
                onClick={(e: React.MouseEvent) => e.preventDefault()}
              >
                <NavList.LeadingVisual>
                  <item.icon size={16} />
                </NavList.LeadingVisual>
                {item.label}
              </NavList.Item>
            ))}
          </NavList>
        </Stack>
      </SplitPageLayout.Sidebar>

      {/* ---- Main content ---- */}
      <SplitPageLayout.Content padding="normal">
        <Stack gap="spacious">
          {/* ===== Repository name ===== */}
          <section>
            <Stack gap="normal">
              <Heading as="h2" variant="large">General</Heading>

              <FormControl>
                <FormControl.Label>Repository name</FormControl.Label>
                <TextInput
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  block
                />
                <FormControl.Caption>
                  Renaming a repository changes all existing links to the
                  project. A redirect from the old name will be set up, but we
                  recommend updating any existing links.
                </FormControl.Caption>
              </FormControl>

              <Button variant="primary">Rename</Button>

              <FormControl>
                <FormControl.Label>Description</FormControl.Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  block
                  resize="vertical"
                />
              </FormControl>

              <FormControl>
                <FormControl.Label>Website</FormControl.Label>
                <TextInput
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  block
                  placeholder="https://example.com"
                />
              </FormControl>

              <Stack gap="condensed">
                <Text weight="semibold">
                  Topics
                </Text>
                <Stack direction="horizontal" gap="condensed" wrap="wrap">
                  <Label variant="accent">javascript</Label>
                  <Label variant="accent">react</Label>
                  <Label variant="accent">issue-tracker</Label>
                  <Label variant="accent">nextjs</Label>
                </Stack>
              </Stack>
            </Stack>
          </section>

          {/* ===== Features ===== */}
          <section>
            <Stack gap="normal">
              <Heading as="h3" variant="medium">Features</Heading>

              <Stack gap="normal">
                <Stack direction="horizontal" align="center" justify="space-between">
                  <Stack gap="none">
                    <Text id="toggle-wikis" weight="semibold">Wikis</Text>
                    <Text size="small" weight="light">
                      Host documentation for your project in a wiki format.
                    </Text>
                  </Stack>
                  <ToggleSwitch
                    aria-labelledby="toggle-wikis"
                    checked={wikisEnabled}
                    onChange={setWikisEnabled}
                  />
                </Stack>

                <Stack direction="horizontal" align="center" justify="space-between">
                  <Stack gap="none">
                    <Text id="toggle-issues" weight="semibold">Issues</Text>
                    <Text size="small" weight="light">
                      Track bugs, enhancements, and tasks for your project.
                    </Text>
                  </Stack>
                  <ToggleSwitch
                    aria-labelledby="toggle-issues"
                    checked={issuesEnabled}
                    onChange={setIssuesEnabled}
                  />
                </Stack>

                <Stack direction="horizontal" align="center" justify="space-between">
                  <Stack gap="none">
                    <Text id="toggle-projects" weight="semibold">Projects</Text>
                    <Text size="small" weight="light">
                      Organize and prioritize work with project boards.
                    </Text>
                  </Stack>
                  <ToggleSwitch
                    aria-labelledby="toggle-projects"
                    checked={projectsEnabled}
                    onChange={setProjectsEnabled}
                  />
                </Stack>

                <Stack direction="horizontal" align="center" justify="space-between">
                  <Stack gap="none">
                    <Text id="toggle-discussions" weight="semibold">Discussions</Text>
                    <Text size="small" weight="light">
                      A space for your community to have conversations, ask
                      questions, and share ideas.
                    </Text>
                  </Stack>
                  <ToggleSwitch
                    aria-labelledby="toggle-discussions"
                    checked={discussionsEnabled}
                    onChange={setDiscussionsEnabled}
                  />
                </Stack>
              </Stack>
            </Stack>
          </section>

          {/* ===== Pull Requests ===== */}
          <section>
            <Stack gap="normal">
              <Heading as="h3" variant="medium">Pull Requests</Heading>

              <Text size="small" weight="light">
                When merging pull requests, you can allow any combination of
                merge commits, squashing, or rebasing.
              </Text>

              <CheckboxGroup>
                <CheckboxGroup.Label visuallyHidden>Allowed merge strategies</CheckboxGroup.Label>
                <FormControl>
                  <Checkbox
                    checked={mergeCommits}
                    onChange={() => setMergeCommits(!mergeCommits)}
                    value="merge-commits"
                  />
                  <FormControl.Label>Allow merge commits</FormControl.Label>
                  <FormControl.Caption>
                    Add all commits from the head branch to the base branch with
                    a merge commit.
                  </FormControl.Caption>
                </FormControl>

                <FormControl>
                  <Checkbox
                    checked={squashMerge}
                    onChange={() => setSquashMerge(!squashMerge)}
                    value="squash-merge"
                  />
                  <FormControl.Label>Allow squash merging</FormControl.Label>
                  <FormControl.Caption>
                    Combine all commits from the head branch into a single
                    commit in the base branch.
                  </FormControl.Caption>
                </FormControl>

                <FormControl>
                  <Checkbox
                    checked={rebaseMerge}
                    onChange={() => setRebaseMerge(!rebaseMerge)}
                    value="rebase-merge"
                  />
                  <FormControl.Label>Allow rebase merging</FormControl.Label>
                  <FormControl.Caption>
                    Add all commits from the head branch onto the base branch
                    individually.
                  </FormControl.Caption>
                </FormControl>
              </CheckboxGroup>

              <div
                style={{
                  borderTop: "var(--borderWidth-thin) solid var(--borderColor-default)",
                  paddingTop: "var(--base-size-16)",
                }}
              >
                <FormControl>
                  <Checkbox
                    checked={autoDeleteBranch}
                    onChange={() => setAutoDeleteBranch(!autoDeleteBranch)}
                    value="auto-delete"
                  />
                  <FormControl.Label>
                    Automatically delete head branches
                  </FormControl.Label>
                  <FormControl.Caption>
                    Deleted branches will still be restorable from the pull
                    request page.
                  </FormControl.Caption>
                </FormControl>
              </div>
            </Stack>
          </section>

          {/* ===== Danger Zone ===== */}
          <section
            style={{
              border: "var(--borderWidth-thin) solid var(--borderColor-danger-emphasis)",
              borderRadius: "var(--borderRadius-medium)",
              padding: "var(--base-size-16)",
            }}
          >
            <Stack gap="normal">
              <Heading as="h3" variant="medium" style={{ color: "var(--fgColor-danger)" }}>
                Danger Zone
              </Heading>

              {/* Change visibility */}
              <Stack
                direction="horizontal"
                align="center"
                justify="space-between"
                gap="normal"
                style={{
                  borderBottom: "var(--borderWidth-thin) solid var(--borderColor-default)",
                  paddingBottom: "var(--base-size-16)",
                }}
              >
                <Stack gap="none">
                  <Text size="medium" weight="semibold">Change repository visibility</Text>
                  <Text size="small" weight="light">
                    This repository is currently public. Changing visibility may
                    affect forks and collaborators.
                  </Text>
                </Stack>
                <Button variant="danger">Change visibility</Button>
              </Stack>

              {/* Transfer ownership */}
              <Stack
                direction="horizontal"
                align="center"
                justify="space-between"
                gap="normal"
                style={{
                  borderBottom: "var(--borderWidth-thin) solid var(--borderColor-default)",
                  paddingBottom: "var(--base-size-16)",
                }}
              >
                <Stack gap="none">
                  <Text size="medium" weight="semibold">Transfer ownership</Text>
                  <Text size="small" weight="light">
                    Transfer this repository to another user or organization.
                  </Text>
                </Stack>
                <Button variant="danger">Transfer</Button>
              </Stack>

              {/* Archive */}
              <Stack
                direction="horizontal"
                align="center"
                justify="space-between"
                gap="normal"
                style={{
                  borderBottom: "var(--borderWidth-thin) solid var(--borderColor-default)",
                  paddingBottom: "var(--base-size-16)",
                }}
              >
                <Stack gap="none">
                  <Text size="medium" weight="semibold">Archive this repository</Text>
                  <Text size="small" weight="light">
                    Mark this repository as archived and read-only.
                  </Text>
                </Stack>
                <Button variant="danger">Archive</Button>
              </Stack>

              {/* Delete */}
              <Stack
                direction="horizontal"
                align="center"
                justify="space-between"
                gap="normal"
              >
                <Stack gap="none">
                  <Text size="medium" weight="semibold">Delete this repository</Text>
                  <Text size="small" weight="light">
                    Once you delete a repository, there is no going back. Please
                    be certain.
                  </Text>
                </Stack>
                <Button variant="danger">Delete this repository</Button>
              </Stack>
            </Stack>
          </section>
        </Stack>
      </SplitPageLayout.Content>
    </SplitPageLayout>
  );
}
