import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import {
  WordsPullUp,
  WordsPullUpMultiStyle,
  AnimatedParagraph,
} from "@/components/animated";
import { SiteNav } from "@/components/site-nav";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OmniDispatch — Autonomous Critical Infrastructure Orchestration" },
      {
        name: "description",
        content:
          "Three agents. One decision. Zero unauthorized actions. OmniDispatch detects, analyzes, and resolves critical infrastructure incidents in under three seconds.",
      },
      { property: "og:title", content: "OmniDispatch" },
      {
        property: "og:description",
        content: "Autonomous multi-agent orchestration for critical infrastructure.",
      },
    ],
  }),
  component: Landing,
});

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4";

function Hero() {
  return (
    <section className="h-screen p-4 md:p-6">
      <div className="relative w-full h-full rounded-2xl md:rounded-[2rem] overflow-hidden bg-black">
        <video
          src={VIDEO_URL}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-blue-950/40 mix-blend-color pointer-events-none" />
        <div className="absolute inset-0 scanline-overlay opacity-[0.45] mix-blend-overlay pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70 pointer-events-none" />

        <SiteNav variant="overlay" />


        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-10 z-10">
          <div className="grid grid-cols-12 gap-4 md:gap-6 items-end">
            <div className="col-span-12 lg:col-span-8">
              <WordsPullUp
                text="OmniDispatch"
                className="text-[11vw] sm:text-[9vw] md:text-[7.5vw] lg:text-[6.5vw] xl:text-[6vw] 2xl:text-[5.5vw] font-medium leading-[0.85] tracking-[-0.05em]"
              />
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="mt-4 max-w-xl text-frost/60 text-sm sm:text-base font-mono leading-relaxed"
              >
                Autonomous multi-agent orchestration for critical infrastructure. Detect, analyze, resolve — in under three seconds.
              </motion.p>
            </div>

            <div className="col-span-12 lg:col-span-4 flex flex-col gap-5 lg:pb-6">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="font-mono text-[10px] sm:text-xs md:text-sm space-y-1"
                style={{ lineHeight: 1.7 }}
              >
                <div className="flex justify-between gap-4">
                  <span style={{ color: "rgba(200, 216, 232, 0.3)" }}>AGENTS ACTIVE</span>
                  <span style={{ color: "rgba(200, 216, 232, 0.8)" }}>03 / 03</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span style={{ color: "rgba(200, 216, 232, 0.3)" }}>INCIDENTS QUEUED</span>
                  <span style={{ color: "rgba(200, 216, 232, 0.8)" }}>
                    01 — HIGH SEVERITY
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span style={{ color: "rgba(200, 216, 232, 0.3)" }}>HITL STATUS</span>
                  <span className="text-signal animate-pulse">AWAITING APPROVAL</span>
                </div>
              </motion.div>

              <Link to="/control-room">
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="group bg-signal rounded-full pl-5 pr-1.5 py-1.5 flex items-center gap-2 hover:gap-3 transition-all text-black font-medium text-sm sm:text-base w-fit cursor-pointer"
                >
                  <span>Authorize Dispatch</span>
                  <span className="bg-black rounded-full w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center transition-transform group-hover:scale-110">
                    <ArrowRight className="w-4 h-4 text-white" />
                  </span>
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section className="bg-black px-4 md:px-6 py-20 md:py-32">
      <div className="bg-[#0A0D10] border border-frost/5 rounded-2xl max-w-6xl mx-auto px-6 sm:px-10 md:px-16 py-16 md:py-24 text-center">
        <div className="text-signal text-[10px] sm:text-xs font-mono tracking-[0.25em] mb-8">
          SYSTEM ARCHITECTURE
        </div>

        <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl max-w-3xl mx-auto leading-[0.95] sm:leading-[0.9]">
          <WordsPullUpMultiStyle
            segments={[
              { text: "OmniDispatch detects,", className: "font-normal" },
              {
                text: "analyzes, and resolves.",
                className: "font-mono text-frost/60",
              },
              {
                text: "Three agents. One decision. Zero unauthorized actions.",
                className: "font-normal",
              },
            ]}
          />
        </div>

        <div className="mt-12 md:mt-16 max-w-3xl mx-auto">
          <AnimatedParagraph
            className="text-xs sm:text-sm md:text-base leading-relaxed"
            text="Built for utility operations centers, telecom NOCs, and municipal emergency management teams — OmniDispatch ingests raw IoT telemetry, cross-references it against regulatory compliance indexes via Foundry IQ, and routes certified field technicians in under three seconds. Every dispatch is logged. Every decision is auditable. Every action requires human authorization."
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  index,
  children,
  className = "",
}: {
  index: number;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <motion.div
      ref={ref}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={inView ? { scale: 1, opacity: 1 } : {}}
      transition={{ duration: 0.7, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
      className={`relative rounded-2xl overflow-hidden ${className}`}
    >
      {children}
    </motion.div>
  );
}

function ChecklistCard({
  number,
  title,
  icon,
  items,
  accent = false,
}: {
  number: string;
  title: string;
  icon: string;
  items: string[];
  accent?: boolean;
}) {
  return (
    <div
      className={`bg-[#0F1318] h-full p-5 sm:p-6 flex flex-col ${
        accent ? "border-l-2 border-signal/40" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-5">
        <img
          src={icon}
          alt=""
          className="w-10 h-10 sm:w-12 sm:h-12 rounded object-cover"
        />
        <span className="text-frost/20 font-mono text-4xl font-bold leading-none">
          {number}
        </span>
      </div>
      <h3 className="text-frost text-lg sm:text-xl font-medium mb-5 leading-tight">
        {title}
      </h3>
      <ul className="space-y-3 flex-1">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2.5 text-xs sm:text-sm text-gray-400 leading-relaxed">
            <Check className="w-4 h-4 text-signal flex-shrink-0 mt-0.5" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
      <a
        href="#"
        className="mt-6 inline-flex items-center gap-2 text-xs sm:text-sm font-mono text-frost/70 hover:text-frost transition-colors"
      >
        Learn more
        <ArrowRight className="w-4 h-4" style={{ transform: "rotate(-45deg)" }} />
      </a>
    </div>
  );
}

function Features() {
  return (
    <section className="min-h-screen bg-black relative px-4 md:px-6 py-20 md:py-32">
      <div className="absolute inset-0 bg-grid opacity-[0.1] pointer-events-none" />
      <div className="relative max-w-7xl mx-auto">
        <div className="text-center mb-12 md:mb-16 space-y-2">
          <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-normal">
            <WordsPullUpMultiStyle
              segments={[
                {
                  text: "Enterprise-grade orchestration for critical infrastructure.",
                  className: "text-frost",
                },
              ]}
            />
          </div>
          <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-normal">
            <WordsPullUpMultiStyle
              segments={[
                {
                  text: "Built for regulated industries. Engineered for zero-trust environments.",
                  className: "text-gray-500",
                },
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-2 md:gap-1 lg:h-[480px]">
          {/* Card 1 — Video */}
          <FeatureCard index={0} className="min-h-[320px] lg:min-h-0">
            <div className="relative w-full h-full bg-black">
              <video
                src={VIDEO_URL}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-blue-950/40 mix-blend-color" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 space-y-2">
                <div className="font-mono text-[10px] tracking-widest text-signal">
                  ● LIVE TELEMETRY
                </div>
                <div className="text-frost text-lg sm:text-xl font-medium leading-tight">
                  Real-time incident stream.
                </div>
              </div>
            </div>
          </FeatureCard>

          <FeatureCard index={1}>
            <ChecklistCard
              number="01"
              title="Concurrent Agent Reasoning."
              icon="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260405_171918_4a5edc79-d78f-4637-ac8b-53c43c220606.png&w=1280&q=85"
              items={[
                "Analysis Agent parses IoT telemetry and classifies incident severity",
                "Policy Agent retrieves applicable regulatory codes via Foundry IQ",
                "Logistics Agent calculates certified technician proximity and ETA",
                "Aggregator synthesises all three outputs — no extra LLM call",
              ]}
            />
          </FeatureCard>

          <FeatureCard index={2}>
            <ChecklistCard
              number="02"
              title="Foundry IQ Compliance Grounding."
              icon="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260405_171741_ed9845ab-f5b2-4018-8ce7-07cc01823522.png&w=1280&q=85"
              items={[
                "Azure AI Search hybrid vector/keyword index with semantic reranking",
                "Entra ID Managed Identity — keyless auth, zero credential exposure",
                "Permission-aware retrieval: union SLAs, municipal codes, vendor SLAs",
              ]}
            />
          </FeatureCard>

          <FeatureCard index={3}>
            <ChecklistCard
              number="03"
              title="Human-in-the-Loop Governance."
              icon="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260405_171809_f56666dc-c099-4778-ad82-9ad4f209567b.png&w=1280&q=85"
              accent
              items={[
                "approval_mode='always_require' — execution graph halts, no exceptions",
                "Every dispatch event logged with operator identity and timestamp",
                "Full OpenTelemetry trace exported to Azure Application Insights",
              ]}
            />
          </FeatureCard>
        </div>
      </div>
    </section>
  );
}

function Landing() {
  return (
    <main className="bg-black min-h-screen">
      <Hero />
      <About />
      <Features />
    </main>
  );
}
