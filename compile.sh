#!/bin/bash

# windows
deno compile --output=./bin/killer.exe --allow-net --allow-env=INTERCEPTOR_EXIT_ON_NEW_VERSION --allow-read=config.json --allow-write=config.json --target=x86_64-pc-windows-msvc local.ts

# current platform
deno compile --output=./bin/killer --allow-net --allow-env=INTERCEPTOR_EXIT_ON_NEW_VERSION --allow-read=config.json --allow-write=config.json local.ts
