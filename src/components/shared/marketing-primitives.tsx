import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Eyebrow({
  children,
  tone = "green",
}: {
  children: React.ReactNode;
  tone?: "green" | "blue" | "neutral";
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.14em]",
        tone === "green" && "bg-neuro-green text-neuro-slate",
        tone === "blue" && "bg-neuro-blue text-neuro-slate",
        tone === "neutral" && "bg-white/75 text-neuro-slate",
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {children}
    </span>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center")}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-5 text-balance text-3xl font-medium tracking-[-0.045em] text-neuro-slate sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function CtaLink({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        "focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition duration-200 hover:-translate-y-0.5",
        variant === "primary" &&
          "bg-neuro-slate text-white shadow-sm hover:bg-[#182a38]",
        variant === "secondary" &&
          "bg-neuro-green text-neuro-slate hover:bg-neuro-olive",
        variant === "ghost" &&
          "border border-neuro-slate/15 bg-white/70 text-neuro-slate hover:bg-white",
        className,
      )}
    >
      {children}
      <ArrowUpRight className="size-4" aria-hidden="true" />
    </a>
  );
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  status,
  tone = "white",
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  status?: string;
  tone?: "white" | "green" | "blue";
}) {
  return (
    <article
      className={cn(
        "group flex min-h-64 flex-col rounded-3xl border border-black/5 p-6 transition duration-300 hover:-translate-y-1 hover:shadow-md sm:p-7",
        tone === "white" && "bg-white",
        tone === "green" && "bg-neuro-green/75",
        tone === "blue" && "bg-neuro-blue/80",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="grid size-11 place-items-center rounded-2xl bg-white text-neuro-slate shadow-sm">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        {status ? (
          <span className="rounded-full border border-neuro-slate/10 bg-white/70 px-2.5 py-1 font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-neuro-slate">
            {status}
          </span>
        ) : null}
      </div>
      <div className="mt-auto pt-10">
        <h3 className="text-xl font-medium tracking-[-0.025em] text-neuro-slate">
          {title}
        </h3>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
    </article>
  );
}

export function StatusDot({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-neuro-slate">
      <span className="size-2 rounded-full bg-[#5e8a68] ring-4 ring-[#5e8a68]/10" />
      {label}
    </span>
  );
}
