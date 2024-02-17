import * as cfg from "./config.json" with {type: "json"}

let ver = Math.floor(Math.random() * 1000000)

try {
    const uri = `https://raw.githubusercontent.com/nulta/fedi_findandkillspam/main/VERSION?v=${ver}`
    const text = await fetch(uri).then(r => r.text())
    ver = parseFloat(text)
    console.log("[Loader] Latest version is: ", ver, ".")
} catch(_) {
    console.error("[Loader] Failed to fetch version information. Falling back to RNG (no caching).")
}

console.log("[Loader] Loading the latest code from github.")

const module = await import(`https://raw.githubusercontent.com/nulta/fedi_findandkillspam/main/core/main.ts?v=${ver}`)
module.main(cfg)
