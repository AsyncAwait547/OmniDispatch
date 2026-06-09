import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { PageShell, Panel } from "@/components/page-shell";

export const Route = createFileRoute("/compliance")({
  head: () => ({
    meta: [
      { title: "Compliance — OmniDispatch" },
      {
        name: "description",
        content:
          "Zero-trust by default. Every dispatch logged, every action authorised. Built for regulated utility and telecom operators.",
      },
      { property: "og:title", content: "Compliance — OmniDispatch" },
      {
        property: "og:description",
        content: "Zero-trust execution. Auditable by design.",
      },
    ],
  }),
  component: CompliancePage,
});

const FRAMEWORKS = [
  { name: "SOC 2 Type II", status: "AUDITED", color: "#00e676" },
  { name: "ISO 27001", status: "CERTIFIED", color: "#00e676" },
  { name: "NERC CIP", status: "COMPLIANT", color: "#00f0ff" },
  { name: "NIS2", status: "COMPLIANT", color: "#00f0ff" },
  { name: "FedRAMP Moderate", status: "STAGED", color: "#ffaa00" },
  { name: "GDPR", status: "COMPLIANT", color: "#00f0ff" }
];

const CONTROLS = [
  "approval_mode='always_require' — no autonomous execution, ever",
  "Per-tenant encryption keys via Azure Key Vault HSM",
  "OpenTelemetry traces exported to customer-owned Application Insights",
  "Immutable audit log with cryptographic chaining (Merkle-tree)",
  "RBAC scoped by operator identity, site, and incident severity",
  "Data residency enforced per region — EU, US, APAC isolated planes",
];

function CompliancePage() {
  return (
    <PageShell
      kicker="03 / GOVERNANCE"
      title="Zero-trust. Audit-first. Operator-owned."
      intro="No agent dispatches without human authorisation. No telemetry leaves your region. Every action — approval, override, escalation — is signed and chained."
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-12">
        {FRAMEWORKS.map((f) => (
          <div
            key={f.name}
            className="bg-[#0A0D10]/80 border border-frost/10 rounded-xl px-4 py-5 flex flex-col justify-between h-28 hover:border-frost/20 transition-colors"
          >
            <div className="font-mono text-xs text-frost/30">FRAMEWORK COMPLIANCE</div>
            <div className="text-frost text-sm sm:text-base font-semibold mt-1">{f.name}</div>
            <div 
              style={{ color: f.color, backgroundColor: `${f.color}15`, borderColor: `${f.color}30` }} 
              className="mt-3 font-mono text-[9px] sm:text-[10px] tracking-wider px-2 py-0.5 rounded border w-fit"
            >
              ● {f.status}
            </div>
          </div>
        ))}
      </div>

      <Panel label="CONTROL CATALOGUE" title="Defaults that ship enabled" accent>
        <ul className="space-y-3 mt-4">
          {CONTROLS.map((c) => (
            <li key={c} className="flex gap-3 text-sm text-frost/70 leading-relaxed">
              <Check className="w-4 h-4 text-signal flex-shrink-0 mt-0.5" />
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </PageShell>
  );
}
