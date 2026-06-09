# ─── OmniDispatch Agent Service ───
# Multi-stage build for Azure AI Foundry Hosted Agent deployment
# Protocol: Responses (Port 8088)
# Runtime: Container (hypervisor-isolated)

# Stage 1: Build dependencies
FROM python:3.11-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Stage 2: Production runtime
FROM python:3.11-slim AS runtime

# Security: Run as non-root user
RUN groupadd -r omnidispatch && useradd -r -g omnidispatch -d /app -s /sbin/nologin omnidispatch

WORKDIR /app

# Copy installed packages from builder stage
COPY --from=builder /install /usr/local

# Copy application code
COPY . .

# Set ownership
RUN chown -R omnidispatch:omnidispatch /app

# Environment defaults
ENV PYTHONUNBUFFERED=1
ENV PORT=8088

# Health check for container orchestrators
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8088/')" || exit 1

# Switch to non-root user
USER omnidispatch

# Expose the Responses Protocol port
EXPOSE 8088

# Launch the agent service
CMD ["python", "main.py"]
