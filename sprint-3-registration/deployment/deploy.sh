#!/usr/bin/env bash

# =============================================================================
# SPRINT 3: PRODUCTION DEPLOYMENT SCRIPT
# TARGET: Google Cloud Run (Serverless) / Google Artifact Registry
# =============================================================================

set -e

# Configurable Parameters
PROJECT_ID="eventhub-saas-production"
REGION="us-central1"
SERVICE_NAME_BACKEND="eventhub-backend"
SERVICE_NAME_FRONTEND="eventhub-frontend"
GAR_REPO="eventhub-docker-repo"

echo "========================================="
echo "   STARTING EVENTHUB SPRINT 3 DEPLOY     "
echo "========================================="

# 1. Authenticate with Google Cloud Platform
echo "Authenticating with Google Cloud SDK..."
gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet

# 2. Build and Tag Backend NestJS Service
echo "Building NestJS backend image for Sprint 3..."
docker build \
  -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/${GAR_REPO}/${SERVICE_NAME_BACKEND}:sprint3 \
  -f ../docker/Dockerfile.backend \
  ../backend

# 3. Build and Tag Frontend Next.js Service
echo "Building Next.js frontend image for Sprint 3..."
docker build \
  -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/${GAR_REPO}/${SERVICE_NAME_FRONTEND}:sprint3 \
  -f ../docker/Dockerfile.frontend \
  ../frontend

# 4. Push Containers to Artifact Registry
echo "Pushing images to Artifact Registry..."
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/${GAR_REPO}/${SERVICE_NAME_BACKEND}:sprint3
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/${GAR_REPO}/${SERVICE_NAME_FRONTEND}:sprint3

# 5. Deploy Backend Server to Cloud Run
echo "Deploying backend server to Google Cloud Run (Sprint 3)..."
gcloud run deploy ${SERVICE_NAME_BACKEND} \
  --image ${REGION}-docker.pkg.dev/${PROJECT_ID}/${GAR_REPO}/${SERVICE_NAME_BACKEND}:sprint3 \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,PORT=5000" \
  --quiet

# 6. Deploy Frontend Client to Cloud Run
echo "Deploying frontend client to Google Cloud Run (Sprint 3)..."
gcloud run deploy ${SERVICE_NAME_FRONTEND} \
  --image ${REGION}-docker.pkg.dev/${PROJECT_ID}/${GAR_REPO}/${SERVICE_NAME_FRONTEND}:sprint3 \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,PORT=3000" \
  --quiet

echo "========================================="
echo "   DEPLOY SUCCESSFUL FOR SPRINT 3!       "
echo "========================================="
