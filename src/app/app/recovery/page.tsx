import type { Metadata } from "next";
import { RecoveryCheckinView } from "@/features/recovery/components/recovery-checkin-view";

export const metadata: Metadata = {
  title: "Penilaian Mandiri Pemulihan",
  description: "Check-in aktivitas dan kendala mandiri NeuroRecovery.",
  robots: { index: false, follow: false },
};

export default function RecoveryPage() {
  return <RecoveryCheckinView />;
}
