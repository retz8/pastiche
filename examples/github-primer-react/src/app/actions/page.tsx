"use client";

import { useState } from "react";
import {
  ActionList,
  ActionMenu,
  Button,
  Label,
  Link,
  NavList,
  PageLayout,
  Stack,
  Text,
  TextInput,
  RelativeTime,
} from "@primer/react";
import { Blankslate } from "@primer/react/experimental";
import {
  CheckCircleFillIcon,
  XCircleFillIcon,
  DotFillIcon,
  SkipIcon,
  SearchIcon,
  PlayIcon,
  WorkflowIcon,
} from "@primer/octicons-react";

// ---------- Types ----------

type RunStatus = "success" | "failure" | "in_progress" | "cancelled";
type TriggerEvent = "push" | "pull_request" | "schedule";

interface WorkflowRun {
  id: number;
  title: string;
  status: RunStatus;
  event: TriggerEvent;
  branch: string;
  actor: string;
  createdAt: string;
  duration: string;
}

interface Workflow {
  id: string;
  name: string;
  runs: WorkflowRun[];
}

// ---------- Mock data ----------

const WORKFLOWS: Workflow[] = [
  {
    id: "ci",
    name: "CI",
    runs: [
      {
        id: 1,
        title: "fix: resolve flaky test in auth module",
        status: "success",
        event: "push",
        branch: "main",
        actor: "octocat",
        createdAt: "2025-05-25T08:30:00Z",
        duration: "3m 42s",
      },
      {
        id: 247,
        title: "feat: add user profile API endpoint",
        status: "failure",
        event: "pull_request",
        branch: "feature/user-profile",
        actor: "monalisa",
        createdAt: "2025-05-25T07:15:00Z",
        duration: "2m 18s",
      },
      {
        id: 3,
        title: "chore: update ESLint configuration",
        status: "success",
        event: "push",
        branch: "main",
        actor: "hubot",
        createdAt: "2025-05-24T22:00:00Z",
        duration: "4m 05s",
      },
      {
        id: 4,
        title: "fix: correct date parsing in timeline component",
        status: "in_progress",
        event: "pull_request",
        branch: "fix/date-parsing",
        actor: "octocat",
        createdAt: "2025-05-24T20:45:00Z",
        duration: "1m 30s",
      },
      {
        id: 5,
        title: "feat: implement notification preferences",
        status: "success",
        event: "push",
        branch: "main",
        actor: "monalisa",
        createdAt: "2025-05-24T16:30:00Z",
        duration: "3m 55s",
      },
      {
        id: 6,
        title: "Scheduled CI run",
        status: "success",
        event: "schedule",
        branch: "main",
        actor: "github-actions",
        createdAt: "2025-05-24T06:00:00Z",
        duration: "4m 12s",
      },
      {
        id: 7,
        title: "refactor: extract shared validation utils",
        status: "cancelled",
        event: "pull_request",
        branch: "refactor/validation",
        actor: "hubot",
        createdAt: "2025-05-23T14:20:00Z",
        duration: "0m 45s",
      },
      {
        id: 8,
        title: "fix: handle empty state in dashboard widget",
        status: "failure",
        event: "push",
        branch: "fix/dashboard-empty",
        actor: "octocat",
        createdAt: "2025-05-23T11:00:00Z",
        duration: "2m 33s",
      },
      {
        id: 9,
        title: "docs: update contributing guidelines",
        status: "success",
        event: "push",
        branch: "main",
        actor: "monalisa",
        createdAt: "2025-05-22T18:45:00Z",
        duration: "3m 10s",
      },
      {
        id: 10,
        title: "feat: add dark mode toggle to settings",
        status: "success",
        event: "pull_request",
        branch: "feature/dark-mode",
        actor: "hubot",
        createdAt: "2025-05-22T09:30:00Z",
        duration: "3m 28s",
      },
    ],
  },
  {
    id: "deploy",
    name: "Deploy",
    runs: [
      {
        id: 11,
        title: "Deploy to production",
        status: "success",
        event: "push",
        branch: "main",
        actor: "octocat",
        createdAt: "2025-05-25T09:00:00Z",
        duration: "5m 22s",
      },
      {
        id: 12,
        title: "Deploy to staging",
        status: "in_progress",
        event: "push",
        branch: "staging",
        actor: "monalisa",
        createdAt: "2025-05-24T15:30:00Z",
        duration: "2m 10s",
      },
    ],
  },
  {
    id: "lint",
    name: "Lint",
    runs: [],
  },
  {
    id: "release",
    name: "Release",
    runs: [
      {
        id: 13,
        title: "Release v2.4.0",
        status: "success",
        event: "push",
        branch: "main",
        actor: "octocat",
        createdAt: "2025-05-23T10:00:00Z",
        duration: "6m 45s",
      },
    ],
  },
];

