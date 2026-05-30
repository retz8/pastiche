"use client";

import { useState } from "react";
import {
  BranchName,
  Button,
  ConfirmationDialog,
  Heading,
  Link,
  PageHeader,
  RelativeTime,
  SplitPageLayout,
  Stack,
  Text,
  TreeView,
} from "@primer/react";
import {
  CalendarIcon,
  CheckCircleFillIcon,
  CircleSlashIcon,
  ClockIcon,
  DotFillIcon,
  FileZipIcon,
  GitBranchIcon,
  GitCommitIcon,
  GitPullRequestIcon,
  PersonIcon,
  StopIcon,
  StopwatchIcon,
  SyncIcon,
  WorkflowIcon,
  XCircleFillIcon,
} from "@primer/octicons-react";

type RunStatus = "success" | "failure" | "in_progress" | "cancelled";
type StepStatus = RunStatus | "skipped";
type RunEvent = "push" | "pull_request" | "schedule";

type Step = {
  name: string;
  status: StepStatus;
  durationSeconds: number;
  log: string;
  defaultExpanded?: boolean;
};

type Job = {
  id: string;
  name: string;
  status: RunStatus;
  durationSeconds: number;
  // Jobs that must finish before this one starts. Empty = starts immediately.
  needs: string[];
  steps: Step[];
};

const MINUTE = 1000 * 60;
const HOUR = MINUTE * 60;

