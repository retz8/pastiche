"use client";

import { useParams } from "next/navigation";
import {
  Avatar,
  Breadcrumbs,
  Button,
  IconButton,
  Stack,
  Text,
  Heading,
  RelativeTime,
  ActionMenu,
  ActionList,
} from "@primer/react";
import {
  CopyIcon,
  DownloadIcon,
  KebabHorizontalIcon,
  FileIcon,
  HistoryIcon,
  PencilIcon,
  GitBranchIcon,
  PersonIcon,
  CheckIcon,
} from "@primer/octicons-react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_FILE_CONTENT = `import React from 'react';
import { clsx } from 'clsx';
import styles from './Button.module.css';

export interface ButtonProps {
  /** The visual style variant of the button */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  /** Size of the button */
  size?: 'small' | 'medium' | 'large';
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Whether the button is in a loading state */
  loading?: boolean;
  /** Optional icon to display before the label */
  leadingIcon?: React.ElementType;
  /** Click handler */
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  /** Button contents */
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'medium',
      disabled = false,
      loading = false,
      leadingIcon: LeadingIcon,
      onClick,
      children,
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={clsx(
          styles.button,
          styles[\`variant-\${variant}\`],
          styles[\`size-\${size}\`],
          loading && styles.loading
        )}
        disabled={disabled || loading}
        onClick={onClick}
        aria-busy={loading}
      >
        {loading && <span className={styles.spinner} aria-hidden="true" />}
        {LeadingIcon && !loading && (
          <LeadingIcon className={styles.icon} size={16} />
        )}
        <span className={styles.label}>{children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;`;

const MOCK_COMMIT = {
  message: "refactor(Button): extract spinner into its own sub-component",
  author: "monalisa",
  date: "2025-05-22T16:45:00Z",
  sha: "a3f8c1d",
};

const MOCK_BRANCH = "main";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const lines = MOCK_FILE_CONTENT.split("\n");
const lineCount = lines.length;
const fileSize = new Blob([MOCK_FILE_CONTENT]).size;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Bytes`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

// Very simple keyword-based "syntax highlighting"
function highlightLine(line: string): React.ReactNode {
  // Order matters: longer patterns first
  const keywords =
    /\b(import|from|export|const|return|interface|default|function|type|React|forwardRef|boolean|string|number|void|undefined|null|true|false|if|else|class|extends|implements)\b/g;
  const strings = /('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)/g;
  const comments = /(\/\/.*$|\/\*\*?[^]*?\*\/)/g;
  const jsxTags = /(<\/?[A-Za-z][A-Za-z0-9.]*)/g;

  // Tokenize the line
  type Token = { start: number; end: number; type: string; text: string };
  const tokens: Token[] = [];

  let match: RegExpExecArray | null;

  // Comments
  const commentRegex = new RegExp(comments.source, "g");
  while ((match = commentRegex.exec(line)) !== null) {
    tokens.push({
      start: match.index,
      end: match.index + match[0].length,
      type: "comment",
      text: match[0],
    });
  }

  // Strings
  const stringRegex = new RegExp(strings.source, "g");
  while ((match = stringRegex.exec(line)) !== null) {
    tokens.push({
      start: match.index,
      end: match.index + match[0].length,
      type: "string",
      text: match[0],
    });
  }

  // Keywords
  const keywordRegex = new RegExp(keywords.source, "g");
  while ((match = keywordRegex.exec(line)) !== null) {
    tokens.push({
      start: match.index,
      end: match.index + match[0].length,
      type: "keyword",
      text: match[0],
    });
  }

  // JSX tags
  const tagRegex = new RegExp(jsxTags.source, "g");
  while ((match = tagRegex.exec(line)) !== null) {
    tokens.push({
      start: match.index,
      end: match.index + match[0].length,
      type: "tag",
      text: match[0],
    });
  }

  // Sort by start position
  tokens.sort((a, b) => a.start - b.start);

  // Remove overlapping tokens (earlier ones win)
  const filtered: Token[] = [];
  let lastEnd = 0;
  for (const t of tokens) {
    if (t.start >= lastEnd) {
      filtered.push(t);
      lastEnd = t.end;
    }
  }

  if (filtered.length === 0) return line;

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  for (let i = 0; i < filtered.length; i++) {
    const t = filtered[i];
    if (cursor < t.start) {
      parts.push(line.slice(cursor, t.start));
    }
    const color =
      t.type === "comment"
        ? "var(--codeMirror-syntax-fgColor-comment)"
        : t.type === "string"
          ? "var(--codeMirror-syntax-fgColor-string)"
          : t.type === "keyword"
            ? "var(--codeMirror-syntax-fgColor-keyword)"
            : t.type === "tag"
              ? "var(--codeMirror-syntax-fgColor-entity)"
              : undefined;
    parts.push(
      <span key={i} style={{ color }}>
        {t.text}
      </span>
    );
    cursor = t.end;
  }
  if (cursor < line.length) {
    parts.push(line.slice(cursor));
  }
  return parts;
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function BlobPage() {
  const params = useParams();
  const pathSegments = (params.path as string[]) || [];
  const fileName = pathSegments[pathSegments.length - 1] || "unknown";

  return (
    <div
      style={{
        paddingLeft: "var(--stack-padding-spacious)",
        paddingRight: "var(--stack-padding-spacious)",
        maxWidth: "1400px",
        marginLeft: "auto",
        marginRight: "auto",
      }}
    >
      <Stack gap="normal">
        {/* Breadcrumb */}
        <Breadcrumbs>
          <Breadcrumbs.Item as={Link} href="/blob/src">
            <Text size="small">src</Text>
          </Breadcrumbs.Item>
          {pathSegments.map((segment, index) => {
            const isLast = index === pathSegments.length - 1;
            const href = `/blob/${pathSegments.slice(0, index + 1).join("/")}`;
            return (
              <Breadcrumbs.Item
                key={index}
                as={Link}
                href={href}
                selected={isLast}
              >
                <Text size="small" weight={isLast ? "semibold" : "normal"}>
                  {segment}
                </Text>
              </Breadcrumbs.Item>
            );
          })}
        </Breadcrumbs>

        {/* File metadata bar */}
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
          <Stack direction="horizontal" align="center" gap="normal">
            {/* Branch selector */}
            <ActionMenu>
              <ActionMenu.Button
                leadingVisual={GitBranchIcon}
                size="small"
              >
                {MOCK_BRANCH}
              </ActionMenu.Button>
              <ActionMenu.Overlay>
                <ActionList>
                  <ActionList.Item>
                    <ActionList.LeadingVisual>
                      <CheckIcon />
                    </ActionList.LeadingVisual>
                    <Text>main</Text>
                  </ActionList.Item>
                  <ActionList.Item>
                    <Text>develop</Text>
                  </ActionList.Item>
                  <ActionList.Item>
                    <Text>feature/new-ui</Text>
                  </ActionList.Item>
                </ActionList>
              </ActionMenu.Overlay>
            </ActionMenu>

            <Stack direction="horizontal" align="center" gap="condensed">
              <FileIcon size={16} />
              <Text size="small" weight="semibold">{fileName}</Text>
            </Stack>

            <Text size="small" weight="light">
              {lineCount} lines
            </Text>

            <Text size="small" weight="light">
              {formatFileSize(fileSize)}
            </Text>
          </Stack>

          <Stack direction="horizontal" align="center" gap="condensed">
            <Button size="small" variant="invisible" leadingVisual={CopyIcon}>
              Raw
            </Button>
            <Button
              size="small"
              variant="invisible"
              leadingVisual={PersonIcon}
            >
              Blame
            </Button>
            <Button
              size="small"
              variant="invisible"
              leadingVisual={HistoryIcon}
            >
              History
            </Button>
            <IconButton
              icon={PencilIcon}
              aria-label="Edit this file"
              size="small"
              variant="invisible"
            />
            <IconButton
              icon={DownloadIcon}
              aria-label="Download raw file"
              size="small"
              variant="invisible"
            />
            <IconButton
              icon={KebabHorizontalIcon}
              aria-label="More options"
              size="small"
              variant="invisible"
            />
          </Stack>
        </div>

        {/* File content card */}
        <div
          style={{
            border: "var(--borderWidth-thin) solid var(--borderColor-default)",
            borderRadius: "var(--borderRadius-medium)",
            overflow: "hidden",
          }}
        >
          {/* Latest commit bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "var(--stack-padding-condensed) var(--stack-padding-normal)",
              backgroundColor: "var(--bgColor-muted)",
              borderBottom:
                "var(--borderWidth-thin) solid var(--borderColor-default)",
            }}
          >
            <Stack direction="horizontal" align="center" gap="condensed">
              <Avatar
                src={`https://avatars.githubusercontent.com/${MOCK_COMMIT.author}`}
                alt={MOCK_COMMIT.author}
                size={24}
              />
              <Text size="small" weight="semibold">
                {MOCK_COMMIT.author}
              </Text>
              <Text size="small">{MOCK_COMMIT.message}</Text>
            </Stack>
            <Stack direction="horizontal" align="center" gap="condensed">
              <Text
                size="small"
                weight="light"
                style={{ fontFamily: "var(--fontStack-monospace)" }}
              >
                {MOCK_COMMIT.sha}
              </Text>
              <Text size="small" weight="light">
                <RelativeTime
                  datetime={MOCK_COMMIT.date}
                  threshold="P30D"
                />
              </Text>
            </Stack>
          </div>

          {/* Code content with line numbers */}
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontFamily: "var(--fontStack-monospace)",
                fontSize: "var(--text-body-size-small)",
                lineHeight: "20px",
              }}
            >
              <tbody>
                {lines.map((line, index) => (
                  <tr
                    key={index}
                    style={{
                      cursor: "pointer",
                    }}
                  >
                    <td
                      id={`L${index + 1}`}
                      style={{
                        padding: "0 var(--stack-padding-normal)",
                        textAlign: "right",
                        userSelect: "none",
                        color: "var(--fgColor-muted)",
                        width: 1,
                        whiteSpace: "nowrap",
                        verticalAlign: "top",
                      }}
                    >
                      <a
                        href={`#L${index + 1}`}
                        style={{
                          color: "var(--fgColor-muted)",
                          textDecoration: "none",
                        }}
                        aria-label={`Line ${index + 1}`}
                      >
                        {index + 1}
                      </a>
                    </td>
                    <td
                      style={{
                        padding: "0 var(--stack-padding-normal)",
                        whiteSpace: "pre",
                      }}
                    >
                      {highlightLine(line)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Stack>
    </div>
  );
}
