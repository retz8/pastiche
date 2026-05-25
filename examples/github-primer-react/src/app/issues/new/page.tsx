"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  FormControl,
  Heading,
  Text,
  TextInput,
  Textarea,
  Stack,
} from "@primer/react";
import { SplitPageLayout } from "@primer/react";

export default function NewIssuePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [showTitleError, setShowTitleError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() === "") {
      setShowTitleError(true);
      return;
    }
    router.push("/issues");
  };

  const handleCancel = () => {
    router.push("/issues");
  };

  return (
    <form onSubmit={handleSubmit}>
      <SplitPageLayout>
        <SplitPageLayout.Content>
          <Stack direction="vertical" gap="spacious">
            <Heading as="h1">New Issue</Heading>

            <FormControl required>
              <FormControl.Label>Title</FormControl.Label>
              <TextInput
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (e.target.value.trim() !== "") {
                    setShowTitleError(false);
                  }
                }}
                placeholder="Title"
                block
                validationStatus={showTitleError ? "error" : undefined}
              />
              {showTitleError && (
                <FormControl.Validation variant="error">
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
                rows={12}
              />
              <FormControl.Caption>
                <Text>Supports Markdown</Text>
              </FormControl.Caption>
            </FormControl>

            <Stack direction="horizontal" gap="normal">
              <Button type="submit" variant="primary">
                <Text>Submit new issue</Text>
              </Button>
              <Button type="button" variant="default" onClick={handleCancel}>
                <Text>Cancel</Text>
              </Button>
            </Stack>
          </Stack>
        </SplitPageLayout.Content>

        <SplitPageLayout.Pane position="end">
          <Stack direction="vertical" gap="spacious">
            {/* Assignees section */}
            <div
              style={{
                borderBottom:
                  "var(--borderWidth-thin) solid var(--borderColor-default)",
                paddingBottom: "var(--stack-gap-normal)",
              }}
            >
              <Stack direction="vertical" gap="condensed">
                <Text size="small" weight="semibold">Assignees</Text>
                <Text size="small" weight="light">No one</Text>
              </Stack>
            </div>

            {/* Labels section */}
            <div
              style={{
                borderBottom:
                  "var(--borderWidth-thin) solid var(--borderColor-default)",
                paddingBottom: "var(--stack-gap-normal)",
              }}
            >
              <Stack direction="vertical" gap="condensed">
                <Text size="small" weight="semibold">Labels</Text>
                <Text size="small" weight="light">None yet</Text>
              </Stack>
            </div>

            {/* Projects section */}
            <div>
              <Stack direction="vertical" gap="condensed">
                <Text size="small" weight="semibold">Projects</Text>
                <Text size="small" weight="light">None yet</Text>
              </Stack>
            </div>
          </Stack>
        </SplitPageLayout.Pane>
      </SplitPageLayout>
    </form>
  );
}
