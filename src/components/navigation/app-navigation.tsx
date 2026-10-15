"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Accessibility,
  Activity,
  Brain,
  CalendarRange,
  ChartNoAxesCombined,
  ClipboardCheck,
  HeartPulse,
  HelpCircle,
  History,
  House,
  ListChecks,
  ListTodo,
  MessageSquareText,
  Sparkles,
  User,
  UsersRound,
} from "lucide-react";
import type { ComponentType } from "react";

interface NavItemProps {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  isMobile?: boolean;
}

function NavItem({ href, label, icon: Icon, isMobile = false }: NavItemProps) {
  const pathname = usePathname();
  const isActive =
    pathname === href || (href !== "/app/dashboard" && pathname.startsWith(`${href}/`));

  if (isMobile) {
    return (
      <Link
        href={href}
        className={`focus-ring grid min-w-14 place-items-center gap-1 rounded-full px-2 py-2 text-[0.65rem] transition-colors ${
          isActive
            ? "bg-neuro-green font-semibold text-neuro-slate"
            : "text-muted-foreground hover:bg-muted"
        }`}
        aria-current={isActive ? "page" : undefined}
      >
        <Icon className="size-4" />
        <span className="truncate max-w-[4.5rem]">{label}</span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`focus-ring flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-colors ${
        isActive
          ? "bg-neuro-green font-semibold text-neuro-slate"
          : "text-muted-foreground hover:bg-muted hover:text-neuro-slate"
      }`}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon className="size-4 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

interface AppNavigationProps {
  showCommunication?: boolean;
  showCognitive?: boolean;
  showCaregiver?: boolean;
}

export function AppSidebarNav({
  showCommunication = false,
  showCognitive = false,
  showCaregiver = false,
}: AppNavigationProps) {
  return (
    <nav
      className="sticky top-20 grid gap-1 rounded-3xl border border-black/5 bg-white p-3 max-h-[calc(100vh_-_6rem)] overflow-y-auto"
      aria-label="Navigasi aplikasi"
    >
      <NavItem href="/app/dashboard" label="Dashboard" icon={House} />

      <div className="my-1.5 px-3 pt-2 text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground/80">
        NeuroPrevent
      </div>
      <NavItem href="/app/screening" label="Skrining" icon={ClipboardCheck} />
      <NavItem href="/app/pulse-monitor" label="Monitor detak" icon={HeartPulse} />
      <NavItem href="/app/insights" label="Insight kesehatan" icon={Sparkles} />
      <NavItem href="/app/screening/gaps" label="Gap pemeriksaan" icon={ListChecks} />
      <NavItem href="/app/screening/history" label="Riwayat" icon={History} />

      <div className="my-1.5 px-3 pt-2 text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground/80">
        NeuroRecovery
      </div>
      <NavItem href="/app/recovery" label="Check-in pemulihan" icon={Accessibility} />
      <NavItem href="/app/recovery/activity" label="Pelacak gerak" icon={Activity} />
      <NavItem href="/app/recovery/progress" label="Progress pemulihan" icon={ChartNoAxesCombined} />
      {showCommunication && (
        <NavItem
          href="/app/recovery/communication"
          label="Kartu komunikasi"
          icon={MessageSquareText}
        />
      )}
      {showCognitive && (
        <NavItem
          href="/app/recovery/cognitive-activity"
          label="Aktivitas kognitif"
          icon={Brain}
        />
      )}

      <div className="my-1.5 px-3 pt-2 text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground/80">
        Bersama
      </div>
      <NavItem href="/app/timeline" label="Timeline kesehatan" icon={CalendarRange} />
      <NavItem href="/app/action-plan" label="Rencana tindakan" icon={ListTodo} />
      <NavItem href="/app/profile" label="Profil & Privasi" icon={User} />
      <NavItem href="/app/help" label="Pusat Bantuan" icon={HelpCircle} />
      {showCaregiver && (
        <NavItem href="/app/caregiver" label="Caregiver" icon={UsersRound} />
      )}
    </nav>
  );
}

export function AppMobileNav() {
  return (
    <nav
      className="sticky bottom-3 z-40 mx-auto mb-3 flex w-[calc(100%_-_1rem)] max-w-xl items-center justify-start overflow-x-auto rounded-full border border-black/5 bg-white/95 p-1.5 shadow-lg backdrop-blur lg:hidden"
      aria-label="Navigasi bawah"
    >
      <NavItem href="/app/dashboard" label="Home" icon={House} isMobile />
      <NavItem href="/app/screening" label="Skrining" icon={ClipboardCheck} isMobile />
      <NavItem href="/app/recovery" label="Recovery" icon={Accessibility} isMobile />
      <NavItem href="/app/timeline" label="Timeline" icon={CalendarRange} isMobile />
      <NavItem href="/app/action-plan" label="Rencana" icon={ListTodo} isMobile />
      <NavItem href="/app/profile" label="Profil" icon={User} isMobile />
      <NavItem href="/app/help" label="Bantuan" icon={HelpCircle} isMobile />
    </nav>
  );
}
