import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/site-header";
import {
  DualJourneySection,
  FAQSection,
  FeatureShowcase,
  FinalCTA,
  HeroSection,
  HowItWorks,
  InstallSection,
  ProductPreviewSection,
  SiteFooter,
  ValueHighlights,
  WhyItMatters,
} from "@/components/marketing/landing-sections";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <>
      <a
        href="#konten-utama"
        className="focus-ring fixed left-4 top-4 z-[100] -translate-y-24 rounded-full bg-neuro-slate px-4 py-3 text-sm font-semibold text-white transition focus:translate-y-0"
      >
        Lewati ke konten utama
      </a>
      <SiteHeader />
      <main id="konten-utama">
        <HeroSection />
        <ValueHighlights />
        <HowItWorks />
        <FeatureShowcase />
        <DualJourneySection />
        <WhyItMatters />
        <ProductPreviewSection />
        <InstallSection />
        <FAQSection />
        <FinalCTA />
      </main>
      <SiteFooter />
    </>
  );
}
