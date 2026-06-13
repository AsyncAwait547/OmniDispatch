# OmniDispatch

**Autonomous Critical Infrastructure Dispatch Orchestrator**  
*Microsoft Agents League Hackathon 2026 — Reasoning Agents Track*

> *"When a transformer overloads at 2 AM, the average utility takes 47 minutes to dispatch a repair crew. Every minute costs $9,000 in cascading damages. OmniDispatch reduces that to **3 seconds** — with full human oversight."*

---

## 🎯 The Problem

Critical infrastructure failures (power grid overloads, telecom outages, pipeline leaks) require immediate coordinated response across **three isolated domains**:

| Domain | Challenge |
|--------|-----------|
| **IoT Telemetry** | Sensor feeds arrive continuously — which ones are critical? |
| **Regulatory Compliance** | Union labor rules, safety certifications, and SLA deadlines must be verified before dispatch |
| **Workforce Logistics** | Who is nearby, certified, and available right now? |

Today, human operators manually cross-reference these three systems. It takes an average of **47 minutes** from telemetry alert to technician dispatch. OmniDispatch eliminates this bottleneck.

---

## ⚡ The Solution

OmniDispatch is a **multi-agent AI orchestration platform** that:

1. **Fans out** three specialized AI agents **in parallel** using the `ConcurrentBuilder` pattern
2. **Merges** their outputs instantly through a **custom zero-latency aggregator** (no extra LLM call)
3. **Halts** the execution graph for **Human-in-the-Loop (HITL) approval** before any dispatch is authorized
4. **Traces** every agent span via **OpenTelemetry** for full auditability

```
┌─────────────────────────────────────────────────────────────────┐
│               OMNIDISPATCH ARCHITECTURE                        │
│                                                                 │
│  Telemetry Alert ──→ ConcurrentBuilder (Fan-Out)               │
│                        ├── Analysis Agent (IoT Classification)  │
│                        ├── Policy Agent (Azure AI Search RAG)   │
│                        └── Logistics Agent (SQL MCP Routing)    │
│                               │                                 │
│                        Custom Aggregator (Zero-Latency Merge)   │
│                               │                                 │
│                        HITL Signature Lock ⟵ HUMAN OPERATOR    │
│                               │                                 │
│                        Dispatch Authorized ──→ Field Units      │
└─────────────────────────────────────────────────────────────────┘
```

### Before vs. After

| Metric | Manual Process | OmniDispatch |
|--------|---------------|--------------|
| Alert → Dispatch | 47 minutes | **< 3 seconds** |
| Agent Reasoning | Sequential human review | **3 parallel AI agents** |
| Compliance Check | Manual policy lookup | **Automated RAG grounding** |
| Audit Trail | Paper-based | **Cryptographic + OTel traced** |
| Oversight | No formal approval | **HITL `always_require` enforcement** |

---

## 🏗️ System Architecture

```
   ┌─────────────────────────────────────────────────────────────┐
   │                  Microsoft Copilot Canvas                   │
   │   - Interactive Fluent UI HTML Map Widget (Port 3000)      │
   │   - OpenAPI-discovered tools via MCP Protocol              │
   └───────────────┬─────────────────────────────▲───────────────┘
                   │                             │
       [1] Telemetry Alert            [5] Renders Widget (HTML)
                   │                             │
   ┌───────────────▼─────────────────────────────┴───────────────┐
   │              Azure AI Foundry Agent Service                 │
   │               - FastAPI (Port 8088, Responses Protocol)     │
   │   ┌─────────────────────────────────────────────────────┐   │
   │   │        Microsoft Agent Framework v1.0 (MAF)         │   │
   │   │             - ConcurrentBuilder Orchestrator        │   │
   │   │                                                     │   │
   │   │   ┌───────────────┬─────────────────┬───────────┐   │   │
   │   │   │ Analysis Agent│  Policy Agent   │ Logistics │   │   │
   │   │   │(Azure OpenAI) │(AI Search RAG)  │ Agent     │   │   │
   │   │   └───────┬───────┴────────┬────────┴─────┬─────┘   │   │
   │   │           └──────────────┐ │ ┌────────────┘         │   │
   │   │                          ▼ ▼ ▼                      │   │
   │   │              [2] Custom Aggregator                  │   │
   │   │                     (Zero-Latency)                  │   │
   │   │                          │                          │   │
   │   │              [3] Cryptographic HITL                 │   │
   │   │           (approval_mode='always_require')          │   │
   │   └──────────────────────────┬──────────────────────────┘   │
   └──────────────────────────────┼──────────────────────────────┘
                                  │
                       [4] Dispatch Signed & Approved
                                  ▼
                     [Field Dispatch Hardware Units]
```

### Technology Stack

