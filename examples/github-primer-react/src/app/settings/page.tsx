"use client";

import { useId, useState } from "react";
import {
  Button,
  Checkbox,
  CheckboxGroup,
  FormControl,
  Heading,
  Link,
  NavList,
  SplitPageLayout,
  Stack,
  Text,
  TextInput,
  TextInputWithTokens,
  Textarea,
  ToggleSwitch,
} from "@primer/react";

type SettingsSection = {
  key: string;
  label: string;
};

const SETTINGS_SECTIONS: SettingsSection[] = [
  { key: "general", label: "General" },
  { key: "access", label: "Access" },
  { key: "branches", label: "Branches" },
  { key: "tags", label: "Tags" },
  { key: "actions", label: "Actions" },
  { key: "pages", label: "Pages" },
  { key: "webhooks", label: "Webhooks" },
  { key: "secrets", label: "Secrets and variables" },
  { key: "notifications", label: "Notifications" },
];

type FeatureToggle = {
  key: string;
  label: string;
  description: string;
  defaultChecked: boolean;
};

const FEATURE_TOGGLES: FeatureToggle[] = [
  {
    key: "wikis",
    label: "Wikis",
    description: "Host documentation for your repository in a wiki.",
    defaultChecked: true,
  },
  {
    key: "issues",
    label: "Issues",
    description: "Track ideas, feedback, tasks, and bugs for your work.",
    defaultChecked: true,
  },
  {
    key: "projects",
    label: "Projects",
    description:
      "Organize and prioritize your issues and pull requests on a board.",
    defaultChecked: true,
  },
  {
    key: "discussions",
    label: "Discussions",
    description: "Create a space for your community to have conversations.",
    defaultChecked: false,
  },
];

type SectionShellProps = {
  title: string;
  children: React.ReactNode;
};

function SectionShell({ title, children }: SectionShellProps) {
  return (
    <Stack
      as="section"
      direction="vertical"
      gap="normal"
      padding="normal"
      style={{
        border: "1px solid var(--borderColor-default)",
        borderRadius: "var(--borderRadius-medium)",
        backgroundColor: "var(--bgColor-default)",
      }}
    >
      <Heading as="h2" variant="medium">
        {title}
      </Heading>
      {children}
    </Stack>
  );
}

type FeatureToggleRowProps = {
  label: string;
  description: string;
  defaultChecked: boolean;
};

function FeatureToggleRow({
  label,
  description,
  defaultChecked,
}: FeatureToggleRowProps) {
  const labelId = useId();
  const descriptionId = useId();
  return (
    <Stack
      direction="horizontal"
      gap="normal"
      align="start"
      justify="space-between"
    >
      <Stack direction="vertical" gap="none">
        <Text id={labelId} weight="semibold">
          {label}
        </Text>
        <Text id={descriptionId} size="small" weight="light">
          {description}
        </Text>
      </Stack>
      <ToggleSwitch
        size="small"
        defaultChecked={defaultChecked}
        aria-labelledby={labelId}
        aria-describedby={descriptionId}
      />
    </Stack>
  );
}

type DangerActionRowProps = {
  title: string;
  description: string;
  actionLabel: string;
};

function DangerActionRow({
  title,
  description,
  actionLabel,
}: DangerActionRowProps) {
  return (
    <Stack
      direction="horizontal"
      gap="normal"
      align="center"
      justify="space-between"
      wrap="wrap"
    >
      <Stack direction="vertical" gap="none">
        <Text weight="semibold">{title}</Text>
        <Text size="small" weight="light">
          {description}
        </Text>
      </Stack>
      <Button variant="danger">{actionLabel}</Button>
    </Stack>
  );
}

