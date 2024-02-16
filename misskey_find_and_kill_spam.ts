// Rev 1.0
// for Misskey
//
// Required permissions:
//   write:notes
//   write:admin:suspend-user
//
// Run with Deno:
//   deno run --allow-net misskey_find_and_kill_spam.ts

// Disclaimer!
// This script is absolutely not tested (yet), be careful!


// ▼ SERVER URL HERE ▼
const SERVER_URL = "https://misskey.example.com/"

// ▼ ACCOUNT ACCESS TOKEN HERE ▼
const API_ACCESS_TOKEN = ""

// Other settings
const FETCH_DELAY = 1000  // (milliseconds)
const NEW_ACCOUNT_THRESHOLD = 1000 * 60 * 15
const TESTING_MODE = false



async function requestApi(endpoint: string, body: Record<string, any>) {
    body = {
        i: API_ACCESS_TOKEN,
        ...body,
    }
    
    const jsonBody = JSON.stringify(body)
    const url = SERVER_URL.replace(/\/$/, "") + "/api/" + endpoint
    const headers = {"Content-Type": "application/json"}

    const resJson = await fetch(url, {
        headers,
        body: jsonBody,
        method: "POST",
    }).then(x => x.json())

    if (TESTING_MODE) {
        console.info({...body, i: "******"})
        console.info(resJson)
    }

    return resJson
}

function parseAidx(id: string): Date {
    const TIME2000 = 946684800000;
    const TIME_LENGTH = 8;
	const time = parseInt(id.slice(0, TIME_LENGTH), 36) + TIME2000;
	return new Date(time);
}

function shouldKillNote(note: Record<string, any>) {
    const {id, userId, visblity, user, text } = note
    const mentions: Array<string> = note["mentions"] ?? []

    const conditions = [
        () => visblity == "public",
        () => mentions.length >= 8,
        () => parseAidx(userId).getTime() > (Date.now() - NEW_ACCOUNT_THRESHOLD),
        () => user["avatarBlurhash"] == null,
    ]

    return conditions.every(f => f())
}

function killNote(note: Record<string, any>) {
    const {id, userId, user, text} = note

    console.log(
        `[${new Date().toISOString()}] `,
        `Bad note ${id} from user @${user["username"] ?? "?"}@${user["host"] ?? "?"}`
    )

    console.log(
        `    Content: ${text.slice(0, 100).replaceAll("\n", "\\n")}`
    )

    if (TESTING_MODE) {return}

    requestApi("notes/delete", {noteId: id})
    requestApi("admin/suspend-user", {userId: userId})
}

async function fetchNotes() {
    try {
        const notes: Array<Record<string, any>> = await requestApi("notes/global-timeline", {
            withRenotes: false,
            sinceDate: Date.now() - FETCH_DELAY * 10,  // ??
            limit: 100,
        })
    
        notes.forEach(note => {
            if (shouldKillNote(note)) {
                killNote(note)
            }
        })
    } catch (e) {
        console.error(`[${new Date().toISOString()}] `, e)
    }
}

setInterval(fetchNotes, FETCH_DELAY)
console.log(`[${new Date().toISOString()}] `, "find_and_kill_spam: Started!")
