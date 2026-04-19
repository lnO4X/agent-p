import type { Metadata } from "next";
import TeamDetailClient from "./team-detail-client";

export const metadata: Metadata = {
  title: "Team Dashboard / 团队 — GameTan",
};

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  return <TeamDetailClient orgId={orgId} />;
}
