#!/bin/bash
set -e

# Default to 'latest' if no argument is provided
VERSION=${1:-latest}

echo "Building rumluos-app Docker image (version: $VERSION) using Jib..."

# Build the docker image locally with Jib
./gradlew jibDockerBuild -PappVersion=$VERSION -x test

echo "Build successful! The image 'rumluos-app:$VERSION' (and latest) is available in your local Docker daemon."