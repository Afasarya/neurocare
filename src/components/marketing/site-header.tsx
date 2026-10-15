"use client";

import Image from "next/image";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CtaLink } from "@/components/shared/marketing-primitives";

const navItems = [
  ["Fitur", "#fitur"],
  ["Cara kerja", "#cara-kerja"],
  ["NeuroPrevent", "#neuroprevent"],
  ["NeuroRecovery", "#neurorecovery"],
  ["FAQ", "#faq"],
] as const;

export function Brand() {
  return (
    <a
      href="#beranda"
      className="focus-ring inline-flex items-center gap-2.5 rounded-full text-lg font-semibold tracking-[-0.03em] text-neuro-slate"
      aria-label="NeuroCare, kembali ke beranda"
    >
      <Image
        src="/icons/neurocare-mark.svg"
        width={32}
        height={32}
        alt=""
        className="size-8 rounded-xl"
      />
      NeuroCare
    </a>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-[#f8f8f2]/85 backdrop-blur-xl">
      <div className="page-shell flex min-h-20 items-center justify-between gap-4">
        <Brand />

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Navigasi utama">
          {navItems.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="focus-ring rounded-full text-sm text-muted-foreground transition hover:text-neuro-slate"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          <CtaLink href="/login" variant="ghost" className="min-h-10 px-4">
            Masuk
          </CtaLink>
          <CtaLink href="/register" variant="primary" className="min-h-10 px-4">
            Daftar
          </CtaLink>
        </div>

        <Sheet>
          <SheetTrigger
            className="focus-ring inline-grid size-11 place-items-center rounded-full border border-neuro-slate/10 bg-white text-neuro-slate lg:hidden"
            aria-label="Buka menu navigasi"
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent className="w-[min(88vw,24rem)] bg-neuro-cream p-2">
            <SheetHeader className="border-b border-black/5 px-4 py-5">
              <SheetTitle>
                <Brand />
              </SheetTitle>
              <SheetDescription>Pilih bagian yang ingin Anda jelajahi.</SheetDescription>
            </SheetHeader>
            <nav className="flex flex-col p-3" aria-label="Navigasi seluler">
              {navItems.map(([label, href]) => (
                <SheetClose
                  key={href}
                  render={<a href={href} />}
                  className="focus-ring rounded-2xl px-4 py-3.5 text-left text-lg font-medium text-neuro-slate hover:bg-white"
                >
                  {label}
                </SheetClose>
              ))}
            </nav>
            <div className="mt-auto grid gap-2 p-3">
              <CtaLink href="/login" variant="ghost">
                Masuk
              </CtaLink>
              <CtaLink href="/register">Daftar</CtaLink>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
