# telemetry_generator.py
# Simulates live IoT telemetry feeds from grid transformers and streams them to the Agent service

import time
import httpx
import random
import sys

TARGET_URL = "http://localhost:8088/telemetry"

FAILURES = [
    {
        "failure_type": "Substation Transformer Overload / Coolant Leak",
        "severity": "Critical",
        "temp_range": (110.0, 130.0),
        "coolant_range": (10.0, 20.0)
    },
    {
        "failure_type": "Voltage Regulator Fault / Arcing Hazard",
        "severity": "Critical",
        "temp_range": (95.0, 115.0),
        "coolant_range": (35.0, 50.0)
    },
    {
        "failure_type": "Phase Unbalance / Overheating Coil",
        "severity": "High",
        "temp_range": (80.0, 95.0),
        "coolant_range": (60.0, 75.0)
    }
]

GRID_SECTORS = [
    "North-East Sector (NE-04)",
    "North-West Sector (NW-02)",
    "South-East Sector (SE-11)",
    "South-West Sector (SW-07)"
]

def generate_telemetry_report(index: int) -> dict:
    failure = random.choice(FAILURES)
    sector = random.choice(GRID_SECTORS)
    incident_id = f"INC-2026-{8000 + index}"
    
    return {
        "incident_id": incident_id,
        "failure_type": failure["failure_type"],
        "severity": failure["severity"],
        "grid_zone": sector,
        "metrics": {
            "temperature_c": round(random.uniform(*failure["temp_range"]), 1),
            "coolant_level_percent": round(random.uniform(*failure["coolant_range"]), 1),
            "load_percentage": round(random.uniform(115.0, 145.0), 1)
        }
    }

def run_generator():
    print("==========================================================")
    print("             OMNIDISPATCH TELEMETRY STREAM GENERATOR")
    print("==========================================================")
    print(f"Streaming live IoT alerts to: {TARGET_URL}")
    print("Press CTRL+C to terminate generator stream.\n")
    
    index = 1
    client = httpx.Client()
    
    try:
        while True:
            payload = generate_telemetry_report(index)
            print(f"[{time.strftime('%H:%M:%S')}] Pushing sensor alert: {payload['incident_id']} - {payload['failure_type']}")
            print(f"             Location: {payload['grid_zone']} | Temp: {payload['metrics']['temperature_c']}C | Load: {payload['metrics']['load_percentage']}%")
            
            try:
                response = client.post(TARGET_URL, json=payload, timeout=5.0)
                if response.status_code == 200:
                    print(f"             Status: Sent successfully (Response ID: {response.json().get('incident_id')})")
                else:
                    print(f"             Status: Server returned error status {response.status_code}")
            except Exception as e:
                print(f"             Status: Failed to connect to agent service. Make sure FastAPI server is running. Error: {e}")
                
            print("-" * 58)
            index += 1
            time.sleep(12.0)
            
    except KeyboardInterrupt:
        print("\nTelemetry generator stopped.")
    finally:
        client.close()

if __name__ == "__main__":
    run_generator()
