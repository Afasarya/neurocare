import Image from "next/image";
import {
  Activity, ArrowDown, ArrowRight, BrainCircuit, CalendarCheck2, Check,
  ClipboardCheck, Clock3, HeartHandshake, HeartPulse, LineChart, ListChecks,
  LockKeyhole, MessageCircleHeart, MonitorSmartphone, MoveUpRight, NotepadText,
  ShieldCheck, Sparkles, Stethoscope, UserRoundCheck,
} from "lucide-react";
import { InstallPwaCard } from "@/components/marketing/install-pwa-card";
import { CtaLink, Eyebrow, FeatureCard, SectionHeader, StatusDot } from "@/components/shared/marketing-primitives";

const values = [
  [ShieldCheck, "Pantau lebih awal", "Catat faktor risiko dan lihat data pemeriksaan apa yang masih perlu dilengkapi."],
  [BrainCircuit, "Insight yang mudah dipahami", "Dapatkan penjelasan pendukung berbasis data yang tersedia, bukan diagnosis."],
  [HeartHandshake, "Dukung kesinambungan pemulihan", "Simpan check-in, aktivitas, dan tindak lanjut pemulihan dalam satu alur."],
  [MonitorSmartphone, "Ringan dan mudah diakses", "Buka dari browser atau pasang ke layar utama tanpa unduhan app store."],
] as const;

const features = [
  { icon: ClipboardCheck, title: "Smart Risk Screening", description: "Alur skrining terstruktur dengan pemeriksaan kelengkapan data dan batas penggunaan yang jelas.", tone: "green" as const },
  { icon: ListChecks, title: "Screening Gap Intelligence", description: "Menunjukkan pemeriksaan yang belum tercatat agar pengguna tahu langkah berikutnya." },
  { icon: MessageCircleHeart, title: "AI Health Insight", description: "Membantu menjelaskan hasil yang sudah tersedia dengan bahasa sederhana dan transparan.", tone: "blue" as const },
  { icon: UserRoundCheck, title: "Recovery Check-in", description: "Catatan mandiri mengenai aktivitas dan pengalaman pemulihan, lengkap dengan waktu pencatatan." },
  { icon: LineChart, title: "Recovery Progress", description: "Ringkasan tren check-in dan aktivitas tanpa mengubahnya menjadi penilaian klinis." },
  { icon: CalendarCheck2, title: "Timeline & Action Planner", description: "Satukan riwayat, agenda pemeriksaan, dan tindak lanjut supaya lebih mudah dipantau.", tone: "green" as const },
  { icon: HeartPulse, title: "Camera PPG", description: "Eksplorasi pengukuran denyut jantung berbasis kamera dengan kualitas sinyal dan persetujuan pengguna.", status: "Beta", tone: "blue" as const },
  { icon: Activity, title: "Motion Rehab Tracker", description: "Eksplorasi pencatatan gerak untuk satu aktivitas yang disetujui, bukan penilaian klinis pemulihan.", status: "Beta" },
] as const;

