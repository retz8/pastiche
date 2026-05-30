"use client";

import {
  ActionList,
  ActionMenu,
  Breadcrumbs,
  Button,
  Label,
  Link,
  PageLayout,
  RelativeTime,
  Stack,
  Text,
} from "@primer/react";
import {
  CheckIcon,
  CodeIcon,
  CopyIcon,
  EyeIcon,
  FileCodeIcon,
  GitBranchIcon,
  HistoryIcon,
  PencilIcon,
} from "@primer/octicons-react";

const HOUR = 1000 * 60 * 60;

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * HOUR).toISOString();
}

type Ref = { name: string; kind: "branch" | "tag" };

const FILE = {
  path: ["src", "components", "Button.tsx"],
  ref: "main",
  size: "2.41 KB",
  language: "TypeScript",
};

const REFS: Ref[] = [
  { name: "main", kind: "branch" },
  { name: "next", kind: "branch" },
  { name: "fix/actionlist-focus-visible", kind: "branch" },
  { name: "v37.0.0", kind: "tag" },
  { name: "v36.4.0", kind: "tag" },
];

const COMMIT = {
  sha: "a1b2c3d",
  message: "Ref-count ActionList mounts; tear down listener at zero",
  author: "monalisa",
  authoredAt: hoursAgo(5.2),
};

// Mock source file — a small Primer-style React component.
const SOURCE = `import React from "react";
import clsx from "clsx";
import styles from "./Button.module.css";

export type ButtonVariant = "default" | "primary" | "invisible" | "danger";

export type ButtonSize = "small" | "medium" | "large";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual emphasis of the button. */
  variant?: ButtonVariant;
  /** Control density. */
  size?: ButtonSize;
  /** Render an icon before the label. */
  leadingVisual?: React.ElementType;
  /** Render an icon after the label. */
  trailingVisual?: React.ElementType;
  /** Stretch the button to fill its container. */
  block?: boolean;
  /** Show a spinner and disable interaction. */
  loading?: boolean;
}

/**
 * Button is the primary interactive control in the system.
 * Prefer a single primary variant per page region.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "default",
      size = "medium",
      leadingVisual: LeadingVisual,
      trailingVisual: TrailingVisual,
      block = false,
      loading = false,
      disabled,
      children,
      className,
      ...rest
    },
    ref,
  ) {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type="button"
        aria-disabled={isDisabled}
        disabled={isDisabled}
        data-variant={variant}
        data-size={size}
        className={clsx(styles.button, block && styles.block, className)}
        {...rest}
      >
        {LeadingVisual ? (
          <span className={styles.visual}>
            <LeadingVisual />
          </span>
        ) : null}
        <span className={styles.label}>{children}</span>
        {TrailingVisual ? (
          <span className={styles.visual}>
            <TrailingVisual />
          </span>
        ) : null}
      </button>
    );
  },
);

export default Button;
`;

// Minimal token-aware syntax highlighter for the mock TypeScript source.
const KEYWORDS = new Set([
  "import",
  "from",
  "export",
  "type",
  "interface",
  "extends",
  "const",
  "function",
  "return",
  "default",
  "boolean",
  "null",
  "true",
  "false",
  "new",
]);

