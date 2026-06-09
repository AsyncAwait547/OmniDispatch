const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static assets from the public directory
app.use(express.static(path.join(__dirname, 'public')));

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
// Instead of returning JSON, this returns the self-contained HTML widget
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
  console.log(`OmniDispatch MCP Server running on port ${PORT}`);
  console.log(`Exposed Tools:`);
  console.log(`- POST http://localhost:${PORT}/tools/list_new_assignments`);
  console.log(`- POST http://localhost:${PORT}/tools/show_assignments_on_map`);
  console.log(`Exposed Widgets:`);
  console.log(`- GET http://localhost:${PORT}/widgets/map`);
});
