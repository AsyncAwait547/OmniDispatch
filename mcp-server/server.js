const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL || 'http://localhost:8088';

app.use(cors());
app.use(express.json());

// Serve static assets from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// ─── OpenAPI spec for Copilot Canvas tool discovery ───
app.get('/openapi.json', (req, res) => {
  const specPath = path.join(__dirname, 'public', 'openapi.json');
  res.sendFile(specPath);
});

// ─── AI Plugin manifest for Copilot connection ───
app.get('/.well-known/ai-plugin.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'ai-plugin.json'));
});

// Mock list of current assignments
const MOCK_ASSIGNMENTS = [
  {
    assignment_id: "ASG-2026-0091",
    incident_id: "INC-2026-8941",
    technician: "Sarah Jenkins",
    role: "Senior Electrical Engineer",
    eta_minutes: 12,
    route: "Route A: 4.2 miles via I-95 South",
    status: "Pending Authorization"
  },
  {
    assignment_id: "ASG-2026-0092",
    incident_id: "INC-2026-8941",
    technician: "David Miller",
    role: "HV Technician",
    eta_minutes: 22,
    route: "Route B: 8.7 miles via Highway 10",
    status: "Pending Authorization"
  }
];

// MCP Tool Endpoint: list_new_assignments
app.post('/tools/list_new_assignments', (req, res) => {
  console.log("MCP Tool Called: list_new_assignments");
  res.json({
    status: "success",
    assignments: MOCK_ASSIGNMENTS
  });
});

// MCP Tool Endpoint: show_assignments_on_map
// Returns the self-contained HTML widget for Copilot Canvas rendering
app.post('/tools/show_assignments_on_map', (req, res) => {
  console.log("MCP Tool Called: show_assignments_on_map");
  
  const mapWidgetPath = path.join(__dirname, 'public', 'map_widget.html');
  
  fs.readFile(mapWidgetPath, 'utf8', (err, data) => {
    if (err) {
      console.error("Error reading map widget template:", err);
      return res.status(500).send("Error generating map widget.");
    }
    
    // Inject dynamic technician data into the widget template
    let renderedWidget = data
      .replace('{{INCIDENT_ID}}', req.body.incident_id || 'INC-2026-8941')
      .replace('{{GRID_ZONE}}', req.body.grid_zone || 'North-East Sector (NE-04)')
      .replace('{{TECHNICIANS_JSON}}', JSON.stringify(MOCK_ASSIGNMENTS));
      
    res.setHeader('Content-Type', 'text/html');
    res.send(renderedWidget);
  });
});

// MCP Tool Endpoint: get_dispatch_status
// Proxies to the Python agent service for real-time pipeline status
app.post('/tools/get_dispatch_status', async (req, res) => {
  console.log("MCP Tool Called: get_dispatch_status");
  try {
    const response = await fetch(`${AGENT_SERVICE_URL}/`, { method: 'GET' });
    const data = await response.json();
    res.json({
      pipeline_status: data.status === 'healthy' ? 'OPERATIONAL' : 'DEGRADED',
      agents: {
        analysis: 'READY',
        policy: 'READY',
        logistics: 'READY'
      },
      approval_status: 'AWAITING_INCIDENT',
      azure_services: data.azure_services || {},
      metrics: {
        mtta_seconds: 24.5,
        total_dispatches: 0,
        sla_uptime: 99.98
      }
    });
  } catch (err) {
    res.json({
      pipeline_status: 'AGENT_SERVICE_OFFLINE',
      agents: { analysis: 'UNKNOWN', policy: 'UNKNOWN', logistics: 'UNKNOWN' },
      approval_status: 'N/A',
      error: 'Could not reach agent service at ' + AGENT_SERVICE_URL
    });
  }
});

// HTTP endpoint to serve the widget directly for verification or iframe testing
app.get('/widgets/map', (req, res) => {
  const mapWidgetPath = path.join(__dirname, 'public', 'map_widget.html');
  fs.readFile(mapWidgetPath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send("Widget template not found.");
    }
    let renderedWidget = data
      .replace('{{INCIDENT_ID}}', 'INC-2026-8941')
      .replace('{{GRID_ZONE}}', 'North-East Sector (NE-04)')
      .replace('{{TECHNICIANS_JSON}}', JSON.stringify(MOCK_ASSIGNMENTS));
    res.setHeader('Content-Type', 'text/html');
    res.send(renderedWidget);
  });
});

app.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════════════════════╗`);
  console.log(`║  OmniDispatch MCP Server running on port ${PORT}         ║`);
  console.log(`╠══════════════════════════════════════════════════════╣`);
  console.log(`║  Exposed Tools:                                      ║`);
  console.log(`║  - POST /tools/list_new_assignments                   ║`);
  console.log(`║  - POST /tools/show_assignments_on_map                ║`);
  console.log(`║  - POST /tools/get_dispatch_status                    ║`);
  console.log(`║  Exposed Widgets:                                     ║`);
  console.log(`║  - GET  /widgets/map                                  ║`);
  console.log(`║  Copilot Canvas:                                      ║`);
  console.log(`║  - GET  /.well-known/ai-plugin.json                   ║`);
  console.log(`║  - GET  /openapi.json                                 ║`);
  console.log(`╚══════════════════════════════════════════════════════╝`);
});
