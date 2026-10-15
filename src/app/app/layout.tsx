import Image from "next/image";
import Link from "next/link";
import { HelpCircle, User } from "lucide-react";
import { connection } from "next/server";
import { AppQueryProvider } from "@/components/providers/app-query-provider";
import { getCommunicationRehabNavigationItem } from "@/features/communication-rehab/communication-rehab.flags";
import { getCognitiveActivityNavigationItem } from "@/features/cognitive-activities/cognitive-activity.flags";
import { getCaregiverNavigationItem } from "@/features/caregiver/caregiver.flags";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AppMobileNav, AppSidebarNav } from "@/components/navigation/app-navigation";

export const instant = false;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = supabase
    ? await supabase.auth.getUser()
    : { data: { user: null } };

  if (!user) redirect("/login");

  const communicationRehabNavigation = getCommunicationRehabNavigationItem();
  const cognitiveActivityNavigation = getCognitiveActivityNavigationItem();
  const caregiverNavigation = getCaregiverNavigationItem();

  return (
    <AppQueryProvider>
      <div className="min-h-screen bg-[#f4f6f2]">
        <header className="border-b border-black/5 bg-white sticky top-0 z-30">
          <div className="page-shell flex min-h-16 items-center justify-between gap-4 py-2.5">
            <Link href="/" className="focus-ring flex items-center gap-2.5 rounded-full font-semibold text-neuro-slate">
              <Image src="/icons/neurocare-mark.svg" width={32} height={32} alt="" className="rounded-xl" />
              NeuroCare
            </Link>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/app/profile"
                className="focus-ring hidden sm:flex items-center gap-2 rounded-full border border-black/10 bg-neuro-cream/60 px-3 py-1.5 text-xs font-medium text-neuro-slate hover:bg-neuro-cream"
              >
                <User className="size-3.5" />
                <span className="max-w-[12rem] truncate">{user.email}</span>
              </Link>
              <Link
                href="/app/help"
                className="focus-ring grid size-9 place-items-center rounded-full border border-black/10 text-neuro-slate hover:bg-neuro-cream"
                title="Bantuan & Kontak Darurat"
                aria-label="Pusat Bantuan"
              >
                <HelpCircle className="size-4" />
              </Link>
              <form action="/api/auth/sign-out" method="post">
                <button
                  type="submit"
                  className="focus-ring min-h-9 rounded-full border border-neuro-slate/10 px-3.5 text-xs font-semibold text-neuro-slate hover:bg-muted"
                >
                  Keluar
                </button>
              </form>
            </div>
          </div>
        </header>

        <div className="page-shell grid gap-6 py-6 lg:grid-cols-[15rem_1fr] lg:py-8">
          <aside className="hidden lg:block">
            <AppSidebarNav
              showCommunication={Boolean(communicationRehabNavigation)}
              showCognitive={Boolean(cognitiveActivityNavigation)}
              showCaregiver={Boolean(caregiverNavigation)}
            />
          </aside>

          <div className="min-w-0 pb-16 lg:pb-0">{children}</div>
        </div>

        {/* Mobile bottom nav */}
        <AppMobileNav />
      </div>
    </AppQueryProvider>
  );
}
