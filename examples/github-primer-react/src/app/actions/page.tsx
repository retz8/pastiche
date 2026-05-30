"use client";

import { useMemo, useState } from "react";
import {
  ActionList,
  ActionMenu,
  Button,
  Heading,
  Link,
  NavList,
  PageHeader,
  RelativeTime,
  SplitPageLayout,
  Stack,
  Text,
  TextInput,
} from "@primer/react";
import { Blankslate } from "@primer/react/experimental";
import {
  CalendarIcon,
  CheckCircleFillIcon,
  ChevronDownIcon,
  CircleSlashIcon,
  GitBranchIcon,
  GitCommitIcon,
  GitPullRequestIcon,
  PersonIcon,
  PlayIcon,
  PlusIcon,
  SearchIcon,
  StopwatchIcon,
  SyncIcon,
  WorkflowIcon,
  XCircleFillIcon,
} from "@primer/octicons-react";

type RunStatus = "success" | "failure" | "in_progress" | "cancelled";
type RunEvent = "push" | "pull_request" | "schedule";

type Workflow = {
  id: string;
  name: string;
  file: string;
};

type WorkflowRun = {
  id: number;
  title: string;
  status: RunStatus;
  event: RunEvent;
  branch: string;
  actor: string;
  startedAt: string;
  durationSeconds: number;
};

const MINUTE = 1000 * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;

function ago(ms: number): string {
  return new Date(Date.now() - ms).toISOString();
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

const WORKFLOWS: Workflow[] = [
  { id: "ci", name: "CI", file: "ci.yml" },
  { id: "deploy", name: "Deploy", file: "deploy.yml" },
  { id: "lint", name: "Lint", file: "lint.yml" },
  { id: "release", name: "Release", file: "release.yml" },
];

const RUNS: Record<string, WorkflowRun[]> = {
  ci: [
    {
      id: 9012,
      title: "Fix focus ring clipping inside ActionList rows",
      status: "in_progress",
      event: "pull_request",
      branch: "fix/focus-ring",
      actor: "monalisa",
      startedAt: ago(3 * MINUTE),
      durationSeconds: 184,
    },
    {
      id: 9008,
      title: "Bump @primer/primitives to 9.4.0",
      status: "success",
      event: "push",
      branch: "main",
      actor: "hubot",
      startedAt: ago(42 * MINUTE),
      durationSeconds: 212,
    },
    {
      id: 9001,
      title: "Add keyboard reordering to TreeView",
      status: "failure",
      event: "pull_request",
      branch: "feat/treeview-reorder",
      actor: "octocat",
      startedAt: ago(2 * HOUR),
      durationSeconds: 96,
    },
    {
      id: 8994,
      title: "Nightly dependency audit",
      status: "success",
      event: "schedule",
      branch: "main",
      actor: "github-actions",
      startedAt: ago(8 * HOUR),
      durationSeconds: 341,
    },
    {
      id: 8987,
      title: "Document SegmentedControl responsive variants",
      status: "cancelled",
      event: "pull_request",
      branch: "docs/segmented-control",
      actor: "broccolinisoup",
      startedAt: ago(1 * DAY),
      durationSeconds: 18,
    },
    {
      id: 8980,
      title: "Migrate Button stories to CSS modules pipeline",
      status: "success",
      event: "push",
      branch: "main",
      actor: "mperrotti",
      startedAt: ago(2 * DAY),
      durationSeconds: 268,
    },
    {
      id: 8972,
      title: "Fix aria-current handling in NavList groups",
      status: "failure",
      event: "pull_request",
      branch: "fix/navlist-aria",
      actor: "TylerJDev",
      startedAt: ago(3 * DAY),
      durationSeconds: 142,
    },
    {
      id: 8965,
      title: "Ship CounterLabel scheme prop",
      status: "success",
      event: "push",
      branch: "release/38.x",
      actor: "lukasoppermann",
      startedAt: ago(4 * DAY),
      durationSeconds: 305,
    },
    {
      id: 8959,
      title: "Weekly token drift check",
      status: "success",
      event: "schedule",
      branch: "main",
      actor: "github-actions",
      startedAt: ago(6 * DAY),
      durationSeconds: 377,
    },
  ],
  deploy: [
    {
      id: 7741,
      title: "Deploy storybook to production",
      status: "success",
      event: "push",
      branch: "main",
      actor: "colebemis",
      startedAt: ago(55 * MINUTE),
      durationSeconds: 512,
    },
    {
      id: 7720,
      title: "Roll back failed preview environment",
      status: "cancelled",
      event: "push",
      branch: "main",
      actor: "siddharthkp",
      startedAt: ago(5 * HOUR),
      durationSeconds: 47,
    },
    {
      id: 7702,
      title: "Promote release/38.x to staging",
      status: "success",
      event: "push",
      branch: "release/38.x",
      actor: "joshblack",
      startedAt: ago(2 * DAY),
      durationSeconds: 489,
    },
  ],
  lint: [
    {
      id: 5510,
      title: "Enforce eslint-plugin-primer-react rules",
      status: "failure",
      event: "pull_request",
      branch: "chore/eslint-rules",
      actor: "langermank",
      startedAt: ago(20 * MINUTE),
      durationSeconds: 73,
    },
    {
      id: 5498,
      title: "Format CSS modules with prettier",
      status: "success",
      event: "push",
      branch: "main",
      actor: "hubot",
      startedAt: ago(3 * HOUR),
      durationSeconds: 61,
    },
  ],
  release: [],
};

const STATUS_META: Record<
  RunStatus,
  { label: string; icon: React.ElementType; color: string }
> = {
  success: {
    label: "Successful",
    icon: CheckCircleFillIcon,
    color: "var(--fgColor-success)",
  },
  failure: {
    label: "Failing",
    icon: XCircleFillIcon,
    color: "var(--fgColor-danger)",
  },
  in_progress: {
    label: "In progress",
    icon: SyncIcon,
    color: "var(--fgColor-attention)",
  },
  cancelled: {
    label: "Cancelled",
    icon: CircleSlashIcon,
    color: "var(--fgColor-muted)",
  },
};

const EVENT_META: Record<RunEvent, { label: string; icon: React.ElementType }> = {
  push: { label: "push", icon: GitCommitIcon },
  pull_request: { label: "pull_request", icon: GitPullRequestIcon },
  schedule: { label: "schedule", icon: CalendarIcon },
};

const STATUS_FILTERS: { value: RunStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "success", label: "Successful" },
  { value: "failure", label: "Failing" },
  { value: "in_progress", label: "In progress" },
  { value: "cancelled", label: "Cancelled" },
];

