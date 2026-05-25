"use client";

import { useState } from "react";
import {
  ActionList,
  ActionMenu,
  Button,
  Label,
  Link,
  Stack,
  SplitPageLayout,
  Text,
  Heading,
  RelativeTime,
  IconButton,
  Breadcrumbs,
  Timeline,
} from "@primer/react";
import {
  CheckCircleFillIcon,
  XCircleFillIcon,
  DotFillIcon,
  SkipIcon,
  SyncIcon,
  XIcon,
  StopwatchIcon,
  GitBranchIcon,
  GitCommitIcon,
  PersonIcon,
  CalendarIcon,
  ZapIcon,
  PackageIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CopyIcon,
  DownloadIcon,
} from "@primer/octicons-react";

// ---------- Types ----------

type RunStatus = "success" | "failure" | "in_progress" | "cancelled";
type StepStatus = "success" | "failure" | "in_progress" | "skipped";

interface Step {
  name: string;
  status: StepStatus;
  duration: string;
  log: string;
  defaultExpanded?: boolean;
}

interface Job {
  id: string;
  name: string;
  status: RunStatus;
  duration: string;
  dependsOn?: string[];
  steps: Step[];
}

interface RunDetail {
  id: number;
  title: string;
  workflowName: string;
  status: RunStatus;
  actor: string;
  branch: string;
  event: string;
  commitSha: string;
  commitMessage: string;
  startedAt: string;
  totalDuration: string;
  billableTime: string;
  jobs: Job[];
  artifacts: { name: string; size: string }[];
}

// ---------- Mock data ----------

