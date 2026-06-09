# test_system.py
# Verification script to test OmniDispatch multi-agent execution pipeline

import asyncio
import json
import sys
import os

# Adjust path to import from agent directory if executed from project root
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agent_logic import run_dispatch_pipeline, dispatch_technicians

async def run_tests():
    print("==========================================================")
    print("               OMNIDISPATCH VERIFICATION TEST")
    print("==========================================================")
    
    # Test Case 1: Multi-Agent Parallel Pipeline Execution
    print("\n[Test 1/3] Executing Multi-Agent Parallel pipeline...")
    incident_description = "Alert: Coolant temperature overload in North-East substation NE-04A."
    
    try:
        proposal = await run_dispatch_pipeline(incident_description)
        print(" -> Pipeline executed successfully.")
        
        # Validate structure of synthesized dispatch plan
        assert proposal["incident_id"] == "INC-2026-8941", "Invalid Incident ID"
        assert proposal["failure_zone"] == "North-East Sector (NE-04)", "Invalid Failure Zone"
        assert "diagnostics" in proposal, "Diagnostics block missing"
        assert "safety_requirements" in proposal, "Safety requirements missing"
        assert "logistics_recommendations" in proposal, "Logistics recommendations missing"
        
        print(" -> Synthesized proposal schema validation: PASSED")
        print(f" -> Incident Diagnostics: {proposal['diagnostics']['type']} - Severity: {proposal['diagnostics']['severity']}")
        print(f" -> Dispatched Logistics Recommendation count: {len(proposal['logistics_recommendations'])}")
        
    except Exception as e:
        print(f" -> Test 1: FAILED - Error: {e}")
        sys.exit(1)

    # Test Case 2: Verification of dispatch execution with manual approval
    print("\n[Test 2/3] Verification of HITL Dispatch Approval Tool...")
    try:
        techs = [t["technician"] for t in proposal["logistics_recommendations"]]
        dispatch_result = dispatch_technicians(
            incident_id=proposal["incident_id"],
            technician_names=techs,
            grid_zone=proposal["failure_zone"]
        )
        
        assert dispatch_result["status"] == "DISPATCH_ORDER_TRANSMITTED", "Invalid status return"
        assert len(dispatch_result["dispatched_technicians"]) == 2, "Incorrect technician count"
        assert "audit_id" in dispatch_result, "Audit tracking ID missing"
        
        print(" -> Dispatch Tool Execution: PASSED")
        print(f" -> Audit Tracking ID: {dispatch_result['audit_id']}")
        print(f" -> Dispatched: {', '.join(dispatch_result['dispatched_technicians'])}")
        
    except Exception as e:
        print(f" -> Test 2: FAILED - Error: {e}")
        sys.exit(1)

    # Test Case 3: FastAPI Web Server validation
    print("\n[Test 3/3] Checking web server routing schema...")
    try:
        import fastapi
        import uvicorn
        from fastapi.testclient import TestClient
        from main import app
        
        client = TestClient(app)
        
        # Test health check
        response = client.get("/")
        assert response.status_code == 200, "Health check failed"
        assert response.json()["status"] == "healthy", "Status not healthy"
        
        # Test responses protocol POST route
        payload = {"prompt": "Analyze grid failure in Sector NE-04"}
        response = client.post("/responses", json=payload)
        assert response.status_code == 200, "Responses protocol route failed"
        response_json = response.json()
        assert "data" in response_json, "Responses payload missing data attribute"
        
        # Test dispatch approval POST route
        approval_payload = {
            "incident_id": "INC-2026-8941",
            "technician_names": ["Sarah Jenkins", "David Miller"],
            "grid_zone": "North-East Sector (NE-04)",
            "approved": True
        }
        response = client.post("/dispatch", json=approval_payload)
        assert response.status_code == 200, "Dispatch approval route failed"
        assert response.json()["status"] == "DISPATCH_ORDER_TRANSMITTED", "Approval response failed"
        
        print(" -> Web Server Router Schema: PASSED")
        
    except ImportError:
        print(" -> Test 3: SKIPPED (fastapi.testclient or dependencies not installed in current environment)")
    except Exception as e:
        print(f" -> Test 3: FAILED - Error: {e}")
        sys.exit(1)

    print("\n==========================================================")
    print("           ALL LOCAL SYSTEM VERIFICATIONS PASSED")
    print("==========================================================")

if __name__ == "__main__":
    asyncio.run(run_tests())
