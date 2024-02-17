#!/bin/bash

INTERCEPTOR_EXIT_ON_NEW_VERSION="1"

while true
do
    deno run --allow-net --allow-env=INTERCEPTOR_EXIT_ON_NEW_VERSION start.ts
    sleep 2
    echo "[start.sh] Restarting deno."
done
