"use client";

import { useMemo, useState } from "react";
import {
  ActionList,
  ActionMenu,
  Button,
  Link,
  LinkButton,
  NavList,
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
  DotFillIcon,
  GitBranchIcon,
  GitCommitIcon,
  GitPullRequestIcon,
  PlayIcon,
  PlusIcon,
  RocketIcon,
  SearchIcon,
  SkipIcon,
  StopwatchIcon,
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
  ranAt: string;
  durationLabel: string;
};

const MINUTE = 1000 * 60;
const HOUR = MINUTE * 60;

function ago(ms: number): string {
  return new Date(Date.now() - ms).toISOString();
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
      id: 9241,
      title: "Fix focus ring clipping inside ActionList rows",
      status: "in_progress",
      event: "pull_request",
      branch: "fix/focus-ring",
      actor: "monalisa",
      ranAt: ago(3 * MINUTE),
      durationLabel: "1m 42s",
    },
    {
      id: 9238,
      title: "Merge pull request #4821 from primer/fix-focus-ring",
      status: "success",
      event: "push",
      branch: "main",
      actor: "hubot",
      ranAt: ago(38 * MINUTE),
      durationLabel: "4m 12s",
    },
    {
      id: 9235,
      title: "Add keyboard reordering to TreeView",
      status: "failure",
      event: "pull_request",
      branch: "feat/treeview-reorder",
      actor: "octocat",
      ranAt: ago(2 * HOUR),
      durationLabel: "3m 58s",
    },
    {
      id: 9230,
      title: "Nightly dependency audit",
      status: "success",
      event: "schedule",
      branch: "main",
      actor: "github-actions",
      ranAt: ago(9 * HOUR),
      durationLabel: "2m 03s",
    },
    {
      id: 9226,
      title: "Document SegmentedControl responsive variants",
      status: "cancelled",
      event: "pull_request",
      branch: "docs/segmented-control",
      actor: "broccolinisoup",
      ranAt: ago(14 * HOUR),
      durationLabel: "0m 21s",
    },
    {
      id: 9219,
      title: "Bump @primer/primitives to 10.4.0",
      status: "success",
      event: "push",
      branch: "deps/primitives-10.4.0",
      actor: "dependabot",
      ranAt: ago(26 * HOUR),
      durationLabel: "4m 47s",
    },
    {
      id: 9211,
      title: "Refactor RelativeTime SSR hydration",
      status: "failure",
      event: "push",
      branch: "fix/relative-time-ssr",
      actor: "siddharthkp",
      ranAt: ago(2 * 24 * HOUR),
      durationLabel: "3m 30s",
    },
    {
      id: 9203,
      title: "Migrate Button stories to CSS modules",
      status: "success",
      event: "pull_request",
      branch: "chore/button-css-modules",
      actor: "mperrotti",
      ranAt: ago(3 * 24 * HOUR),
      durationLabel: "5m 18s",
    },
    {
      id: 9198,
      title: "Weekly token snapshot",
      status: "success",
      event: "schedule",
      branch: "main",
      actor: "github-actions",
      ranAt: ago(4 * 24 * HOUR),
      durationLabel: "1m 55s",
    },
  ],
  deploy: [
    {
      id: 8804,
      title: "Deploy storybook to production",
      status: "success",
      event: "push",
      branch: "main",
      actor: "hubot",
      ranAt: ago(5 * HOUR),
      durationLabel: "6m 41s",
    },
    {
      id: 8799,
      title: "Roll back preview environment",
      status: "cancelled",
      event: "push",
      branch: "main",
      actor: "langermank",
      ranAt: ago(28 * HOUR),
      durationLabel: "0m 48s",
    },
    {
      id: 8790,
      title: "Deploy preview for #4815",
      status: "failure",
      event: "pull_request",
      branch: "feat/treeview-reorder",
      actor: "octocat",
      ranAt: ago(2 * 24 * HOUR),
      durationLabel: "7m 02s",
    },
  ],
  lint: [],
  release: [
    {
      id: 7321,
      title: "Publish v37.2.0 to npm",
      status: "success",
      event: "push",
      branch: "release/37.2.0",
      actor: "github-actions",
      ranAt: ago(6 * 24 * HOUR),
      durationLabel: "3m 12s",
    },
    {
      id: 7298,
      title: "Cut release candidate 37.2.0-rc.1",
      status: "in_progress",
      event: "schedule",
      branch: "main",
      actor: "github-actions",
      ranAt: ago(7 * MINUTE),
      durationLabel: "2m 09s",
    },
  ],
};

