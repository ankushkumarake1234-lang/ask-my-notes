#!/bin/bash
while true; do
  echo "Starting localtunnel..."
  npx localtunnel --port 3001 --subdomain askmynotesbackend
  echo "localtunnel crashed... restarting in 5s"
  sleep 5
done
