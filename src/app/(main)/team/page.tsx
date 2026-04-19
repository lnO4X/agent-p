import type { Metadata } from "next";
import TeamListClient from "./team-list-client";

export const metadata: Metadata = {
  title: "Teams / 团队 — GameTan",
  description: "Manage your coaching teams and players.",
};

export default function TeamListPage() {
  return <TeamListClient />;
}
