"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  FormControl,
  TextInput,
  Textarea,
  Heading,
  Text,
  Stack,
} from "@primer/react";
import { SplitPageLayout } from "@primer/react";

export default function NewIssuePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [titleError, setTitleError] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);

    if (title.trim() === "") {
      setTitleError(true);
      return;
    }

    router.push("/issues");
  }

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTitle(e.target.value);
    if (titleError && e.target.value.trim() !== "") {
      setTitleError(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <SplitPageLayout>
        <SplitPageLayout.Content>
          <Stack direction="vertical" gap="spacious">
            <Heading as="h1">New issue</Heading>

            <Stack direction="vertical" gap="normal">
              <FormControl required>
                <FormControl.Label>Title</FormControl.Label>
                <TextInput
                  value={title}
                  onChange={handleTitleChange}
                  placeholder="Title"
                  block
                  validationStatus={titleError ? "error" : undefined}
                  aria-describedby={titleError ? "title-validation" : undefined}
                />
                {titleError && (
                  <FormControl.Validation id="title-validation" variant="error">
                    <Text>Title is required</Text>
                  </FormControl.Validation>
                )}
              </FormControl>

              <FormControl>
                <FormControl.Label>Description</FormControl.Label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Leave a comment"
                  block
                  resize="vertical"
                  minHeight={200}
                />
                <FormControl.Caption>
                  <Text>Markdown is supported</Text>
                </FormControl.Caption>
              </FormControl>
            </Stack>

            <Stack direction="horizontal" gap="normal" align="center">
              <Button type="submit" variant="primary">
                Submit new issue
              </Button>
              <Button
                type="button"
                variant="default"
                onClick={() => router.push("/issues")}
              >
                Cancel
              </Button>
            </Stack>
          </Stack>
        </SplitPageLayout.Content>

        <SplitPageLayout.Pane position="end">
          <Stack direction="vertical" gap="normal">
            {/* Assignees section */}
            <div
              style={{
                paddingBottom: "var(--base-size-16)",
                borderBottom:
                  "var(--borderWidth-thin) solid var(--borderColor-muted)",
              }}
            >
              <Stack direction="vertical" gap="condensed">
                <Text size="small" weight="semibold">
                  Assignees
                </Text>
                <Text size="small" style={{ color: "var(--fgColor-muted)" }}>
                  No one
                </Text>
              </Stack>
            </div>

            {/* Labels section */}
            <div
              style={{
                paddingBottom: "var(--base-size-16)",
                borderBottom:
                  "var(--borderWidth-thin) solid var(--borderColor-muted)",
              }}
            >
              <Stack direction="vertical" gap="condensed">
                <Text size="small" weight="semibold">
                  Labels
                </Text>
                <Text size="small" style={{ color: "var(--fgColor-muted)" }}>
                  None yet
                </Text>
              </Stack>
            </div>

            {/* Projects section */}
            <div>
              <Stack direction="vertical" gap="condensed">
                <Text size="small" weight="semibold">
                  Projects
                </Text>
                <Text size="small" style={{ color: "var(--fgColor-muted)" }}>
                  None yet
                </Text>
              </Stack>
            </div>
          </Stack>
        </SplitPageLayout.Pane>
      </SplitPageLayout>
    </form>
  );
}
