import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Panel } from "@/components/page-shell";
import { Globe, Wifi, Activity, Compass, Cpu } from "lucide-react";

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
    ping: "28ms",
    channels: "84 active SCADA channels",
    coords: { x: 400, y: 90 },
    details: "HQ Sync: Primary control loop active. Multi-spectral backup link established."
  },
  {
    code: "TELCO-APAC-02",
    sector: "Tier-1 Telecom NOC",
    region: "Singapore, SG",
    status: "OPERATIONAL",
    metric: "180K cell sites · 99.998% uptime",
    ping: "42ms",
    channels: "1,200 cellular nodes monitored",
    coords: { x: 640, y: 270 },
    details: "APAC hub: Operating under active-active mirror mode. Standard routing active."
  },
  {
    code: "MUNI-EMG-15",
    sector: "Municipal Emergency Mgmt",
    region: "Rotterdam, NL",
    status: "OPERATIONAL",
    metric: "311 hydrant zones · sub-2s dispatch",
    ping: "15ms",
    channels: "NFC hydrant sensor grid active",
    coords: { x: 390, y: 115 },
    details: "High-priority urban response: Direct API dispatch integration with civil safety networks."
  },
  {
    code: "WATER-NA-04",
    sector: "Regional Water Authority",
    region: "Phoenix, US",
    status: "STAGED",
    metric: "Pilot · 9,800 SCADA endpoints",
    ping: "68ms",
    channels: "Aqueduct pressure stream staged",
    coords: { x: 150, y: 160 },
    details: "Desert pilot: Baseline telemetry ingestion running. Physical actuators locked."
  },
];