| Layer | Technology | Purpose |
|:------|:-----------|:--------|
| **Compute** | Azure AI Foundry Hosted Agents | Container deployment, Responses Protocol (Port 8088) |
| **Orchestration** | Microsoft Agent Framework v1.0 | `ConcurrentBuilder` for parallel fan-out execution |
| **LLM** | Azure OpenAI (GPT-4o) | Real-time reasoning for analysis, policy, and logistics agents |
| **Knowledge (RAG)** | Azure AI Search + Foundry IQ | Semantic vector search over safety regulations and SLA policies |
| **MCP Server** | Node.js / Express | Exposes tools and renders Fluent UI widgets for Copilot Canvas |
| **UX** | React + TanStack Start | Real-time Control Room with OTel Gantt trace, voice alerts, PDF export |
| **Safety** | MAF `@ai_function` | `approval_mode='always_require'` for HITL dispatch halt |
| **Observability** | OpenTelemetry + Azure App Insights | End-to-end trace spans for every agent and tool call |
| **IaC** | Bicep + Azure Developer CLI (`azd`) | One-command provisioning and deployment |

---

## ✨ Key Features

### Real-Time Control Room
- **Live WebSocket Streaming**: Telemetry alerts broadcast instantly to the React dashboard
- **OTel Waterfall Gantt Trace**: Animated visualization of parallel agent execution with per-span latency
- **Voice Synthesis Alerts**: Web Speech API announces critical incidents and dispatch confirmations
- **Severity Heatmap**: Color-coded grid sectors (Critical/High/Moderate/Low) on the canvas map
- **Multi-Incident Queue**: Handles concurrent incidents with auto-load on dispatch completion
- **PDF Audit Export**: One-click compliance report with cryptographic hashes

### Multi-Agent Orchestration
- **ConcurrentBuilder Pattern**: Three agents execute simultaneously, not sequentially
- **Custom Aggregator**: Compiles parallel outputs without triggering additional LLM inference
- **Hybrid Agents**: Transparently use Azure OpenAI when configured, fall back to deterministic mocks

### Enterprise Safety
- **HITL Enforcement**: `@ai_function(approval_mode='always_require')` halts the execution graph
- **Cryptographic Audit Trail**: Every dispatch generates a unique `AUDIT-{id}-{uuid}` token
- **Compliance Grounding**: Policy agent retrieves real regulations from Azure AI Search

---

## 📁 Project Structure

```
OmniDispatch/
├── azure.yaml                    # Azure Developer CLI deployment manifest
├── infra/
│   └── main.bicep                # Infrastructure-as-Code (all Azure resources)
├── agent/
│   ├── Dockerfile                # Multi-stage production container (non-root)
│   ├── agent.yaml                # Foundry Agent Service manifest
│   ├── requirements.txt          # Python dependencies (Azure SDKs included)
│   ├── .env.example              # Environment variable template
│   ├── main.py                   # FastAPI server (Responses Protocol, WebSocket, Telemetry)
│   ├── agent_logic.py            # HybridAgent orchestration (Azure OpenAI + AI Search + MAF)
│   ├── mock_services.py          # Deterministic fallback agents and mock databases
│   ├── telemetry_generator.py    # IoT sensor simulator for live demos
│   └── test_system.py            # Automated verification tests
├── mcp-server/
│   ├── server.js                 # MCP tool endpoints + Copilot Canvas integration
│   ├── ai-plugin.json            # Copilot plugin manifest (tool discovery)
│   └── public/
│       ├── openapi.json          # OpenAPI 3.1 specification
│       └── map_widget.html       # Fluent UI interactive dispatch map
├── Frontend/
│   └── src/
│       └── routes/
│           ├── index.tsx          # Landing page
│           ├── control-room.tsx   # Real-time dispatch console (WebSocket, OTel, Voice)
│           ├── architecture.tsx   # System architecture visualization
│           ├── agents.tsx         # Agent capability showcase
│           ├── compliance.tsx     # Regulatory compliance dashboard
│           └── deployments.tsx    # Deployment status monitor
└── run_local.ps1                 # One-command local startup script
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- (Optional) Azure subscription for real AI services

### Quick Start (Local)
```powershell
# Clone the repository
git clone https://github.com/your-org/OmniDispatch.git
cd OmniDispatch

# Run the automated startup script
.\run_local.ps1
```

This starts three services:
| Service | URL | Purpose |
|---------|-----|---------|
| React Frontend | http://localhost:8082 | Control Room dashboard |
| Python Agent Service | http://localhost:8088 | Responses Protocol + WebSocket |
| MCP Server | http://localhost:3000 | Copilot Canvas tools + widgets |

### Connecting Real Azure Services (Optional)
```powershell
# Copy the environment template
cp agent/.env.example agent/.env

# Fill in your Azure credentials
# See the "Azure Setup Guide" section below
```

### Azure Deployment
```powershell
# Install Azure Developer CLI
winget install Microsoft.Azd

