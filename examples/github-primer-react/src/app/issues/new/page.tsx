"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  FormControl,
  Heading,
  LinkButton,
  SplitPageLayout,
  Stack,
  Text,
  TextInput,
  Textarea,
} from "@primer/react";

type SidebarSection = {
  heading: string;
  placeholder: string;
};

const SIDEBAR_SECTIONS: SidebarSection[] = [
  { heading: "Assignees", placeholder: "No one—assign yourself" },
  { heading: "Labels", placeholder: "None yet" },
  { heading: "Projects", placeholder: "None yet" },
];

export default function NewIssuePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [titleError, setTitleError] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (title.trim() === "") {
      setTitleError(true);
      return;
    }
    setTitleError(false);
    router.push("/issues");
  }

  return (
    <SplitPageLayout>
      <SplitPageLayout.Content width="xlarge">
        <Stack as="form" direction="vertical" gap="normal" onSubmit={handleSubmit}>
          <Heading as="h1" variant="large">
            New issue
          </Heading>

          <FormControl required>
            <FormControl.Label>Title</FormControl.Label>
            <TextInput
              block
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                if (titleError && event.target.value.trim() !== "") {
                  setTitleError(false);
                }
              }}
              validationStatus={titleError ? "error" : undefined}
              placeholder="Title"
            />
            {titleError && (
              <FormControl.Validation variant="error">
                A title is required to open an issue.
              </FormControl.Validation>
            )}
          </FormControl>

          <FormControl>
            <FormControl.Label>Add a description</FormControl.Label>
            <Textarea
              block
              resize="vertical"
              rows={12}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Leave a comment"
            />
          </FormControl>

          <Stack direction="horizontal" gap="condensed" justify="end">
            <LinkButton href="/issues" variant="invisible">
              Cancel
            </LinkButton>
            <Button type="submit" variant="primary">
              Submit new issue
            </Button>
          </Stack>
        </Stack>
      </SplitPageLayout.Content>

      <SplitPageLayout.Pane position="end" aria-label="Issue metadata">
        <Stack direction="vertical" gap="none">
          {SIDEBAR_SECTIONS.map((section, index) => (
            <Stack
              key={section.heading}
              direction="vertical"
              gap="none"
              paddingBlock="normal"
              style={
                index < SIDEBAR_SECTIONS.length - 1
                  ? {
                      borderBottom:
                        "var(--borderWidth-thin) solid var(--borderColor-muted)",
                    }
                  : undefined
              }
            >
              <Heading as="h2" variant="small">
                {section.heading}
              </Heading>
              <Text size="small" weight="light">
                {section.placeholder}
              </Text>
            </Stack>
          ))}
        </Stack>
      </SplitPageLayout.Pane>
    </SplitPageLayout>
  );
}