const STATUS_META: Record<
  RunStatus,
  { label: string; icon: React.ElementType; color: string }
> = {
  success: {
    label: "Success",
    icon: CheckCircleFillIcon,
    color: "var(--fgColor-success)",
  },
  failure: {
    label: "Failure",
    icon: XCircleFillIcon,
    color: "var(--fgColor-danger)",
  },
  in_progress: {
    label: "In progress",
    icon: DotFillIcon,
    color: "var(--fgColor-attention)",
  },
  cancelled: {
    label: "Cancelled",
    icon: SkipIcon,
    color: "var(--fgColor-muted)",
  },
};

const EVENT_META: Record<
  RunEvent,
  { label: string; icon: React.ElementType }
> = {
  push: { label: "push", icon: GitCommitIcon },
  pull_request: { label: "pull_request", icon: GitPullRequestIcon },
  schedule: { label: "schedule", icon: CalendarIcon },
};

const STATUS_FILTERS: { value: RunStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "success", label: "Success" },
  { value: "failure", label: "Failure" },
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
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>("ci");
  const [workflowQuery, setWorkflowQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RunStatus | "all">("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [eventFilter, setEventFilter] = useState<RunEvent | "all">("all");

  const visibleWorkflows = useMemo(
    () =>
      WORKFLOWS.filter((workflow) =>
        workflow.name.toLowerCase().includes(workflowQuery.trim().toLowerCase())
      ),
    [workflowQuery]
  );

  const runs = RUNS[selectedWorkflow] ?? [];

  const branchFilters = useMemo(() => {
    const branches = Array.from(new Set(runs.map((run) => run.branch)));
    return [{ value: "all", label: "All branches" }, ...branches.map((b) => ({ value: b, label: b }))];
  }, [runs]);

  const visibleRuns = useMemo(
    () =>
      runs.filter(
        (run) =>
          (statusFilter === "all" || run.status === statusFilter) &&
          (branchFilter === "all" || run.branch === branchFilter) &&
          (eventFilter === "all" || run.event === eventFilter)
      ),
    [runs, statusFilter, branchFilter, eventFilter]
  );

  const activeWorkflow = WORKFLOWS.find((w) => w.id === selectedWorkflow);
  const statusFilterLabel =
    STATUS_FILTERS.find((f) => f.value === statusFilter)?.label ?? "Status";
  const branchFilterLabel =
    branchFilter === "all" ? "Branch" : branchFilter;
  const eventFilterLabel =
    EVENT_FILTERS.find((f) => f.value === eventFilter)?.label ?? "Event";

  return (
    <SplitPageLayout>
      <SplitPageLayout.Sidebar position="start" aria-label="Workflows">
        <Stack direction="vertical" gap="normal">
          <Stack direction="horizontal" gap="condensed" align="baseline">
            <WorkflowIcon />
            <Text weight="semibold">Workflows</Text>
          </Stack>

          <TextInput
            block
            type="search"
            leadingVisual={SearchIcon}
            placeholder="Filter workflows"
            aria-label="Filter workflows"
            value={workflowQuery}
            onChange={(event) => setWorkflowQuery(event.target.value)}
          />

          <LinkButton
            href="/actions/new"
            variant="invisible"
            leadingVisual={PlusIcon}
            block
            alignContent="start"
          >
            New workflow
          </LinkButton>

          {visibleWorkflows.length === 0 ? (
            <Text size="small" weight="light">
              No workflows match &ldquo;{workflowQuery}&rdquo;.
            </Text>
          ) : (
            <NavList>
              {visibleWorkflows.map((workflow) => (
                <NavList.Item
                  key={workflow.id}
                  aria-current={
                    workflow.id === selectedWorkflow ? "page" : undefined
                  }
                  onClick={(event) => {
                    event.preventDefault();
                    setSelectedWorkflow(workflow.id);
                    setStatusFilter("all");
                    setBranchFilter("all");
                    setEventFilter("all");
                  }}
                  href={`/actions?workflow=${workflow.id}`}
                >
                  <NavList.LeadingVisual>
                    <WorkflowIcon />
                  </NavList.LeadingVisual>
                  {workflow.name}
                </NavList.Item>
              ))}
            </NavList>
          )}
        </Stack>
      </SplitPageLayout.Sidebar>

      <SplitPageLayout.Content>
        <Stack direction="vertical" gap="normal">
          <Stack
            direction="horizontal"
            gap="normal"
            align="center"
            justify="space-between"
            wrap="wrap"
          >
            <Stack direction="vertical" gap="none">
              <Stack direction="horizontal" gap="condensed" align="baseline">
                <RocketIcon />
                <Text size="large" weight="semibold">
                  {activeWorkflow?.name ?? "Workflow"}
                </Text>
              </Stack>
              <Text size="small" weight="light">
                {activeWorkflow?.file}
              </Text>
            </Stack>

            <Button variant="primary" leadingVisual={PlayIcon}>
              Run workflow
            </Button>
          </Stack>

          {runs.length > 0 && (
            <Stack direction="horizontal" gap="condensed" align="center" wrap="wrap">
              <ActionMenu>
                <ActionMenu.Button>
                  {statusFilterLabel}
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
                <ActionMenu.Button
                  leadingVisual={GitBranchIcon}
                >
                  {branchFilterLabel}
                </ActionMenu.Button>
                <ActionMenu.Overlay width="small">
                  <ActionList selectionVariant="single">
                    {branchFilters.map((filter) => (
                      <ActionList.Item
                        key={filter.value}
                        selected={branchFilter === filter.value}
                        onSelect={() => setBranchFilter(filter.value)}
                      >
                        {filter.label}
                      </ActionList.Item>
                    ))}
                  </ActionList>
                </ActionMenu.Overlay>
              </ActionMenu>

              <ActionMenu>
                <ActionMenu.Button>
                  {eventFilterLabel}
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
          )}

          {runs.length === 0 ? (
            <Blankslate>
              <Blankslate.Visual>
                <WorkflowIcon size={24} />
              </Blankslate.Visual>
              <Blankslate.Heading>
                This workflow has no runs yet
              </Blankslate.Heading>
              <Blankslate.Description>
                Once {activeWorkflow?.name} runs for the first time, its history
                will appear here. You can also trigger it manually.
              </Blankslate.Description>
              <Blankslate.PrimaryAction href="/actions">
                Run workflow
              </Blankslate.PrimaryAction>
            </Blankslate>
          ) : visibleRuns.length === 0 ? (
            <Blankslate>
              <Blankslate.Heading>No matching runs</Blankslate.Heading>
              <Blankslate.Description>
                No runs match the current status, branch, and event filters.
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
                        <StatusIcon />
                      </span>
                    </ActionList.LeadingVisual>

                    <Link href={`/actions/runs/${run.id}`}>
                      <Text weight="semibold">{run.title}</Text>
                    </Link>

                    <ActionList.Description variant="block">
                      <Stack
                        direction="horizontal"
                        gap="condensed"
                        align="center"
                        wrap="wrap"
                      >
                        <Stack direction="horizontal" gap="condensed" align="baseline">
                          <EventIcon />
                          <Text size="small" weight="light">
                            {event.label}
                          </Text>
                        </Stack>
                        <Stack direction="horizontal" gap="condensed" align="baseline">
                          <GitBranchIcon />
                          <Text size="small" weight="light">
                            {run.branch}
                          </Text>
                        </Stack>
                        <Text size="small" weight="light">
                          {status.label} &middot; #{run.id} &middot; {run.actor}
                        </Text>
                      </Stack>
                    </ActionList.Description>

                    <ActionList.TrailingVisual>
                      <Stack
                        direction="horizontal"
                        gap="condensed"
                        align="baseline"
                      >
                        <Text size="small" weight="light">
                          <RelativeTime
                            date={new Date(run.ranAt)}
                            threshold="P30D"
                          />
                        </Text>
                        <Stack
                          direction="horizontal"
                          gap="condensed"
                          align="baseline"
                        >
                          <StopwatchIcon />
                          <Text size="small" weight="light">
                            {run.durationLabel}
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
