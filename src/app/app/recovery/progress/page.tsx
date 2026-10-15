import type { Metadata } from "next";
import { RecoveryProgressView } from "@/features/recovery-progress/components/recovery-progress-view";

export const metadata: Metadata = {
  title: "Perubahan Catatan Pemulihan",
  description: "Ringkasan deskriptif check-in dan aktivitas NeuroRecovery.",
  robots: { index: false, follow: false },
};

export default function RecoveryProgressPage() {
  return <RecoveryProgressView />;
}
