"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Accessibility, Activity, Brain, CalendarRange, ChartNoAxesCombined,
  ClipboardCheck, HeartPulse, HelpCircle, History, House, ListChecks,
  ListTodo, Menu, MessageSquareText, Sparkles, User, UsersRound, X,
} from "lucide-react";
import type { ComponentType } from "react";
import {
  getMobilePrimaryActiveKey,
  getMostSpecificActiveHref,
  type MobilePrimaryKey,
} from "@/components/navigation/navigation-state";

type NavigationIcon = ComponentType<{ className?: string }>;
type NavigationItem = { href: string; label: string; icon: NavigationIcon };
type NavigationSection = { label: string | null; items: NavigationItem[] };

interface AppNavigationProps {
  showCommunication?: boolean;
  showCognitive?: boolean;
  showCaregiver?: boolean;
}

function getNavigationSections({
  showCommunication = false,
  showCognitive = false,
  showCaregiver = false,
}: AppNavigationProps): NavigationSection[] {
  return [
    { label: null, items: [{ href: "/app/dashboard", label: "Dashboard", icon: House }] },
    {
      label: "NeuroPrevent",
      items: [
        { href: "/app/screening", label: "Skrining", icon: ClipboardCheck },
        { href: "/app/pulse-monitor", label: "Monitor detak", icon: HeartPulse },
        { href: "/app/insights", label: "Insight kesehatan", icon: Sparkles },
        { href: "/app/screening/gaps", label: "Gap pemeriksaan", icon: ListChecks },
        { href: "/app/screening/history", label: "Riwayat", icon: History },
      ],
    },
    {
      label: "NeuroRecovery",
      items: [
        { href: "/app/recovery", label: "Check-in pemulihan", icon: Accessibility },
        { href: "/app/recovery/activity", label: "Pelacak gerak", icon: Activity },
        { href: "/app/recovery/progress", label: "Progress pemulihan", icon: ChartNoAxesCombined },
        ...(showCommunication ? [{ href: "/app/recovery/communication", label: "Kartu komunikasi", icon: MessageSquareText }] : []),
        ...(showCognitive ? [{ href: "/app/recovery/cognitive-activity", label: "Aktivitas kognitif", icon: Brain }] : []),
      ],
    },
    {
      label: "Bersama",
      items: [
        { href: "/app/timeline", label: "Timeline kesehatan", icon: CalendarRange },
        { href: "/app/action-plan", label: "Rencana tindakan", icon: ListTodo },
        { href: "/app/profile", label: "Profil & Privasi", icon: User },
        { href: "/app/help", label: "Pusat Bantuan", icon: HelpCircle },
        ...(showCaregiver ? [{ href: "/app/caregiver", label: "Caregiver", icon: UsersRound }] : []),
      ],
    },
  ];
}

function NavItem({ item, active, compact = false, onNavigate }: {
  item: NavigationItem;
  active: boolean;
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`focus-ring flex items-center gap-3 rounded-2xl text-sm transition-colors ${compact ? "min-h-11 px-3 py-2.5" : "px-4 py-3"} ${active ? "bg-neuro-green font-semibold text-neuro-slate" : "text-muted-foreground hover:bg-muted hover:text-neuro-slate"}`}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="size-4 shrink-0" />
      <span>{item.label}</span>
    </Link>
  );
}

function NavigationSections({ sections, onNavigate, compact = false }: {
  sections: NavigationSection[];
  onNavigate?: () => void;
  compact?: boolean;
}) {
  const pathname = usePathname();
  const hrefs = useMemo(() => sections.flatMap((section) => section.items.map((item) => item.href)), [sections]);
  const activeHref = getMostSpecificActiveHref(pathname, hrefs);

  return sections.map((section, index) => (
    <div key={section.label ?? "main"} className={index === 0 ? "" : "mt-2"}>
      {section.label ? <p className="px-3 pb-1.5 pt-2 text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground/80">{section.label}</p> : null}
      <div className="grid gap-1">
        {section.items.map((item) => <NavItem key={item.href} item={item} active={activeHref === item.href} compact={compact} onNavigate={onNavigate} />)}
      </div>
    </div>
  ));
}

export function AppSidebarNav(props: AppNavigationProps) {
  const sections = getNavigationSections(props);
  return (
    <nav className="sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-3xl border border-black/5 bg-white p-3" aria-label="Navigasi aplikasi">
      <NavigationSections sections={sections} />
    </nav>
  );
}

const primaryItems: Array<{ key: Exclude<MobilePrimaryKey, "menu">; item: NavigationItem }> = [
  { key: "home", item: { href: "/app/dashboard", label: "Home", icon: House } },
  { key: "prevent", item: { href: "/app/screening", label: "Prevent", icon: ClipboardCheck } },
  { key: "recovery", item: { href: "/app/recovery", label: "Recovery", icon: Accessibility } },
  { key: "timeline", item: { href: "/app/timeline", label: "Timeline", icon: CalendarRange } },
];

export function AppMobileNav(props: AppNavigationProps) {
  const pathname = usePathname();
  const activeKey = getMobilePrimaryActiveKey(pathname);
  const [open, setOpen] = useState(false);
  const sections = getNavigationSections(props);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <>
      <nav className="fixed inset-x-2 bottom-2 z-40 grid grid-cols-5 gap-1 rounded-[1.35rem] border border-black/5 bg-white/95 p-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-[0_12px_40px_rgb(36_55_70/0.16)] backdrop-blur lg:hidden" aria-label="Navigasi utama mobile">
        {primaryItems.map(({ key, item }) => {
          const Icon = item.icon;
          const active = activeKey === key;
          return <Link key={key} href={item.href} aria-current={active ? "page" : undefined} className={`focus-ring grid min-h-12 min-w-0 place-items-center gap-0.5 rounded-2xl px-1 py-1.5 text-[0.625rem] transition-colors ${active ? "bg-neuro-green font-semibold text-neuro-slate" : "text-muted-foreground"}`}><Icon className="size-4" /><span className="max-w-full truncate">{item.label}</span></Link>;
        })}
        <button type="button" onClick={() => setOpen(true)} aria-expanded={open} aria-controls="mobile-app-menu" className={`focus-ring grid min-h-12 min-w-0 place-items-center gap-0.5 rounded-2xl px-1 py-1.5 text-[0.625rem] transition-colors ${activeKey === "menu" || open ? "bg-neuro-green font-semibold text-neuro-slate" : "text-muted-foreground"}`}><Menu className="size-4" /><span>Menu</span></button>
      </nav>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-labelledby="mobile-menu-title">
          <button type="button" className="absolute inset-0 bg-neuro-slate/45 backdrop-blur-sm" aria-label="Tutup menu navigasi" onClick={() => setOpen(false)} />
          <section id="mobile-app-menu" className="absolute inset-x-0 bottom-0 max-h-[86dvh] overflow-y-auto overscroll-contain rounded-t-[2rem] bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-black/5 bg-white/95 pb-3 backdrop-blur">
              <div><p className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">Semua fitur</p><h2 id="mobile-menu-title" className="mt-1 text-lg font-semibold text-neuro-slate">Navigasi NeuroCare</h2></div>
              <button type="button" autoFocus onClick={() => setOpen(false)} className="focus-ring grid size-11 shrink-0 place-items-center rounded-full border border-black/10" aria-label="Tutup menu"><X className="size-5" /></button>
            </div>
            <nav className="py-3" aria-label="Semua navigasi aplikasi"><NavigationSections sections={sections} compact onNavigate={() => setOpen(false)} /></nav>
          </section>
        </div>
      ) : null}
    </>
  );
}