function ago(ms: number): string {
  return new Date(Date.now() - ms).toISOString();
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

const STATUS_META: Record<
  StepStatus,
  { label: string; icon: React.ElementType; color: string }
> = {
  success: {
    label: "Successful",
    icon: CheckCircleFillIcon,
    color: "var(--fgColor-success)",
  },
  failure: {
    label: "Failed",
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
  skipped: {
    label: "Skipped",
    icon: DotFillIcon,
    color: "var(--fgColor-muted)",
  },
};

const EVENT_META: Record<RunEvent, { label: string; icon: React.ElementType }> = {
  push: { label: "push", icon: GitCommitIcon },
  pull_request: { label: "pull_request", icon: GitPullRequestIcon },
  schedule: { label: "schedule", icon: CalendarIcon },
};

const RUN = {
  id: 9001,
  title: "Add keyboard reordering to TreeView",
  workflowName: "CI",
  workflowFile: "ci.yml",
  status: "failure" as RunStatus,
  event: "pull_request" as RunEvent,
  branch: "feat/treeview-reorder",
  actor: "octocat",
  startedAt: ago(2 * HOUR),
  durationSeconds: 96,
  billableSeconds: 248,
  commit: {
    sha: "4d2f9ab",
    message: "Add keyboard reordering to TreeView",
  },
  artifacts: [
    { name: "playwright-report", sizeLabel: "4.2 MB" },
    { name: "coverage", sizeLabel: "812 KB" },
  ],
};

const JOBS: Job[] = [
  {
    id: "setup",
    name: "Set up build",
    status: "success",
    durationSeconds: 19,
    needs: [],
    steps: [
      {
        name: "Set up job",
        status: "success",
        durationSeconds: 2,
        log: `Current runner version: '2.317.0'
Operating System: Ubuntu 22.04.4 LTS
Runner Image: ubuntu-22.04
Runner Image Provisioner: 2.0.385.1`,
      },
      {
        name: "Checkout repository",
        status: "success",
        durationSeconds: 4,
        log: `Syncing repository: primer/react
Getting Git version info
git version 2.45.2
Fetching the repository
 * [new ref]   refs/pull/9001/merge -> refs/remotes/pull/9001/merge
HEAD is now at 4d2f9ab Add keyboard reordering to TreeView`,
      },
      {
        name: "Setup Node.js",
        status: "success",
        durationSeconds: 7,
        log: `Attempting to download 20...
Acquiring 20.15.0 from cache
Adding to the cache ...
node --version
v20.15.0`,
      },
      {
        name: "Install dependencies",
        status: "success",
        durationSeconds: 6,
        log: `npm ci
added 1842 packages in 5.8s
241 packages are looking for funding`,
      },
    ],
  },
  {
    id: "lint",
    name: "Lint",
    status: "success",
    durationSeconds: 24,
    needs: ["setup"],
    steps: [
      {
        name: "Set up job",
        status: "success",
        durationSeconds: 2,
        log: `Current runner version: '2.317.0'
Runner Image: ubuntu-22.04`,
      },
      {
        name: "Restore dependencies",
        status: "success",
        durationSeconds: 3,
        log: `Cache restored from key: node-modules-ubuntu-4d2f9ab`,
      },
      {
        name: "Run eslint",
        status: "success",
        durationSeconds: 14,
        log: `> primer/react@37.0.0 lint
> eslint src --max-warnings 0

✔ No problems found in 612 files.`,
      },
      {
        name: "Check formatting",
        status: "success",
        durationSeconds: 5,
        log: `> prettier --check "src/**/*.{ts,tsx}"
All matched files use Prettier code style!`,
      },
    ],
  },
  {
    id: "test",
    name: "Unit tests",
    status: "failure",
    durationSeconds: 53,
    needs: ["setup"],
    steps: [
      {
        name: "Set up job",
        status: "success",
        durationSeconds: 2,
        log: `Current runner version: '2.317.0'
Runner Image: ubuntu-22.04`,
      },
      {
        name: "Restore dependencies",
        status: "success",
        durationSeconds: 3,
        log: `Cache restored from key: node-modules-ubuntu-4d2f9ab`,
      },
      {
        name: "Build component library",
        status: "success",
        durationSeconds: 21,
        log: `> primer/react@37.0.0 build
> rollup -c
created dist in 19.4s`,
      },
      {
        name: "Run jest",
        status: "failure",
        durationSeconds: 27,
        defaultExpanded: true,
        log: `> primer/react@37.0.0 test
> jest TreeView

 FAIL  src/TreeView/TreeView.test.tsx
  ● TreeView › keyboard reordering › moves focused item up with Alt+ArrowUp

    expect(received).toEqual(expected) // deep equality

    - Expected  - 1
    + Received  + 1

      Array [
    -   "Item B",
        "Item A",
    +   "Item B",
        "Item C",
      ]

      at Object.<anonymous> (src/TreeView/TreeView.test.tsx:418:31)

Tests:       1 failed, 247 passed, 248 total
Test Suites: 1 failed, 1 total
Time:        24.118 s`,
      },
      {
        name: "Upload coverage",
        status: "skipped",
        durationSeconds: 0,
        log: `This step was skipped because a previous step failed.`,
      },
    ],
  },
  {
    id: "e2e",
    name: "End-to-end tests",
    status: "cancelled",
    durationSeconds: 0,
    needs: ["lint", "test"],
    steps: [
      {
        name: "Set up job",
        status: "cancelled",
        durationSeconds: 0,
        log: `The job was cancelled because "test" failed and "fail-fast" is enabled for this matrix.`,
      },
      {
        name: "Run playwright",
        status: "skipped",
        durationSeconds: 0,
        log: `This step was skipped because the job was cancelled.`,
      },
      {
        name: "Upload report",
        status: "skipped",
        durationSeconds: 0,
        log: `This step was skipped because the job was cancelled.`,
      },
      {
        name: "Complete job",
        status: "cancelled",
        durationSeconds: 0,
        log: `Cleaning up orphan processes`,
      },
    ],
  },
];

// Group jobs into stages by their position in the dependency graph. Jobs in
// the same stage run in parallel; later stages run after earlier ones.
function computeStages(jobs: Job[]): Job[][] {
  const byId = new Map(jobs.map((job) => [job.id, job]));
  const depth = new Map<string, number>();

  function resolveDepth(job: Job): number {
    const cached = depth.get(job.id);
    if (cached !== undefined) return cached;
    if (job.needs.length === 0) {
      depth.set(job.id, 0);
      return 0;
    }
    const value =
      1 +
      Math.max(
        ...job.needs.map((id) => {
          const dep = byId.get(id);
          return dep ? resolveDepth(dep) : 0;
        }),
      );
    depth.set(job.id, value);
    return value;
  }

  jobs.forEach(resolveDepth);

  const stages: Job[][] = [];
  jobs.forEach((job) => {
    const level = depth.get(job.id) ?? 0;
    (stages[level] ??= []).push(job);
  });
  return stages.filter(Boolean);
}

function StatusIcon({ status }: { status: StepStatus }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span style={{ color: meta.color, display: "inline-flex" }}>
      <Icon aria-label={meta.label} />
    </span>
  );
}

function MetadataRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Stack
      direction="horizontal"
      gap="condensed"
      align="center"
      justify="space-between"
    >
      <Text size="small" weight="light">
        {label}
      </Text>
      <Stack direction="horizontal" gap="condensed" align="center">
        {children}
      </Stack>
    </Stack>
  );
}

const SECTION_BORDER = {
  borderBottom: "var(--borderWidth-thin) solid var(--borderColor-muted)",
} as const;

const STAGE_CARD = {
  border: "var(--borderWidth-thin) solid var(--borderColor-default)",
  borderRadius: "var(--borderRadius-medium)",
} as const;

