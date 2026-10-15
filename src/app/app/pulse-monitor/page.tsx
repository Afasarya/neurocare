import type { Metadata } from "next";
import { PulseMonitor } from "@/features/ppg/components/pulse-monitor";

export const metadata: Metadata = {
  title: "Monitor Detak dengan Kamera",
  description: "Prototipe pengukuran detak jantung berbasis kamera NeuroPrevent.",
  robots: { index: false, follow: false },
};

export default function PulseMonitorPage() {
  return <PulseMonitor />;
}
