import { type ReactNode } from "react";
import { SiteNav } from "./site-nav";
import { WordsPullUpMultiStyle } from "./animated";

export function PageShell({
  kicker,
  title,
  intro,
  children,
}: {
  kicker: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <main className="bg-black min-h-screen text-frost">
      <SiteNav variant="solid" />
      <section className="relative px-4 md:px-6 pt-16 md:pt-24 pb-12">
        <div className="absolute inset-0 bg-grid opacity-[0.08] pointer-events-none" />
        <div className="relative max-w-6xl mx-auto">
          <div className="text-signal text-[10px] sm:text-xs font-mono tracking-[0.3em] mb-6">
            {kicker}
          </div>
          <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl leading-[0.95] font-medium tracking-[-0.03em]">
            <WordsPullUpMultiStyle segments={[{ text: title, className: "text-frost" }]} />
          </div>
          <p className="mt-8 max-w-2xl text-frost/60 text-sm md:text-base leading-relaxed font-mono">
            {intro}
          </p>
        </div>
      </section>
      <section className="relative px-4 md:px-6 pb-24">
        <div className="relative max-w-6xl mx-auto">{children}</div>
      </section>
      <footer className="border-t border-frost/10 px-4 md:px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-[10px] sm:text-xs text-frost/40">
          <div>◆ OMNIDISPATCH // CONTROL PLANE v3.2.1</div>
          <div>© 2026 — ALL DISPATCHES AUDITED</div>
        </div>
      </footer>
    </main>
  );
}

export function Panel({
  label,
  title,
  children,
  accent = false,
}: {
  label?: string;
  title?: string;
  children: ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`bg-[#0A0D10] border border-frost/10 rounded-2xl p-6 md:p-8 ${
        accent ? "border-l-2 border-l-signal/60" : ""
      }`}
    >
      {label && (
        <div className="text-signal text-[10px] font-mono tracking-[0.25em] mb-3">{label}</div>
      )}
      {title && <h3 className="text-frost text-xl md:text-2xl font-medium mb-4">{title}</h3>}
      <div className="text-frost/70 text-sm md:text-base leading-relaxed space-y-3">
        {children}
      </div>
    </div>
  );
}
