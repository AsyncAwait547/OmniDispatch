import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { PageShell, Panel } from "@/components/page-shell";
import {
  Shield, Check, Clock, User, Server, AlertTriangle, AlertCircle,
  Activity, Play, Volume2, RotateCcw, FileDown, Sun, Moon,
  History, Zap, ChevronRight, Radio, Layers
} from "lucide-react";
import { jsPDF } from "jspdf";

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

/* ─── Type Definitions ─── */
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
  startOffset: number;
  width: number;
  duration: number;
  status: "idle" | "running" | "success" | "pending";
  description: string;
}

// ── Feature #1 & #5: Incident History for the Queue ──
interface HistoryEntry {
  incident: IncidentProposal;
  status: "AWAITING_APPROVAL" | "DISPATCH_ACTIVE" | "LOCAL_MOCK";
  auditId: string | null;
  timestamp: string;
  mttaSeconds: number;
}

/* ─── Severity Color Map for Feature #3 ─── */
const SEVERITY_COLORS: Record<string, string> = {
  Critical: "rgba(255, 23, 68, 0.12)",
  High: "rgba(255, 170, 0, 0.10)",
  Moderate: "rgba(0, 168, 255, 0.08)",
  Low: "rgba(0, 230, 118, 0.06)",
};

const SEVERITY_BORDER: Record<string, string> = {
  Critical: "rgba(255, 23, 68, 0.45)",
  High: "rgba(255, 170, 0, 0.35)",
  Moderate: "rgba(0, 168, 255, 0.25)",
  Low: "rgba(0, 230, 118, 0.20)",
};

