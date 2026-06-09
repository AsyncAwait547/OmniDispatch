import os
import logging
import json
import uuid
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

# Import local agent logic and fallback state
from agent_logic import run_dispatch_pipeline, dispatch_technicians, get_system_status

# OpenTelemetry setups (simulating Azure App Insights observability)
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor, ConsoleSpanExporter

# Setup basic logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("OmniDispatch.AgentService")

# Initialize OpenTelemetry tracer
provider = TracerProvider()
processor = SimpleSpanProcessor(ConsoleSpanExporter())
provider.add_span_processor(processor)
trace.set_tracer_provider(provider)
tracer = trace.get_tracer("omnidispatch-agent-tracer")

app = FastAPI(
    title="OmniDispatch Agent Service",
    description="Azure AI Foundry Hosted Agent Service implementing Port 8088 Responses Protocol with Live WebSockets",
    version="1.0.0"
)

# Enable CORS for local integration testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info("New WebSocket client connected.")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info("WebSocket client disconnected.")

    async def broadcast(self, message: dict):
        logger.info(f"Broadcasting message to {len(self.active_connections)} active WebSocket client(s).")
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error sending message to client: {e}")
                self.disconnect(connection)

manager = ConnectionManager()

# In-memory dispatch history store
dispatch_history: List[Dict[str, Any]] = []

# Request / Response Schemas
class IncidentRequest(BaseModel):
    prompt: str
    session_id: Optional[str] = "session-default"
    history: Optional[List[Dict[str, Any]]] = []

class DispatchApprovalRequest(BaseModel):
    incident_id: str
    technician_names: List[str]
    grid_zone: str
    approved: bool

class TelemetryAlert(BaseModel):
    incident_id: str
    failure_type: str
    severity: str
    grid_zone: str
    metrics: Dict[str, Any]

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep client connection alive
            data = await websocket.receive_text()
            logger.info(f"Received feedback from client: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket connection error: {e}")
        manager.disconnect(websocket)

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "service": "OmniDispatch Agent Service",
        "port": 8088,
        "protocol": "responses",
        "azure_services": get_system_status()
    }

@app.post("/telemetry")
async def handle_telemetry_stream(alert: TelemetryAlert):
    logger.info(f"Received real-time telemetry alert for incident {alert.incident_id} in {alert.grid_zone}.")
    
    with tracer.start_as_current_span("telemetry_stream_processing") as span:
        span.set_attribute("incident_id", alert.incident_id)
        span.set_attribute("grid_zone", alert.grid_zone)
        
        try:
            # Trigger agent pipeline execution asynchronously
            prompt = f"Analyze incident {alert.incident_id} ({alert.failure_type}) in {alert.grid_zone}. Metrics: {json.dumps(alert.metrics)}."
            proposal = await run_dispatch_pipeline(prompt)
            
            # Map dynamic telemetry variables onto the proposal payload
            proposal["incident_id"] = alert.incident_id
            proposal["failure_zone"] = alert.grid_zone
            proposal["diagnostics"] = {
                "type": alert.failure_type,
                "severity": alert.severity,
                "temperature": f"{alert.metrics.get('temperature_c', 0)}C",
                "coolant_level": f"{alert.metrics.get('coolant_level_percent', 0)}%"
            }
            
            # Broadcast the compiled dispatch proposal
            event_payload = {
                "event": "NEW_INCIDENT_PROPOSAL",
                "data": proposal
            }
            await manager.broadcast(event_payload)
            
            return {
                "status": "TELEMETRY_PROCESSED_AND_BROADCAST",
                "incident_id": alert.incident_id
            }
        except Exception as e:
            logger.exception("Error processing real-time telemetry")
            span.record_exception(e)
            raise HTTPException(status_code=500, detail=str(e))

@app.post("/responses")
async def handle_responses_protocol(payload: IncidentRequest):
    logger.info(f"Received request under Responses protocol. Session: {payload.session_id}")
    
    with tracer.start_as_current_span("responses_protocol_execution") as span:
        span.set_attribute("session_id", payload.session_id)
        span.set_attribute("user_prompt", payload.prompt)
        
        try:
            # Execute the multi-agent ConcurrentBuilder orchestration
            proposal = await run_dispatch_pipeline(payload.prompt)
            
            # Format and return the result
            response_payload = {
                "session_id": payload.session_id,
                "response": "Dispatch proposal synthesized successfully.",
                "data": proposal
            }
            logger.info("Successfully executed agent logic and returned response.")
            return response_payload
            
        except Exception as e:
            logger.exception("Error executing orchestration pipeline")
            span.record_exception(e)
            raise HTTPException(status_code=500, detail=str(e))

@app.post("/dispatch")
def execute_dispatch_with_approval(payload: DispatchApprovalRequest):
    logger.info(f"Received HITL dispatch command for incident {payload.incident_id}.")
    
    with tracer.start_as_current_span("execute_dispatch_approval") as span:
        span.set_attribute("incident_id", payload.incident_id)
        span.set_attribute("approved", payload.approved)
        
        if not payload.approved:
            logger.warning("Dispatch approval was rejected by human operator.")
            return {
                "status": "DISPATCH_REJECTED",
                "message": "Human operator rejected the dispatch recommendation."
            }
            
        try:
            # Trigger the tool decorated with approval_mode='always_require'
            result = dispatch_technicians(
                incident_id=payload.incident_id,
                technician_names=payload.technician_names,
                grid_zone=payload.grid_zone
            )
            
            # Generate dynamic audit ID and timestamp
            audit_id = f"AUDIT-{payload.incident_id}-{uuid.uuid4().hex[:8].upper()}"
            timestamp = datetime.now(timezone.utc).isoformat()
            result["audit_id"] = audit_id
            result["timestamp"] = timestamp
            
            # Store in dispatch history
            history_entry = {
                "incident_id": payload.incident_id,
                "grid_zone": payload.grid_zone,
                "technicians": payload.technician_names,
                "audit_id": audit_id,
                "timestamp": timestamp,
                "status": "DISPATCH_ACTIVE"
            }
            dispatch_history.insert(0, history_entry)
            logger.info(f"Dispatch history updated. Total entries: {len(dispatch_history)}")
            
            return result
        except Exception as e:
            logger.exception("Error executing dispatch tool")
            span.record_exception(e)
            raise HTTPException(status_code=500, detail=str(e))

@app.get("/dispatch-history")
def get_dispatch_history():
    """Returns the full dispatch history for audit and compliance purposes."""
    return {
        "total": len(dispatch_history),
        "history": dispatch_history
    }

if __name__ == "__main__":
    import uvicorn
    # Start FastAPI server on port 8088 as specified by the responses protocol
    uvicorn.run(app, host="0.0.0.0", port=8088)
