import Link from "next/link";
import { AlertTriangle, HelpCircle, PhoneCall, Stethoscope } from "lucide-react";

export const metadata = {
  title: "Pusat Bantuan & Panduan Darurat",
  description: "Panduan tanggap darurat gejala stroke dan informasi penggunaan NeuroCare.",
};

export default function HelpPage() {
  return (
    <main className="space-y-6">
      {/* Emergency Alert Banner */}
      <section className="rounded-[2rem] border border-red-200 bg-[#fff1f1] p-6 sm:p-8" aria-labelledby="emergency-heading">
        <div className="flex items-start gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-red-600 text-white">
            <AlertTriangle className="size-6" />
          </div>
          <div>
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-red-700">
              Perhatian Medis Darurat
            </span>
            <h1 id="emergency-heading" className="mt-2 text-2xl font-bold text-red-950 sm:text-3xl">
              Apakah Anda atau seseorang di sekitar mengalami gejala stroke akut?
            </h1>
            <p className="mt-2 text-sm leading-6 text-red-800">
              <strong>NeuroCare BUKAN layanan gawat darurat dan tidak menggantikan diagnosis dokter.</strong> Segera hubungi ambulans atau datangi Instalasi Gawat Darurat (IGD) rumah sakit terdekat jika menemukan gejala berikut:
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white p-4 border border-red-200">
                <p className="font-bold text-red-900">1. Wajah Mencong</p>
                <p className="mt-1 text-xs text-red-750">Senyum tidak simetris atau sudut bibir turun sebelah.</p>
              </div>
              <div className="rounded-2xl bg-white p-4 border border-red-200">
                <p className="font-bold text-red-900">2. Kelemahan Lengan</p>
                <p className="mt-1 text-xs text-red-750">Satu tangan atau kaki tiba-tiba lemas, baal, atau tidak bisa diangkat.</p>
              </div>
              <div className="rounded-2xl bg-white p-4 border border-red-200">
                <p className="font-bold text-red-900">3. Bicara Pelo / Terganggu</p>
                <p className="mt-1 text-xs text-red-750">Sulit bicara, perkataan tidak jelas, atau tidak paham perkataan orang lain.</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="tel:119"
                className="focus-ring inline-flex min-h-12 items-center gap-2 rounded-full bg-red-600 px-6 text-sm font-semibold text-white hover:bg-red-700"
              >
                <PhoneCall className="size-4" />
                Telepon Ambulans Darurat (119)
              </a>
              <a
                href="tel:112"
                className="focus-ring inline-flex min-h-12 items-center gap-2 rounded-full border border-red-300 bg-white px-6 text-sm font-semibold text-red-900 hover:bg-red-50"
              >
                <PhoneCall className="size-4" />
                Layanan Darurat Nasional (112)
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Guide to Using NeuroCare */}
      <section className="rounded-[2rem] border border-black/5 bg-white p-6 sm:p-8" aria-labelledby="guide-heading">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-2xl bg-neuro-cream text-neuro-slate">
            <Stethoscope className="size-5" />
          </div>
          <div>
            <h2 id="guide-heading" className="text-xl font-semibold text-neuro-slate">
              Memahami Jalur Layanan NeuroCare
            </h2>
            <p className="text-xs text-muted-foreground">Pilih fitur yang sesuai dengan kebutuhan kesehatan Anda</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-neuro-cream p-5">
            <span className="font-mono text-xs uppercase tracking-wider text-neuro-slate font-semibold">Jalur 1 · NeuroPrevent</span>
            <h3 className="mt-2 text-base font-semibold text-neuro-slate">Pencegahan Dini & Skrining Faktor Risiko</h3>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Ditujukan bagi individu yang ingin mengetahui profil faktor risiko kardiovaskular 10 tahun (usia 40–59 tahun) atau parameter dasar (18–39 tahun). Skrining ini menghitung estimasi risiko dan memandu Anda mencatat tekanan darah atau kolesterol yang belum pernah diperiksa.
            </p>
            <Link
              href="/app/screening"
              className="focus-ring mt-4 inline-flex items-center text-xs font-semibold text-neuro-slate hover:underline"
            >
              Mulai Skrining Preventif →
            </Link>
          </div>

          <div className="rounded-2xl bg-neuro-cream p-5">
            <span className="font-mono text-xs uppercase tracking-wider text-neuro-slate font-semibold">Jalur 2 · NeuroRecovery</span>
            <h3 className="mt-2 text-base font-semibold text-neuro-slate">Pemantauan Pemulihan Pascastroke</h3>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Ditujukan bagi penyintas stroke yang sedang menjalani pemulihan di rumah. Anda dapat mengisi check-in harian/mingguan dan melacak progres latihan gerak tanpa perlu mengkhawatirkan skor atau evaluasi yang menghakimi.
            </p>
            <Link
              href="/app/recovery"
              className="focus-ring mt-4 inline-flex items-center text-xs font-semibold text-neuro-slate hover:underline"
            >
              Buka Check-in Pemulihan →
            </Link>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="rounded-[2rem] border border-black/5 bg-white p-6 sm:p-8" aria-labelledby="faq-heading">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-2xl bg-neuro-cream text-neuro-slate">
            <HelpCircle className="size-5" />
          </div>
          <div>
            <h2 id="faq-heading" className="text-xl font-semibold text-neuro-slate">
              Pertanyaan yang Sering Diajukan (FAQ)
            </h2>
            <p className="text-xs text-muted-foreground">Keamanan data, privasi, dan batasan teknologi</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <article className="rounded-2xl bg-[#fafafa] p-5">
            <h3 className="font-semibold text-neuro-slate">Apakah data kesehatan saya aman dan terisolasi?</h3>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Ya. Setiap data kesehatan Anda (tekanan darah, rencana tindakan, check-in) dilindungi dengan Row Level Security (RLS) di tingkat database PostgreSQL. Pengguna lain tidak memiliki akses untuk melihat, membaca, atau memodifikasi data Anda.
            </p>
          </article>

          <article className="rounded-2xl bg-[#fafafa] p-5">
            <h3 className="font-semibold text-neuro-slate">Bagaimana AI digunakan di NeuroCare?</h3>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              AI hanya digunakan sebagai alat bantu analisis rekomendasi gaya hidup dengan persetujuan eksplisit Anda. NeuroCare tidak menggunakan AI untuk membuat diagnosis medis langsung. Anda dapat mencabut izin AI kapan saja di halaman Profil, dan aplikasi akan beralih ke template terstruktur secara aman.
            </p>
          </article>

          <article className="rounded-2xl bg-[#fafafa] p-5">
            <h3 className="font-semibold text-neuro-slate">Bisakah saya menghapus atau mengekspor data saya?</h3>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Bisa. Di halaman <Link href="/app/profile" className="font-semibold text-neuro-slate underline">Profil</Link>, Anda dapat mengunduh seluruh salinan data kesehatan dalam format JSON atau melakukan penghapusan akun permanen yang akan menghapus seluruh data secara berjenjang (<code>ON DELETE CASCADE</code>).
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
