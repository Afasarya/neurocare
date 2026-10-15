import type { Metadata } from "next";
import { HealthTimelineView } from "@/features/health-records/components/health-timeline-view";

export const metadata: Metadata = { title: "Timeline Kesehatan", description: "Riwayat kesehatan terpadu NeuroCare.", robots: { index: false, follow: false } };

export default function TimelinePage() { return <HealthTimelineView />; }
