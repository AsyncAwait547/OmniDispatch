import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Panel } from "@/components/page-shell";
import { Activity, Shield, Database, Cpu, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/architecture")({
  head: () => ({
    meta: [
      { title: "Architecture — OmniDispatch" },
      {
        name: "description",
        content:
          "Inside the OmniDispatch control plane: concurrent agent reasoning, Foundry IQ grounding, and zero-trust execution graphs.",
      },
      { property: "og:title", content: "Architecture — OmniDispatch" },
      {
        property: "og:description",
        content: "Concurrent agent reasoning over a zero-trust execution graph.",
      },
    ],
  }),
  component: ArchitecturePage,
});

const LAYERS = [
  {
    code: "L4",
    name: "Aggregator",
    desc: "Synthesises analysis, policy, and logistics outputs into a single dispatch envelope. No additional LLM call.",
    icon: Cpu
  },
  {
    code: "L3",
    name: "Concurrent Agents",
    desc: "Analysis, Policy, and Logistics agents reason in parallel against a shared incident frame.",
    icon: Activity
  },
  {
    code: "L2",
    name: "Foundry IQ",
    desc: "Hybrid vector + keyword retrieval over regulatory codes, SLAs, and vendor contracts via Azure AI Search.",
    icon: Database
  },
  {
    code: "L1",
    name: "Telemetry Ingress",
    desc: "Raw IoT, SCADA, and NOC feeds normalised into incident frames. Per-tenant, per-region routing.",
    icon: Shield
  },
];

function ArchitecturePage() {
  return (
    <PageShell
      kicker="01 / CONTROL PLANE"
      title="Four layers. One execution graph."
      intro="OmniDispatch is built as a deterministic execution graph over a probabilistic reasoning core. Every stage is observable, every transition is logged."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {LAYERS.map((l, i) => {
          const Icon = l.icon;
          return (
            <Panel key={l.code} label={l.code} title={l.name} accent={i === 0}>
              <div className="flex gap-4 items-start">
                <div className="p-3 bg-frost/5 rounded-xl border border-frost/10">
                  <Icon className="w-5 h-5 text-signal" />
                </div>
                <p className="text-frost/70 text-sm leading-relaxed">{l.desc}</p>
              </div>
            </Panel>
          );
        })}
      </div>

      <div className="mt-12">
        <Panel label="DATAFLOW" title="Incident → Dispatch in < 3.0s">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 bg-black/60 border border-frost/5 rounded-2xl mt-4">
            {/* Step 1 */}
            <div className="flex flex-col items-center bg-[#0F1318] border border-frost/10 rounded-xl p-4 w-full md:w-44 text-center">
              <Database className="w-6 h-6 text-signal mb-2" />
              <div className="text-xs font-bold text-frost">Telemetry Ingress</div>
              <div className="text-[10px] text-frost/40 mt-1">IoT & SCADA feeds</div>
            </div>
            
            <ArrowRight className="w-5 h-5 text-frost/30 hidden md:block" />
            
            {/* Step 2 */}
            <div className="flex flex-col gap-2 w-full md:w-48">
              <div className="bg-[#0F1318]/80 border border-frost/10 rounded-xl px-3 py-2 text-center text-xs text-frost/70 font-mono">
                Analysis Agent (Severity)
              </div>
              <div className="bg-[#0F1318]/80 border border-frost/10 rounded-xl px-3 py-2 text-center text-xs text-frost/70 border-l-2 border-l-signal/60 font-mono">
                Policy Agent (Foundry IQ)
              </div>
              <div className="bg-[#0F1318]/80 border border-frost/10 rounded-xl px-3 py-2 text-center text-xs text-frost/70 font-mono">
                Logistics Agent (Workforce)
              </div>
            </div>
            
            <ArrowRight className="w-5 h-5 text-frost/30 hidden md:block" />
            
            {/* Step 3 */}
            <div className="flex flex-col items-center bg-[#0F1318] border border-frost/10 rounded-xl p-4 w-full md:w-44 text-center">
              <Cpu className="w-6 h-6 text-signal mb-2" />
              <div className="text-xs font-bold text-frost">Aggregator</div>
              <div className="text-[10px] text-frost/40 mt-1">Zero-latency merge</div>
            </div>
            
            <ArrowRight className="w-5 h-5 text-frost/30 hidden md:block" />
            
            {/* Step 4 */}
            <div className="flex flex-col items-center bg-[#0F1318] border border-signal/30 rounded-xl p-4 w-full md:w-44 text-center shadow-lg shadow-signal/5">
              <Shield className="w-6 h-6 text-signal mb-2 animate-pulse" />
              <div className="text-xs font-bold text-frost">HITL Signature Gate</div>
              <div className="text-[10px] text-frost/40 mt-1">Manual Authorization</div>
            </div>
          </div>
        </Panel>
      </div>
    </PageShell>
  );
}
