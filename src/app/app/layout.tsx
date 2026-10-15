import Image from "next/image";
import Link from "next/link";
import { ClipboardCheck, HeartPulse, History, House, ListChecks, Sparkles } from "lucide-react";
import { AppQueryProvider } from "@/components/providers/app-query-provider";

export default function AppLayout({ children }: LayoutProps<"/app">) {
  return (
    <AppQueryProvider>
      <div className="min-h-screen bg-[#f4f6f2]">
      <header className="border-b border-black/5 bg-white">
        <div className="page-shell flex min-h-18 items-center justify-between gap-4 py-3">
          <Link href="/" className="focus-ring flex items-center gap-2.5 rounded-full font-semibold text-neuro-slate">
            <Image src="/icons/neurocare-mark.svg" width={34} height={34} alt="" className="rounded-xl" />
            NeuroCare
          </Link>
          <span className="rounded-full bg-neuro-green px-3 py-1.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-neuro-slate">
            NeuroPrevent
          </span>
        </div>
      </header>
      <div className="page-shell grid gap-6 py-6 lg:grid-cols-[15rem_1fr] lg:py-8">
        <aside className="hidden lg:block">
          <nav className="sticky top-6 grid gap-1 rounded-3xl border border-black/5 bg-white p-3" aria-label="Navigasi NeuroPrevent">
            <Link href="/" className="focus-ring flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-muted-foreground hover:bg-muted"><House className="size-4" />Beranda</Link>
            <Link href="/app/screening" className="focus-ring flex items-center gap-3 rounded-2xl bg-neuro-green px-4 py-3 text-sm font-semibold text-neuro-slate"><ClipboardCheck className="size-4" />Skrining</Link>
            <Link href="/app/pulse-monitor" className="focus-ring flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-muted-foreground hover:bg-muted"><HeartPulse className="size-4" />Monitor detak</Link>
            <Link href="/app/insights" className="focus-ring flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-muted-foreground hover:bg-muted"><Sparkles className="size-4" />Insight kesehatan</Link>
            <Link href="/app/screening/gaps" className="focus-ring flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-muted-foreground hover:bg-muted"><ListChecks className="size-4" />Gap pemeriksaan</Link>
            <Link href="/app/screening/history" className="focus-ring flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-muted-foreground hover:bg-muted"><History className="size-4" />Riwayat</Link>
          </nav>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
      <nav className="sticky bottom-3 z-40 mx-auto mb-3 flex w-[calc(100%_-_1rem)] max-w-lg items-center justify-around rounded-full border border-black/5 bg-white/95 p-2 shadow-lg backdrop-blur lg:hidden" aria-label="Navigasi bawah">
        <Link href="/" className="focus-ring grid min-w-12 place-items-center gap-1 rounded-full px-1 py-2 text-[0.6rem] text-muted-foreground"><House className="size-4" />Beranda</Link>
        <Link href="/app/screening" className="focus-ring grid min-w-12 place-items-center gap-1 rounded-full bg-neuro-green px-1 py-2 text-[0.6rem] font-semibold text-neuro-slate"><ClipboardCheck className="size-4" />Skrining</Link>
        <Link href="/app/pulse-monitor" className="focus-ring grid min-w-12 place-items-center gap-1 rounded-full px-1 py-2 text-[0.6rem] text-muted-foreground"><HeartPulse className="size-4" />Detak</Link>
        <Link href="/app/insights" className="focus-ring grid min-w-12 place-items-center gap-1 rounded-full px-1 py-2 text-[0.6rem] text-muted-foreground"><Sparkles className="size-4" />Insight</Link>
        <Link href="/app/screening/gaps" className="focus-ring grid min-w-12 place-items-center gap-1 rounded-full px-1 py-2 text-[0.6rem] text-muted-foreground"><ListChecks className="size-4" />Gap</Link>
        <Link href="/app/screening/history" className="focus-ring grid min-w-12 place-items-center gap-1 rounded-full px-1 py-2 text-[0.6rem] text-muted-foreground"><History className="size-4" />Riwayat</Link>
      </nav>
      </div>
    </AppQueryProvider>
  );
}