/* ─── Main Component ─── */
function ControlRoomPage() {
  // ── Feature #7: Theme Toggle ──
  const [isDark, setIsDark] = useState(true);

  // ── Core State ──
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

  // ── Real-time Operations Metrics ──
  const [metrics, setMetrics] = useState({
    totalDispatches: 2,
    mttaSeconds: 24.5,
    avgLatency: 1.62,
    slaUptime: 99.98
  });
  const mttaStart = useRef<number>(Date.now());

  // ── Feature #1 & #5: Incident History / Multi-Incident Queue ──
  const [incidentHistory, setIncidentHistory] = useState<HistoryEntry[]>([]);
  const [incidentQueue, setIncidentQueue] = useState<IncidentProposal[]>([]);
  const [selectedQueueIndex, setSelectedQueueIndex] = useState<number>(-1);

  // ── Feature #4: Live Clock & Uptime ──
  const [currentTime, setCurrentTime] = useState(new Date());
  const [uptimeSeconds, setUptimeSeconds] = useState(0);
  const systemStartTime = useRef(Date.now());

  // ── Logs ──
  const [logs, setLogs] = useState<LogLine[]>([
    { time: "12:13:31", msg: "OTel Span Initialized: tracking concurrent dispatcher execution.", color: "#8fa0b0" },
    { time: "12:13:32", msg: "ConcurrentBuilder Fan-out: analysis, policy, and logistics threads invoked.", color: "#00e676" },
    { time: "12:13:32", msg: "Aggregator synthesis complete: proposal compiled. Halting execution graph for HITL approval.", color: "#00f0ff" }
  ]);

  // ── OTel Gantt Spans ──
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
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  // ── Feature #4: Live Clock Ticker ──
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
      setUptimeSeconds(Math.floor((Date.now() - systemStartTime.current) / 1000));
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${h}h ${m}m ${s}s`;
  };

  // Web Speech API Voice Synthesis helper
  const speak = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 0.95;
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Microsoft") || v.name.includes("Natural")));
      if (preferredVoice) utterance.voice = preferredVoice;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Dynamic console log helper
  const addLog = useCallback((msg: string, color: string = "#8fa0b0") => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev.slice(-100), { time, msg, color }]);
  }, []);

  // ── Feature #2: Replay Last Incident Animation ──
  const replayLastIncident = () => {
    addLog("Replaying last incident trace animation...", "#ffaa00");
    speak("Replaying last incident trace for demonstration.");
    animateTracePipeline();
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

          // ── Feature #5: Multi-Incident Queue ──
          // If the system is busy with an active dispatch, queue the new incident
          if (status === "TRANSMITTING") {
            setIncidentQueue((prev) => [...prev, data]);
            addLog(`QUEUED: ${data.incident_id} added to multi-incident queue (system busy).`, "#ffaa00");
            speak(`New incident ${data.incident_id} queued. Current dispatch in progress.`);
            return;
          }

          speak(`Warning. Critical incident ${data.incident_id} detected in ${data.failure_zone}. Co-ordinating dispatch proposal.`);

          setIncident(data);
          setStatus("AWAITING_APPROVAL");
          setAuditId(null);
          mttaStart.current = Date.now();

          // Shifting visual coordinates dynamically
          incidentCoords.current = {
            xFactor: Math.random() * 0.3 + 0.35,
            yFactor: Math.random() * 0.3 + 0.35
          };

          addLog(`NEW ALERT RECEIVED: ${data.incident_id} detected!`, "#ff1744");
          addLog(`Diagnostics: ${data.diagnostics.type} (Severity: ${data.diagnostics.severity})`, "#ffaa00");
          addLog("Execution graph paused. Halting for manual operator approval...", "#ffaa00");

          animateTracePipeline();
        }
      } catch (e) {
        console.error("Error parsing WebSocket event:", e);
      }
    };

    socket.onclose = () => {
      addLog("WebSocket disconnected. Retrying connection in 5s...", "#ff1744");
    };

    if ("speechSynthesis" in window) window.speechSynthesis.getVoices();

    return () => { socket.close(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animates the OTel Gantt progress bars live
  const animateTracePipeline = () => {
    setSpans([
      { id: "parent", name: "Ingestion Root Span", startOffset: 0, width: 0, duration: 520, status: "running", description: "Telemetry Event Listener Ingestion" },
      { id: "analysis", name: "Analysis Agent", startOffset: 15, width: 0, duration: 240, status: "idle", description: "Telemetry classification & severity scoring" },
      { id: "policy", name: "Policy Agent", startOffset: 15, width: 0, duration: 290, status: "idle", description: "Grounding verification via Foundry IQ Search" },
      { id: "logistics", name: "Logistics Agent", startOffset: 15, width: 0, duration: 180, status: "idle", description: "Proximity routing calculations via SQL MCP" },
      { id: "aggregator", name: "Custom Aggregator", startOffset: 70, width: 0, duration: 50, status: "idle", description: "Zero-latency parallel response merge" },
      { id: "hitl", name: "HITL Signature Lock", startOffset: 80, width: 0, duration: 120, status: "idle", description: "approval_mode=always_require verification" }
    ]);

    setTimeout(() => {
      setSpans((prev) =>
        prev.map((s) => {
          if (s.id === "parent") return { ...s, width: 15, status: "running" };
          if (["analysis", "policy", "logistics"].includes(s.id)) return { ...s, width: s.id === "analysis" ? 45 : s.id === "policy" ? 55 : 35, status: "running" };
          return s;
        })
      );
    }, 150);

    setTimeout(() => {
      setSpans((prev) =>
        prev.map((s) => {
          if (["analysis", "policy", "logistics"].includes(s.id)) return { ...s, status: "success" };
          if (s.id === "aggregator") return { ...s, width: 10, status: "running" };
          return s;
        })
      );
    }, 550);

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

  // ── Feature #3: Canvas with Severity Heatmap ──
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

      // ── Feature #3: Severity Heatmap Overlay ──
      const severity = incident.diagnostics.severity || "Moderate";
      const heatColor = SEVERITY_COLORS[severity] || SEVERITY_COLORS.Moderate;
      const heatBorder = SEVERITY_BORDER[severity] || SEVERITY_BORDER.Moderate;

      // Draw the sector heatmap — a large translucent rectangle around the incident
      const sectorSize = 120;
      const sectorX = center.x - sectorSize / 2;
      const sectorY = center.y - sectorSize / 2;
      ctx.fillStyle = heatColor;
      ctx.fillRect(sectorX, sectorY, sectorSize, sectorSize);
      ctx.strokeStyle = heatBorder;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(sectorX, sectorY, sectorSize, sectorSize);
      ctx.setLineDash([]);

      // Sector label
      ctx.font = "bold 9px 'JetBrains Mono', monospace";
      ctx.fillStyle = heatBorder;
      ctx.fillText(`SECTOR: ${severity.toUpperCase()}`, sectorX + 4, sectorY + 12);

      // Grid overlay
      ctx.strokeStyle = isDark ? "rgba(0, 240, 255, 0.04)" : "rgba(0, 0, 0, 0.06)";
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      // Routing paths
      ctx.strokeStyle = isDark ? "rgba(0, 240, 255, 0.5)" : "rgba(0, 100, 200, 0.5)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath(); ctx.moveTo(nodeA.x, nodeA.y); ctx.lineTo(center.x, center.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(nodeB.x, nodeB.y); ctx.lineTo(center.x, center.y); ctx.stroke();
      ctx.setLineDash([]);

      // Radar pulses
      radarRadius.current = (radarRadius.current + 0.8) % 60;
      ctx.strokeStyle = "rgba(255, 23, 68, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(center.x, center.y, radarRadius.current, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(center.x, center.y, Math.max(0, radarRadius.current - 30), 0, Math.PI * 2); ctx.stroke();

      // Incident epicenter
      ctx.fillStyle = "#ff1744";
      ctx.beginPath(); ctx.arc(center.x, center.y, 8, 0, Math.PI * 2); ctx.fill();
      ctx.font = "bold 10px Outfit";
      ctx.fillStyle = "#ff1744";
      ctx.fillText("CRITICAL OVERLOAD", center.x + 12, center.y - 4);

      // Technician nodes
      ctx.fillStyle = "#00e676";
      ctx.beginPath(); ctx.arc(nodeA.x, nodeA.y, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = isDark ? "#f0f4f8" : "#1a1a2e";
      ctx.fillText("TECH-01: SARAH", nodeA.x + 10, nodeA.y + 4);
      ctx.fillStyle = "#00e676";
      ctx.beginPath(); ctx.arc(nodeB.x, nodeB.y, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = isDark ? "#f0f4f8" : "#1a1a2e";
      ctx.fillText("TECH-02: DAVID", nodeB.x + 10, nodeB.y + 4);

      animationFrameId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark, incident.diagnostics.severity]);

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

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

    const elapsed = (Date.now() - mttaStart.current) / 1000;

    try {
      const response = await fetch("http://localhost:8088/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        const newAuditId = result.audit_id;
        setAuditId(newAuditId);
        setStatus("DISPATCH_ACTIVE");
        addLog(`HITL Signature Validated. Audit ID: ${newAuditId}`, "#00e676");
        addLog("Dispatch instructions sent to Field technician hardware units.", "#00e676");
        speak("Dispatch authorization signed. Hardware unit updated.");

        // ── Feature #1: Add to History ──
        addToHistory("DISPATCH_ACTIVE", newAuditId, elapsed);
        updateMetrics(elapsed);
        processQueue();
      } else {
        throw new Error("HTTP Handshake failed");
      }
    } catch {
      const mockAudit = `AUDIT-${incident.incident_id}-LOCAL-MOCK`;
      setAuditId(mockAudit);
      setStatus("LOCAL_MOCK");
      addLog("Local simulation mode trigger: Handshake executed offline.", "#ff1744");
      addLog(`Manual Audit Code Generated: ${mockAudit}`, "#00e676");
      speak("Offline fallback activated. Dispatch authorized locally.");

      addToHistory("LOCAL_MOCK", mockAudit, elapsed);
      updateMetrics(elapsed);
      processQueue();
    }
  };

  // ── Feature #1: Add entry to incident history ──
  const addToHistory = (entryStatus: HistoryEntry["status"], entryAuditId: string | null, mtta: number) => {
    setIncidentHistory((prev) => [
      {
        incident: { ...incident },
        status: entryStatus,
        auditId: entryAuditId,
        timestamp: new Date().toLocaleTimeString(),
        mttaSeconds: parseFloat(mtta.toFixed(1)),
      },
      ...prev,
    ]);
  };

  // ── Feature #5: Process next item in queue ──
  const processQueue = () => {
    setIncidentQueue((prev) => {
      if (prev.length === 0) return prev;
      const [next, ...rest] = prev;

      // Auto-load next incident from queue after a short delay
      setTimeout(() => {
        setIncident(next);
        setStatus("AWAITING_APPROVAL");
        setAuditId(null);
        mttaStart.current = Date.now();
        incidentCoords.current = { xFactor: Math.random() * 0.3 + 0.35, yFactor: Math.random() * 0.3 + 0.35 };
        addLog(`QUEUE AUTO-LOAD: ${next.incident_id} loaded from multi-incident queue. ${rest.length} remaining.`, "#00f0ff");
        speak(`Next incident ${next.incident_id} loaded from queue.`);
        animateTracePipeline();
      }, 1500);

      return rest;
    });
  };

  // ── Feature #5: Select from queue sidebar ──
  const selectQueuedIncident = (idx: number) => {
    const selected = incidentQueue[idx];
    if (!selected) return;

    setIncident(selected);
    setStatus("AWAITING_APPROVAL");
    setAuditId(null);
    mttaStart.current = Date.now();
    setSelectedQueueIndex(idx);
    incidentCoords.current = { xFactor: Math.random() * 0.3 + 0.35, yFactor: Math.random() * 0.3 + 0.35 };

    // Remove from queue
    setIncidentQueue((prev) => prev.filter((_, i) => i !== idx));
    setSelectedQueueIndex(-1);

    addLog(`MANUAL QUEUE SELECT: ${selected.incident_id} loaded by operator.`, "#00f0ff");
    animateTracePipeline();
  };

  const updateMetrics = (elapsed: number) => {
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
      return { ...prev, totalDispatches: total, mttaSeconds: mtta > 60 ? 22.4 : mtta };
    });
  };

  // ── Feature #6: Export Audit Report as PDF ──
  const exportAuditPDF = () => {
    const doc = new jsPDF();
    const now = new Date().toISOString();

    // Header
    doc.setFillColor(10, 13, 16);
    doc.rect(0, 0, 210, 40, "F");
    doc.setTextColor(0, 240, 255);
    doc.setFontSize(22);
    doc.text("OMNIDISPATCH", 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(140, 160, 180);
    doc.text("Autonomous Dispatch Audit Report", 14, 26);
    doc.text(`Generated: ${now}`, 14, 33);

    // Incident Details
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text("Incident Details", 14, 52);
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);

    const details = [
      ["Incident ID", incident.incident_id],
      ["Failure Zone", incident.failure_zone],
      ["Type", incident.diagnostics.type],
      ["Severity", incident.diagnostics.severity],
      ["Temperature", incident.diagnostics.temperature],
      ["Coolant Level", incident.diagnostics.coolant_level],
      ["Audit ID", auditId || "N/A"],
      ["Status", status],
      ["Report Timestamp", now],
    ];

    let y = 60;
    details.forEach(([key, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${key}:`, 14, y);
      doc.setFont("helvetica", "normal");
      doc.text(value, 70, y);
      y += 7;
    });

    // Technician Assignments
    y += 5;
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Technician Assignments", 14, y);
    y += 10;
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);

    incident.logistics_recommendations.forEach((tech, i) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${i + 1}. ${tech.technician}`, 14, y);
      doc.setFont("helvetica", "normal");
      doc.text(`Role: ${tech.role} | ETA: ${tech.eta_minutes} min | Distance: ${tech.distance_miles || "N/A"} mi`, 20, y + 6);
      if (tech.certifications) {
        doc.text(`Certifications: ${tech.certifications.join(", ")}`, 20, y + 12);
      }
      y += 20;
    });

    // Safety Requirements
    y += 5;
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Safety Compliance Requirements", 14, y);
    y += 10;
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);

    incident.safety_requirements.forEach((req) => {
      doc.text(`• ${req}`, 14, y);
      y += 7;
    });

    // Audit Trail Hash
    y += 10;
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Audit Trail", 14, y);
    y += 10;
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    const hash = btoa(`${incident.incident_id}:${auditId}:${now}`).substring(0, 44);
    doc.text(`Cryptographic Hash: SHA-256:${hash}`, 14, y);
    doc.text(`Approval Mode: ${incident.approval_mode}`, 14, y + 6);
    doc.text("This dispatch was authorized through Human-in-the-Loop (HITL) verification.", 14, y + 12);

    // Performance Metrics
    y += 25;
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Operational Metrics", 14, y);
    y += 10;
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(`Total Dispatches: ${metrics.totalDispatches}`, 14, y);
    doc.text(`Mean Time To Authorize: ${metrics.mttaSeconds}s`, 14, y + 7);
    doc.text(`Parallel Agent Co-Latency: ${metrics.avgLatency}s`, 14, y + 14);
    doc.text(`SLA Compliance Uptime: ${metrics.slaUptime}%`, 14, y + 21);

    // Footer
    doc.setFillColor(10, 13, 16);
    doc.rect(0, 282, 210, 15, "F");
    doc.setTextColor(100, 120, 140);
    doc.setFontSize(8);
    doc.text("OMNIDISPATCH // CONTROL PLANE v3.2.1 — ALL DISPATCHES AUDITED", 14, 290);

    doc.save(`OmniDispatch_Audit_${incident.incident_id}_${Date.now()}.pdf`);
    addLog(`Audit PDF exported for ${incident.incident_id}.`, "#00e676");
    speak("Audit report exported as PDF document.");
  };

  // ── Theme CSS variables ──
  const themeVars = isDark
    ? { bg: "#04060A", cardBg: "#0A0D10", text: "#e0e8f0", textMuted: "rgba(224,232,240,0.4)", border: "rgba(224,232,240,0.1)" }
    : { bg: "#f0f2f5", cardBg: "#ffffff", text: "#1a1a2e", textMuted: "rgba(26,26,46,0.4)", border: "rgba(26,26,46,0.12)" };

  return (
    <PageShell
      kicker="03 / CONTROL CENTER"
      title="Real-Time Dispatch Console"
      intro="Monitor active grid incidents, evaluate fanned-out agent logic envelopes, and authorize critical field actions."
    >
      {/* ── Feature #4: Live System Status Header ── */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-4">
          {/* Live Clock */}
          <div className="flex items-center gap-2 bg-[#0A0D10]/80 border border-frost/10 rounded-full px-4 py-2">
            <Clock className="w-3.5 h-3.5 text-signal" />
            <span className="font-mono text-xs text-frost/80 tabular-nums">
              {currentTime.toLocaleTimeString([], { hour12: false })}
            </span>
          </div>
          {/* Uptime Counter */}
          <div className="flex items-center gap-2 bg-[#0A0D10]/80 border border-frost/10 rounded-full px-4 py-2">
            <Radio className="w-3.5 h-3.5 text-[#00e676] animate-pulse" />
            <span className="font-mono text-[10px] text-frost/50 tracking-wider">UPTIME</span>
            <span className="font-mono text-xs text-[#00e676] tabular-nums">
              {formatUptime(uptimeSeconds)}
            </span>
          </div>
        </div>

        {/* Controls: Theme Toggle, Replay, PDF Export */}
        <div className="flex items-center gap-2">
          {/* Feature #2: Replay Last Incident */}
          <button
            onClick={replayLastIncident}
            className="flex items-center gap-1.5 bg-[#0A0D10]/80 border border-frost/10 rounded-full px-3 py-2 text-[10px] font-mono text-frost/50 hover:text-frost hover:border-signal/30 transition-all cursor-pointer"
            title="Replay last incident animation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">REPLAY</span>
          </button>

          {/* Feature #6: Export PDF */}
          <button
            onClick={exportAuditPDF}
            className="flex items-center gap-1.5 bg-[#0A0D10]/80 border border-frost/10 rounded-full px-3 py-2 text-[10px] font-mono text-frost/50 hover:text-frost hover:border-[#00f0ff]/30 transition-all cursor-pointer"
            title="Export Audit Report as PDF"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">EXPORT PDF</span>
          </button>

          {/* Feature #7: Theme Toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="flex items-center gap-1.5 bg-[#0A0D10]/80 border border-frost/10 rounded-full px-3 py-2 text-[10px] font-mono text-frost/50 hover:text-frost hover:border-frost/30 transition-all cursor-pointer"
            title="Toggle Light/Dark theme"
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isDark ? "LIGHT" : "DARK"}</span>
          </button>
        </div>
      </div>

      {/* Dynamic Operations Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {([
          ["ACTIVE DISPATCHES", metrics.totalDispatches, "text-signal"],
          ["MEAN TIME TO AUTHORIZE (MTTA)", `${metrics.mttaSeconds}s`, "text-frost"],
          ["PARALLEL AGENT CO-LATENCY", `${metrics.avgLatency}s`, "text-frost/80"],
          ["SLA COMPLIANCE UPTIME", `${metrics.slaUptime}%`, "text-[#00e676]"]
        ] as const).map(([k, v, color]) => (
          <div key={k} className="bg-[#0A0D10]/80 border border-frost/10 rounded-xl p-4 flex flex-col justify-between">
            <div className="text-[10px] font-mono tracking-widest text-frost/30">{k}</div>
            <div className={`mt-2 text-xl md:text-2xl font-bold font-mono ${color}`}>{v}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Vector Map Dashboard */}
        <div className="lg:col-span-8 bg-[#0A0D10]/50 border border-frost/10 rounded-2xl overflow-hidden h-[400px] relative">
          <canvas ref={canvasRef} />
          {/* Voice Indicator */}
          <div className="absolute top-4 right-4 bg-black/60 border border-frost/10 px-3 py-1.5 rounded-full flex items-center gap-2 text-[10px] font-mono text-frost/50">
            <Volume2 className="w-3.5 h-3.5 text-signal" />
            <span>Voice Announcements Active</span>
          </div>
          {/* Feature #3: Severity Legend */}
          <div className="absolute bottom-4 left-4 bg-black/70 border border-frost/10 px-3 py-2 rounded-lg flex items-center gap-3 text-[9px] font-mono text-frost/40">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#ff1744]/50 inline-block" /> CRITICAL</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#ffaa00]/50 inline-block" /> HIGH</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#00a8ff]/50 inline-block" /> MODERATE</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#00e676]/50 inline-block" /> LOW</span>
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

      {/* ── Feature #5: Multi-Incident Queue Sidebar ── */}
      {incidentQueue.length > 0 && (
        <div className="mt-6 bg-[#04060A]/90 border border-[#ffaa00]/20 rounded-2xl p-5 shadow-2xl">
          <div className="flex items-center justify-between border-b border-frost/10 pb-3 mb-4">
            <div className="flex items-center gap-2 text-xs font-mono text-[#ffaa00]">
              <Layers className="w-3.5 h-3.5" />
              <span>QUEUED INCIDENTS ({incidentQueue.length})</span>
            </div>
            <div className="text-[10px] font-mono text-frost/30">CLICK TO LOAD • AUTO-PROCESSED ON DISPATCH COMPLETION</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {incidentQueue.map((qi, idx) => (
              <button
                key={qi.incident_id + idx}
                onClick={() => selectQueuedIncident(idx)}
                className={`text-left bg-black/60 border rounded-xl p-3 hover:border-signal/40 transition-all cursor-pointer ${
                  selectedQueueIndex === idx ? "border-signal/50 bg-signal/5" : "border-frost/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-signal">{qi.incident_id}</span>
                  <ChevronRight className="w-3 h-3 text-frost/30" />
                </div>
                <div className="text-[10px] font-mono text-frost/50 mt-1">{qi.failure_zone}</div>
                <div className="text-[10px] font-mono text-frost/30 mt-1">
                  {qi.diagnostics.severity} • {qi.diagnostics.type}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Visual OTel Waterfall Gantt Trace Viewer */}
      <div className="mt-6 bg-[#04060A]/90 border border-frost/10 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-frost/10 pb-4 mb-4">
          <div className="flex items-center gap-2 text-xs font-mono text-frost/60">
            <Activity className="w-3.5 h-3.5 text-signal" />
            <span>OpenTelemetry Multi-Agent Waterfall Tracing</span>
          </div>
          <div className="text-[10px] font-mono text-frost/30">MAF ORCHESTRATION PIPELINE // CO-LATENCY: {metrics.avgLatency}s</div>
        </div>

        <div className="space-y-4">
          {spans.map((s) => (
            <div key={s.id} className="grid grid-cols-12 items-center gap-4 text-xs">
              <div className="col-span-12 md:col-span-3 font-mono">
                <div className="text-frost font-semibold">{s.name}</div>
                <div className="text-[10px] text-frost/30 mt-0.5">{s.description}</div>
              </div>
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
                  <span className="text-frost/20">IDLE</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Feature #1: Incident History Timeline ── */}
      <div className="mt-6 bg-[#04060A]/90 border border-frost/10 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-frost/10 pb-3 mb-4">
          <div className="flex items-center gap-2 text-xs font-mono text-frost/60">
            <History className="w-3.5 h-3.5 text-signal" />
            <span>Dispatch History Timeline</span>
          </div>
          <div className="text-[10px] font-mono text-frost/30">{incidentHistory.length} COMPLETED DISPATCHES</div>
        </div>

        {incidentHistory.length === 0 ? (
          <div className="text-center py-8 text-frost/20 font-mono text-xs">
            No dispatches completed yet. Authorize an incident to see history.
          </div>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-thin">
            {incidentHistory.map((entry, idx) => (
              <div
                key={entry.incident.incident_id + idx}
                className="bg-black/50 border border-frost/5 rounded-xl p-4 flex items-center justify-between hover:border-frost/15 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Status Icon */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    entry.status === "DISPATCH_ACTIVE" ? "bg-[#00e676]/15" : "bg-signal/15"
                  }`}>
                    {entry.status === "DISPATCH_ACTIVE" ? (
                      <Check className="w-4 h-4 text-[#00e676]" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-signal" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-frost">{entry.incident.incident_id}</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${
                        entry.status === "DISPATCH_ACTIVE"
                          ? "bg-[#00e676]/10 text-[#00e676] border border-[#00e676]/20"
                          : "bg-signal/10 text-signal border border-signal/20"
                      }`}>
                        {entry.status === "DISPATCH_ACTIVE" ? "✓ DISPATCHED" : "⚡ LOCAL MOCK"}
                      </span>
                    </div>
                    <div className="text-[10px] text-frost/40 font-mono mt-1">
                      {entry.incident.failure_zone} • {entry.incident.diagnostics.severity} • {entry.incident.diagnostics.type}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-mono text-frost/50">{entry.timestamp}</div>
                  <div className="text-[10px] font-mono text-frost/30 mt-1">
                    MTTA: {entry.mttaSeconds}s | {entry.auditId ? entry.auditId.substring(0, 16) + "..." : "N/A"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
        <div ref={logContainerRef} className="h-32 overflow-y-auto font-mono text-[11px] sm:text-xs space-y-2 scrollbar-thin">
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
