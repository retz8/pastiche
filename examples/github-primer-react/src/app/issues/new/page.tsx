"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  SplitPageLayout,
  PageHeader,
  FormControl,
  TextInput,
  Textarea,
  Button,
  Stack,
  Text,
} from "@primer/react";

export default function NewIssuePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const titleInvalid = submitted && title.trim() === "";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (title.trim() === "") return;
    // No real persistence — navigate back
    router.push("/issues");
  }

  return (
    <SplitPageLayout>
      <SplitPageLayout.Header>
        <PageHeader>
          <PageHeader.TitleArea>
            <PageHeader.Title as="h1">New issue</PageHeader.Title>
          </PageHeader.TitleArea>
        </PageHeader>
      </SplitPageLayout.Header>

      <SplitPageLayout.Content>
        <form onSubmit={handleSubmit} noValidate>
          <Stack direction="vertical" gap="normal">
            <FormControl required={true} id="issue-title">
              <FormControl.Label>Title</FormControl.Label>
              <TextInput
                block
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                validationStatus={titleInvalid ? "error" : undefined}
                aria-describedby={titleInvalid ? "title-error" : undefined}
              />
              {titleInvalid && (
                <FormControl.Validation variant="error" id="title-error">
                  Title is required
                </FormControl.Validation>
              )}
            </FormControl>

            <FormControl id="issue-body">
              <FormControl.Label>Description</FormControl.Label>
              <Textarea
                block
                rows={12}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Leave a comment"
                resize="vertical"
              />
            </FormControl>

            <Stack direction="horizontal" gap="condensed" align="center">
              <Button type="submit" variant="primary">
                Submit new issue
              </Button>
              <Button
                type="button"
                variant="invisible"
                onClick={() => router.push("/issues")}
              >
                Cancel
              </Button>
            </Stack>
          </Stack>
        </form>
      </SplitPageLayout.Content>

      <SplitPageLayout.Pane position="end" divider="line">
        <Stack direction="vertical" gap="normal">
          <SidebarSection label="Assignees">
            <Text size="small" weight="normal" as="span"
              style={{ color: "var(--fgColor-muted)" }}>
              No one
            </Text>
          </SidebarSection>

          <SidebarSection label="Labels">
            <Text size="small" weight="normal" as="span"
              style={{ color: "var(--fgColor-muted)" }}>
              None yet
            </Text>
          </SidebarSection>

          <SidebarSection label="Projects" hideDivider>
            <Text size="small" weight="normal" as="span"
              style={{ color: "var(--fgColor-muted)" }}>
              None yet
            </Text>
          </SidebarSection>
        </Stack>
      </SplitPageLayout.Pane>
    </SplitPageLayout>
  );
}

function SidebarSection({
  label,
  children,
  hideDivider = false,
}: {
  label: string;
  children: React.ReactNode;
  hideDivider?: boolean;
}) {
  return (
    <div
      style={
        hideDivider
          ? { paddingBlock: "var(--spacing-normal)" }
          : {
              paddingBlock: "var(--spacing-normal)",
              borderBottom: "1px solid var(--borderColor-muted)",
            }
      }
    >
      <Stack direction="vertical" gap="condensed">
        <Text size="small" weight="semibold" as="span">
          {label}
        </Text>
        {children}
      </Stack>
    </div>
  );
}
