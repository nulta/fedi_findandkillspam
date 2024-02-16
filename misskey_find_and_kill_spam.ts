// Rev 3
// for Misskey
// Required permissions:
//   write:notes
//   write:admin:suspend-user
//
// Run with: deno run --allow-net misskey_find_and_kill_spam.ts


const SERVER_URL = "https://misskey.example.com/"
const API_ACCESS_TOKEN = "InsertApiAccessTokenHere"

// Other settings
const NEW_ACCOUNT_THRESHOLD = 1000 * 60 * 20
const MENTIONS_THRESHOLD = 5

const FETCH_DELAY = 1000
const REPORT_REPEATS = 10
const TESTING_MODE = false


async function requestApi(endpoint: string, body: Record<string, any>) {
    body = {
        i: API_ACCESS_TOKEN,
        ...body,
    }
    
    const jsonBody = JSON.stringify(body)
    const url = SERVER_URL.replace(/\/$/, "") + "/api/" + endpoint
    const headers = {"Content-Type": "application/json"}

    const res = await fetch(url, {
        headers,
        body: jsonBody,
        method: "POST",
    })

    let resJson = undefined
    try {
        resJson = await res.json()
    } catch (e) {}

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
    const {id, userId, visibility, user, text } = note
    const mentions: Array<string> = note["mentions"] ?? []

    const conditions = [
        () => visibility == "public",
        () => mentions.length >= MENTIONS_THRESHOLD,
        () => parseAidx(userId).getTime() >= (Date.now() - NEW_ACCOUNT_THRESHOLD),
        () => user["avatarBlurhash"] == null,
    ]

    return conditions.every(f => f())
}

function killNote(note: Record<string, any>) {
    const {id, userId, user, text} = note

    console.log(
        `[${new Date().toISOString()}] `,
        `Bad note ${id} from user @${user["username"] ?? "?"}@${user["host"] ?? "this_server"}`
    )

    console.log(
        `    Content: ${text.slice(0, 100).replaceAll("\n", "\\n")}`
    )

    requestApi("notes/delete", {noteId: id})
    requestApi("admin/suspend-user", {userId: userId})
}


let lastId = undefined
let reports = REPORT_REPEATS
let processedNotes = 0

async function fetchNotes() {
    try {
        const notes: Array<Record<string, any>> = await requestApi("notes/global-timeline", {
            withRenotes: false,
            sinceId: lastId,
            limit: 100,
        })
    
        notes.forEach(note => {
            if (shouldKillNote(note)) {
                killNote(note)
            }
            lastId = note.id
        })

        processedNotes += notes.length
        reports -= 1

        if (reports <= 0) {
            console.log(`[${new Date().toISOString()}] `, `processed ${processedNotes} notes.`)
            processedNotes = 0
            reports = REPORT_REPEATS
        }
    } catch (e) {
        console.error(`[${new Date().toISOString()}] `, e)
    }
}

setInterval(fetchNotes, FETCH_DELAY)
console.log(`[${new Date().toISOString()}] `, "find_and_kill_spam: rev 3")
console.log(`[${new Date().toISOString()}] `, "find_and_kill_spam: Started!")