export default function SettingsPage() {
  const [repoName, setRepoName] = useState("react");
  const [description, setDescription] = useState(
    "A primer-flavored example app for pastiche.",
  );
  const [website, setWebsite] = useState("https://primer.style");
  const [topics, setTopics] = useState([
    { id: 1, text: "design-system" },
    { id: 2, text: "react" },
    { id: 3, text: "primer" },
  ]);
  const [topicDraft, setTopicDraft] = useState("");

  function removeTopic(tokenId: string | number) {
    setTopics((current) => current.filter((topic) => topic.id !== tokenId));
  }

  function addTopic(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const value = topicDraft.trim();
    if (value === "") return;
    setTopics((current) => [
      ...current,
      { id: (current.at(-1)?.id ?? 0) + 1, text: value },
    ]);
    setTopicDraft("");
  }

  return (
    <SplitPageLayout>
      <SplitPageLayout.Sidebar position="start" aria-label="Settings sections">
        <Stack direction="vertical" gap="normal" padding="normal">
          <Heading as="h2" variant="small">
            Settings
          </Heading>
          <NavList aria-label="Settings sections">
            {SETTINGS_SECTIONS.map((section) => (
              <NavList.Item
                key={section.key}
                href={`/settings?section=${section.key}`}
                aria-current={section.key === "general" ? "page" : undefined}
                onClick={(event) => event.preventDefault()}
              >
                {section.label}
              </NavList.Item>
            ))}
          </NavList>
        </Stack>
      </SplitPageLayout.Sidebar>

      <SplitPageLayout.Content width="large">
        <Stack direction="vertical" gap="spacious">
          <Heading as="h1" variant="large">
            General
          </Heading>

          <SectionShell title="Repository name">
            <FormControl>
              <FormControl.Label>Repository name</FormControl.Label>
              <TextInput
                block
                value={repoName}
                onChange={(event) => setRepoName(event.target.value)}
              />
              <FormControl.Caption>
                Renaming a repository can have unintended side effects.
                Redirects will be set up for the old name, but existing links,
                clones, and integrations referencing the previous name may need
                to be updated.
              </FormControl.Caption>
            </FormControl>

            <FormControl>
              <FormControl.Label>Description</FormControl.Label>
              <Textarea
                block
                resize="vertical"
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Short description of this repository"
              />
            </FormControl>

            <FormControl>
              <FormControl.Label>Website</FormControl.Label>
              <TextInput
                block
                type="url"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
                placeholder="https://example.com"
              />
            </FormControl>

            <FormControl>
              <FormControl.Label>Topics</FormControl.Label>
              <TextInputWithTokens
                block
                tokens={topics}
                onTokenRemove={removeTopic}
                value={topicDraft}
                onChange={(event) => setTopicDraft(event.target.value)}
                onKeyDown={addTopic}
                placeholder="Add topics"
              />
              <FormControl.Caption>
                Add topics to help others find and contribute to your
                repository. Press Enter to add a topic.
              </FormControl.Caption>
            </FormControl>
          </SectionShell>

          <SectionShell title="Features">
            <Text size="small" weight="light">
              Enable or disable features for this repository.
            </Text>
            <Stack direction="vertical" gap="normal">
              {FEATURE_TOGGLES.map((feature) => (
                <FeatureToggleRow
                  key={feature.key}
                  label={feature.label}
                  description={feature.description}
                  defaultChecked={feature.defaultChecked}
                />
              ))}
            </Stack>
          </SectionShell>

          <SectionShell title="Pull Requests">
            <CheckboxGroup>
              <CheckboxGroup.Label>Merge strategies</CheckboxGroup.Label>
              <CheckboxGroup.Caption>
                Choose which merge methods are available when merging pull
                requests. At least one must be enabled.
              </CheckboxGroup.Caption>
              <FormControl>
                <Checkbox defaultChecked value="merge" />
                <FormControl.Label>Allow merge commits</FormControl.Label>
                <FormControl.Caption>
                  Add all commits from the head branch to the base branch with a
                  merge commit.
                </FormControl.Caption>
              </FormControl>
              <FormControl>
                <Checkbox defaultChecked value="squash" />
                <FormControl.Label>Allow squash merging</FormControl.Label>
                <FormControl.Caption>
                  Combine all commits from the head branch into a single commit
                  in the base branch.
                </FormControl.Caption>
              </FormControl>
              <FormControl>
                <Checkbox value="rebase" />
                <FormControl.Label>Allow rebase merging</FormControl.Label>
                <FormControl.Caption>
                  Add all commits from the head branch onto the base branch
                  individually.
                </FormControl.Caption>
              </FormControl>
            </CheckboxGroup>

            <CheckboxGroup>
              <CheckboxGroup.Label>After merge</CheckboxGroup.Label>
              <FormControl>
                <Checkbox defaultChecked value="auto-delete" />
                <FormControl.Label>
                  Automatically delete head branches
                </FormControl.Label>
                <FormControl.Caption>
                  Deleted branches will still be able to be restored after a
                  pull request is merged.
                </FormControl.Caption>
              </FormControl>
            </CheckboxGroup>
          </SectionShell>

          <Stack
            as="section"
            direction="vertical"
            gap="normal"
            padding="normal"
            style={{
              border: "1px solid var(--borderColor-danger-emphasis)",
              borderRadius: "var(--borderRadius-medium)",
              backgroundColor: "var(--bgColor-default)",
            }}
          >
            <Heading
              as="h2"
              variant="medium"
              style={{ color: "var(--fgColor-danger)" }}
            >
              Danger Zone
            </Heading>

            <Stack direction="vertical" gap="normal">
              <DangerActionRow
                title="Change repository visibility"
                description="This repository is currently public."
                actionLabel="Change visibility"
              />
              <DangerActionRow
                title="Transfer ownership"
                description="Transfer this repository to another user or organization."
                actionLabel="Transfer"
              />
              <DangerActionRow
                title="Archive this repository"
                description="Mark this repository as archived and read-only."
                actionLabel="Archive this repository"
              />
              <DangerActionRow
                title="Delete this repository"
                description="Once you delete a repository, there is no going back. Please be certain."
                actionLabel="Delete this repository"
              />
            </Stack>
          </Stack>

          <Text size="small" weight="light">
            Need more options?{" "}
            <Link href="/settings" onClick={(event) => event.preventDefault()}>
              View all settings sections
            </Link>
            .
          </Text>
        </Stack>
      </SplitPageLayout.Content>
    </SplitPageLayout>
  );
}