function DeploymentsPage() {
  const [hoveredSite, setHoveredSite] = useState<string | null>(null);

  return (
    <PageShell
      kicker="04 / FIELD STATUS"
      title="Operational across three continents."
      intro="OmniDispatch runs in regulated production environments — not labs. Every deployment is dual-region active-active with operator-owned control planes."
    >
      <div className="space-y-6">
        {/* Interactive Schematic Map Panel */}
        <Panel label="GLOBAL TELEMETRY ROUTING PLANE" title="Live Deployment Topology Map">
          <div className="relative bg-black/60 border border-frost/5 rounded-2xl p-4 overflow-hidden select-none">
            {/* HUD Header overlay */}
            <div className="absolute top-4 left-4 z-10 font-mono text-[10px] tracking-wider text-frost/40 flex items-center gap-3">
              <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5 text-signal" /> TOPOLOGY: ACTIVE-ACTIVE</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-signal animate-pulse"><Wifi className="w-3.5 h-3.5" /> HQ ROUTING: OSLO</span>
            </div>

            {/* Tactical Grid Background */}
            <div className="absolute inset-0 bg-grid opacity-[0.05] pointer-events-none" />
            
            {/* Coordinate markers */}
            <div className="absolute bottom-2 right-4 font-mono text-[9px] text-frost/30">
              SYS_REF: GRID-800x320 // MERCATOR_PROJ
            </div>

            {/* SVG Schematic World Map */}
            <svg viewBox="0 0 800 320" className="w-full h-auto relative z-0 opacity-90 transition-all duration-300">
              {/* stylized background continents */}
              <g fill="#171C22" stroke="rgba(200, 216, 232, 0.15)" strokeWidth="1" strokeDasharray="3 3">
                {/* North America */}
                <polygon points="60,80 200,80 240,120 180,180 120,220 50,140" />
                {/* South America */}
                <polygon points="170,210 200,230 220,300 180,318 150,260" />
                {/* Eurasia */}
                <polygon points="340,70 480,50 660,80 700,140 660,240 530,270 440,230 380,210 350,160 320,100" />
                {/* Africa */}
                <polygon points="350,170 420,180 460,220 430,300 380,310 350,230" />
                {/* Australia */}
                <polygon points="630,260 690,260 700,300 640,310" />
              </g>

              {/* Dotted Grid Horizontal/Vertical Coordinate Lines */}
              <line x1="0" y1="90" x2="800" y2="90" stroke="rgba(200, 216, 232, 0.05)" strokeDasharray="1 5" />
              <line x1="0" y1="160" x2="800" y2="160" stroke="rgba(200, 216, 232, 0.05)" strokeDasharray="1 5" />
              <line x1="0" y1="270" x2="800" y2="270" stroke="rgba(200, 216, 232, 0.05)" strokeDasharray="1 5" />
              <line x1="150" y1="0" x2="150" y2="320" stroke="rgba(200, 216, 232, 0.05)" strokeDasharray="1 5" />
              <line x1="390" y1="0" x2="390" y2="320" stroke="rgba(200, 216, 232, 0.05)" strokeDasharray="1 5" />
              <line x1="640" y1="0" x2="640" y2="320" stroke="rgba(200, 216, 232, 0.05)" strokeDasharray="1 5" />

              {/* Telemetry Sync Curves routing to HQ (Oslo: 400, 90) */}
              {SITES.filter(s => s.code !== "NORDIC-GRID-07").map((s) => {
                const isHovered = hoveredSite === s.code || hoveredSite === "NORDIC-GRID-07";
                return (
                  <path
                    key={`path-${s.code}`}
                    d={`M ${s.coords.x} ${s.coords.y} Q ${(s.coords.x + 400)/2} ${(s.coords.y + 90)/2 - 30} 400 90`}
                    fill="none"
                    stroke={isHovered ? "rgba(0, 240, 255, 0.7)" : "rgba(200, 216, 232, 0.15)"}
                    strokeWidth={isHovered ? "2" : "1"}
                    strokeDasharray={s.status === "OPERATIONAL" ? "5 5" : "3 10"}
                    className="transition-all duration-300"
                  />
                );
              })}

              {/* World Markers */}
              {SITES.map((s) => {
                const isHovered = hoveredSite === s.code;
                const markerColor = s.status === "OPERATIONAL" ? "#00e676" : "#ffaa00";
                return (
                  <g
                    key={`marker-${s.code}`}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredSite(s.code)}
                    onMouseLeave={() => setHoveredSite(null)}
                  >
                    {/* Pulsing Beacon Ring */}
                    <circle
                      cx={s.coords.x}
                      cy={s.coords.y}
                      r={isHovered ? 14 : 8}
                      fill="none"
                      stroke={markerColor}
                      strokeWidth="1.5"
                      className="transition-all duration-300 opacity-60"
                    >
                      {s.status === "OPERATIONAL" && (
                        <animate
                          attributeName="r"
                          values={`${isHovered ? 10 : 6};${isHovered ? 25 : 18};${isHovered ? 10 : 6}`}
                          dur="3s"
                          repeatCount="indefinite"
                        />
                      )}
                      {s.status === "OPERATIONAL" && (
                        <animate
                          attributeName="opacity"
                          values="0.8;0.1;0.8"
                          dur="3s"
                          repeatCount="indefinite"
                        />
                      )}
                    </circle>

                    {/* Central Anchor Node */}
                    <circle
                      cx={s.coords.x}
                      cy={s.coords.y}
                      r={isHovered ? 6 : 4}
                      fill={isHovered ? "#00f0ff" : markerColor}
                      className="transition-all duration-300"
                    />

                    {/* Node Label tooltip overlays */}
                    <text
                      x={s.coords.x + 10}
                      y={s.coords.y - 10}
                      fill={isHovered ? "#00f0ff" : "rgba(200, 216, 232, 0.7)"}
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight={isHovered ? "bold" : "normal"}
                      className="transition-all duration-300 select-none pointer-events-none"
                    >
                      {s.code}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </Panel>

        {/* Deployments Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SITES.map((s) => {
            const isHovered = hoveredSite === s.code;
            return (
              <div
                key={s.code}
                onMouseEnter={() => setHoveredSite(s.code)}
                onMouseLeave={() => setHoveredSite(null)}
                className="transition-all duration-300"
              >
                <Panel 
                  label={s.code} 
                  title={s.sector} 
                  accent={isHovered}
                >
                  <div className="flex items-center justify-between font-mono text-xs mb-4">
                    <span className="text-frost/40 flex items-center gap-1">
                      <Compass className="w-3.5 h-3.5 text-frost/30" /> {s.region}
                    </span>
                    <span
                      className={
                        s.status === "OPERATIONAL"
                          ? "text-signal animate-pulse font-semibold"
                          : "text-[#ffaa00] font-semibold"
                      }
                    >
                      ● {s.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2.5 p-3 bg-black/40 border border-frost/5 rounded-xl font-mono text-[11px] sm:text-xs mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-frost/30 flex items-center gap-1"><Cpu className="w-3.5 h-3.5 text-frost/30" /> MONITORING SCOPE</span>
                      <span className="text-frost/80">{s.channels}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-frost/30 flex items-center gap-1"><Activity className="w-3.5 h-3.5 text-frost/30" /> TELEMETRY LATENCY</span>
                      <span className={s.status === "OPERATIONAL" ? "text-signal" : "text-[#ffaa00]"}>{s.ping}</span>
                    </div>
                  </div>

                  <p className="font-mono text-xs text-frost/60 mb-2 leading-relaxed">{s.metric}</p>
                  
                  {/* Expanded telemetry text for high-fidelity content feel */}
                  <p className="text-[11px] font-mono text-frost/30 border-t border-frost/5 pt-3 leading-relaxed">
                    {s.details}
                  </p>
                </Panel>
              </div>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
}
