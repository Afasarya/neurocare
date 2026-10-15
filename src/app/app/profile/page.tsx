"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Bot, Download, FileText, HeartPulse, LoaderCircle, ShieldCheck, Trash2, User } from "lucide-react";

interface ProfileData {
  user: {
    id: string;
    email: string;
    createdAt: string;
  };
  profile: {
    preferred_pathway: "neuroprevent" | "neurorecovery" | null;
    locale: string;
    created_at: string;
    updated_at: string;
  };
}

interface ConsentData {
  consents: {
    coreHealthProcessing: boolean;
    externalAi: boolean;
    camera: boolean;
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [consents, setConsents] = useState<ConsentData["consents"] | null>(null);
  const [pathway, setPathway] = useState<"neuroprevent" | "neurorecovery" | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingPathway, setSavingPathway] = useState(false);
  const [togglingAi, setTogglingAi] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteInputText, setDeleteInputText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [profileRes, consentRes] = await Promise.all([
          fetch("/api/profile"),
          fetch("/api/consent"),
        ]);
        if (profileRes.ok) {
          const profileJson = await profileRes.json();
          setProfile(profileJson);
          setPathway(profileJson.profile?.preferred_pathway ?? null);
        }
        if (consentRes.ok) {
          const consentJson = await consentRes.json();
          setConsents(consentJson.consents);
        }
      } catch (err) {
        console.error("Gagal memuat profil:", err);
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, []);

  async function handleSavePathway(selected: "neuroprevent" | "neurorecovery") {
    setSavingPathway(true);
    setMessage(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferredPathway: selected }),
      });
      if (res.ok) {
        setPathway(selected);
        setMessage("Jalur preferensi berhasil diperbarui.");
      }
    } catch {
      setMessage("Gagal menyimpan preferensi jalur.");
    } finally {
      setSavingPathway(false);
    }
  }

  async function handleToggleAiConsent() {
    if (!consents) return;
    setTogglingAi(true);
    setMessage(null);
    const newAction = consents.externalAi ? "withdrawn" : "granted";
    try {
      const res = await fetch("/api/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose: "external_ai",
          action: newAction,
          policyVersion: "v1.0",
        }),
      });
      if (res.ok) {
        setConsents({
          ...consents,
          externalAi: newAction === "granted",
        });
        setMessage(
          newAction === "granted"
            ? "Persetujuan AI eksternal telah diaktifkan."
            : "Persetujuan AI eksternal telah dicabut. Semua request AI berikutnya akan diblokir otomatis.",
        );
      }
    } catch {
      setMessage("Gagal memperbarui persetujuan AI.");
    } finally {
      setTogglingAi(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteInputText !== "HAPUS AKUN SAYA") return;
    setDeleting(true);
    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmationText: deleteInputText }),
      });
      if (res.ok) {
        router.push("/login?deleted=true");
      } else {
        const errorJson = await res.json();
        setMessage(errorJson.message || "Gagal menghapus akun.");
      }
    } catch {
      setMessage("Terjadi kesalahan koneksi saat menghapus akun.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <main className="grid min-h-[50vh] place-items-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle className="size-5 animate-spin" />
          Memuat data profil…
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      {/* Header */}
      <div className="rounded-[2rem] bg-white p-6 sm:p-8">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#486452]">
          <ShieldCheck className="size-4" />
          Kontrol Privasi & Akun
        </div>
        <h1 className="mt-3 text-3xl font-medium tracking-[-0.045em] text-neuro-slate sm:text-4xl">
          Profil & Pengaturan Data
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Kelola jalur utama, izin pemrosesan AI, ekspor catatan medis mandiri, dan penghapusan akun.
        </p>

        {message && (
          <div className="mt-4 rounded-2xl bg-neuro-green/40 p-4 text-sm font-medium text-neuro-slate">
            {message}
          </div>
        )}
      </div>

      {/* Account Info */}
      <section className="rounded-[2rem] border border-black/5 bg-white p-6 sm:p-8" aria-labelledby="account-heading">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-2xl bg-neuro-cream text-neuro-slate">
            <User className="size-5" />
          </div>
          <div>
            <h2 id="account-heading" className="text-lg font-semibold text-neuro-slate">
              Informasi Akun
            </h2>
            <p className="text-xs text-muted-foreground">Identitas login Anda di NeuroCare</p>
          </div>
        </div>

        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-neuro-cream p-4">
            <dt className="text-xs text-muted-foreground">Alamat Email</dt>
            <dd className="mt-1 font-semibold text-neuro-slate break-all">{profile?.user.email ?? "—"}</dd>
          </div>
          <div className="rounded-2xl bg-neuro-cream p-4">
            <dt className="text-xs text-muted-foreground">User ID (Owner Scope)</dt>
            <dd className="mt-1 font-mono text-xs text-neuro-slate break-all">{profile?.user.id ?? "—"}</dd>
          </div>
        </dl>
      </section>

      {/* Preferred Pathway */}
      <section className="rounded-[2rem] border border-black/5 bg-white p-6 sm:p-8" aria-labelledby="pathway-heading">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-2xl bg-neuro-cream text-neuro-slate">
            <HeartPulse className="size-5" />
          </div>
          <div>
            <h2 id="pathway-heading" className="text-lg font-semibold text-neuro-slate">
              Jalur Utama Layanan
            </h2>
            <p className="text-xs text-muted-foreground">Sesuaikan fokus navigasi Anda</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => handleSavePathway("neuroprevent")}
            disabled={savingPathway}
            className={`focus-ring rounded-2xl border p-5 text-left transition ${
              pathway === "neuroprevent"
                ? "border-neuro-slate bg-neuro-green font-semibold"
                : "border-black/10 bg-white hover:bg-neuro-cream"
            }`}
          >
            <span className="font-mono text-xs uppercase tracking-wider text-neuro-slate">NeuroPrevent</span>
            <p className="mt-2 text-base font-semibold text-neuro-slate">Pencegahan Dini Stroke</p>
            <p className="mt-1 text-xs text-neuro-slate/70">
              Skrining terpandu faktor risiko CVD 10 tahun dan rencana tindakan mandiri.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleSavePathway("neurorecovery")}
            disabled={savingPathway}
            className={`focus-ring rounded-2xl border p-5 text-left transition ${
              pathway === "neurorecovery"
                ? "border-neuro-slate bg-neuro-blue font-semibold"
                : "border-black/10 bg-white hover:bg-neuro-cream"
            }`}
          >
            <span className="font-mono text-xs uppercase tracking-wider text-neuro-slate">NeuroRecovery</span>
            <p className="mt-2 text-base font-semibold text-neuro-slate">Pemantauan Pemulihan</p>
            <p className="mt-1 text-xs text-neuro-slate/70">
              Check-in berkala pascastroke, pelacak gerak, dan grafik progres mandiri.
            </p>
          </button>
        </div>
      </section>

      {/* Consent Management (Append-Only) */}
      <section className="rounded-[2rem] border border-black/5 bg-white p-6 sm:p-8" aria-labelledby="consent-heading">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-2xl bg-neuro-cream text-neuro-slate">
            <Bot className="size-5" />
          </div>
          <div>
            <h2 id="consent-heading" className="text-lg font-semibold text-neuro-slate">
              Persetujuan & Pemrosesan AI
            </h2>
            <p className="text-xs text-muted-foreground">
              Rekam jejak persetujuan bersifat append-only untuk audit kepatuhan privasi
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl bg-neuro-cream p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-neuro-slate">Analisis Rekomendasi oleh AI Eksternal</p>
              <p className="mt-1 text-xs text-muted-foreground max-w-xl">
                Bila dimatikan, request ke model AI pihak ketiga akan langsung diblokir dan NeuroCare hanya menggunakan template rekomendasi deterministik standar.
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleAiConsent}
              disabled={togglingAi}
              className={`focus-ring min-h-11 shrink-0 rounded-full px-5 text-xs font-semibold transition ${
                consents?.externalAi
                  ? "bg-neuro-slate text-white hover:bg-neuro-slate/90"
                  : "border border-black/15 bg-white text-neuro-slate hover:bg-neuro-cream"
              }`}
            >
              {togglingAi
                ? "Memperbarui…"
                : consents?.externalAi
                ? "Aktif (Klik untuk Cabut)"
                : "Nonaktif (Klik untuk Izinkan)"}
            </button>
          </div>

          <div className="flex flex-col gap-2 rounded-2xl border border-black/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-neuro-slate">Pemrosesan Data Kesehatan Utama</p>
              <p className="text-xs text-muted-foreground">
                Diperlukan untuk menyimpan tekanan darah, berat, tinggi, dan rencana tindakan di bawah isolasi RLS akun Anda.
              </p>
            </div>
            <span className="rounded-full bg-neuro-green/60 px-3 py-1 font-mono text-[0.65rem] font-semibold text-neuro-slate">
              Aktif
            </span>
          </div>
        </div>
      </section>

      {/* Data Export & Account Deletion */}
      <section className="rounded-[2rem] border border-black/5 bg-white p-6 sm:p-8" aria-labelledby="data-heading">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-2xl bg-neuro-cream text-neuro-slate">
            <FileText className="size-5" />
          </div>
          <div>
            <h2 id="data-heading" className="text-lg font-semibold text-neuro-slate">
              Hak & Kontrol Data (UU PDP)
            </h2>
            <p className="text-xs text-muted-foreground">Portabilitas data dan hak penghapusan akun secara aman</p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-black/5 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-neuro-slate">Ekspor Salinan Data Kesehatan</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Unduh seluruh riwayat pengukuran, catatan check-in, dan rencana tindakan dalam format terstruktur JSON.
              </p>
            </div>
            <a
              href="/api/profile/export"
              download
              className="focus-ring inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-neuro-slate/20 bg-white px-5 text-xs font-semibold text-neuro-slate hover:bg-neuro-cream"
            >
              <Download className="size-4" />
              Unduh Data (JSON)
            </a>
          </div>

          {/* Danger Zone */}
          <div className="rounded-2xl border border-red-200 bg-red-50/50 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900">Penghapusan Akun & Data Permanen</h3>
                <p className="mt-1 text-xs leading-5 text-red-700">
                  Tindakan ini memanfaatkan aturan cascade database (<code>ON DELETE CASCADE</code>). Seluruh data profil, pengukuran, dan riwayat kesehatan akan terhapus secara permanen dan tidak dapat dipulihkan.
                </p>

                {!deleteConfirmOpen ? (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmOpen(true)}
                    className="focus-ring mt-4 inline-flex min-h-10 items-center gap-2 rounded-full bg-red-600 px-4 text-xs font-semibold text-white hover:bg-red-700"
                  >
                    <Trash2 className="size-3.5" />
                    Hapus Akun Saya
                  </button>
                ) : (
                  <div className="mt-4 space-y-3 rounded-xl border border-red-300 bg-white p-4">
                    <p className="text-xs font-semibold text-red-900">
                      Ketik <span className="font-mono font-bold text-red-700">HAPUS AKUN SAYA</span> untuk konfirmasi:
                    </p>
                    <input
                      type="text"
                      value={deleteInputText}
                      onChange={(e) => setDeleteInputText(e.target.value)}
                      placeholder="HAPUS AKUN SAYA"
                      className="focus-ring w-full rounded-xl border border-red-300 px-3 py-2 text-xs"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        disabled={deleteInputText !== "HAPUS AKUN SAYA" || deleting}
                        className="focus-ring rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {deleting ? "Menghapus…" : "Konfirmasi Hapus Permanen"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteConfirmOpen(false);
                          setDeleteInputText("");
                        }}
                        className="focus-ring rounded-full border border-black/10 px-4 py-2 text-xs font-semibold text-neuro-slate hover:bg-neuro-cream"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
