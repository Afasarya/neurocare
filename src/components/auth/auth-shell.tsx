import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-neuro-cream px-4 py-8 sm:py-14">
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-[0_24px_80px_rgb(36_55_70/0.08)] lg:grid-cols-[0.9fr_1.1fr]">
        <section className="bg-neuro-slate p-8 text-white sm:p-12">
          <Link href="/" className="focus-ring inline-flex items-center gap-3 rounded-full font-semibold">
            <Image src="/icons/neurocare-mark.svg" width={36} height={36} alt="" className="rounded-xl" />
            NeuroCare
          </Link>
          <div className="mt-16 max-w-md">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-neuro-olive">Pemantauan terpandu</p>
            <h2 className="mt-4 text-3xl font-medium tracking-[-0.04em] sm:text-4xl">Data kesehatan tetap milikmu.</h2>
            <p className="mt-5 leading-7 text-white/70">NeuroCare membantu mencatat dan memahami informasi kesehatan. Bukan alat diagnosis atau pengganti tenaga kesehatan.</p>
          </div>
        </section>
        <section className="p-7 sm:p-12">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Akun NeuroCare</p>
          <h1 className="mt-3 text-3xl font-medium tracking-[-0.045em] text-neuro-slate sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">{description}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-7 border-t pt-6 text-sm text-muted-foreground">{footer}</div>
        </section>
      </div>
    </main>
  );
}