const MOCK_RUN: RunDetail = {
  id: 247,
  title: "feat: add user profile API endpoint",
  workflowName: "CI",
  status: "failure",
  actor: "monalisa",
  branch: "feature/user-profile",
  event: "pull_request",
  commitSha: "a3f8c2d",
  commitMessage: "feat: add user profile API endpoint",
  startedAt: "2025-05-25T07:15:00Z",
  totalDuration: "8m 42s",
  billableTime: "12m",
  jobs: [
    {
      id: "lint",
      name: "Lint",
      status: "success",
      duration: "1m 12s",
      steps: [
        {
          name: "Set up job",
          status: "success",
          duration: "2s",
          log: `Current runner version: '2.319.1'
Operating System
  Ubuntu
  22.04.5
  LTS
Runner Image
  Image: ubuntu-22.04
  Version: 20250519.1.0
  Included Software: https://github.com/actions/runner-images/blob/ubuntu22/20250519.1/images/ubuntu/Ubuntu2204-Readme.md
Runner Image Provision Source: github
GITHUB_TOKEN Permissions
  Contents: read
  Metadata: read
  Packages: read`,
        },
        {
          name: "Checkout repository",
          status: "success",
          duration: "3s",
          log: `Syncing repository: octocat/hello-world
Getting Git version info
Temporarily overriding HOME='/home/runner/work/_temp/a1b2c3' before making global git config changes
Adding repository directory to the temporary git global config as a safe directory
/usr/bin/git config --global --add safe.directory /home/runner/work/hello-world/hello-world
Deleting the contents of '/home/runner/work/hello-world/hello-world'
Initializing the repository
/usr/bin/git init /home/runner/work/hello-world/hello-world
/usr/bin/git remote add origin https://github.com/octocat/hello-world
/usr/bin/git fetch --no-tags --prune --no-recurse-submodules --depth=1 origin +refs/heads/feature/user-profile:refs/remotes/origin/feature/user-profile
/usr/bin/git checkout --progress --force -B feature/user-profile refs/remotes/origin/feature/user-profile`,
        },
        {
          name: "Setup Node.js 20.x",
          status: "success",
          duration: "8s",
          log: `Attempting to download 20.18.0...
Acquiring 20.18.0 - x64 from https://github.com/actions/node-versions/releases/download/20.18.0-11415330388/node-20.18.0-linux-x64.tar.gz
Extracting ...
/usr/bin/tar xz --strip-components=1 -C /home/runner/work/_temp/a8e39f12-node -f /home/runner/work/_temp/2a4f9d20-6c0e.tar.gz
Adding to the path
Environment details
  node: v20.18.0
  npm: 10.8.2
  yarn: 1.22.22`,
        },
        {
          name: "Install dependencies",
          status: "success",
          duration: "32s",
          log: `npm ci
added 1247 packages in 28s
127 packages are looking for funding
  run \`npm fund\` for details`,
        },
        {
          name: "Run ESLint",
          status: "success",
          duration: "18s",
          log: `> hello-world@1.0.0 lint
> eslint . --ext .ts,.tsx

✨ No lint errors found.`,
        },
        {
          name: "Post Checkout repository",
          status: "success",
          duration: "0s",
          log: `Post job cleanup.
/usr/bin/git version
git version 2.43.2
Temporarily overriding HOME
/usr/bin/git config --local --name-only --get-regexp http\\.https\\:\\/\\/github\\.com\\/\\.extraheader
/usr/bin/git config --local --unset-all http.https://github.com/.extraheader`,
        },
      ],
    },
    {
      id: "test",
      name: "Test",
      status: "failure",
      duration: "4m 05s",
      dependsOn: ["lint"],
      steps: [
        {
          name: "Set up job",
          status: "success",
          duration: "2s",
          log: `Current runner version: '2.319.1'
Operating System
  Ubuntu
  22.04.5
  LTS
Runner Image
  Image: ubuntu-22.04
  Version: 20250519.1.0`,
        },
        {
          name: "Checkout repository",
          status: "success",
          duration: "2s",
          log: `Syncing repository: octocat/hello-world
/usr/bin/git init /home/runner/work/hello-world/hello-world
/usr/bin/git remote add origin https://github.com/octocat/hello-world
/usr/bin/git fetch --no-tags --prune --no-recurse-submodules --depth=1 origin +refs/heads/feature/user-profile
/usr/bin/git checkout --progress --force -B feature/user-profile refs/remotes/origin/feature/user-profile`,
        },
        {
          name: "Setup Node.js 20.x",
          status: "success",
          duration: "6s",
          log: `Attempting to download 20.18.0...
Extracting ...
Adding to the path
Environment details
  node: v20.18.0
  npm: 10.8.2`,
        },
        {
          name: "Install dependencies",
          status: "success",
          duration: "30s",
          log: `npm ci
added 1247 packages in 26s`,
        },
        {
          name: "Run tests",
          status: "failure",
          duration: "3m 18s",
          defaultExpanded: true,
          log: `> hello-world@1.0.0 test
> jest --coverage

PASS src/utils/validation.test.ts (4.2s)
PASS src/components/Header.test.tsx (2.1s)
FAIL src/api/profile.test.ts (8.3s)
  ● UserProfile API › GET /api/profile/:id › should return user profile

    expect(received).toEqual(expected)

    Expected: {"avatar": "https://avatars.example.com/u/1", "bio": "Hello!", "email": "octocat@github.com", "id": 1, "name": "Octocat"}
    Received: undefined

      at Object.<anonymous> (src/api/profile.test.ts:42:28)

  ● UserProfile API › GET /api/profile/:id › should return 404 for non-existent user

    expect(received).toBe(expected)

    Expected: 404
    Received: 500

      at Object.<anonymous> (src/api/profile.test.ts:58:31)

FAIL src/api/profile-validation.test.ts (3.1s)
  ● Profile Validation › should reject invalid email format

    TypeError: Cannot read properties of undefined (reading 'validate')

      at Object.<anonymous> (src/api/profile-validation.test.ts:15:22)

Tests:       3 failed, 14 passed, 17 total
Snapshots:   0 total
Time:        22.4s
Ran all test suites.

##[error]Process completed with exit code 1.`,
        },
        {
          name: "Post Checkout repository",
          status: "skipped",
          duration: "0s",
          log: `Skipped — previous step failed.`,
        },
      ],
    },
    {
      id: "build",
      name: "Build",
      status: "cancelled",
      duration: "0s",
      dependsOn: ["test"],
      steps: [
        {
          name: "Set up job",
          status: "skipped",
          duration: "0s",
          log: `Skipped — dependency "test" failed.`,
        },
        {
          name: "Checkout repository",
          status: "skipped",
          duration: "0s",
          log: `Skipped — dependency "test" failed.`,
        },
        {
          name: "Setup Node.js 20.x",
          status: "skipped",
          duration: "0s",
          log: `Skipped — dependency "test" failed.`,
        },
        {
          name: "Install dependencies",
          status: "skipped",
          duration: "0s",
          log: `Skipped — dependency "test" failed.`,
        },
        {
          name: "Build project",
          status: "skipped",
          duration: "0s",
          log: `Skipped — dependency "test" failed.`,
        },
      ],
    },
    {
      id: "typecheck",
      name: "Type Check",
      status: "success",
      duration: "2m 03s",
      steps: [
        {
          name: "Set up job",
          status: "success",
          duration: "2s",
          log: `Current runner version: '2.319.1'
Operating System
  Ubuntu
  22.04.5
  LTS`,
        },
        {
          name: "Checkout repository",
          status: "success",
          duration: "2s",
          log: `Syncing repository: octocat/hello-world
/usr/bin/git checkout --progress --force -B feature/user-profile refs/remotes/origin/feature/user-profile`,
        },
        {
          name: "Setup Node.js 20.x",
          status: "success",
          duration: "5s",
          log: `Attempting to download 20.18.0...
Adding to the path
Environment details
  node: v20.18.0`,
        },
        {
          name: "Install dependencies",
          status: "success",
          duration: "28s",
          log: `npm ci
added 1247 packages in 25s`,
        },
        {
          name: "Run tsc --noEmit",
          status: "success",
          duration: "1m 22s",
          log: `> hello-world@1.0.0 typecheck
> tsc --noEmit

Done in 82s.`,
        },
        {
          name: "Post Checkout repository",
          status: "success",
          duration: "0s",
          log: `Post job cleanup.`,
        },
      ],
    },
  ],
  artifacts: [
    { name: "coverage-report", size: "2.4 MB" },
    { name: "lint-results", size: "48 KB" },
  ],
};

