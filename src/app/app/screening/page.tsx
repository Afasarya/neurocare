import type { Metadata } from "next";
import { ScreeningFlow } from "@/features/screening/components/screening-flow";

export const metadata: Metadata = {
  title: "Skrining Faktor Risiko",
  description: "Alur NeuroPrevent untuk mencatat faktor risiko dan kelengkapan pemeriksaan.",
  robots: { index: false, follow: false },
};

export default function ScreeningPage() {
  return <ScreeningFlow />;
}
