
let cfg: {default: any}
try {
    const cfgData = JSON.parse(await Deno.readTextFile("./config.json"))
    cfg = {default: cfgData}
} catch (e) {
    const configContent = `{
    "Mastodon": false,
    "Misskey": false,

    "Misskey_ShouldBanUser": true,

    "Site": "https://instancename.example.com/",
    "ApiKey": "???????"
}
`

    console.error("[Loader] Failed to find configuration file.")
    console.error("[Loader] Creating 'config.json'. Please check!")
    await Deno.writeTextFile(
        "./config.json",
        configContent
    )
    Deno.exit(1)
}

console.log("[Loader] Loading the local script...")
console.log("[Loader] Version", 9)

Deno.env.delete("INTERCEPTOR_EXIT_ON_NEW_VERSION")

const module = await import("./core/main.ts")
module.main(cfg)