// ---------- Helpers ----------

function statusIcon(status: RunStatus | StepStatus, size = 16) {
  switch (status) {
    case "success":
      return <CheckCircleFillIcon size={size} fill="var(--fgColor-success)" />;
    case "failure":
      return <XCircleFillIcon size={size} fill="var(--fgColor-danger)" />;
    case "in_progress":
      return <DotFillIcon size={size} fill="var(--fgColor-attention)" />;
    case "cancelled":
    case "skipped":
      return <SkipIcon size={size} fill="var(--fgColor-muted)" />;
  }
}

function statusLabelProps(status: RunStatus): {
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

// ---------- Sub-components ----------

function StepRow({ step }: { step: Step }) {
  const [expanded, setExpanded] = useState(step.defaultExpanded ?? false);

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded(!expanded);
          }
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--stack-gap-condensed)",
          padding: "var(--stack-padding-condensed) 0",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        {expanded ? (
          <ChevronDownIcon size={16} fill="var(--fgColor-muted)" />
        ) : (
          <ChevronRightIcon size={16} fill="var(--fgColor-muted)" />
        )}
        {statusIcon(step.status)}
        <Text size="small" weight="medium" style={{ flex: 1 }}>
          {step.name}
        </Text>
        <Text size="small" weight="light" style={{ color: "var(--fgColor-muted)" }}>
          {step.duration}
        </Text>
      </div>
      {expanded && (
        <pre
          style={{
            margin: 0,
            marginLeft: 32,
            padding: "var(--stack-padding-condensed)",
            backgroundColor: "var(--bgColor-inset)",
            border: "1px solid var(--borderColor-default)",
            borderRadius: "var(--borderRadius-medium)",
            fontSize: "var(--text-body-size-small)",
            lineHeight: 1.6,
            overflowX: "auto",
            color: "var(--fgColor-default)",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {step.log}
        </pre>
      )}
    </div>
  );
}

