import type { Metadata } from "next";
import { HealthInsightView } from "@/features/insights/components/health-insight-view";

export const metadata: Metadata = {
  title: "Insight Kesehatan Personal",
  description: "Penjelasan terbatas dan non-diagnostik dari hasil skrining NeuroPrevent.",
  robots: { index: false, follow: false },
};

export default function InsightsPage() {
  return <HealthInsightView />;
}
