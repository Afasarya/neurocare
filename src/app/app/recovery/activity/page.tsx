import type { Metadata } from "next";
import { MotionRehabilitationView } from "@/features/rehab-motion/components/motion-rehabilitation-view";

export const metadata: Metadata = {
  title: "Pelacak Gerak Rehabilitasi",
  description: "Pelacak gerak rehabilitasi berbasis kamera NeuroCare.",
  robots: { index: false, follow: false },
};

export default function RecoveryActivityPage() {
  return <MotionRehabilitationView />;
}
