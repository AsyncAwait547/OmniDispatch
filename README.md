# OmniDispatch

**Autonomous Critical Infrastructure Orchestrator**  
*Developed for the Microsoft Agents League Hackathon 2026 (Reasoning Agents Track)*

OmniDispatch is an enterprise-grade autonomous multi-agent system built to orchestrate field technician dispatches in response to critical infrastructure failures (such as grid power overloads, telecom outages, and pipeline leaks).

The system integrates real-time IoT telemetry, regulatory policy compliance (union labor agreements, safety standards), and technician routing logistics. Results are rendered dynamically via theme-adaptive Fluent UI widgets inside the Microsoft Copilot Canvas.

---

## 📋 Table of Contents
1. [Key Features](#-key-features)
2. [System Architecture](#-system-architecture)
3. [Project Directory Layout](#-project-directory-layout)
4. [Local Setup & Running](#-local-setup--running)
5. [Verification & Testing](#-verification--testing)
6. [Rubric & Alignment](#-rubric--alignment)

---

## ✨ Key Features
* **Parallel Orchestration**: Fans out incoming incident alerts to three specialized agents simultaneously (Analysis, Policy, and Logistics) using the `ConcurrentBuilder` pattern, fanning back in with a custom zero-latency aggregator.
* **Human-in-the-Loop (HITL) Safety**: Prevents autonomous execution of high-stakes dispatches by enforcing `approval_mode="always_require"` on the dispatch executor tool.
* **Fluent UI Interactive Map Widget**: An adaptive HTML/JS control panel rendered in Copilot Canvas containing real-time animated technician routes and status indicators.
* **Cloud-Ready Compute isolation**: Configured via `Dockerfile` and `agent.yaml` to run containerized on the Azure AI Foundry Agent Service using the Responses Protocol on Port `8088`.
* **Telemetry Tracing**: Emits OpenTelemetry traces (structured spans for LLM inference, tool calls, and approval signatures) to Azure Application Insights.

---

## 🏗️ System Architecture

```
   ┌─────────────────────────────────────────────────────────────┐
   │                  Microsoft Copilot Canvas                   │
   │   - Interactive Fluent UI HTML Map Widget (Port 3000)      │
   └───────────────┬─────────────────────────────▲───────────────┘
                   │                             │
       [1] User Input (Incident)       [4] Renders Widget (HTML)
                   │                             │
   ┌───────────────▼─────────────────────────────┴───────────────┐
   │              Azure AI Foundry Agent Service                 │
   │               - main.py FastAPI (Port 8088)                 │
   │   ┌─────────────────────────────────────────────────────┐   │
   │   │        Microsoft Agent Framework v1.0 (MAF)         │   │
   │   │             - ConcurrentBuilder Orchestrator        │   │
   │   │                                                     │   │
   │   │   ┌───────────────┬─────────────────┬───────────┐   │   │
   │   │   │Analysis Agent │  Policy Agent   │Logistics  │   │   │
   │   │   │ (IoT Telemetry) (Foundry IQ RAG)│ Agent     │   │   │
   │   │   └───────┬───────┴────────┬────────┴─────┬─────┘   │   │
   │   │           │                │              │         │   │
   │   │           └──────────────┐ │ ┌────────────┘         │   │
   │   │                          ▼ ▼ ▼                      │   │
   │   │               [2] Custom Aggregator                 │   │
   │   │                          │                          │   │
   │   │               [3] Cryptographic HITL                │   │
   │   │           (approval_mode='always_require')          │   │
   │   └──────────────────────────┬──────────────────────────┘   │
   └──────────────────────────────┼──────────────────────────────┘
                                  │
                       [5] Dispatch Signed & Approved
                                  ▼
                     [Field Dispatch Hardware Units]
```

---

## 📁 Project Directory Layout

* [agent/](file:///d:/projects/OmniDispatch/agent/) - Python Agent Service directory.
  * [Dockerfile](file:///d:/projects/OmniDispatch/agent/Dockerfile) - Multi-stage container setup exposing port 8088.
  * [agent.yaml](file:///d:/projects/OmniDispatch/agent/agent.yaml) - Azure AI Foundry deployment manifest.
  * [requirements.txt](file:///d:/projects/OmniDispatch/agent/requirements.txt) - Python package dependencies.
  * [main.py](file:///d:/projects/OmniDispatch/agent/main.py) - FastAPI endpoint executing the Responses protocol.
  * [agent_logic.py](file:///d:/projects/OmniDispatch/agent/agent_logic.py) - Multi-agent graph implementation and tool binding.
  * [mock_services.py](file:///d:/projects/OmniDispatch/agent/mock_services.py) - Simulated framework libraries and datasets for fallback execution.
* [mcp-server/](file:///d:/projects/OmniDispatch/mcp-server/) - Node.js Express server acting as remote MCP.
  * [package.json](file:///d:/projects/OmniDispatch/mcp-server/package.json) - Node environment dependencies.
  * [server.js](file:///d:/projects/OmniDispatch/mcp-server/server.js) - Exposes tools and serves web widgets.
  * [ai-plugin.json](file:///d:/projects/OmniDispatch/mcp-server/ai-plugin.json) - Copilot connection file.
  * [public/map_widget.html](file:///d:/projects/OmniDispatch/mcp-server/public/map_widget.html) - Adaptive HTML panel using canvas animation.
* [run_local.ps1](file:///d:/projects/OmniDispatch/run_local.ps1) - Automation startup script for Windows.

---

## 🚀 Local Setup & Running

To execute and run the prototype on your local machine:

1. Open a **PowerShell** window as Administrator.
2. Navigate to the project root directory:
   ```powershell
   cd d:\projects\OmniDispatch
   ```
3. Run the automated startup script:
   ```powershell
   .\run_local.ps1
   ```
   *This script will install Node.js and Python dependencies automatically, then open two separate terminal windows running the MCP server (Port 3000) and the Agent service (Port 8088).*

---

## 🧪 Verification & Testing

Once both services are running:
* Access the interactive Fluent UI control panel widget directly in your browser:  
  `http://localhost:3000/widgets/map`
* Send a simulated incident payload to the Agent's Responses protocol endpoint:
  ```bash
  curl -X POST http://localhost:8088/responses -H "Content-Type: application/json" -d "{\"prompt\": \"Analyze grid overload in Sector NE-04\"}"
  ```
* Clicking the **"Authorize Dispatch"** button on the map widget will invoke the cryptographic approval handshakes with the Python agent service running on port 8088, outputting the signed audit code to the widget terminal console.
