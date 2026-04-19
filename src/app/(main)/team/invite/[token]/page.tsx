import type { Metadata } from "next";
import InviteAcceptClient from "./invite-accept-client";

export const metadata: Metadata = {
  title: "Team Invite / 团队邀请 — GameTan",
};

export default async function InviteAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <InviteAcceptClient token={token} />;
}
