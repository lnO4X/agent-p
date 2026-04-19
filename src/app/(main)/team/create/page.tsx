import type { Metadata } from "next";
import CreateTeamClient from "./create-team-client";

export const metadata: Metadata = {
  title: "Create Team / 创建团队 — GameTan",
};

export default function CreateTeamPage() {
  return <CreateTeamClient />;
}
