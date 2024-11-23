#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status

echo "Starting script..."

export GIT_REPOSITORY_URL="$GIT_REPOSITORY_URL"
echo "GIT_REPOSITORY_URL is set to $GIT_REPOSITORY_URL"

echo "Cloning repository..."
if git clone "$GIT_REPOSITORY_URL" /home/app/output; then
  echo "Repository cloned successfully."
else
  echo "Failed to clone repository."
  exit 1
fi

echo "Starting node script..."
exec node script.js