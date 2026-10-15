import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "NeuroCare — Pantau Lebih Awal, Dukung Pemulihan",
    template: "%s | NeuroCare",
  },
  description:
    "NeuroCare membantu pengguna memantau faktor risiko terkait stroke, melihat pemeriksaan yang belum lengkap, dan mencatat dukungan pemulihan dalam satu PWA.",
  applicationName: "NeuroCare",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/neurocare-mark.svg",
    apple: "/icons/neurocare-192.png",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    siteName: "NeuroCare",
    title: "NeuroCare — Pantau Lebih Awal, Dukung Pemulihan",
    description:
      "Satu pengalaman digital untuk pemantauan faktor risiko, tindak lanjut kesehatan, dan pencatatan pemulihan pascastroke.",
    images: [
      {
        url: "/images/landing/neurocare-telehealth-hero.jpg",
        width: 1672,
        height: 940,
        alt: "Pengguna NeuroCare mengikuti konsultasi kesehatan melalui tablet",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NeuroCare — Pantau Lebih Awal, Dukung Pemulihan",
    description:
      "PWA edukasi dan monitoring untuk perjalanan NeuroPrevent dan NeuroRecovery.",
    images: ["/images/landing/neurocare-telehealth-hero.jpg"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
