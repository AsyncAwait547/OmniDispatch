import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Panel } from "@/components/page-shell";

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
  },
  {
    code: "L3",
    name: "Concurrent Agents",
    desc: "Analysis, Policy, and Logistics agents reason in parallel against a shared incident frame.",
  },
  {
    code: "L2",
    name: "Foundry IQ",
    desc: "Hybrid vector + keyword retrieval over regulatory codes, SLAs, and vendor contracts via Azure AI Search.",
  },
  {
    code: "L1",
    name: "Telemetry Ingress",
    desc: "Raw IoT, SCADA, and NOC feeds normalised into incident frames. Per-tenant, per-region routing.",
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
        {LAYERS.map((l, i) => (
          <Panel key={l.code} label={l.code} title={l.name} accent={i === 0}>
            <p>{l.desc}</p>
          </Panel>
        ))}
      </div>

      <div className="mt-12">
        <Panel label="DATAFLOW" title="Incident → Dispatch in < 3.0s">
          <pre className="font-mono text-xs sm:text-sm text-frost/60 leading-relaxed overflow-x-auto">{`telemetry  ─►  frame  ─►  ┌─ analysis  ─┐
                          ├─ policy    ─┤  ─►  aggregator  ─►  HITL  ─►  dispatch
                          └─ logistics ─┘`}</pre>
        </Panel>
      </div>
    </PageShell>
  );
}
