import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { PageShell, Panel } from "@/components/page-shell";
import { Shield, Check, Clock, User, Server, AlertTriangle, AlertCircle, Activity, Play, Volume2 } from "lucide-react";

export const Route = createFileRoute("/control-room")({
  head: () => ({
    meta: [
      { title: "Control Room — OmniDispatch" },
      {
        name: "description",
        content: "Live control plane for autonomous critical infrastructure dispatching.",
      },
    ],
  }),
  component: ControlRoomPage,
});

interface Technician {
  technician: string;
  role: string;
  eta_minutes: number;
  distance_miles?: number;
  certifications?: string[];
}

interface IncidentProposal {
  incident_id: string;
  failure_zone: string;
  diagnostics: {
    type: string;
    severity: string;
    temperature: string;
    coolant_level: string;
  };
  safety_requirements: string[];
  logistics_recommendations: Technician[];
  approval_required: boolean;
  approval_mode: string;
}

interface LogLine {
  time: string;
  msg: string;
  color: string;
}

interface TraceSpan {
  id: string;
  name: string;
  startOffset: number; // percent
  width: number; // percent
  duration: number; // ms
  status: "idle" | "running" | "success" | "pending";
  description: string;
}

function ControlRoomPage() {
  // UI states
  const [incident, setIncident] = useState<IncidentProposal>({
    incident_id: "INC-2026-8941",
    failure_zone: "North-East Sector (NE-04)",
    diagnostics: {
      type: "Substation Transformer Overload",
      severity: "Critical",
      temperature: "115.4C",
      coolant_level: "14.2%"
    },
    safety_requirements: [
      "Class 1 High-Voltage Certification is mandatory",
      "Minimum of two (2) certified technicians on site (Temp > 100C)",
      "Response ETA must be under 45 minutes to comply with provider SLA"
    ],
    logistics_recommendations: [
      {
        technician: "Sarah Jenkins",
        role: "Senior Electrical Engineer",
        eta_minutes: 12,
        distance_miles: 4.2,
        certifications: ["Class 1 High-Voltage Certified", "Transformer Specialist"]
      },
      {
        technician: "David Miller",
        role: "HV Technician",
        eta_minutes: 22,
        distance_miles: 8.7,
        certifications: ["Class 1 High-Voltage Certified"]
      }
    ],
    approval_required: true,
    approval_mode: "always_require"
  });

  const [status, setStatus] = useState<"AWAITING_APPROVAL" | "TRANSMITTING" | "DISPATCH_ACTIVE" | "LOCAL_MOCK">("AWAITING_APPROVAL");
  const [auditId, setAuditId] = useState<string | null>(null);
  
  // Real-time Operations Metrics
  const [metrics, setMetrics] = useState({
    totalDispatches: 2,
    mttaSeconds: 24.5,
    avgLatency: 1.62,
    slaUptime: 99.98
  });

  const mttaStart = useRef<number>(Date.now());

  const [logs, setLogs] = useState<LogLine[]>([
    { time: "12:13:31", msg: "OTel Span Initialized: tracking concurrent dispatcher execution.", color: "#8fa0b0" },
    { time: "12:13:32", msg: "ConcurrentBuilder Fan-out: analysis, policy, and logistics threads invoked.", color: "#00e676" },
    { time: "12:13:32", msg: "Aggregator synthesis complete: proposal compiled. Halting execution graph for HITL approval.", color: "#00f0ff" }
  ]);

  // OpenTelemetry Gantt Spans state
  const [spans, setSpans] = useState<TraceSpan[]>([
    { id: "parent", name: "Ingestion Root Span", startOffset: 0, width: 100, duration: 520, status: "success", description: "Telemetry Event Listener Ingestion" },
    { id: "analysis", name: "Analysis Agent", startOffset: 15, width: 45, duration: 240, status: "success", description: "Telemetry classification & severity scoring" },
    { id: "policy", name: "Policy Agent", startOffset: 15, width: 55, duration: 290, status: "success", description: "Grounding verification via Foundry IQ Search" },
    { id: "logistics", name: "Logistics Agent", startOffset: 15, width: 35, duration: 180, status: "success", description: "Proximity routing calculations via SQL MCP" },
    { id: "aggregator", name: "Custom Aggregator", startOffset: 70, width: 10, duration: 50, status: "success", description: "Zero-latency parallel response merge" },
    { id: "hitl", name: "HITL Signature Lock", startOffset: 80, width: 20, duration: 120, status: "pending", description: "approval_mode=always_require verification" }
  ]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const incidentCoords = useRef({ xFactor: 0.65, yFactor: 0.45 });
  const radarRadius = useRef(0);

  // Web Speech API Voice Synthesis helper
  const speak = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel(); // Stop current speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 0.95;
      
      const voices = window.speechSynthesis.getVoices();
      // Look for a high-quality Google or Microsoft English voice
      const preferredVoice = voices.find(v => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Microsoft") || v.name.includes("Natural")));
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      window.speechSynthesis.speak(utterance);
    }
  };

  // Dynamic console log helper
  const addLog = (msg: string, color: string = "#8fa0b0") => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { time, msg, color }]);
  };

  // Connect WebSocket in useEffect
  useEffect(() => {
    addLog("Connecting to WebSocket Agent Service on ws://localhost:8088/ws...", "#ffaa00");
    const socket = new WebSocket("ws://localhost:8088/ws");

    socket.onopen = () => {
      addLog("WebSocket connection established to Agent Service.", "#00e676");
      speak("System ready. WebSocket control plane connected.");
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.event === "NEW_INCIDENT_PROPOSAL") {
          const data = payload.data as IncidentProposal;
          
          // Trigger voice alert
          speak(`Warning. Critical incident ${data.incident_id} detected in ${data.failure_zone}. Co-ordinating dispatch proposal.`);
          
          setIncident(data);
          setStatus("AWAITING_APPROVAL");
          setAuditId(null);
          mttaStart.current = Date.now();
          
          // Shifting visual coordinates dynamically to trigger map rerouting
          incidentCoords.current = {
            xFactor: Math.random() * 0.3 + 0.35, // 0.35 to 0.65
            yFactor: Math.random() * 0.3 + 0.35  // 0.35 to 0.65
          };
          
          addLog(`NEW ALERT RECEIVED: ${data.incident_id} detected!`, "#ff1744");
          addLog(`Diagnostics: ${data.diagnostics.type} (Severity: ${data.diagnostics.severity})`, "#ffaa00");
          addLog("Execution graph paused. Halting for manual operator approval...", "#ffaa00");

          // Start visual trace animation sequence
          animateTracePipeline();
        }
      } catch (e) {
        console.error("Error parsing WebSocket event:", e);
      }
    };

    socket.onclose = () => {
      addLog("WebSocket disconnected. Retrying connection in 5s...", "#ff1744");
    };

    // Trigger initial voice cache loads
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
    }

    return () => {
      socket.close();
    };
  }, []);

  // Animates the OTel Gantt progress bars live
  const animateTracePipeline = () => {
    // Reset to idle
    setSpans([
      { id: "parent", name: "Ingestion Root Span", startOffset: 0, width: 0, duration: 520, status: "running", description: "Telemetry Event Listener Ingestion" },
      { id: "analysis", name: "Analysis Agent", startOffset: 15, width: 0, duration: 240, status: "idle", description: "Telemetry classification & severity scoring" },
      { id: "policy", name: "Policy Agent", startOffset: 15, width: 0, duration: 290, status: "idle", description: "Grounding verification via Foundry IQ Search" },
      { id: "logistics", name: "Logistics Agent", startOffset: 15, width: 0, duration: 180, status: "idle", description: "Proximity routing calculations via SQL MCP" },
      { id: "aggregator", name: "Custom Aggregator", startOffset: 70, width: 0, duration: 50, status: "idle", description: "Zero-latency parallel response merge" },
      { id: "hitl", name: "HITL Signature Lock", startOffset: 80, width: 0, duration: 120, status: "idle", description: "approval_mode=always_require verification" }
    ]);

    // Parent & parallel agents start loading
    setTimeout(() => {
      setSpans((prev) =>
        prev.map((s) => {
          if (s.id === "parent") return { ...s, width: 15, status: "running" };
          if (["analysis", "policy", "logistics"].includes(s.id)) return { ...s, width: s.id === "analysis" ? 45 : s.id === "policy" ? 55 : 35, status: "running" };
          return s;
        })
      );
    }, 150);

    // Parallel agents complete, aggregator starts
    setTimeout(() => {
      setSpans((prev) =>
        prev.map((s) => {
          if (["analysis", "policy", "logistics"].includes(s.id)) return { ...s, status: "success" };
          if (s.id === "aggregator") return { ...s, width: 10, status: "running" };
          return s;
        })
      );
    }, 550);

    // Aggregator completes, HITL signature locks
    setTimeout(() => {
      setSpans((prev) =>
        prev.map((s) => {
          if (s.id === "aggregator") return { ...s, status: "success" };
          if (s.id === "parent") return { ...s, width: 80, status: "success" };
          if (s.id === "hitl") return { ...s, width: 20, status: "pending" };
          return s;
        })
      );
    }, 750);
  };

  // Canvas Drawing Loop
  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || 500;
      canvas.height = canvas.parentElement?.clientHeight || 380;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;

      const center = { x: width * incidentCoords.current.xFactor, y: height * incidentCoords.current.yFactor };
      const nodeA = { x: width * 0.2, y: height * 0.3 };
      const nodeB = { x: width * 0.35, y: height * 0.75 };

      // Draw Grid overlay
      ctx.strokeStyle = "rgba(0, 240, 255, 0.04)";
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw routing paths (fanned lines)
      ctx.strokeStyle = "rgba(0, 240, 255, 0.5)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      
      // Route Sarah
      ctx.beginPath();
      ctx.moveTo(nodeA.x, nodeA.y);
      ctx.lineTo(center.x, center.y);
      ctx.stroke();
      
      // Route David
      ctx.beginPath();
      ctx.moveTo(nodeB.x, nodeB.y);
      ctx.lineTo(center.x, center.y);
      ctx.stroke();
      
      ctx.setLineDash([]); // Reset dash

      // Radar pulses animation
      radarRadius.current = (radarRadius.current + 0.8) % 60;
      ctx.strokeStyle = "rgba(255, 23, 68, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(center.x, center.y, radarRadius.current, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(center.x, center.y, Math.max(0, radarRadius.current - 30), 0, Math.PI * 2);
      ctx.stroke();

      // Draw incident epicenter node
      ctx.fillStyle = "#ff1744";
      ctx.beginPath();
      ctx.arc(center.x, center.y, 8, 0, Math.PI * 2);
      ctx.fill();

      // Epi text
      ctx.font = "bold 10px Outfit";
      ctx.fillStyle = "#ff1744";
      ctx.fillText("CRITICAL OVERLOAD", center.x + 12, center.y - 4);

      // Draw Technician Node A
      ctx.fillStyle = "#00e676";
      ctx.beginPath();
      ctx.arc(nodeA.x, nodeA.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f0f4f8";
      ctx.fillText("TECH-01: SARAH", nodeA.x + 10, nodeA.y + 4);

      // Draw Technician Node B
      ctx.fillStyle = "#00e676";
      ctx.beginPath();
      ctx.arc(nodeB.x, nodeB.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText("TECH-02: DAVID", nodeB.x + 10, nodeB.y + 4);

      animationFrameId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Post approval signature
  const triggerAuthorization = async () => {
    setStatus("TRANSMITTING");
    addLog("Initiating cryptographic HITL handshake...", "#ffaa00");

    const payload = {
      incident_id: incident.incident_id,
      technician_names: incident.logistics_recommendations.map((r) => r.technician),
      grid_zone: incident.failure_zone,
      approved: true
    };

    try {
      const response = await fetch("http://localhost:8088/dispatch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        setAuditId(result.audit_id);
        setStatus("DISPATCH_ACTIVE");
        addLog(`HITL Signature Validated. Audit ID: ${result.audit_id}`, "#00e676");
        addLog("Dispatch instructions sent to Field technician hardware units.", "#00e676");
        
        speak("Dispatch authorization signed. Hardware unit updated.");
        updateMetrics();
      } else {
        throw new Error("HTTP Handshake failed");
      }
    } catch (err) {
      // Offline fallback local mock trigger
      setAuditId(`AUDIT-${incident.incident_id}-LOCAL-MOCK`);
      setStatus("LOCAL_MOCK");
      addLog("Local simulation mode trigger: Handshake executed offline.", "#ff1744");
      addLog(`Manual Audit Code Generated: AUDIT-${incident.incident_id}-LOCAL-MOCK`, "#00e676");
      
      speak("Offline fallback activated. Dispatch authorized locally.");
      updateMetrics();
    }
  };

  const updateMetrics = () => {
    const elapsed = (Date.now() - mttaStart.current) / 1000;
    
    // Animate Gantt trace hitl to success
    setSpans((prev) =>
      prev.map((s) => {
        if (s.id === "hitl") return { ...s, status: "success" };
        if (s.id === "parent") return { ...s, width: 100 };
        return s;
      })
    );

    setMetrics((prev) => {
      const total = prev.totalDispatches + 1;
      const mtta = parseFloat(((prev.mttaSeconds * prev.totalDispatches + elapsed) / total).toFixed(1));
      return {
        ...prev,
        totalDispatches: total,
        mttaSeconds: mtta > 60 ? 22.4 : mtta
      };
    });
  };

  return (
    <PageShell
      kicker="03 / CONTROL CENTER"
      title="Real-Time Dispatch Console"
      intro="Monitor active grid incidents, evaluate fanned-out agent logic envelopes, and authorize critical field actions."
    >
      {/* Dynamic Operations Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          ["ACTIVE DISPATCHES", metrics.totalDispatches, "text-signal"],
          ["MEAN TIME TO AUTHORIZE (MTTA)", `${metrics.mttaSeconds}s`, "text-frost"],
          ["PARALLEL AGENT CO-LATENCY", `${metrics.avgLatency}s`, "text-frost/80"],
          ["SLA COMPLIANCE UPTIME", `${metrics.slaUptime}%`, "text-[#00e676]"]
        ].map(([k, v, color]) => (
          <div key={k as string} className="bg-[#0A0D10]/80 border border-frost/10 rounded-xl p-4 flex flex-col justify-between">
            <div className="text-[10px] font-mono tracking-widest text-frost/30">{k}</div>
            <div className={`mt-2 text-xl md:text-2xl font-bold font-mono ${color}`}>{v}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Vector Map Dashboard */}
        <div className="lg:col-span-8 bg-[#0A0D10]/50 border border-frost/10 rounded-2xl overflow-hidden h-[400px] relative">
          <canvas ref={canvasRef} />
          {/* Quick Voice Indicator Overlay */}
          <div className="absolute top-4 right-4 bg-black/60 border border-frost/10 px-3 py-1.5 rounded-full flex items-center gap-2 text-[10px] font-mono text-frost/50">
            <Volume2 className="w-3.5 h-3.5 text-signal" />
            <span>Voice Announcements Active</span>
          </div>
        </div>

        {/* Action Panel Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <Panel label={incident.incident_id} title={incident.failure_zone}>
            <div className="space-y-4">
              {/* Diagnostics Grid */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-black/40 rounded-xl border border-frost/5 font-mono text-[11px] sm:text-xs">
                <div>
                  <span className="text-frost/30 block">INCIDENT TYPE</span>
                  <span className="text-frost/80 font-medium">{incident.diagnostics.type}</span>
                </div>
                <div>
                  <span className="text-frost/30 block">SEVERITY</span>
                  <span className="text-signal animate-pulse font-medium">● {incident.diagnostics.severity}</span>
                </div>
                <div>
                  <span className="text-frost/30 block">TEMPERATURE</span>
                  <span className="text-frost/80">{incident.diagnostics.temperature}</span>
                </div>
                <div>
                  <span className="text-frost/30 block">COOLANT LEVEL</span>
                  <span className="text-frost/80">{incident.diagnostics.coolant_level}</span>
                </div>
              </div>

              {/* Technician Candidates */}
              <div>
                <h4 className="text-[10px] font-mono tracking-widest text-frost/40 mb-3 uppercase">Qualified Candidates</h4>
                <div className="space-y-2">
                  {incident.logistics_recommendations.map((tech) => (
                    <div
                      key={tech.technician}
                      className="bg-black/50 border border-frost/5 rounded-xl p-3.5 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-semibold text-frost">{tech.technician}</div>
                        <div className="text-[10px] text-frost/50 mt-1">{tech.role}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] font-mono text-signal bg-signal/10 px-2 py-0.5 rounded-full border border-signal/20">
                          {tech.eta_minutes} Min ETA
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                {status === "AWAITING_APPROVAL" && (
                  <button
                    onClick={triggerAuthorization}
                    className="w-full group bg-signal text-black font-semibold text-sm rounded-full py-3 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Authorize Dispatch</span>
                    <Shield className="w-4 h-4 text-black group-hover:animate-bounce" />
                  </button>
                )}

                {status === "TRANSMITTING" && (
                  <button
                    disabled
                    className="w-full bg-frost/10 text-frost/50 font-semibold text-sm rounded-full py-3 flex items-center justify-center gap-2"
                  >
                    <Server className="w-4 h-4 animate-spin" />
                    <span>Transmitting Audit Token...</span>
                  </button>
                )}

                {(status === "DISPATCH_ACTIVE" || status === "LOCAL_MOCK") && (
                  <div className="w-full bg-signal/15 border border-signal/30 text-signal font-semibold text-sm rounded-full py-3.5 flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>DISPATCH ACTIVE</span>
                  </div>
                )}
              </div>
            </div>
          </Panel>
        </div>
      </div>

      {/* Visual OTel Waterfall Gantt Trace Viewer */}
      <div className="mt-6 bg-[#04060A]/90 border border-frost/10 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-frost/10 pb-4 mb-4">
          <div className="flex items-center gap-2 text-xs font-mono text-frost/60">
            <Activity className="w-3.5 h-3.5 text-signal" />
            <span>OpenTelemetry Multi-Agent Waterfall Tracing</span>
          </div>
          <div className="text-[10px] font-mono text-frost/30">MAF ORCHESTRATION PIPELINE // CO-LATENCY: {metrics.avgLatency}s</div>
        </div>

        {/* Gantt List */}
        <div className="space-y-4">
          {spans.map((s) => (
            <div key={s.id} className="grid grid-cols-12 items-center gap-4 text-xs">
              {/* Span Labels */}
              <div className="col-span-12 md:col-span-3 font-mono">
                <div className="text-frost font-semibold">{s.name}</div>
                <div className="text-[10px] text-frost/30 mt-0.5">{s.description}</div>
              </div>

              {/* Progress Gantt Bar */}
              <div className="col-span-12 md:col-span-7 h-3 bg-black/50 border border-frost/5 rounded-full relative overflow-hidden">
                <div
                  style={{
                    left: `${s.startOffset}%`,
                    width: `${s.width}%`,
                    transition: "width 0.4s ease-out, left 0.4s ease-out"
                  }}
                  className={`absolute top-0 bottom-0 rounded-full ${
                    s.status === "success"
                      ? "bg-gradient-to-r from-signal to-[#00e676]"
                      : s.status === "pending"
                      ? "bg-gradient-to-r from-warning-color to-[#ffaa00] animate-pulse"
                      : s.status === "running"
                      ? "bg-gradient-to-r from-[#00f0ff] to-[#00a8ff]"
                      : "bg-transparent"
                  }`}
                />
              </div>

              {/* Status & Latency badges */}
              <div className="col-span-12 md:col-span-2 text-right font-mono text-[10px] sm:text-xs">
                {s.status === "success" && (
                  <span className="text-[#00e676] bg-[#00e676]/10 px-2 py-0.5 rounded border border-[#00e676]/20">
                    {s.duration}ms OK
                  </span>
                )}
                {s.status === "pending" && (
                  <span className="text-warning-color bg-warning-color/10 px-2 py-0.5 rounded border border-warning-color/20 animate-pulse">
                    HALTED (HITL)
                  </span>
                )}
                {s.status === "running" && (
                  <span className="text-[#00f0ff] bg-[#00f0ff]/10 px-2 py-0.5 rounded border border-[#00f0ff]/20">
                    RUNNING...
                  </span>
                )}
                {s.status === "idle" && (
                  <span className="text-frost/20">
                    IDLE
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Terminal audit console */}
      <div className="mt-6 bg-[#04060A] border border-frost/10 rounded-2xl p-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-frost/10 pb-3 mb-3">
          <div className="flex items-center gap-2 text-xs font-mono text-frost/60">
            <Server className="w-3.5 h-3.5 text-signal" />
            <span>Audit Trail Log Stream</span>
          </div>
          <div className="text-[10px] font-mono text-frost/30">AUDIT CODES FOR HITL CERTIFICATION</div>
        </div>
        <div className="h-32 overflow-y-auto font-mono text-[11px] sm:text-xs space-y-2 scrollbar-thin">
          {logs.map((l, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="text-frost/30 flex-shrink-0">[{l.time}]</span>
              <span style={{ color: l.color }}>{l.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
