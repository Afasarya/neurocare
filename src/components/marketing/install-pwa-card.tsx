"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Check, Download, Share2, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const standaloneQuery = "(display-mode: standalone)";

function subscribeToStandalone(callback: () => void) {
  const media = window.matchMedia(standaloneQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function getStandaloneSnapshot() {
  return window.matchMedia(standaloneQuery).matches;
}

export function InstallPwaCard() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const standalone = useSyncExternalStore(
    subscribeToStandalone,
    getStandaloneSnapshot,
    () => false,
  );
  const [installedInSession, setInstalledInSession] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const installed = standalone || installedInSession;

  useEffect(() => {
    const handlePrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setInstalledInSession(true);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!installPrompt) {
      setShowHelp(true);
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setInstalledInSession(true);
    setInstallPrompt(null);
  }

  return (
    <div className="rounded-[2rem] border border-white/10 bg-neuro-slate p-6 text-white shadow-2xl sm:p-8">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-white/55">
            PWA siap di genggaman
          </p>
          <h3 className="mt-3 text-2xl font-medium tracking-[-0.035em]">
            Akses NeuroCare seperti aplikasi.
          </h3>
        </div>
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/10">
          <Smartphone className="size-5" aria-hidden="true" />
        </span>
      </div>

      <ul className="mt-7 grid gap-3 text-sm text-white/75">
        {["Dibuka langsung dari layar utama", "Dirancang mobile-first", "Tetap transparan saat koneksi terbatas"].map(
          (item) => (
            <li key={item} className="flex items-center gap-3">
              <Check className="size-4 text-neuro-olive" aria-hidden="true" />
              {item}
            </li>
          ),
        )}
      </ul>

      <button
        type="button"
        onClick={handleInstall}
        disabled={installed}
        className="focus-ring mt-8 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-neuro-green px-5 text-sm font-semibold text-neuro-slate transition hover:bg-neuro-olive disabled:cursor-default disabled:bg-white/15 disabled:text-white/70"
      >
        {installed ? <Check className="size-4" /> : <Download className="size-4" />}
        {installed ? "NeuroCare sudah terpasang" : "Instal NeuroCare"}
      </button>

      {showHelp && !installed ? (
        <p className="mt-4 flex gap-2 rounded-2xl bg-white/10 p-4 text-xs leading-5 text-white/75" role="status">
          <Share2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Jika tombol instal belum tersedia, buka menu browser lalu pilih “Instal aplikasi” atau “Tambahkan ke Layar Utama”.
        </p>
      ) : null}
    </div>
  );
}
