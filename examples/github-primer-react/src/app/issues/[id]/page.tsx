import { Heading } from "@primer/react";

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <Heading as="h1">Issue #{id}</Heading>;
}
