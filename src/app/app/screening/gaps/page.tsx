import type { Metadata } from "next";
import { ScreeningGapsView } from "@/features/screening-gaps/components/screening-gaps-view";

export const metadata: Metadata = {
  title: "Gap Pemeriksaan",
  description: "Lihat data kesehatan yang belum tersedia dan sumber aturan tindak lanjut.",
  robots: { index: false, follow: false },
};

export default function ScreeningGapsPage() {
  return <ScreeningGapsView />;
}
