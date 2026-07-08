#!/usr/bin/env bash
-- =============================================================================
-- SPRINT 10: AUTOMATED DEPLOYMENT SCRIPT FOR DOOR PRIZE SERVICE
-- SERVICE: Google Cloud Run
-- PROJECT: eventhub-saas-platform-2026
-- =============================================================================

set -eo pipefail

# 1. Environment Configurations
SERVICE_NAME="sprint-10-doorprize-service"
PROJECT_ID="eventhub-saas-platform-2026"
REGION="us-central1"
IMAGE_TAG="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest"

echo "======================================================"
echo "🚀 INITIATING SPRINT 10: DOOR PRIZE DEPLOYMENT TO CLOUD RUN"
echo "======================================================"
echo "Service Name: ${SERVICE_NAME}"
echo "Project ID:   ${PROJECT_ID}"
echo "Region:       ${REGION}"
echo "Image Tag:    ${IMAGE_TAG}"
echo "------------------------------------------------------"

# 2. Authentication check
if ! gcloud config get-value project &>/dev/null; then
  echo "❌ Error: gcloud authentication credentials not detected."
  echo "Please run 'gcloud auth login' and 'gcloud config set project ${PROJECT_ID}' first."
  exit 1
fi

# 3. Build & Bundling
echo "📦 Running production builds and code bundling..."
npm run build

# 4. Building Docker Container
echo "🐳 Building Docker image for GCR..."
docker build -t "${IMAGE_TAG}" -f - . <<EOF
FROM node:20-alpine

WORKDIR /app

# Copy production package dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy compiled bundles and assets
COPY dist ./dist
COPY db-store.json ./db-store.json

# Expose microservice port
EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "dist/server.cjs"]
EOF

# 5. Push Image to Google Container Registry
echo "📤 Pushing container image to Google Container Registry..."
docker push "${IMAGE_TAG}"

# 6. Deploy to Google Cloud Run
echo "⚡ Deploying container instance to Google Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
  --image="${IMAGE_TAG}" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --platform="managed" \
  --allow-unauthenticated \
  --port=3000 \
  --cpu=1 \
  --memory=512Mi \
  --min-instances=0 \
  --max-instances=5 \
  --set-env-vars="NODE_ENV=production,SERVICE_VERSION=sprint-10-1.0.0"

echo "======================================================"
echo "🎉 DEPLOYMENT SUCCESSFUL!"
echo "Sprint 10 Door Prize Service is live on Google Cloud Run."
echo "======================================================"
