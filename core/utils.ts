function pad(num: number, amount = 2) {
    return num.toString().padStart(amount, "0")
}

function timeStamp() {
    const date = new Date()
    const dateStr = `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`
    const timeStr = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    const msStr = `${pad(date.getMilliseconds(),3)}`
    return `[${dateStr} ${timeStr}.${msStr}] `
}

export function printError(...params: any[]) {
    console.error("%c%s", "color:red", timeStamp(), ...params)
}

export function printMessage(...params: any[]) {
    console.log("%c%s", "color:lightgreen", timeStamp(), ...params)
}

export function printDebug(...params: any[]) {
    console.info("%c%s", "color:cyan", timeStamp(), ...params)
}

export async function checkVersion(myVer: number) {
    try {
        const uri = `https://raw.githubusercontent.com/nulta/fedi_findandkillspam/main/VERSION?v=${Math.random()}`
        const text = await fetch(uri).then(r => r.text())
        const newVer = parseFloat(text)
        if (myVer < newVer) {
            printMessage("")
            printMessage("New update available!!!")
            printMessage("Current version:", myVer)
            printMessage("New version:", newVer)
            printMessage("")

            if (Deno.env.has("INTERCEPTOR_EXIT_ON_NEW_VERSION")) {
                Deno.exit(0)
            }
        }
    } catch(_) {
        printError("Failed to fetch version information.")
    }
}

export function countExternalMentions(text: string): number {
    text = " " + text
    const mentions = text.match(
        /[ \n]@[a-zA-Z0-9_]+([a-zA-Z0-9_.-]+[a-zA-Z0-9_]+)?@[-a-zA-Z0-9._]{1,256}\.[-a-zA-Z0-9]{1,25}/g
    ) ?? []

    const uniqueMentions = new Set(mentions.map(v => v.replace(/^[ \n]/, "")))
    return uniqueMentions.size
}