export default function WorkflowRunDetailPage() {
  const [cancelOpen, setCancelOpen] = useState(false);

  const stages = computeStages(JOBS);
  const status = STATUS_META[RUN.status];
  const event = EVENT_META[RUN.event];
  const EventIcon = event.icon;
  const inProgress = RUN.status === "in_progress";
  const hasFailures = JOBS.some((job) => job.status === "failure");

  return (
    <SplitPageLayout>
      <SplitPageLayout.Content width="xlarge">
        <Stack direction="vertical" gap="normal">
          <PageHeader role="banner" aria-label="Workflow run">
            <PageHeader.TitleArea>
              <PageHeader.Title as="h1">
                {RUN.title}{" "}
                <Text weight="light" style={{ color: "var(--fgColor-muted)" }}>
                  #{RUN.id}
                </Text>
              </PageHeader.Title>
            </PageHeader.TitleArea>
            <PageHeader.Description>
              <Stack
                direction="horizontal"
                gap="condensed"
                align="center"
                wrap="wrap"
              >
                <Stack direction="horizontal" gap="condensed" align="center">
                  <StatusIcon status={RUN.status} />
                  <Text
                    size="small"
                    weight="semibold"
                    style={{ color: status.color }}
                  >
                    {status.label}
                  </Text>
                </Stack>
                <Text size="small" weight="light">
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
                      <WorkflowIcon size={14} />
                      <Text size="small" weight="light">
                        {RUN.workflowName}
                      </Text>
                    </Stack>
                    <Stack
                      direction="horizontal"
                      gap="condensed"
                      align="center"
                    >
                      <PersonIcon size={14} />
                      <Text size="small" weight="light">
                        {RUN.actor}
                      </Text>
                    </Stack>
                    <Stack
                      direction="horizontal"
                      gap="condensed"
                      align="center"
                    >
                      <GitBranchIcon size={14} />
                      <BranchName>{RUN.branch}</BranchName>
                    </Stack>
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
                    <Text size="small" weight="light">
                      started{" "}
                      <RelativeTime
                        date={new Date(RUN.startedAt)}
                        threshold="P30D"
                      />
                    </Text>
                  </Stack>
                </Text>
              </Stack>
            </PageHeader.Description>
            <PageHeader.Actions>
              <Button
                variant="default"
                leadingVisual={SyncIcon}
                disabled={inProgress}
              >
                Re-run all jobs
              </Button>
              <Button
                variant="default"
                leadingVisual={SyncIcon}
                disabled={inProgress || !hasFailures}
              >
                Re-run failed jobs
              </Button>
              <Button
                variant="danger"
                leadingVisual={StopIcon}
                disabled={!inProgress}
                onClick={() => setCancelOpen(true)}
              >
                Cancel run
              </Button>
            </PageHeader.Actions>
          </PageHeader>

          {/* Jobs grouped into dependency stages. Jobs in one stage run in
              parallel; stages run top-to-bottom. */}
          <Stack direction="vertical" gap="normal">
            <Heading as="h2" variant="small">
              Jobs
            </Heading>

            {stages.map((stage, stageIndex) => (
              <Stack key={stageIndex} direction="vertical" gap="condensed">
                <Text size="small" weight="light">
                  {stage.length > 1
                    ? `Stage ${stageIndex + 1} · ${stage.length} jobs in parallel`
                    : `Stage ${stageIndex + 1}`}
                </Text>

                <div style={STAGE_CARD}>
                  <Stack
                    direction="vertical"
                    gap="none"
                    padding="condensed"
                  >
                    <TreeView aria-label={`Jobs in stage ${stageIndex + 1}`}>
                      {stage.map((job) => (
                        <TreeView.Item
                          key={job.id}
                          id={job.id}
                          defaultExpanded={job.status === "failure"}
                        >
                          <TreeView.LeadingVisual>
                            <StatusIcon status={job.status} />
                          </TreeView.LeadingVisual>
                          <Stack
                            direction="horizontal"
                            gap="condensed"
                            align="baseline"
                            justify="space-between"
                          >
                            <Text weight="semibold">{job.name}</Text>
                            <Stack
                              direction="horizontal"
                              gap="condensed"
                              align="center"
                            >
                              <StopwatchIcon size={14} />
                              <Text size="small" weight="light">
                                {formatDuration(job.durationSeconds)}
                              </Text>
                            </Stack>
                          </Stack>
                          <TreeView.SubTree>
                            {job.steps.map((step) => (
                              <TreeView.Item
                                key={step.name}
                                id={`${job.id}:${step.name}`}
                                defaultExpanded={Boolean(step.defaultExpanded)}
                              >
                                <TreeView.LeadingVisual>
                                  <StatusIcon status={step.status} />
                                </TreeView.LeadingVisual>
                                <Stack
                                  direction="horizontal"
                                  gap="condensed"
                                  align="center"
                                  justify="space-between"
                                >
                                  <Text size="small">{step.name}</Text>
                                  <Text size="small" weight="light">
                                    {formatDuration(step.durationSeconds)}
                                  </Text>
                                </Stack>
                                <TreeView.SubTree>
                                  <pre
                                    style={{
                                      margin: 0,
                                      padding: "var(--stack-padding-condensed)",
                                      fontFamily:
                                        "var(--fontStack-monospace)",
                                      fontSize: "var(--text-codeInline-size)",
                                      lineHeight: 1.6,
                                      color: "var(--fgColor-default)",
                                      backgroundColor: "var(--bgColor-muted)",
                                      borderRadius: "var(--borderRadius-medium)",
                                      whiteSpace: "pre-wrap",
                                      overflowX: "auto",
                                    }}
                                  >
                                    {step.log}
                                  </pre>
                                </TreeView.SubTree>
                              </TreeView.Item>
                            ))}
                          </TreeView.SubTree>
                        </TreeView.Item>
                      ))}
                    </TreeView>
                  </Stack>
                </div>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </SplitPageLayout.Content>

      <SplitPageLayout.Pane position="end" aria-label="Run summary">
        <Stack direction="vertical" gap="none">
          <Stack
            direction="vertical"
            gap="condensed"
            paddingBlock="normal"
            style={SECTION_BORDER}
          >
            <Heading as="h2" variant="small">
              Summary
            </Heading>
            <MetadataRow label="Total duration">
              <StopwatchIcon size={14} aria-hidden />
              <Text size="small">{formatDuration(RUN.durationSeconds)}</Text>
            </MetadataRow>
            <MetadataRow label="Billable time">
              <ClockIcon size={14} aria-hidden />
              <Text size="small">{formatDuration(RUN.billableSeconds)}</Text>
            </MetadataRow>
            <MetadataRow label="Triggered by">
              <PersonIcon size={14} aria-hidden />
              <Text size="small">{RUN.actor}</Text>
            </MetadataRow>
          </Stack>

          <Stack
            direction="vertical"
            gap="condensed"
            paddingBlock="normal"
            style={SECTION_BORDER}
          >
            <Heading as="h2" variant="small">
              Triggering commit
            </Heading>
            <Stack
              direction="horizontal"
              gap="condensed"
              align="baseline"
              wrap="wrap"
            >
              <GitCommitIcon size={14} aria-hidden />
              <Link
                href={`/commit/${RUN.commit.sha}`}
                muted
                onClick={(e) => e.preventDefault()}
                style={{ fontFamily: "var(--fontStack-monospace)" }}
              >
                <Text size="small">{RUN.commit.sha}</Text>
              </Link>
              <Text size="small">{RUN.commit.message}</Text>
            </Stack>
          </Stack>

          <Stack direction="vertical" gap="condensed" paddingBlock="normal">
            <Heading as="h2" variant="small">
              Artifacts
            </Heading>
            {RUN.artifacts.length > 0 ? (
              <Stack direction="vertical" gap="condensed">
                {RUN.artifacts.map((artifact) => (
                  <Stack
                    key={artifact.name}
                    direction="horizontal"
                    gap="condensed"
                    align="center"
                    justify="space-between"
                  >
                    <Stack
                      direction="horizontal"
                      gap="condensed"
                      align="center"
                    >
                      <FileZipIcon size={14} aria-hidden />
                      <Link
                        href={`/actions/runs/${RUN.id}/artifacts/${artifact.name}`}
                        muted
                        onClick={(e) => e.preventDefault()}
                      >
                        <Text size="small">{artifact.name}</Text>
                      </Link>
                    </Stack>
                    <Text size="small" weight="light">
                      {artifact.sizeLabel}
                    </Text>
                  </Stack>
                ))}
              </Stack>
            ) : (
              <Text size="small" weight="light">
                No artifacts produced
              </Text>
            )}
          </Stack>
        </Stack>
      </SplitPageLayout.Pane>

      {cancelOpen && (
        <ConfirmationDialog
          title="Cancel this workflow run?"
          confirmButtonContent="Cancel run"
          confirmButtonType="danger"
          cancelButtonContent="Keep running"
          onClose={() => setCancelOpen(false)}
        >
          In-progress jobs will be stopped and marked as cancelled. This cannot
          be undone.
        </ConfirmationDialog>
      )}
    </SplitPageLayout>
  );
}
