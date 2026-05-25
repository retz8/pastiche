"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  FormControl,
  Heading,
  Stack,
  Text,
  TextInput,
  Textarea,
} from "@primer/react";
import { SplitPageLayout } from "@primer/react";
import { GearIcon } from "@primer/octicons-react";

export default function NewIssuePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [titleError, setTitleError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim() === "") {
      setTitleError(true);
      return;
    }
    setTitleError(false);
    router.push("/issues");
  }

  return (
    <form onSubmit={handleSubmit}>
      <SplitPageLayout>
        <SplitPageLayout.Content>
          <Stack gap="spacious">
            <Heading as="h1">New issue</Heading>

            <FormControl required>
              <FormControl.Label>Title</FormControl.Label>
              <TextInput
                block
                placeholder="Title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (titleError && e.target.value.trim() !== "") {
                    setTitleError(false);
                  }
                }}
                validationStatus={titleError ? "error" : undefined}
              />
              {titleError && (
                <FormControl.Validation variant="error">
                  Title is required
                </FormControl.Validation>
              )}
            </FormControl>

            <FormControl>
              <FormControl.Label>Description</FormControl.Label>
              <Textarea
                block
                placeholder="Add a description..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={12}
                resize="vertical"
              />
              <FormControl.Caption>
                Describe the issue in detail. Markdown is supported.
              </FormControl.Caption>
            </FormControl>

            <Stack direction="horizontal" gap="condensed">
              <Button type="submit" variant="primary">
                Submit new issue
              </Button>
              <Button
                variant="default"
                onClick={() => router.push("/issues")}
                type="button"
              >
                Cancel
              </Button>
            </Stack>
          </Stack>
        </SplitPageLayout.Content>

        <SplitPageLayout.Pane position="end" divider="line">
          <Stack gap="spacious">
            <SidebarSection title="Assignees" placeholder="No one" />
            <SidebarSection title="Labels" placeholder="None yet" />
            <SidebarSection title="Projects" placeholder="None yet" />
          </Stack>
        </SplitPageLayout.Pane>
      </SplitPageLayout>
    </form>
  );
}

function SidebarSection({
  title,
  placeholder,
}: {
  title: string;
  placeholder: string;
}) {
  return (
    <div
      style={{
        paddingBlockEnd: "var(--stack-gap-spacious)",
        borderBlockEnd: "var(--borderWidth-thin) solid var(--borderColor-muted)",
      }}
    >
      <Stack gap="condensed">
        <Stack direction="horizontal" align="center" justify="space-between">
          <Text size="small" weight="semibold">
            {title}
          </Text>
          <GearIcon size={16} />
        </Stack>
        <Text size="small" weight="light">
          {placeholder}
        </Text>
      </Stack>
    </div>
  );
}
