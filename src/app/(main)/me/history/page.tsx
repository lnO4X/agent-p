import type { Metadata } from "next";
import { HistoryClient } from "./history-client";

export const metadata: Metadata = {
  title: "Test History — GameTan",
  description:
    "Compare your cognitive profile across past GameTan assessments. Track dimension-level change and see where practice effect ends and real ability gain begins.",
  robots: { index: false, follow: false },
};

export default function HistoryPage() {
  return <HistoryClient />;
}
