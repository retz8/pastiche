"use client";

import { useState, type FormEvent, type ChangeEvent } from "react";
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
  Heading,
  ActionList,
} from "@primer/react";

export default function NewIssuePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [titleError, setTitleError] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim()) {
      setTitleError(true);
      return;
    }
    router.push("/issues");
  }

  function handleCancel() {
    router.push("/issues");
  }

  return (
    <SplitPageLayout>
      <SplitPageLayout.Content>
        <PageHeader>
          <PageHeader.Title as="h1">New issue</PageHeader.Title>
        </PageHeader>

        <form onSubmit={handleSubmit} noValidate>
          <Stack direction="vertical" gap="normal">
            <FormControl required={true}>
              <FormControl.Label>Title</FormControl.Label>
              <TextInput
                block
                value={title}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setTitle(e.target.value);
                  if (e.target.value.trim()) setTitleError(false);
                }}
                validationStatus={titleError ? "error" : undefined}
                placeholder="Title"
                aria-label="Issue title"
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
                block={true}
                value={body}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setBody(e.target.value)}
                placeholder="Add a description…"
                minHeight={200}
                resize="vertical"
                aria-label="Issue description"
              />
            </FormControl>

            <Stack direction="horizontal" gap="normal">
              <Button type="submit" variant="primary">
                Submit new issue
              </Button>
              <Button type="button" variant="invisible" onClick={handleCancel}>
                Cancel
              </Button>
            </Stack>
          </Stack>
        </form>
      </SplitPageLayout.Content>

      <SplitPageLayout.Pane position="end">
        <Stack direction="vertical" gap="normal">
          <section>
            <Heading as="h3">Assignees</Heading>
            <ActionList.Divider />
            <Text size="small" weight="light">
              No one
            </Text>
          </section>

          <section>
            <Heading as="h3">Labels</Heading>
            <ActionList.Divider />
            <Text size="small" weight="light">
              None yet
            </Text>
          </section>

          <section>
            <Heading as="h3">Projects</Heading>
            <ActionList.Divider />
            <Text size="small" weight="light">
              None yet
            </Text>
          </section>
        </Stack>
      </SplitPageLayout.Pane>
    </SplitPageLayout>
  );
}