const EVENT_FILTERS: { value: RunEvent | "all"; label: string }[] = [
  { value: "all", label: "All events" },
  { value: "push", label: "push" },
  { value: "pull_request", label: "pull_request" },
  { value: "schedule", label: "schedule" },
];

export default function ActionsPage() {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>("ci");
  const [workflowQuery, setWorkflowQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RunStatus | "all">("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [eventFilter, setEventFilter] = useState<RunEvent | "all">("all");

  const selectedWorkflow =
    WORKFLOWS.find((workflow) => workflow.id === selectedWorkflowId) ??
    WORKFLOWS[0];

  const visibleWorkflows = WORKFLOWS.filter((workflow) =>
    workflow.name.toLowerCase().includes(workflowQuery.trim().toLowerCase()),
  );

  const allRuns = RUNS[selectedWorkflow.id] ?? [];

  const branchOptions = useMemo(() => {
    const branches = new Set(allRuns.map((run) => run.branch));
    return ["all", ...Array.from(branches)];
  }, [allRuns]);

  const visibleRuns = allRuns.filter((run) => {
    if (statusFilter !== "all" && run.status !== statusFilter) return false;
    if (branchFilter !== "all" && run.branch !== branchFilter) return false;
    if (eventFilter !== "all" && run.event !== eventFilter) return false;
    return true;
  });

  const branchLabel =
    branchFilter === "all" ? "All branches" : branchFilter;
  const statusLabel =
    STATUS_FILTERS.find((filter) => filter.value === statusFilter)?.label ??
    "All statuses";
  const eventLabel =
    EVENT_FILTERS.find((filter) => filter.value === eventFilter)?.label ??
    "All events";

  return (
    <SplitPageLayout>
      <SplitPageLayout.Sidebar position="start" aria-label="Workflows">
        <Stack direction="vertical" gap="normal" padding="normal">
          <Stack direction="vertical" gap="condensed">
            <Heading as="h2" variant="small">
              Actions
            </Heading>
            <TextInput
              block
              type="search"
              value={workflowQuery}
              onChange={(event) => setWorkflowQuery(event.target.value)}
              leadingVisual={SearchIcon}
              placeholder="Filter workflows"
              aria-label="Filter workflows"
            />
          </Stack>

          <NavList aria-label="Workflows">
            <NavList.Item
              href="/actions/new"
              onClick={(event) => event.preventDefault()}
            >
              <NavList.LeadingVisual>
                <PlusIcon />
              </NavList.LeadingVisual>
              New workflow
            </NavList.Item>

            <NavList.Group title="Workflows">
              {visibleWorkflows.map((workflow) => (
                <NavList.Item
                  key={workflow.id}
                  href={`/actions?workflow=${workflow.id}`}
                  aria-current={
                    workflow.id === selectedWorkflow.id ? "page" : undefined
                  }
                  onClick={(event) => {
                    event.preventDefault();
                    setSelectedWorkflowId(workflow.id);
                    setStatusFilter("all");
                    setBranchFilter("all");
                    setEventFilter("all");
                  }}
                >
                  <NavList.LeadingVisual>
                    <WorkflowIcon />
                  </NavList.LeadingVisual>
                  {workflow.name}
                </NavList.Item>
              ))}
            </NavList.Group>
          </NavList>
        </Stack>
      </SplitPageLayout.Sidebar>

      <SplitPageLayout.Content width="xlarge">
        <Stack direction="vertical" gap="normal">
          <PageHeader role="banner" aria-label="Workflow runs">
            <PageHeader.TitleArea>
              <PageHeader.Title as="h1">{selectedWorkflow.name}</PageHeader.Title>
            </PageHeader.TitleArea>
            <PageHeader.Description>
              <Text size="small" weight="light">
                {selectedWorkflow.file}
              </Text>
            </PageHeader.Description>
            <PageHeader.Actions>
              <Button leadingVisual={PlayIcon}>Run workflow</Button>
            </PageHeader.Actions>
          </PageHeader>

          <Stack
            direction="horizontal"
            gap="condensed"
            align="center"
            wrap="wrap"
          >
            <ActionMenu>
              <ActionMenu.Button trailingVisual={ChevronDownIcon}>
                {statusLabel}
              </ActionMenu.Button>
              <ActionMenu.Overlay width="small">
                <ActionList selectionVariant="single">
                  {STATUS_FILTERS.map((filter) => (
                    <ActionList.Item
                      key={filter.value}
                      selected={statusFilter === filter.value}
                      onSelect={() => setStatusFilter(filter.value)}
                    >
                      {filter.label}
                    </ActionList.Item>
                  ))}
                </ActionList>
              </ActionMenu.Overlay>
            </ActionMenu>

            <ActionMenu>
              <ActionMenu.Button trailingVisual={ChevronDownIcon}>
                {branchLabel}
              </ActionMenu.Button>
              <ActionMenu.Overlay width="small">
                <ActionList selectionVariant="single">
                  {branchOptions.map((branch) => (
                    <ActionList.Item
                      key={branch}
                      selected={branchFilter === branch}
                      onSelect={() => setBranchFilter(branch)}
                    >
                      <ActionList.LeadingVisual>
                        <GitBranchIcon />
                      </ActionList.LeadingVisual>
                      {branch === "all" ? "All branches" : branch}
                    </ActionList.Item>
                  ))}
                </ActionList>
              </ActionMenu.Overlay>
            </ActionMenu>

            <ActionMenu>
              <ActionMenu.Button trailingVisual={ChevronDownIcon}>
                {eventLabel}
              </ActionMenu.Button>
              <ActionMenu.Overlay width="small">
                <ActionList selectionVariant="single">
                  {EVENT_FILTERS.map((filter) => (
                    <ActionList.Item
                      key={filter.value}
                      selected={eventFilter === filter.value}
                      onSelect={() => setEventFilter(filter.value)}
                    >
                      {filter.label}
                    </ActionList.Item>
                  ))}
                </ActionList>
              </ActionMenu.Overlay>
            </ActionMenu>
          </Stack>

          {allRuns.length === 0 ? (
            <Blankslate>
              <Blankslate.Visual>
                <WorkflowIcon size="medium" />
              </Blankslate.Visual>
              <Blankslate.Heading>
                This workflow has no runs yet
              </Blankslate.Heading>
              <Blankslate.Description>
                Once {selectedWorkflow.name} runs for the first time, its history
                will show up here. You can trigger it manually with Run workflow.
              </Blankslate.Description>
            </Blankslate>
          ) : visibleRuns.length === 0 ? (
            <Blankslate>
              <Blankslate.Visual>
                <SearchIcon size="medium" />
              </Blankslate.Visual>
              <Blankslate.Heading>No runs match these filters</Blankslate.Heading>
              <Blankslate.Description>
                Try clearing the status, branch, or event filters to see more
                runs.
              </Blankslate.Description>
            </Blankslate>
          ) : (
            <ActionList showDividers>
              {visibleRuns.map((run) => {
                const status = STATUS_META[run.status];
                const event = EVENT_META[run.event];
                const StatusIcon = status.icon;
                const EventIcon = event.icon;
                return (
                  <ActionList.Item key={run.id}>
                    <ActionList.LeadingVisual>
                      <span style={{ color: status.color }}>
                        <StatusIcon aria-label={status.label} />
                      </span>
                    </ActionList.LeadingVisual>

                    <Stack
                      direction="horizontal"
                      gap="condensed"
                      align="baseline"
                      wrap="wrap"
                    >
                      <Link href={`/actions/runs/${run.id}`}>
                        <Text weight="semibold">{run.title}</Text>
                      </Link>
                      <Text size="small" weight="light">
                        #{run.id}
                      </Text>
                    </Stack>

                    <ActionList.Description variant="block">
                      <Stack
                        direction="horizontal"
                        gap="condensed"
                        align="center"
                        wrap="wrap"
                      >
                        <Stack
                          direction="horizontal"
                          gap="condensed"
                          align="center"
                        >
                          <EventIcon size={14} />
                          <Text size="small" weight="light">
                            {event.label}
                          </Text>
                        </Stack>
                        <Stack
                          direction="horizontal"
                          gap="condensed"
                          align="center"
                        >
                          <GitBranchIcon size={14} />
                          <Text size="small" weight="light">
                            {run.branch}
                          </Text>
                        </Stack>
                        <Stack
                          direction="horizontal"
                          gap="condensed"
                          align="center"
                        >
                          <PersonIcon size={14} />
                          <Text size="small" weight="light">
                            {run.actor}
                          </Text>
                        </Stack>
                      </Stack>
                    </ActionList.Description>

                    <ActionList.TrailingVisual>
                      <Stack
                        direction="horizontal"
                        gap="normal"
                        align="center"
                      >
                        <Text size="small" weight="light">
                          <RelativeTime
                            date={new Date(run.startedAt)}
                            threshold="P30D"
                          />
                        </Text>
                        <Stack
                          direction="horizontal"
                          gap="condensed"
                          align="center"
                        >
                          <StopwatchIcon size={14} />
                          <Text size="small" weight="light">
                            {formatDuration(run.durationSeconds)}
                          </Text>
                        </Stack>
                      </Stack>
                    </ActionList.TrailingVisual>
                  </ActionList.Item>
                );
              })}
            </ActionList>
          )}
        </Stack>
      </SplitPageLayout.Content>
    </SplitPageLayout>
  );
}
