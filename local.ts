import * as cfg from "./config.json" with {type: "json"}

console.log("[Loader] Loading the local script. No automatic update.")
Deno.env.delete("INTERCEPTOR_EXIT_ON_NEW_VERSION")

const module = await import("./core/main.ts")
module.main(cfg)