# One-command provisioning and deployment
azd up
```

---

## 🔑 Azure Setup Guide

To connect OmniDispatch to real Azure AI services:

### Step 1: Create Azure OpenAI Resource
1. Go to [Azure Portal](https://portal.azure.com) → Create → "Azure OpenAI"
2. Deploy a `gpt-4o` model
3. Copy the **Endpoint** and **API Key** from the resource's "Keys and Endpoint" page

### Step 2: Create Azure AI Search Resource
1. Go to [Azure Portal](https://portal.azure.com) → Create → "Azure AI Search"
2. Create an index named `omnidispatch-policies`
3. Upload safety regulation documents (PDFs)
4. Enable **Semantic Search** configuration

### Step 3: Configure Environment Variables
```bash
# In agent/.env
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-key
AZURE_OPENAI_DEPLOYMENT=gpt-4o
AZURE_SEARCH_ENDPOINT=https://your-search.search.windows.net
AZURE_SEARCH_KEY=your-key
AZURE_SEARCH_INDEX=omnidispatch-policies
```

### What's Real vs. What's Simulated

| Component | With Azure Credentials | Without Credentials |
|-----------|----------------------|---------------------|
| **Analysis Agent** | Real GPT-4o inference on telemetry data | Deterministic mock classification |
| **Policy Agent** | RAG retrieval from Azure AI Search index | Mock safety policy database |
| **Logistics Agent** | Real GPT-4o reasoning over workforce data | Mock proximity calculations |
| **ConcurrentBuilder** | Real parallel execution pattern | Identical parallel mock execution |
| **HITL Approval** | Full `approval_mode='always_require'` | Identical approval enforcement |
| **OTel Tracing** | Azure App Insights export | Console span export |
| **WebSocket Streaming** | Identical real-time broadcast | Identical real-time broadcast |
| **Control Room UI** | Identical live dashboard | Identical live dashboard |

> **Note**: The HITL approval, WebSocket streaming, OTel tracing, PDF export, and Control Room are **fully real** in both modes. Only the LLM inference and RAG search switch between Azure and mock.

---

## 🧪 Testing

```powershell
# Run automated verification tests
cd agent
python test_system.py

# Check system health and Azure connectivity
curl http://localhost:8088/

# Send a test telemetry alert
curl -X POST http://localhost:8088/telemetry -H "Content-Type: application/json" -d '{"incident_id":"INC-TEST-001","failure_type":"Transformer Overload","severity":"Critical","grid_zone":"North-East Sector (NE-04)","metrics":{"temperature_c":115.4,"coolant_level_percent":14.2,"load_percentage":138.5}}'
```

---

## 🏆 Hackathon Rubric Alignment

| Criterion (Weight) | OmniDispatch Implementation | Evidence |
|:---|:---|:---|
| **Reasoning & Multi-step** (20%) | `ConcurrentBuilder` fans out 3 agents in parallel. Custom `Aggregator` merges without extra LLM call. | [agent_logic.py](agent/agent_logic.py) — `HybridAgent` class + `register_aggregator()` |
| **Reliability & Safety** (20%) | `@ai_function(approval_mode='always_require')` halts execution graph. UUID audit tokens. Cryptographic hash in PDF reports. | [agent_logic.py](agent/agent_logic.py) — `dispatch_technicians()` decorator |
| **Accuracy & Relevance** (20%) | Azure AI Search RAG for policy grounding. Semantic search over safety regulations. Real GPT-4o inference. | [agent_logic.py](agent/agent_logic.py) — `search_policy_index()` + Azure OpenAI integration |
| **User Experience** (15%) | Fluent UI widgets in Copilot Canvas. React Control Room with OTel Gantt, voice alerts, heatmap, PDF export. | [control-room.tsx](Frontend/src/routes/control-room.tsx) + [map_widget.html](mcp-server/public/map_widget.html) |
| **Creativity** (15%) | Novel domain (critical infrastructure). Real-time WebSocket telemetry. Multi-incident queue. Voice synthesis. | Full system integration across all components |

---

## 📋 Copilot Canvas Integration

OmniDispatch integrates with Microsoft Copilot Canvas via the Model Context Protocol (MCP):

1. **Plugin Discovery**: `ai-plugin.json` + `openapi.json` at `/.well-known/ai-plugin.json`
2. **Tool Invocation**: Copilot calls `/tools/show_assignments_on_map` to render interactive HTML widgets
3. **Theme Adaptation**: Widgets detect Copilot's light/dark mode via CSS media queries
4. **Real-Time Data**: Widget connects to the Agent Service WebSocket for live incident updates

```
Copilot Canvas ←→ MCP Server (Port 3000) ←→ Agent Service (Port 8088)
                     │                              │
              Tool Discovery               WebSocket Streaming
              Widget Rendering             Telemetry Processing
              OpenAPI Spec                 HITL Approval
```

---

## 🎬 Demo Video

> 📹 [Watch the 3-minute demo video →](#) 



https://github.com/user-attachments/assets/c8f56c2b-69da-46a6-8ed8-cd6bd3e1f404





The demo shows:
1. A live telemetry alert arriving via WebSocket
2. Three agents executing in parallel (visible on the OTel Gantt trace)
3. Voice synthesis announcing the incident
4. Human operator authorizing the dispatch
5. PDF audit report generation

---

## 📄 License

MIT License — See [LICENSE](LICENSE) for details.

---

<div align="center">

**◆ OMNIDISPATCH // AUTONOMOUS DISPATCH, DONE RESPONSIBLY ◆**

*Built for the Microsoft Agents League Hackathon 2026*

</div>