function JobCard({ job }: { job: Job }) {
  const [expanded, setExpanded] = useState(
    job.status === "failure" || job.status === "in_progress"
  );
  const sl = statusLabelProps(job.status);

  return (
    <div
      style={{
        border: "1px solid var(--borderColor-default)",
        borderRadius: "var(--borderRadius-medium)",
        overflow: "hidden",
      }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded(!expanded);
          }
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--stack-gap-condensed)",
          padding: "var(--stack-padding-condensed) var(--stack-padding-normal)",
          backgroundColor: "var(--bgColor-muted)",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        {expanded ? (
          <ChevronDownIcon size={16} />
        ) : (
          <ChevronRightIcon size={16} />
        )}
        {statusIcon(job.status)}
        <Text weight="semibold" style={{ flex: 1 }}>
          {job.name}
        </Text>
        <Label variant={sl.variant} size="small">
          {sl.text}
        </Label>
        <Text size="small" weight="light" style={{ color: "var(--fgColor-muted)" }}>
          {job.duration}
        </Text>
      </div>
      {expanded && (
        <div style={{ padding: "var(--stack-padding-condensed) var(--stack-padding-normal) var(--stack-padding-normal)" }}>
          {job.steps.map((step, i) => (
            <StepRow key={i} step={step} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Page ----------

export default function WorkflowRunDetailPage() {
  const run = MOCK_RUN;
  const sl = statusLabelProps(run.status);

  // Group jobs by dependency layers for visual ordering
  const independentJobs = run.jobs.filter((j) => !j.dependsOn || j.dependsOn.length === 0);
  const dependentJobs = run.jobs.filter((j) => j.dependsOn && j.dependsOn.length > 0);

  return (
    <SplitPageLayout>
      <SplitPageLayout.Content>
        <Stack gap="normal">
          {/* Breadcrumbs */}
          <Breadcrumbs>
            <Breadcrumbs.Item href="/actions">Actions</Breadcrumbs.Item>
            <Breadcrumbs.Item href="/actions">
              {run.workflowName}
            </Breadcrumbs.Item>
            <Breadcrumbs.Item href={`/actions/runs/${run.id}`} selected>
              Run #{run.id}
            </Breadcrumbs.Item>
          </Breadcrumbs>

          {/* Page header */}
          <Stack gap="condensed">
            <Stack direction="horizontal" align="center" gap="condensed" wrap="wrap">
              {statusIcon(run.status, 24)}
              <Heading as="h1" variant="large">
                {run.title}
              </Heading>
            </Stack>

            <Stack direction="horizontal" align="center" gap="condensed" wrap="wrap">
              <Label variant={sl.variant}>{sl.text}</Label>
              <Text size="small" weight="light" style={{ color: "var(--fgColor-muted)" }}>
                {run.workflowName}
              </Text>
              <Text size="small" weight="light" style={{ color: "var(--fgColor-muted)" }}>
                triggered by
              </Text>
              <Text size="small" weight="medium">
                {run.actor}
              </Text>
              <Text size="small" weight="light" style={{ color: "var(--fgColor-muted)" }}>
                via {run.event}
              </Text>
              <Text size="small" weight="light" style={{ color: "var(--fgColor-muted)" }}>
                on
              </Text>
              <Label variant="secondary" size="small">
                <GitBranchIcon size={12} /> {run.branch}
              </Label>
              <Text size="small" weight="light" style={{ color: "var(--fgColor-muted)" }}>
                <RelativeTime datetime={run.startedAt} threshold="P30D" />
              </Text>
            </Stack>
          </Stack>

          {/* Action buttons */}
          <Stack direction="horizontal" gap="condensed" wrap="wrap">
            <ActionMenu>
              <ActionMenu.Button leadingVisual={SyncIcon}>
                Re-run jobs
              </ActionMenu.Button>
              <ActionMenu.Overlay>
                <ActionList>
                  <ActionList.Item>
                    <ActionList.LeadingVisual>
                      <SyncIcon />
                    </ActionList.LeadingVisual>
                    Re-run all jobs
                  </ActionList.Item>
                  <ActionList.Item>
                    <ActionList.LeadingVisual>
                      <XCircleFillIcon fill="var(--fgColor-danger)" />
                    </ActionList.LeadingVisual>
                    Re-run failed jobs
                  </ActionList.Item>
                </ActionList>
              </ActionMenu.Overlay>
            </ActionMenu>
            <Button variant="danger" leadingVisual={XIcon} disabled>
              Cancel run
            </Button>
          </Stack>

          {/* Dependency graph visualization */}
          <Stack gap="condensed">
            <Heading as="h2" variant="small">
              Jobs
            </Heading>

            {/* Independent jobs (run in parallel) */}
            {independentJobs.length > 0 && (
              <Stack gap="condensed">
                <Text size="small" weight="light" style={{ color: "var(--fgColor-muted)" }}>
                  Parallel
                </Text>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${Math.min(independentJobs.length, 2)}, 1fr)`,
                    gap: "var(--stack-gap-condensed)",
                  }}
                >
                  {independentJobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              </Stack>
            )}

            {/* Dependent jobs (sequential) */}
            {dependentJobs.length > 0 && (
              <Stack gap="condensed">
                <Text size="small" weight="light" style={{ color: "var(--fgColor-muted)" }}>
                  Sequential
                </Text>
                {dependentJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </Stack>
            )}
          </Stack>
        </Stack>
      </SplitPageLayout.Content>

      {/* Sidebar */}
      <SplitPageLayout.Sidebar position="end">
        <Stack gap="spacious" padding="normal">
          {/* Run metadata */}
          <Stack gap="normal">
            <Heading as="h3" variant="small">
              Summary
            </Heading>

            <Stack gap="condensed">
              <Stack direction="horizontal" align="center" gap="condensed">
                <StopwatchIcon size={16} fill="var(--fgColor-muted)" />
                <Text size="small" weight="light">
                  Total duration:
                </Text>
                <Text size="small" weight="medium">
                  {run.totalDuration}
                </Text>
              </Stack>

              <Stack direction="horizontal" align="center" gap="condensed">
                <ZapIcon size={16} fill="var(--fgColor-muted)" />
                <Text size="small" weight="light">
                  Billable time:
                </Text>
                <Text size="small" weight="medium">
                  {run.billableTime}
                </Text>
              </Stack>

              <Stack direction="horizontal" align="center" gap="condensed">
                <PersonIcon size={16} fill="var(--fgColor-muted)" />
                <Text size="small" weight="light">
                  Triggered by:
                </Text>
                <Text size="small" weight="medium">
                  {run.actor}
                </Text>
              </Stack>

              <Stack direction="horizontal" align="center" gap="condensed">
                <CalendarIcon size={16} fill="var(--fgColor-muted)" />
                <Text size="small" weight="light">
                  Started:
                </Text>
                <Text size="small" weight="medium">
                  <RelativeTime datetime={run.startedAt} threshold="P30D" />
                </Text>
              </Stack>
            </Stack>
          </Stack>

          {/* Commit info */}
          <Stack gap="normal">
            <Heading as="h3" variant="small">
              Triggering commit
            </Heading>

            <Stack gap="condensed">
              <Stack direction="horizontal" align="center" gap="condensed">
                <GitCommitIcon size={16} fill="var(--fgColor-muted)" />
                <Link
                  href="#"
                  muted
                  style={{
                    fontFamily: "var(--fontStack-monospace)",
                    fontSize: "var(--text-body-size-small)",
                  }}
                >
                  {run.commitSha}
                </Link>
                <IconButton
                  aria-label="Copy commit SHA"
                  icon={CopyIcon}
                  size="small"
                  variant="invisible"
                />
              </Stack>
              <Text size="small" weight="light" style={{ color: "var(--fgColor-muted)" }}>
                {run.commitMessage}
              </Text>
            </Stack>
          </Stack>

          {/* Artifacts */}
          <Stack gap="normal">
            <Heading as="h3" variant="small">
              Artifacts
            </Heading>

            {run.artifacts.length === 0 ? (
              <Text size="small" weight="light" style={{ color: "var(--fgColor-muted)" }}>
                No artifacts produced.
              </Text>
            ) : (
              <ActionList>
                {run.artifacts.map((artifact) => (
                  <ActionList.Item key={artifact.name}>
                    <ActionList.LeadingVisual>
                      <PackageIcon />
                    </ActionList.LeadingVisual>
                    <Text size="small">{artifact.name}</Text>
                    <ActionList.TrailingVisual>
                      <Stack direction="horizontal" align="center" gap="condensed">
                        <Text size="small" weight="light">
                          {artifact.size}
                        </Text>
                        <DownloadIcon size={16} />
                      </Stack>
                    </ActionList.TrailingVisual>
                  </ActionList.Item>
                ))}
              </ActionList>
            )}
          </Stack>
        </Stack>
      </SplitPageLayout.Sidebar>
    </SplitPageLayout>
  );
}
