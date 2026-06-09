import asyncio
import functools
import json
import logging
from typing import List, Callable, Any, Dict

logger = logging.getLogger("OmniDispatch.MockServices")

# Mock database records
MOCK_IOT_TELEMETRY = {
    "grid_zone": "North-East Sector (NE-04)",
    "incident_id": "INC-2026-8941",
    "failure_type": "Substation Transformer Overload / Coolant Leak",
    "severity": "Critical",
    "affected_substations": ["Substation NE-04A", "Substation NE-04B", "Substation NE-04C"],
    "metrics": {
        "temperature_c": 115.4,
        "coolant_level_percent": 14.2,
        "load_percentage": 138.5,
    }
}

MOCK_COMPLIANCE_POLICIES = [
    {
        "id": "REG-SEC-101",
        "title": "High Voltage Work Safety Standards",
        "content": "Any technician working on transformers above 10kV must hold a valid Class 1 High-Voltage Certification. Team dispatch requires a minimum of two certified personnel if temperature exceeds 100C.",
    },
    {
        "id": "UNION-SLA-SEC4",
        "title": "Union Labor Overtime Thresholds",
        "content": "Emergency overtime dispatch requires union approval if technician has exceeded 48 hours of work in the current week. Dispatch priority must favor technicians with remaining regular hours.",
    },
    {
        "id": "SLA-T-300",
        "title": "Utility Provider Critical Response Time SLA",
        "content": "For Critical severity incidents in residential zones, response teams must be dispatched and arrive on-site within 45 minutes of telemetry alert to avoid compliance penalties.",
    }
]

MOCK_WORKFORCE_DATABASE = [
    {
        "name": "Sarah Jenkins",
        "role": "Senior Electrical Engineer",
        "certifications": ["Class 1 High-Voltage Certified", "Transformer Maintenance Specialist"],
        "proximity_miles": 4.2,
        "eta_minutes": 12,
        "current_hours_week": 38.5,
        "available": True,
    },
    {
        "name": "David Miller",
        "role": "HV Technician",
        "certifications": ["Class 1 High-Voltage Certified"],
        "proximity_miles": 8.7,
        "eta_minutes": 22,
        "current_hours_week": 42.0,
        "available": True,
    },
    {
        "name": "Alex Rivera",
        "role": "Grid Operations Apprentice",
        "certifications": ["General Grid Safety"],
        "proximity_miles": 2.1,
        "eta_minutes": 8,
        "current_hours_week": 24.0,
        "available": True,
    }
]

# Simulated Agent Framework Classes (in case agent-framework package isn't installed)
class MockAgentRunResponse:
    def __init__(self, text: str):
        self.text = text

class MockAgentExecutorResponse:
    def __init__(self, agent_name: str, response_text: str):
        self.agent_name = agent_name
        self.text = response_text
        # Emulate the MAF message hierarchy
        class MessageObj:
            def __init__(self, t):
                self.text = t
        class RunResponse:
            def __init__(self, t):
                self.messages = [MessageObj(t)]
        self.agent_run_response = RunResponse(response_text)

class MockAgent:
    def __init__(self, name: str, system_prompt: str, tools: List[Callable] = None):
        self.name = name
        self.system_prompt = system_prompt
        self.tools = tools or []

    async def run(self, input_text: str) -> str:
        # Simulate LLM thinking and generating responses using mock databases
        await asyncio.sleep(0.5)  # Simulate network/LLM latency
        
        if "Analysis" in self.name:
            return (
                f"Analysis Agent Response:\n"
                f"- Evaluated IoT Telemetry Feed.\n"
                f"- Failure detected: {MOCK_IOT_TELEMETRY['failure_type']} (Severity: {MOCK_IOT_TELEMETRY['severity']}).\n"
                f"- Target Area: {MOCK_IOT_TELEMETRY['grid_zone']}.\n"
                f"- Metrics: Temp is {MOCK_IOT_TELEMETRY['metrics']['temperature_c']}°C, Coolant is at {MOCK_IOT_TELEMETRY['metrics']['coolant_level_percent']}%. Urgent dispatch is required."
            )
        elif "Policy" in self.name:
            # Emulate search matching
            policies = "\n".join([f"- [{p['id']}] {p['title']}: {p['content']}" for p in MOCK_COMPLIANCE_POLICIES])
            return (
                f"Policy Agent Response:\n"
                f"- Checked Foundry IQ (Azure AI Search).\n"
                f"- Applicable regulations and safety requirements found:\n{policies}"
            )
        elif "Logistics" in self.name:
            candidates = []
            for w in MOCK_WORKFORCE_DATABASE:
                if w["available"]:
                    candidates.append(
                        f"  * {w['name']} ({w['role']}): ETA {w['eta_minutes']} mins, proximity {w['proximity_miles']} miles. Certs: {', '.join(w['certifications'])}. Hours worked: {w['current_hours_week']}/48."
                    )
            candidates_str = "\n".join(candidates)
            return (
                f"Logistics Agent Response:\n"
                f"- Queried workforce database via SQL MCP tools.\n"
                f"- Identified active, certified technicians near incident location:\n{candidates_str}"
            )
        else:
            return f"MockAgent '{self.name}' received: {input_text}"

class MockConcurrentBuilder:
    def __init__(self, participants: List[Any]):
        self.participants = participants
        self.aggregator = None
        self._checkpointing = None
        self._request_info = False

    def with_aggregator(self, callback: Callable) -> 'MockConcurrentBuilder':
        self.aggregator = callback
        return self

    def with_checkpointing(self, storage: Any) -> 'MockConcurrentBuilder':
        self._checkpointing = storage
        return self

    def with_request_info(self) -> 'MockConcurrentBuilder':
        self._request_info = True
        return self

    def build(self):
        class SimulatedWorkflow:
            def __init__(self, builder: MockConcurrentBuilder):
                self.builder = builder

            async def run(self, input_data: str) -> Any:
                logger.info(f"ConcurrentBuilder running with {len(self.builder.participants)} participants in parallel...")
                tasks = [p.run(input_data) for p in self.builder.participants]
                results = await asyncio.gather(*tasks)
                
                # Wrap results in ExecutorResponses
                executor_responses = []
                for i, r in enumerate(results):
                    agent_name = self.builder.participants[i].name
                    executor_responses.append(MockAgentExecutorResponse(agent_name, r))
                
                if self.builder.aggregator:
                    return self.builder.aggregator(executor_responses)
                return executor_responses
                
        return SimulatedWorkflow(self)

def mock_ai_function(description: str, approval_mode: str = None):
    def decorator(func: Callable):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            return func(*args, **kwargs)
        # Store metadata attributes on wrapper function
        wrapper.__ai_function_description__ = description
        wrapper.__ai_function_approval_mode__ = approval_mode
        return wrapper
    return decorator
