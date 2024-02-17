// Rev 4
// for Misskey
// Required permissions:
//   write:notes
//   write:admin:suspend-user
//
// Run with: deno run --allow-net misskey_find_and_kill_spam.ts


const SERVER_URL = "https://misskey.example.com/"
const API_ACCESS_TOKEN = "InsertApiKeyHere"

// Other settings
const NEW_ACCOUNT_THRESHOLD = 1000 * 60 * 120
const MENTIONS_THRESHOLD_1 = 2
const MENTIONS_THRESHOLD_2 = 5
const IMAGE_OCCURRENCE_THRESHOLD = 4

const FETCH_DELAY = 1000
const REPORT_REPEATS = 10
const IMAGE_OCCURRENCE_DECAY_REPEATS = 120
const VERSION_CHECK_REPEATS = 300
const TESTING_MODE = false
const VER = 4.0


async function requestApi(endpoint: string, body: Record<string, any>) {
    body = {
        i: API_ACCESS_TOKEN.replaceAll(/[' ]/g, ""),
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

// TODO: rewrite
const imageOccuranceMap = new Map<string, number>()
let imageOccuranceNoteId = ""
let imageOccuranceSameNoteKeys = new Set()
function imageOccurrenceFilter(blurhash: string | null, noteId: string): boolean {
    if (blurhash == null) {return false}

    const splits: string[] = blurhash.match(/.{1,6}/g) ?? []
    let detections = 0

    if (imageOccuranceNoteId != noteId) {
        imageOccuranceNoteId = noteId
        imageOccuranceSameNoteKeys = new Set()
    }

    splits.forEach((v, i) => {
        const key = `${i} ${v}`
        if (imageOccuranceSameNoteKeys.has(key)) { return }
        imageOccuranceSameNoteKeys.add(key)

        const occurrences = imageOccuranceMap.get(key) ?? 0
        imageOccuranceMap.set(key, occurrences + 1)

        if (occurrences+1 >= IMAGE_OCCURRENCE_THRESHOLD) {
            detections += 1
        }
    })

    // 6 of 9
    if (detections >= 6) {
        return true
    } else {
        return false
    }
}

function imageOccurrenceDecay() {
    new Map(imageOccuranceMap).forEach((v, k) => {
        v -= 1
        if (v <= 0) {
            imageOccuranceMap.delete(k)
        } else {
            imageOccuranceMap.set(k, v)
        }
    })
}

function shouldKillNote(note: Record<string, any>) {
    const {id, userId, visibility, user, text } = note
    const mentions: Array<string> = note["mentions"] ?? []
    const files: Array<any> = note["files"] ?? []

    const hardConditions = [
        () => mentions.length >= MENTIONS_THRESHOLD_1,
        () => parseAidx(userId).getTime() >= (Date.now() - NEW_ACCOUNT_THRESHOLD),
    ].map(f => f())

    if (!hardConditions.every(b => b)) { return false }
    
    const softConditions = [
        () => visibility == "public",
        () => mentions.length >= MENTIONS_THRESHOLD_2,
        () => user["avatarBlurhash"] == null,
        () => files.map(f => imageOccurrenceFilter(f["blurhash"] ?? null, id)).some(b => b),
        () => (user.name == user.username) || (user.name == null),
    ].map(f => f())

    return (softConditions.filter(b => b).length >= 3)
}

function killNote(note: Record<string, any>) {
    const {id, userId, user, text} = note

    console.log(
        `[${new Date().toISOString()}] `,
        `Bad note ${id} from user @${user["username"] ?? "?"}@${user["host"] ?? "this_server"}`
    )

    console.log(
        `    Content: ${text.slice(0, 150).replaceAll("\n", "\\n")}`
    )

    requestApi("notes/delete", {noteId: id})
    requestApi("admin/suspend-user", {userId: userId})
}

async function checkVersion() {
    try {
        const uri = "https://raw.githubusercontent.com/nulta/fedi_findandkillspam/main/VERSION"
        const text = await fetch(uri).then(r => r.text())
        const newVer = parseFloat(text)
        if (VER < newVer) {
            console.log(`[${new Date().toISOString()}] `, "")
            console.log(`[${new Date().toISOString()}] `, "New update available!!!")
            console.log(`[${new Date().toISOString()}] `, "Current version:", VER)
            console.log(`[${new Date().toISOString()}] `, "New version:", newVer)
            console.log(`[${new Date().toISOString()}] `, "")
        }
    } catch(e) {
        console.error(`[${new Date().toISOString()}] `, "Failed to fetch version information.")
    }
}


let lastId = undefined
let reports = 0
let processedNotes = 0
async function fetchNotes() {
    try {
        const notes: Array<Record<string, any>> | undefined = await requestApi("notes/global-timeline", {
            withRenotes: false,
            sinceId: lastId,
            limit: 100,
        })

        if (notes === undefined) {
            console.error(`[${new Date().toISOString()}] `, "Fetch failed?! Got undefined response.")
            return
        }
    
        notes.forEach(note => {
            if (shouldKillNote(note)) {
                killNote(note)
            }
            lastId = note.id
        })

        processedNotes += notes.length
        reports += 1

        if (reports % REPORT_REPEATS == 0) {
            console.log(`[${new Date().toISOString()}] `, `processed ${processedNotes} notes.`)
            processedNotes = 0
        }

        if (reports % IMAGE_OCCURRENCE_DECAY_REPEATS == 0) {
            imageOccurrenceDecay()
        }

        if (reports % VERSION_CHECK_REPEATS == 0) {
            checkVersion()
        }
    } catch (e) {
        console.error(`[${new Date().toISOString()}] `, e)
    }
}

setInterval(fetchNotes, FETCH_DELAY)
console.log(`[${new Date().toISOString()}] `, "find_and_kill_spam: rev", VER)
console.log(`[${new Date().toISOString()}] `, "find_and_kill_spam: Started!")
checkVersion()
