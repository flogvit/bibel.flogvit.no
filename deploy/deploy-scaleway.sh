#!/bin/bash
# Deploy to Scaleway Serverless Containers

set -e

REGION="fr-par"
REGISTRY="rg.${REGION}.scw.cloud"
NAMESPACE="bibel"  # Din registry namespace
IMAGE_NAME="bibel-flogvit"
CONTAINER_NAME="bibel"
CUSTOM_DOMAIN="bibel.flogvit.no"

echo "🔧 Checking Registry namespace..."
if ! scw registry namespace list region=${REGION} -o json | jq -e ".[] | select(.name==\"${NAMESPACE}\")" > /dev/null 2>&1; then
    echo "Creating Registry namespace '${NAMESPACE}'..."
    scw registry namespace create name=${NAMESPACE} region=${REGION}
else
    echo "Registry namespace '${NAMESPACE}' exists"
fi

echo "🔧 Checking Container namespace..."
if ! scw container namespace list region=${REGION} -o json | jq -e ".[] | select(.name==\"${NAMESPACE}\")" > /dev/null 2>&1; then
    echo "Creating Container namespace '${NAMESPACE}'..."
    scw container namespace create name=${NAMESPACE} region=${REGION}
    sleep 5  # Wait for namespace to be ready
else
    echo "Container namespace '${NAMESPACE}' exists"
fi

echo "🔑 Logging into Scaleway Registry..."
scw registry login

echo "🔨 Building Docker image..."
docker build --platform linux/amd64 -t ${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}:latest .

echo "📤 Pushing to Scaleway Registry..."
docker push ${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}:latest

echo "🚀 Deploying Serverless Container..."
NAMESPACE_ID=$(scw container namespace list region=${REGION} -o json | jq -r ".[] | select(.name==\"${NAMESPACE}\") | .id")

# Check if container exists, update or create
if scw container container list namespace-id=${NAMESPACE_ID} region=${REGION} -o json | jq -e ".[] | select(.name==\"${CONTAINER_NAME}\")" > /dev/null 2>&1; then
    echo "Updating existing container..."
    CONTAINER_ID=$(scw container container list namespace-id=${NAMESPACE_ID} region=${REGION} -o json | jq -r ".[] | select(.name==\"${CONTAINER_NAME}\") | .id")
    scw container container update ${CONTAINER_ID} \
        port=8080 \
        cpu-limit=100 \
        memory-limit=256 \
        region=${REGION} \
        redeploy=true
else
    echo "Creating new container..."
    scw container container create \
        name=${CONTAINER_NAME} \
        namespace-id=${NAMESPACE_ID} \
        registry-image=${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}:latest \
        port=8080 \
        min-scale=0 \
        max-scale=1 \
        cpu-limit=100 \
        memory-limit=256 \
        region=${REGION}
    sleep 5  # Wait for container to be ready
fi

echo "⏳ Waiting for container to be ready..."
CONTAINER_ID=$(scw container container list namespace-id=${NAMESPACE_ID} region=${REGION} -o json | jq -r ".[] | select(.name==\"${CONTAINER_NAME}\") | .id")

# Wait for container to be ready (max 60 seconds)
for i in {1..50}; do
    STATUS=$(scw container container get ${CONTAINER_ID} region=${REGION} -o json | jq -r '.status')
    echo "  Status: ${STATUS}"
    if [ "$STATUS" = "ready" ]; then
        break
    fi
    if [ "$STATUS" = "error" ]; then
        echo "❌ Container failed to start!"
        scw container container get ${CONTAINER_ID} region=${REGION}
        exit 1
    fi
    sleep 5
done

echo "🌐 Setting up custom domain..."

# Check if domain already exists
if ! scw container domain list container-id=${CONTAINER_ID} region=${REGION} -o json | grep -q "${CUSTOM_DOMAIN}"; then
    echo "Adding domain ${CUSTOM_DOMAIN}..."
    scw container domain create container-id=${CONTAINER_ID} hostname=${CUSTOM_DOMAIN} region=${REGION}
else
    echo "Domain ${CUSTOM_DOMAIN} already configured"
fi

echo ""
echo "✅ Deploy complete!"
echo ""
scw container container list name=${CONTAINER_NAME} region=${REGION}
echo ""
echo "📋 DNS Setup required (one-time):"
echo "   Add CNAME record: ${CUSTOM_DOMAIN} -> $(scw container container get ${CONTAINER_ID} region=${REGION} -o json | jq -r '.domain_name')"
echo ""
echo "🌐 https://${CUSTOM_DOMAIN}"
