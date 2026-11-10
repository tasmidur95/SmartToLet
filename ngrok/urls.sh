#!/bin/sh
# Prints the public ngrok URLs (waits until the tunnels are up).
for i in $(seq 1 30); do
  out=$(curl -s http://127.0.0.1:4040/api/tunnels 2>/dev/null)
  case "$out" in *public_url*) break;; esac
  sleep 1
done
echo "$out" | python -c "import sys,json;[print(t['name'].ljust(9),t['public_url']) for t in json.load(sys.stdin)['tunnels']]"