export function HeroSection() {
  return (
    <section id="beranda" className="overflow-hidden pb-10 pt-8 sm:pb-16 sm:pt-10 lg:pb-24">
      <div className="page-shell">
        <div className="grid min-h-[calc(100svh-8rem)] items-stretch overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-sm lg:grid-cols-[0.94fr_1.06fr]">
          <div className="flex flex-col px-6 py-10 sm:px-10 sm:py-14 lg:px-12 lg:py-16">
            <Eyebrow>Care that keeps moving</Eyebrow>
            <h1 className="mt-7 max-w-3xl text-balance text-[clamp(2.8rem,6vw,5.6rem)] font-medium leading-[0.96] tracking-[-0.065em] text-neuro-slate">
              Pantau lebih awal. Dukung pemulihan <span className="rounded-2xl bg-neuro-green px-2">berkelanjutan.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">NeuroCare membantu pengguna usia produktif dan penyintas stroke tetap terhubung dengan skrining, insight pendukung, serta tindak lanjut kesehatan dalam satu PWA.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <CtaLink href="/register">Mulai dengan akun</CtaLink>
              <CtaLink href="#cara-kerja" variant="secondary">Jelajahi Cara Kerja</CtaLink>
            </div>
            <div className="mt-auto grid gap-4 border-t border-black/5 pt-8 sm:grid-cols-2 lg:mt-12">
              <StatusDot label="Mobile-first & installable" /><StatusDot label="Dua jalur pendampingan" />
              <StatusDot label="Privasi sebagai fondasi" /><StatusDot label="Bukan alat diagnosis" />
            </div>
          </div>
          <div className="relative min-h-[32rem] overflow-hidden bg-neuro-blue lg:min-h-full">
            <Image src="/images/landing/neurocare-telehealth-hero.jpg" alt="Seorang pengguna mengikuti percakapan kesehatan melalui tablet di rumah" fill priority sizes="(min-width: 1024px) 52vw, 100vw" className="object-cover object-[64%_center]" />
            <div className="absolute inset-0 bg-gradient-to-t from-neuro-slate/35 via-transparent to-transparent" />
            <div className="absolute left-4 top-4 rounded-2xl border border-white/50 bg-white/90 p-4 shadow-lg backdrop-blur sm:left-7 sm:top-7">
              <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-neuro-green text-neuro-slate"><ShieldCheck className="size-5" /></span><div><p className="text-xs text-muted-foreground">Data kesehatan</p><p className="text-sm font-semibold text-neuro-slate">Tetap dalam kendali Anda</p></div></div>
            </div>
            <div className="absolute bottom-5 left-4 right-4 grid gap-3 sm:bottom-7 sm:left-auto sm:right-7 sm:w-80">
              <div className="rounded-2xl border border-white/60 bg-white/92 p-4 shadow-lg backdrop-blur"><div className="flex items-center justify-between gap-4"><div><p className="text-xs text-muted-foreground">Tindak lanjut berikutnya</p><p className="mt-1 text-sm font-semibold text-neuro-slate">Lengkapi catatan kesehatan</p></div><ArrowRight className="size-5 text-neuro-slate" /></div></div>
              <div className="rounded-2xl border border-white/20 bg-neuro-slate/92 p-4 text-white shadow-lg backdrop-blur"><div className="flex items-center gap-3"><Sparkles className="size-5 text-neuro-olive" /><div><p className="text-xs text-white/55">Insight pendukung</p><p className="text-sm font-medium">Jelas, transparan, dapat ditinjau</p></div></div></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ValueHighlights() {
  return (
    <section aria-labelledby="value-title" className="pb-14 pt-6 sm:pb-24"><div className="page-shell">
      <div className="mb-8 flex items-end justify-between gap-6"><div><p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">Satu ruang, dua perjalanan</p><h2 id="value-title" className="mt-2 text-2xl font-medium tracking-[-0.035em] text-neuro-slate sm:text-3xl">Dibuat untuk langkah kesehatan yang lebih terarah.</h2></div><ArrowDown className="hidden size-6 text-muted-foreground sm:block" /></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{values.map(([Icon, title, text], index) => <article key={title} className="rounded-3xl border border-black/5 bg-white p-6"><div className="flex items-center justify-between"><span className="grid size-10 place-items-center rounded-2xl bg-neuro-green/70 text-neuro-slate"><Icon className="size-5" /></span><span className="font-mono text-xs text-muted-foreground">0{index + 1}</span></div><h3 className="mt-8 text-lg font-medium text-neuro-slate">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></article>)}</div>
    </div></section>
  );
}

export function HowItWorks() {
  const steps = [
    ["01", "Pilih perjalanan", "Mulai melalui NeuroPrevent atau NeuroRecovery sesuai riwayat dan kebutuhan Anda."],
    ["02", "Catat dengan jelas", "Isi skrining atau check-in dengan data yang Anda ketahui—tanpa menebak data yang belum ada."],
    ["03", "Pahami konteks", "Lihat gap data, penjelasan pendukung, serta batas penggunaan setiap informasi."],
    ["04", "Lanjutkan aksi", "Pantau rencana tindak lanjut, aktivitas, dan riwayat dari waktu ke waktu."],
  ] as const;
  return (
    <section id="cara-kerja" className="section-space border-y border-black/5 bg-neuro-slate text-white"><div className="page-shell"><div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
      <div className="lg:sticky lg:top-28 lg:self-start"><Eyebrow tone="neutral">Cara kerja</Eyebrow><h2 className="mt-5 text-balance text-3xl font-medium tracking-[-0.045em] sm:text-4xl lg:text-5xl">Langkah kecil yang tetap terhubung.</h2><p className="mt-5 max-w-md leading-7 text-white/65">NeuroCare merapikan perjalanan dari pencatatan awal menuju aksi lanjutan—tanpa menggantikan tenaga kesehatan.</p></div>
      <ol className="divide-y divide-white/10 border-y border-white/10">{steps.map(([number, title, text]) => <li key={number} className="grid gap-4 py-7 sm:grid-cols-[4rem_0.65fr_1fr] sm:items-start sm:gap-8"><span className="font-mono text-sm text-neuro-olive">{number}</span><h3 className="text-xl font-medium tracking-[-0.025em]">{title}</h3><p className="max-w-md text-sm leading-6 text-white/60">{text}</p></li>)}</ol>
    </div></div></section>
  );
}

export function FeatureShowcase() {
  return (
    <section id="fitur" className="section-space"><div className="page-shell">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"><SectionHeader eyebrow="Fitur inti" title="Satu platform, dari pemantauan hingga tindak lanjut." description="Setiap fitur dirancang untuk membuat data dan langkah berikutnya lebih mudah dipahami—dengan batas klinis yang tetap jelas." /><p className="max-w-xs text-sm leading-6 text-muted-foreground">Fitur beta adalah eksplorasi dan tidak digunakan untuk diagnosis atau penilaian klinis.</p></div>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{features.map((feature) => <FeatureCard key={feature.title} {...feature} />)}</div>
    </div></section>
  );
}

function JourneyPanel({ id, eyebrow, title, audience, items, tone, icon: Icon }: { id: string; eyebrow: string; title: string; audience: string; items: string[]; tone: "green" | "blue"; icon: typeof ShieldCheck }) {
  return (
    <article id={id} className={`rounded-[2rem] border border-black/5 p-7 sm:p-10 ${tone === "green" ? "bg-neuro-green" : "bg-neuro-blue"}`}>
      <div className="flex items-start justify-between gap-6"><Eyebrow tone="neutral">{eyebrow}</Eyebrow><span className="grid size-12 place-items-center rounded-2xl bg-white/80 text-neuro-slate"><Icon className="size-5" /></span></div>
      <h3 className="mt-12 max-w-lg text-3xl font-medium tracking-[-0.045em] text-neuro-slate sm:text-4xl">{title}</h3><p className="mt-5 max-w-lg leading-7 text-neuro-slate/65">{audience}</p>
      <ul className="mt-10 grid gap-3 border-t border-neuro-slate/10 pt-7 sm:grid-cols-2">{items.map((item) => <li key={item} className="flex items-center gap-3 text-sm font-medium text-neuro-slate"><Check className="size-4" />{item}</li>)}</ul>
    </article>
  );
}

export function DualJourneySection() {
  return (
    <section className="section-space bg-white"><div className="page-shell"><SectionHeader eyebrow="Dua perjalanan" title="Mulai dari konteks Anda, bukan dari asumsi." description="Riwayat stroke atau TIA tidak dimasukkan ke jalur perhitungan risiko primer. NeuroCare memisahkan kedua perjalanan agar tindak lanjut tetap relevan." align="center" />
      <div className="mt-12 grid gap-5 lg:grid-cols-2"><JourneyPanel id="neuroprevent" eyebrow="NeuroPrevent" title="Kenali faktor risiko dan gap pemeriksaan lebih awal." audience="Untuk pengguna usia produktif tanpa riwayat stroke, TIA, atau penyakit kardiovaskular yang ingin lebih teratur memantau kesehatan." items={["Skrining terstruktur", "Gap pemeriksaan", "Insight pendukung", "Rencana tindak lanjut"]} tone="green" icon={ShieldCheck} /><JourneyPanel id="neurorecovery" eyebrow="NeuroRecovery" title="Jaga kesinambungan catatan selama pemulihan." audience="Untuk pengguna pascastroke dan pendamping yang membutuhkan ruang sederhana untuk check-in, aktivitas, dan tindak lanjut." items={["Recovery check-in", "Ringkasan aktivitas", "Tren pencatatan", "Timeline pemulihan"]} tone="blue" icon={HeartHandshake} /></div>
    </div></section>
  );
}

export function WhyItMatters() {
  const reasons = [
    [NotepadText, "Data kesehatan sering terpencar", "Catatan pemeriksaan, agenda, dan tindak lanjut sulit dilihat sebagai satu rangkaian."],
    [Stethoscope, "Pemeriksaan belum selalu lengkap", "Pengguna perlu mengetahui data mana yang belum ada tanpa menerima angka yang ditebak."],
    [Clock3, "Kesinambungan butuh dukungan", "Check-in sederhana membantu perjalanan pemulihan tetap tercatat dari waktu ke waktu."],
  ] as const;
  return (
    <section className="section-space"><div className="page-shell grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-end"><SectionHeader eyebrow="Mengapa ini penting" title="Kesehatan lebih mudah ditindaklanjuti saat informasinya tidak terputus." description="NeuroCare membantu merapikan informasi yang pengguna masukkan sendiri dan mengarahkannya ke langkah lanjutan yang jelas. Bukan diagnosis, bukan pengganti konsultasi." />
      <div className="grid gap-3">{reasons.map(([Icon, title, text], index) => <article key={title} className="grid gap-4 rounded-3xl border border-black/5 bg-white p-5 sm:grid-cols-[3.25rem_1fr_auto] sm:items-center sm:p-6"><span className="grid size-12 place-items-center rounded-2xl bg-neuro-green/65 text-neuro-slate"><Icon className="size-5" /></span><div><h3 className="font-medium text-neuro-slate">{title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p></div><span className="hidden font-mono text-xs text-muted-foreground sm:block">0{index + 1}</span></article>)}</div>
    </div></section>
  );
}

function MiniTrend() {
  const bars = [34, 44, 38, 58, 52, 66, 73, 62, 78, 84, 75, 90];
  return <div className="mt-6 flex h-24 items-end gap-1.5" aria-label="Ilustrasi tren frekuensi pencatatan">{bars.map((height, index) => <span key={`${height}-${index}`} className="flex-1 rounded-t-full bg-neuro-olive" style={{ height: `${height}%` }} />)}</div>;
}

export function ProductPreviewSection() {
  return (
    <section id="product-preview" className="section-space overflow-hidden bg-neuro-green/60"><div className="page-shell">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"><SectionHeader eyebrow="Preview produk" title="Dari informasi menjadi aksi yang terlihat." description="Pratinjau antarmuka berikut menggunakan konten ilustratif, bukan data pasien atau hasil medis nyata." /><span className="w-fit rounded-full border border-neuro-slate/10 bg-white/70 px-3 py-1.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-neuro-slate">Demo / simulasi</span></div>
      <div className="mt-12 rounded-[2.25rem] border border-white/80 bg-[#edf3ea] p-3 shadow-xl sm:p-5 lg:p-7"><div className="grid gap-4 lg:grid-cols-[0.72fr_1.28fr]">
        <aside className="rounded-[1.7rem] bg-neuro-slate p-6 text-white"><div className="flex items-center gap-3"><Image src="/icons/neurocare-mark.svg" width={34} height={34} alt="" className="rounded-xl" /><span className="font-semibold">NeuroCare</span></div><p className="mt-12 text-xs uppercase tracking-[0.16em] text-white/45">Ringkasan hari ini</p><h3 className="mt-3 text-2xl font-medium tracking-[-0.035em]">Selamat datang. Apa yang ingin Anda lanjutkan?</h3><div className="mt-8 space-y-2">{["Dashboard", "Skrining", "Pemulihan", "Timeline", "Profil"].map((item, index) => <div key={item} className={`rounded-2xl px-4 py-3 text-sm ${index === 0 ? "bg-white text-neuro-slate" : "text-white/60"}`}>{item}</div>)}</div><div className="mt-10 rounded-2xl bg-white/10 p-4 text-xs leading-5 text-white/65"><LockKeyhole className="mb-3 size-4 text-neuro-olive" />Data pribadi hanya tampil setelah pengguna terautentikasi.</div></aside>
        <div className="grid gap-4 sm:grid-cols-2"><article className="rounded-[1.7rem] bg-white p-6 sm:col-span-2"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs text-muted-foreground">Timeline kesehatan</p><h3 className="mt-1 text-xl font-medium text-neuro-slate">Kebiasaan mencatat, terlihat dari waktu ke waktu.</h3></div><StatusDot label="Tersinkron saat online" /></div><MiniTrend /><p className="mt-3 text-xs text-muted-foreground">Grafik ilustratif frekuensi pencatatan • bukan indikator perbaikan klinis</p></article>
          <article className="rounded-[1.7rem] bg-neuro-blue p-6"><div className="flex items-center justify-between"><span className="grid size-10 place-items-center rounded-2xl bg-white"><ListChecks className="size-5" /></span><span className="font-mono text-[0.65rem] uppercase tracking-wider text-neuro-slate/55">Action plan</span></div><h3 className="mt-9 text-xl font-medium text-neuro-slate">Lengkapi data tekanan darah</h3><p className="mt-3 text-sm leading-6 text-neuro-slate/65">Belum ada data. Catat hasil pengukuran dari alat yang sesuai atau konsultasikan dengan tenaga kesehatan.</p></article>
          <article className="rounded-[1.7rem] bg-white p-6"><div className="flex items-center justify-between"><span className="grid size-10 place-items-center rounded-2xl bg-neuro-green"><Sparkles className="size-5" /></span><span className="font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">AI insight</span></div><h3 className="mt-9 text-xl font-medium text-neuro-slate">Konteks, bukan keputusan.</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">Penjelasan AI bersifat pendukung dan tidak mengubah hasil deterministik atau arahan darurat.</p></article>
        </div>
      </div></div>
    </div></section>
  );
}

export function InstallSection() {
  return (
    <section id="install" className="section-space bg-white"><div className="page-shell grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center"><div><SectionHeader eyebrow="Instal PWA" title="Selalu dekat, tanpa memenuhi ruang ponsel." description="NeuroCare dapat dibuka dari browser dan dipasang ke layar utama. Pengalaman tetap dirancang jelas dan nyaman di layar kecil." /><div className="mt-8 grid gap-3 sm:grid-cols-2">{["Buka langsung dari browser", "Tambahkan ke layar utama", "Tampilan mobile-first", "Status offline yang jujur"].map((item) => <div key={item} className="flex items-center gap-3 rounded-2xl bg-neuro-cream p-4 text-sm font-medium text-neuro-slate"><Check className="size-4" />{item}</div>)}</div></div><div className="mx-auto w-full max-w-lg rounded-[2.5rem] bg-neuro-green/55 p-3 sm:p-6"><InstallPwaCard /></div></div></section>
  );
}

const faqs = [
  ["Apa itu NeuroCare?", "NeuroCare adalah prototipe PWA edukasi dan monitoring untuk membantu pencatatan faktor risiko terkait stroke, kelengkapan pemeriksaan, tindak lanjut, dan aktivitas pemulihan."],
  ["Siapa yang dapat menggunakan NeuroCare?", "NeuroPrevent ditujukan untuk pengguna tanpa riwayat stroke/TIA/CVD, sedangkan NeuroRecovery mendukung pencatatan bagi pengguna pascastroke dan pendampingnya."],
  ["Apakah NeuroCare merupakan alat diagnosis medis?", "Tidak. NeuroCare bukan alat diagnosis, alat triase darurat, atau pengganti konsultasi tenaga kesehatan. Gejala mendadak yang mengarah ke stroke membutuhkan bantuan darurat segera."],
  ["Bisakah NeuroCare dipasang di ponsel?", "Ya. Sebagai PWA, NeuroCare dapat dibuka lewat browser lalu ditambahkan ke layar utama pada browser dan perangkat yang mendukung."],
  ["Apakah NeuroCare mendukung pencatatan pemulihan?", "Ya. NeuroRecovery dirancang untuk check-in mandiri, pencatatan aktivitas, ringkasan tren, dan tindak lanjut. Catatan tersebut bukan penilaian klinis pemulihan."],
  ["Apakah Camera PPG menggantikan alat medis?", "Tidak. Fitur beta Camera PPG hanya diarahkan untuk estimasi denyut jantung saat kualitas sinyal memadai. Fitur ini tidak mengukur tekanan darah, mendeteksi aritmia, atau memprediksi stroke."],
] as const;

export function FAQSection() {
  return (
    <section id="faq" className="section-space"><div className="page-shell grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20"><div><SectionHeader eyebrow="FAQ" title="Pertanyaan yang sering muncul." description="Batas penggunaan dibuat jelas agar NeuroCare tetap membantu tanpa memberi kesan klinis yang keliru." /></div><div className="divide-y divide-black/10 border-y border-black/10">{faqs.map(([question, answer]) => <details key={question} className="group py-1"><summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-6 rounded-2xl px-2 py-5 text-base font-medium text-neuro-slate marker:hidden sm:text-lg">{question}<span className="grid size-8 shrink-0 place-items-center rounded-full bg-white transition group-open:rotate-45"><MoveUpRight className="size-4" /></span></summary><p className="max-w-2xl px-2 pb-6 pr-12 text-sm leading-7 text-muted-foreground">{answer}</p></details>)}</div></div></section>
  );
}

export function FinalCTA() {
  return (
    <section className="px-4 pb-4"><div className="mx-auto max-w-[88rem] overflow-hidden rounded-[2rem] bg-neuro-slate text-white"><div className="page-shell section-space grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-end"><div><Eyebrow tone="neutral">Mulai dengan tenang</Eyebrow><h2 className="mt-6 max-w-4xl text-balance text-4xl font-medium leading-[1.02] tracking-[-0.055em] sm:text-5xl lg:text-7xl">Mulai dari pencegahan. Lanjutkan dengan dukungan.</h2></div><div><p className="max-w-md leading-7 text-white/65">Jelajahi bagaimana NeuroCare menyatukan pencatatan, insight pendukung, dan tindak lanjut dalam pengalaman yang mudah diakses.</p><div className="mt-7 flex flex-col gap-3 sm:flex-row"><CtaLink href="/register" variant="secondary">Buat akun</CtaLink><CtaLink href="#install" variant="ghost" className="border-white/15 bg-white/10 text-white hover:bg-white/15">Instal PWA</CtaLink></div></div></div></div></section>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-neuro-slate px-4 pb-8 pt-16 text-white"><div className="page-shell"><div className="grid gap-12 border-b border-white/10 pb-12 md:grid-cols-[1.3fr_0.7fr_0.7fr]"><div><div className="flex items-center gap-3"><Image src="/icons/neurocare-mark.svg" width={38} height={38} alt="" className="rounded-xl" /><span className="text-xl font-semibold">NeuroCare</span></div><p className="mt-5 max-w-md text-sm leading-6 text-white/55">Platform PWA untuk membantu pencatatan faktor risiko, tindak lanjut kesehatan, serta perjalanan pemulihan pascastroke.</p></div><div><h3 className="text-sm font-semibold">Jelajahi</h3><nav className="mt-4 grid gap-3 text-sm text-white/55" aria-label="Navigasi footer"><a href="#fitur" className="hover:text-white">Fitur</a><a href="#cara-kerja" className="hover:text-white">Cara kerja</a><a href="#product-preview" className="hover:text-white">Demo produk</a><a href="#faq" className="hover:text-white">FAQ</a></nav></div><div><h3 className="text-sm font-semibold">Perjalanan</h3><div className="mt-4 grid gap-3 text-sm text-white/55"><a href="#neuroprevent" className="hover:text-white">NeuroPrevent</a><a href="#neurorecovery" className="hover:text-white">NeuroRecovery</a><a href="#install" className="hover:text-white">Instal PWA</a></div></div></div><div className="flex flex-col gap-4 pt-7 text-xs leading-5 text-white/45 sm:flex-row sm:items-start sm:justify-between"><p>© 2026 NeuroCare. Prototipe edukasi dan monitoring.</p><p className="max-w-2xl sm:text-right">NeuroCare bukan alat diagnosis atau pengganti tenaga kesehatan. Untuk gejala mendadak yang mengarah ke stroke, segera cari bantuan darurat setempat atau fasilitas kesehatan terdekat.</p></div></div></footer>
  );
}
