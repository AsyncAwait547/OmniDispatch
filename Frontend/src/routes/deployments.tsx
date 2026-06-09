import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Panel } from "@/components/page-shell";

export const Route = createFileRoute("/deployments")({
  head: () => ({
    meta: [
      { title: "Deployments — OmniDispatch" },
      {
        name: "description",
        content:
          "Live OmniDispatch deployments across utility grids, telecom NOCs, and municipal emergency-management operations centres.",
      },
      { property: "og:title", content: "Deployments — OmniDispatch" },
      {
        property: "og:description",
        content: "Operational across grid, telecom, and municipal infrastructure.",
      },
    ],
  }),
  component: DeploymentsPage,
});

const SITES = [
  {
    code: "NORDIC-GRID-07",
    sector: "Transmission Utility",
    region: "Oslo, NO",
    status: "OPERATIONAL",
    metric: "4,200 substations · 13s mean MTTA",
  },
  {
    code: "TELCO-APAC-02",
    sector: "Tier-1 Telecom NOC",
    region: "Singapore, SG",
    status: "OPERATIONAL",
    metric: "180K cell sites · 99.998% uptime",
  },
  {
    code: "MUNI-EMG-15",
    sector: "Municipal Emergency Mgmt",
    region: "Rotterdam, NL",
    status: "OPERATIONAL",
    metric: "311 hydrant zones · sub-2s dispatch",
  },
  {
    code: "WATER-NA-04",
    sector: "Regional Water Authority",
    region: "Phoenix, US",
    status: "STAGED",
    metric: "Pilot · 9,800 SCADA endpoints",
  },
];

function DeploymentsPage() {
  return (
    <PageShell
      kicker="04 / FIELD STATUS"
      title="Operational across three continents."
      intro="OmniDispatch runs in regulated production environments — not labs. Every deployment is dual-region active-active with operator-owned control planes."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SITES.map((s) => (
          <Panel key={s.code} label={s.code} title={s.sector}>
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-frost/40">{s.region}</span>
              <span
                className={
                  s.status === "OPERATIONAL"
                    ? "text-signal animate-pulse"
                    : "text-frost/50"
                }
              >
                ● {s.status}
              </span>
            </div>
            <p className="mt-4 font-mono text-xs text-frost/60">{s.metric}</p>
          </Panel>
        ))}
      </div>
    </PageShell>
  );
}