// ---------- Helpers ----------

function statusIcon(status: RunStatus) {
  switch (status) {
    case "success":
      return <CheckCircleFillIcon size={16} fill="var(--fgColor-success)" />;
    case "failure":
      return <XCircleFillIcon size={16} fill="var(--fgColor-danger)" />;
    case "in_progress":
      return <DotFillIcon size={16} fill="var(--fgColor-attention)" />;
    case "cancelled":
      return <SkipIcon size={16} fill="var(--fgColor-muted)" />;
  }
}

function statusLabel(status: RunStatus): {
  text: string;
  variant: "success" | "danger" | "attention" | "secondary";
} {
  switch (status) {
    case "success":
      return { text: "Success", variant: "success" };
    case "failure":
      return { text: "Failure", variant: "danger" };
    case "in_progress":
      return { text: "In progress", variant: "attention" };
    case "cancelled":
      return { text: "Cancelled", variant: "secondary" };
  }
}

function eventLabel(event: TriggerEvent): string {
  switch (event) {
    case "push":
      return "push";
    case "pull_request":
      return "pull_request";
    case "schedule":
      return "schedule";
  }
}

// ---------- Component ----------

export default function ActionsPage() {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState("ci");
  const [workflowSearch, setWorkflowSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RunStatus | "all">("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [eventFilter, setEventFilter] = useState<TriggerEvent | "all">("all");

  const selectedWorkflow = WORKFLOWS.find((w) => w.id === selectedWorkflowId)!;

  const filteredWorkflows = WORKFLOWS.filter((w) =>
    w.name.toLowerCase().includes(workflowSearch.toLowerCase())
  );

  // Collect unique branches and events from the selected workflow's runs
  const branches = Array.from(new Set(selectedWorkflow.runs.map((r) => r.branch)));

  const filteredRuns = selectedWorkflow.runs.filter((run) => {
    if (statusFilter !== "all" && run.status !== statusFilter) return false;
    if (branchFilter !== "all" && run.branch !== branchFilter) return false;
    if (eventFilter !== "all" && run.event !== eventFilter) return false;
    return true;
  });

  return (
    <PageLayout>
      {/* ---- Sidebar ---- */}
      <PageLayout.Sidebar>
      <Stack gap="condensed">
        <TextInput
          aria-label="Filter workflows"
          placeholder="Filter workflows"
          leadingVisual={SearchIcon}
          value={workflowSearch}
          onChange={(e) => setWorkflowSearch(e.target.value)}
          size="small"
        />
        <NavList aria-label="Workflows">
          {filteredWorkflows.map((workflow) => (
            <NavList.Item
              key={workflow.id}
              aria-current={workflow.id === selectedWorkflowId ? "page" : undefined}
              onClick={(e) => {
                e.preventDefault();
                setSelectedWorkflowId(workflow.id);
                setStatusFilter("all");
                setBranchFilter("all");
                setEventFilter("all");
              }}
              href="#"
            >
              <NavList.LeadingVisual>
                <WorkflowIcon size={16} />
              </NavList.LeadingVisual>
              {workflow.name}
            </NavList.Item>
          ))}
        </NavList>
        <Link href="#" muted style={{ fontSize: "var(--text-body-size-small)" }}>
          New workflow
        </Link>
      </Stack>
      </PageLayout.Sidebar>

      {/* ---- Main content ---- */}
      <PageLayout.Content>
      <Stack gap="normal">
        {/* Filter bar */}
        <Stack direction="horizontal" gap="condensed" align="center" wrap="wrap">
          <ActionMenu>
            <ActionMenu.Button>
              <Text>Status: {statusFilter === "all" ? "All" : statusLabel(statusFilter).text}</Text>
            </ActionMenu.Button>
            <ActionMenu.Overlay>
              <ActionList selectionVariant="single">
                <ActionList.Item
                  selected={statusFilter === "all"}
                  onSelect={() => setStatusFilter("all")}
                >
                  All
                </ActionList.Item>
                <ActionList.Item
                  selected={statusFilter === "success"}
                  onSelect={() => setStatusFilter("success")}
                >
                  Success
                </ActionList.Item>
                <ActionList.Item
                  selected={statusFilter === "failure"}
                  onSelect={() => setStatusFilter("failure")}
                >
                  Failure
                </ActionList.Item>
                <ActionList.Item
                  selected={statusFilter === "in_progress"}
                  onSelect={() => setStatusFilter("in_progress")}
                >
                  In progress
                </ActionList.Item>
                <ActionList.Item
                  selected={statusFilter === "cancelled"}
                  onSelect={() => setStatusFilter("cancelled")}
                >
                  Cancelled
                </ActionList.Item>
              </ActionList>
            </ActionMenu.Overlay>
          </ActionMenu>

          <ActionMenu>
            <ActionMenu.Button>
              <Text>Branch: {branchFilter === "all" ? "All" : branchFilter}</Text>
            </ActionMenu.Button>
            <ActionMenu.Overlay>
              <ActionList selectionVariant="single">
                <ActionList.Item
                  selected={branchFilter === "all"}
                  onSelect={() => setBranchFilter("all")}
                >
                  All
                </ActionList.Item>
                {branches.map((branch) => (
                  <ActionList.Item
                    key={branch}
                    selected={branchFilter === branch}
                    onSelect={() => setBranchFilter(branch)}
                  >
                    {branch}
                  </ActionList.Item>
                ))}
              </ActionList>
            </ActionMenu.Overlay>
          </ActionMenu>

          <ActionMenu>
            <ActionMenu.Button>
              <Text>Event: {eventFilter === "all" ? "All" : eventLabel(eventFilter)}</Text>
            </ActionMenu.Button>
            <ActionMenu.Overlay>
              <ActionList selectionVariant="single">
                <ActionList.Item
                  selected={eventFilter === "all"}
                  onSelect={() => setEventFilter("all")}
                >
                  All
                </ActionList.Item>
                <ActionList.Item
                  selected={eventFilter === "push"}
                  onSelect={() => setEventFilter("push")}
                >
                  push
                </ActionList.Item>
                <ActionList.Item
                  selected={eventFilter === "pull_request"}
                  onSelect={() => setEventFilter("pull_request")}
                >
                  pull_request
                </ActionList.Item>
                <ActionList.Item
                  selected={eventFilter === "schedule"}
                  onSelect={() => setEventFilter("schedule")}
                >
                  schedule
                </ActionList.Item>
              </ActionList>
            </ActionMenu.Overlay>
          </ActionMenu>

          <Stack.Item grow>
            <Stack direction="horizontal" justify="end">
              <Button variant="primary" leadingVisual={PlayIcon}>
                Run workflow
              </Button>
            </Stack>
          </Stack.Item>
        </Stack>

        {/* Run list */}
        {filteredRuns.length === 0 ? (
          <Blankslate>
            <Blankslate.Visual>
              <WorkflowIcon size={24} />
            </Blankslate.Visual>
            <Blankslate.Heading>
              {selectedWorkflow.runs.length === 0
                ? `${selectedWorkflow.name} has no runs yet`
                : "No runs match your filters"}
            </Blankslate.Heading>
            <Blankslate.Description>
              {selectedWorkflow.runs.length === 0
                ? "This workflow has not been triggered. Use the \"Run workflow\" button to start a run manually."
                : "Try adjusting your filter criteria to see more results."}
            </Blankslate.Description>
          </Blankslate>
        ) : (
          <ActionList showDividers>
            {filteredRuns.map((run) => {
              const sl = statusLabel(run.status);
              return (
                <ActionList.LinkItem key={run.id} href={`/actions/runs/${run.id}`}>
                  <ActionList.LeadingVisual>
                    {statusIcon(run.status)}
                  </ActionList.LeadingVisual>
                  <Stack gap="none">
                    <Stack direction="horizontal" align="center" gap="condensed">
                      <Text weight="semibold">{run.title}</Text>
                      <Label variant={sl.variant} size="small">
                        {sl.text}
                      </Label>
                    </Stack>
                    <Text size="small" weight="light">
                      {eventLabel(run.event)} on{" "}
                      <Text size="small" weight="medium">
                        {run.branch}
                      </Text>{" "}
                      by {run.actor}
                    </Text>
                  </Stack>
                  <ActionList.TrailingVisual>
                    <Stack direction="horizontal" align="center" gap="condensed">
                      <Text size="small" weight="light">
                        {run.duration}
                      </Text>
                      <Text size="small" weight="light">
                        <RelativeTime datetime={run.createdAt} threshold="P30D" />
                      </Text>
                    </Stack>
                  </ActionList.TrailingVisual>
                </ActionList.LinkItem>
              );
            })}
          </ActionList>
        )}
      </Stack>
      </PageLayout.Content>
    </PageLayout>
  );
}
