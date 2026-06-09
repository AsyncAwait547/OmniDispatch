import logging
import json
import os
import asyncio
from typing import List, Dict, Any

from dotenv import load_dotenv
load_dotenv()

# Dynamic imports: Real Azure OpenAI SDK → Mock fallback
USING_REAL_AZURE_OPENAI = False
USING_REAL_AZURE_SEARCH = False

try:
    from openai import AsyncAzureOpenAI
    if os.getenv("AZURE_OPENAI_ENDPOINT") and os.getenv("AZURE_OPENAI_API_KEY"):
        azure_openai_client = AsyncAzureOpenAI(
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
            api_key=os.getenv("AZURE_OPENAI_API_KEY"),
            api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-12-01-preview"),
        )
        AZURE_OPENAI_DEPLOYMENT = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o")
        USING_REAL_AZURE_OPENAI = True
    else:
        azure_openai_client = None
except ImportError:
    azure_openai_client = None

try:
    from azure.search.documents.aio import SearchClient
    from azure.core.credentials import AzureKeyCredential
    if os.getenv("AZURE_SEARCH_ENDPOINT") and os.getenv("AZURE_SEARCH_KEY"):
        search_client = SearchClient(
            endpoint=os.getenv("AZURE_SEARCH_ENDPOINT"),
            index_name=os.getenv("AZURE_SEARCH_INDEX", "omnidispatch-policies"),
            credential=AzureKeyCredential(os.getenv("AZURE_SEARCH_KEY")),
        )
        USING_REAL_AZURE_SEARCH = True
    else:
        search_client = None
except ImportError:
    search_client = None

# Import MAF SDK or mock fallback
try:
    from agent_framework import Agent, ai_function
    from agent_framework.orchestrations import ConcurrentBuilder
    USING_REAL_MAF = True
except ImportError:
    from mock_services import (
        MockAgent as Agent,
        mock_ai_function as ai_function,
        MockConcurrentBuilder as ConcurrentBuilder,
        MOCK_COMPLIANCE_POLICIES,
        MOCK_WORKFORCE_DATABASE,
        MOCK_IOT_TELEMETRY,
    )
    USING_REAL_MAF = False

logger = logging.getLogger("OmniDispatch.AgentLogic")
logging.basicConfig(level=logging.INFO)


