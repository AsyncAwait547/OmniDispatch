import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Panel } from "@/components/page-shell";

export const Route = createFileRoute("/agents")({
  head: () => ({
    meta: [
      { title: "Agents — OmniDispatch" },
      {
        name: "description",
        content:
          "Three specialised reasoning agents — Analysis, Policy, Logistics — coordinated by a deterministic aggregator.",
      },
      { property: "og:title", content: "Agents — OmniDispatch" },
      {
        property: "og:description",
        content: "Three specialised agents. One synthesised decision.",
      },
    ],
  }),
  component: AgentsPage,
});

const AGENTS = [
  {
    id: "AGT-01",
    name: "Analysis",
    role: "Telemetry classification + severity scoring",
    stack: ["GPT-4o · turbo path", "torch.compile inference", "5ms p99 cold start"],
  },
  {
    id: "AGT-02",
    name: "Policy",
    role: "Regulatory grounding via Foundry IQ",
    stack: ["Azure AI Search hybrid", "Entra ID Managed Identity", "Per-tenant permission scopes"],
  },
  {
    id: "AGT-03",
    name: "Logistics",
    role: "Certified technician routing + ETA",
    stack: ["Live workforce graph", "Geospatial OSRM", "SLA-aware proximity"],
  },
];

function AgentsPage() {
  return (
    <PageShell
      kicker="02 / REASONING MESH"
      title="Three agents. Concurrent. Specialised."
      intro="Each agent owns a narrow domain. They reason in parallel against a shared incident frame and return structured envelopes to the aggregator — no chain-of-agents latency."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {AGENTS.map((a, i) => (
          <Panel key={a.id} label={a.id} title={a.name} accent={i === 1}>
            <p className="text-frost/80">{a.role}</p>
            <ul className="mt-4 space-y-2 font-mono text-xs text-frost/50">
              {a.stack.map((s) => (
                <li key={s}>› {s}</li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>

      <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ["UPTIME", "99.997%"],
          ["P50 LATENCY", "1.4s"],
          ["P99 LATENCY", "2.8s"],
          ["DISPATCHES / DAY", "12.4K"],
        ].map(([k, v]) => (
          <div key={k} className="bg-[#0A0D10] border border-frost/10 rounded-xl p-5">
            <div className="text-[10px] font-mono tracking-widest text-frost/40">{k}</div>
            <div className="mt-2 text-2xl md:text-3xl font-medium text-signal">{v}</div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