const TOKEN_RE =
  /(\/\*[\s\S]*?\*\/|\/\/[^\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b[A-Za-z_$][\w$]*\b)|(\s+)|([^\s])/g;

const TOKEN_COLOR = {
  comment: "var(--fgColor-muted)",
  string: "var(--fgColor-success)",
  keyword: "var(--fgColor-done)",
  type: "var(--fgColor-attention)",
} as const;

function highlight(line: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let match: RegExpExecArray | null;
  let key = 0;
  TOKEN_RE.lastIndex = 0;
  while ((match = TOKEN_RE.exec(line)) !== null) {
    const [, comment, string, word, whitespace, symbol] = match;
    if (comment !== undefined) {
      nodes.push(
        <span key={key++} style={{ color: TOKEN_COLOR.comment }}>
          {comment}
        </span>,
      );
    } else if (string !== undefined) {
      nodes.push(
        <span key={key++} style={{ color: TOKEN_COLOR.string }}>
          {string}
        </span>,
      );
    } else if (word !== undefined) {
      if (KEYWORDS.has(word)) {
        nodes.push(
          <span key={key++} style={{ color: TOKEN_COLOR.keyword }}>
            {word}
          </span>,
        );
      } else if (/^[A-Z]/.test(word)) {
        nodes.push(
          <span key={key++} style={{ color: TOKEN_COLOR.type }}>
            {word}
          </span>,
        );
      } else {
        nodes.push(word);
      }
    } else {
      nodes.push(whitespace ?? symbol);
    }
  }
  return nodes;
}

export default function BlobPage() {
  const lines = SOURCE.replace(/\n$/, "").split("\n");
  const lineCount = lines.length;
  const fileName = FILE.path[FILE.path.length - 1];

  const monoFont = "var(--fontStack-monospace)";

  return (
    <PageLayout containerWidth="full" padding="normal">
      <PageLayout.Content>
        <Stack direction="vertical" gap="normal">
          {/* Ref selector + breadcrumb path */}
          <Stack
            direction="horizontal"
            gap="condensed"
            align="center"
            wrap="wrap"
          >
            <ActionMenu>
              <ActionMenu.Button leadingVisual={GitBranchIcon}>
                {FILE.ref}
              </ActionMenu.Button>
              <ActionMenu.Overlay width="medium">
                <ActionList selectionVariant="single">
                  {REFS.map((ref) => (
                    <ActionList.Item
                      key={ref.name}
                      selected={ref.name === FILE.ref}
                    >
                      <ActionList.LeadingVisual>
                        {ref.name === FILE.ref ? <CheckIcon /> : <GitBranchIcon />}
                      </ActionList.LeadingVisual>
                      {ref.name}
                      <ActionList.TrailingVisual>
                        <Text size="small" weight="light">
                          {ref.kind}
                        </Text>
                      </ActionList.TrailingVisual>
                    </ActionList.Item>
                  ))}
                </ActionList>
              </ActionMenu.Overlay>
            </ActionMenu>

            <Breadcrumbs>
              {FILE.path.map((segment, index) => {
                const isLast = index === FILE.path.length - 1;
                const href = `/blob/${FILE.ref}/${FILE.path
                  .slice(0, index + 1)
                  .join("/")}`;
                return (
                  <Breadcrumbs.Item
                    key={href}
                    href={href}
                    selected={isLast}
                  >
                    {segment}
                  </Breadcrumbs.Item>
                );
              })}
            </Breadcrumbs>
          </Stack>

          {/* Latest commit on this file */}
          <Stack
            direction="horizontal"
            gap="condensed"
            align="baseline"
            wrap="wrap"
            style={{
              border:
                "var(--borderWidth-thin) solid var(--borderColor-default)",
              borderRadius: "var(--borderRadius-medium)",
              padding: "var(--stack-padding-condensed)",
              backgroundColor: "var(--bgColor-muted)",
            }}
          >
            <Text size="small" weight="semibold">
              {COMMIT.author}
            </Text>
            <Text size="small">{COMMIT.message}</Text>
            <Stack direction="horizontal" gap="condensed" align="baseline">
              <Link
                href={`/commit/${COMMIT.sha}`}
                muted
                style={{ fontFamily: monoFont }}
              >
                <Text size="small">{COMMIT.sha}</Text>
              </Link>
              <Text size="small" weight="light">
                <RelativeTime
                  date={new Date(COMMIT.authoredAt)}
                  threshold="P30D"
                />
              </Text>
            </Stack>
          </Stack>

          {/* File metadata bar + content */}
          <div
            style={{
              border:
                "var(--borderWidth-thin) solid var(--borderColor-default)",
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
                borderBottom:
                  "var(--borderWidth-thin) solid var(--borderColor-muted)",
                backgroundColor: "var(--bgColor-muted)",
              }}
            >
              <Stack direction="horizontal" gap="condensed" align="center">
                <span style={{ color: "var(--fgColor-muted)", display: "flex" }} aria-hidden>
                  <FileCodeIcon size={16} />
                </span>
                <Text
                  size="medium"
                  weight="semibold"
                  style={{ fontFamily: monoFont }}
                >
                  {fileName}
                </Text>
                <Label variant="secondary">{FILE.language}</Label>
                <Text size="small" weight="light">
                  {lineCount} lines
                </Text>
                <Text size="small" weight="light">
                  {FILE.size}
                </Text>
              </Stack>

              <Stack direction="horizontal" gap="condensed" align="center">
                <Button size="small" leadingVisual={CodeIcon}>
                  Raw
                </Button>
                <Button size="small" leadingVisual={CopyIcon}>
                  Copy
                </Button>
                <Button size="small" leadingVisual={EyeIcon}>
                  Blame
                </Button>
                <Button size="small" leadingVisual={HistoryIcon}>
                  History
                </Button>
                <Button size="small" leadingVisual={PencilIcon}>
                  Edit
                </Button>
              </Stack>
            </Stack>

            {/* Code body with per-line numbers */}
            <div
              style={{
                overflowX: "auto",
                backgroundColor: "var(--bgColor-default)",
                fontFamily: monoFont,
                fontSize: "var(--text-codeBlock-size)",
                lineHeight: "var(--text-codeBlock-lineHeight)",
              }}
            >
              <table
                style={{
                  borderCollapse: "collapse",
                  width: "100%",
                  tabSize: 2,
                }}
              >
                <tbody>
                  {lines.map((line, index) => {
                    const lineNumber = index + 1;
                    return (
                      <tr key={lineNumber} id={`L${lineNumber}`}>
                        <td
                          style={{
                            width: "1%",
                            minWidth: "var(--control-large-size)",
                            padding: "0 var(--space-md)",
                            textAlign: "right",
                            color: "var(--fgColor-muted)",
                            userSelect: "none",
                            verticalAlign: "top",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <Link
                            href={`#L${lineNumber}`}
                            muted
                            style={{
                              fontFamily: monoFont,
                              color: "inherit",
                            }}
                            aria-label={`Line ${lineNumber}`}
                          >
                            {lineNumber}
                          </Link>
                        </td>
                        <td
                          style={{
                            padding: "0 var(--space-md)",
                            whiteSpace: "pre",
                            color: "var(--fgColor-default)",
                          }}
                        >
                          {line.length > 0 ? highlight(line) : " "}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Stack>
      </PageLayout.Content>
    </PageLayout>
  );
}
