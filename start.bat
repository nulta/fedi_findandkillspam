@echo off
set INTERCEPTOR_EXIT_ON_NEW_VERSION=1

:loop

deno run --allow-net --allow-env=INTERCEPTOR_EXIT_ON_NEW_VERSION start.ts
timeout /t 2
echo [start.sh] Restarting deno.

goto loop