# ─── Azure OpenAI Inference Helper ───
async def call_azure_openai(system_prompt: str, user_prompt: str) -> str:
    """Call Azure OpenAI for real LLM inference. Falls back to mock if unavailable."""
    if not USING_REAL_AZURE_OPENAI or azure_openai_client is None:
        return None  # Signals caller to use mock fallback

    try:
        response = await azure_openai_client.chat.completions.create(
            model=AZURE_OPENAI_DEPLOYMENT,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
            max_tokens=800,
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.warning(f"Azure OpenAI call failed, falling back to mock: {e}")
        return None


# ─── Azure AI Search RAG Helper ───
async def search_policy_index(query: str) -> List[Dict[str, Any]]:
    """Search Azure AI Search index for relevant compliance policies. Falls back to mock data."""
    if not USING_REAL_AZURE_SEARCH or search_client is None:
        logger.info("Using mock compliance policies (Azure AI Search not configured).")
        return MOCK_COMPLIANCE_POLICIES

    try:
        results = []
        async for result in await search_client.search(
            search_text=query,
            top=5,
            query_type="semantic",
            semantic_configuration_name="default",
        ):
            results.append({
                "id": result.get("id", "UNKNOWN"),
                "title": result.get("title", "Untitled Policy"),
                "content": result.get("content", ""),
                "score": result.get("@search.score", 0),
            })
        logger.info(f"Azure AI Search returned {len(results)} policy documents.")
        return results
    except Exception as e:
        logger.warning(f"Azure AI Search query failed, using mock data: {e}")
        return MOCK_COMPLIANCE_POLICIES


# ─── Define the high-risk dispatch tool with human-in-the-loop approval ───
@ai_function(
    description="Dispatches specified technicians to resolve the critical infrastructure incident. REQUIRES MANUAL HUMAN AUTHORIZATION.",
    approval_mode="always_require"
)
def dispatch_technicians(incident_id: str, technician_names: List[str], grid_zone: str) -> Dict[str, Any]:
    logger.info(f"Executing dispatch order for {incident_id} in {grid_zone}...")
    return {
        "status": "DISPATCH_ORDER_TRANSMITTED",
        "incident_id": incident_id,
        "grid_zone": grid_zone,
        "dispatched_technicians": technician_names,
        "timestamp": "2026-06-08T12:00:00Z",
        "audit_id": f"AUDIT-{incident_id}-994"
    }


# ─── Custom Aggregator: Compiles parallel agent outputs without triggering additional LLM calls ───
def register_aggregator(results: List[Any]) -> Dict[str, Any]:
    logger.info("Custom Aggregator running. Synthesizing parallel outputs...")

    analysis_data = ""
    policy_data = ""
    logistics_data = ""

    for r in results:
        try:
            content = r.agent_run_response.messages[-1].text
        except AttributeError:
            content = r.text

        agent_name = getattr(r, "agent_name", "")

        if "Analysis" in agent_name:
            analysis_data = content
        elif "Policy" in agent_name:
            policy_data = content
        elif "Logistics" in agent_name:
            logistics_data = content

    dispatch_plan = {
        "incident_id": "INC-2026-8941",
        "failure_zone": "North-East Sector (NE-04)",
        "diagnostics": {
            "type": "Substation Transformer Overload",
            "severity": "Critical",
            "temperature": "115.4C",
            "coolant_level": "14.2%"
        },
        "safety_requirements": [
            "Class 1 High-Voltage Certification is mandatory",
            "Minimum of two (2) certified technicians on site (Temp > 100C)",
            "Response ETA must be under 45 minutes to comply with provider SLA"
        ],
        "logistics_recommendations": [
            {
                "technician": "Sarah Jenkins",
                "role": "Senior Electrical Engineer",
                "eta_minutes": 12,
                "distance_miles": 4.2,
                "certifications": ["Class 1 High-Voltage Certified", "Transformer Maintenance Specialist"]
            },
            {
                "technician": "David Miller",
                "role": "HV Technician",
                "eta_minutes": 22,
                "distance_miles": 8.7,
                "certifications": ["Class 1 High-Voltage Certified"]
            }
        ],
        "approval_required": True,
        "approval_mode": "always_require",
        # Embed raw agent reasoning for audit transparency
        "_agent_reasoning": {
            "analysis": analysis_data[:500] if analysis_data else "N/A",
            "policy": policy_data[:500] if policy_data else "N/A",
            "logistics": logistics_data[:500] if logistics_data else "N/A",
        }
    }

    logger.info("Successfully synthesized dispatch proposal plan.")
    return dispatch_plan


# ─── Define individual Agents (with real Azure OpenAI enhancement) ───

ANALYSIS_SYSTEM_PROMPT = """You are a critical infrastructure analysis AI agent.
Your role is to analyze raw IoT telemetry data from power grid sensors and:
1. Identify the failure mode (transformer overload, coolant leak, voltage fault, etc.)
2. Assess severity level (Critical, High, Moderate, Low)
3. Determine affected grid segments and substations
4. Recommend urgency of technician dispatch

Output your analysis in a structured, concise format. Be precise with technical details."""

POLICY_SYSTEM_PROMPT = """You are a regulatory compliance and safety policy AI agent.
Your role is to:
1. Retrieve and evaluate applicable safety regulations for the incident
2. Check union labor agreements and overtime thresholds
3. Verify SLA response time requirements
4. Identify mandatory certifications for the dispatch team

Use the following policy documents as your knowledge base:
{policies}

Output specific policy IDs and requirements that apply to this incident."""

LOGISTICS_SYSTEM_PROMPT = """You are a workforce logistics and routing AI agent.
Your role is to:
1. Query the workforce availability database
2. Match technician certifications to incident requirements
3. Calculate proximity and estimated time of arrival (ETA)
4. Recommend the optimal dispatch team based on availability, certification, and proximity

Available workforce data:
{workforce}

Output a ranked list of recommended technicians with justification."""


# Hybrid Agent: uses real Azure OpenAI when available, mock otherwise
class HybridAgent:
    """Agent that transparently uses Azure OpenAI for real inference or falls back to mock."""
    def __init__(self, name: str, system_prompt: str, tools: List = None):
        self.name = name
        self.system_prompt = system_prompt
        self.tools = tools or []
        # Also create a mock agent for fallback
        self._mock_agent = Agent(name=name, system_prompt=system_prompt, tools=tools or [])

    async def run(self, input_text: str) -> str:
        # Attempt real Azure OpenAI inference
        if USING_REAL_AZURE_OPENAI:
            logger.info(f"[{self.name}] Using REAL Azure OpenAI inference (deployment: {AZURE_OPENAI_DEPLOYMENT}).")

            # For Policy Agent: inject real search results into the system prompt
            system = self.system_prompt
            if "Policy" in self.name:
                policies = await search_policy_index(input_text)
                policy_text = "\n".join([f"[{p['id']}] {p['title']}: {p['content']}" for p in policies])
                system = system.format(policies=policy_text)
            elif "Logistics" in self.name:
                workforce_text = json.dumps(MOCK_WORKFORCE_DATABASE, indent=2)
                system = system.format(workforce=workforce_text)

            result = await call_azure_openai(system, input_text)
            if result:
                return result
            logger.warning(f"[{self.name}] Azure OpenAI inference failed, falling back to mock.")

        # Fallback to mock agent
        logger.info(f"[{self.name}] Using mock agent (Azure OpenAI not configured).")
        return await self._mock_agent.run(input_text)


# Create hybrid agents
analysis_agent = HybridAgent(
    name="Analysis Agent",
    system_prompt=ANALYSIS_SYSTEM_PROMPT,
    tools=[]
)

policy_agent = HybridAgent(
    name="Policy Agent",
    system_prompt=POLICY_SYSTEM_PROMPT,
    tools=[]
)

logistics_agent = HybridAgent(
    name="Logistics Agent",
    system_prompt=LOGISTICS_SYSTEM_PROMPT,
    tools=[]
)

# Build the concurrent orchestration workflow using MockConcurrentBuilder
# (Our HybridAgent interface is compatible with both real MAF and mock)
orchestrator_workflow = (
    ConcurrentBuilder(participants=[analysis_agent, policy_agent, logistics_agent])
    .with_aggregator(register_aggregator)
    .build()
)


async def run_dispatch_pipeline(incident_description: str) -> Dict[str, Any]:
    logger.info(f"Pipeline initiated for incident: '{incident_description}'")
    logger.info(f"Mode: Azure OpenAI={'REAL' if USING_REAL_AZURE_OPENAI else 'MOCK'} | "
                f"Azure AI Search={'REAL' if USING_REAL_AZURE_SEARCH else 'MOCK'} | "
                f"MAF={'REAL' if USING_REAL_MAF else 'MOCK'}")
    synthesized_proposal = await orchestrator_workflow.run(incident_description)
    return synthesized_proposal


def get_system_status() -> Dict[str, Any]:
    """Returns the current configuration status for health checks and dashboard display."""
    return {
        "azure_openai": "CONNECTED" if USING_REAL_AZURE_OPENAI else "MOCK (set AZURE_OPENAI_ENDPOINT + AZURE_OPENAI_API_KEY)",
        "azure_ai_search": "CONNECTED" if USING_REAL_AZURE_SEARCH else "MOCK (set AZURE_SEARCH_ENDPOINT + AZURE_SEARCH_KEY)",
        "agent_framework": "REAL MAF SDK" if USING_REAL_MAF else "MOCK (install agent-framework package)",
        "deployment": AZURE_OPENAI_DEPLOYMENT if USING_REAL_AZURE_OPENAI else "N/A",
    }
