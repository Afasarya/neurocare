import type { Metadata } from "next";
import { ActionPlanView } from "@/features/health-records/components/action-plan-view";

export const metadata: Metadata = { title: "Rencana Tindak Lanjut", description: "Rencana tindak lanjut NeuroCare.", robots: { index: false, follow: false } };

export default function ActionPlanPage() { return <ActionPlanView />; }
