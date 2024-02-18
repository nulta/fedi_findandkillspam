import { FediversePost, FediverseSpamInterceptor, FediverseUser, VER } from "./interceptor_core.ts?v=7"
import { printMessage, printError, checkVersion } from "./utils.ts?v=7"
let cfg: any = null

const MISSKEY_STATUS_429 = Symbol()
async function mkApi(endpoint: string, body: any, except429 = false) {
    body = {
        i: cfg.default.ApiKey.replaceAll(/[' ]/g, ""),
        ...body,
    }
    
    const jsonBody = JSON.stringify(body)
    const url = cfg.default.Site.replace(/\/$/, "") + "/api/" + endpoint
    const headers = {"Content-Type": "application/json"}
    const res = await fetch(url, {
        headers,
        body: jsonBody,
        method: "POST",
    })

    if (!res.ok) {
        if (except429 && res.status == 429) {
            return MISSKEY_STATUS_429
        }
        printError(`API Request to ${endpoint} Failed:`, res.status)
        printError(`body:`, await res.text().catch(e => "(failed to parse)"))
        return undefined
    }

    const resJson = await res.json().catch(_ => undefined)
    return resJson
}

class MisskeyApiRequester {
    static deleteQueue: string[] = []
    static lastLimit = new Date(0)

    static requestSuspend(user: FediverseUser) {
        // admin/suspend-user does not have rate limiting?
        printMessage("Suspend user", `${user.username}@${user.host ?? "THIS_SERVER"}`)
        mkApi("admin/suspend-user", {userId: user.userId})
    }

    static requestDelete(post: FediversePost) {
        // notes/delete does have a rate limiting
        this.deleteQueue.push(post.postId)
        this.processQueue()
    }

    static async processQueue() {
        if (this.lastLimit.getTime() > Date.now() - 1000) {
            // Sleep a second between processing
            return
        }

        const postId = this.deleteQueue.shift()
        if (postId == undefined) { return }

        const result = await mkApi("notes/delete", {noteId: postId}, true)

        if (result == MISSKEY_STATUS_429) {
            // Retry
            printError(`Rate limit excedded deleting note ${postId} (429), Trying again...`)
            this.lastLimit = new Date()
            this.deleteQueue.unshift(postId)
        } else {
            printMessage(`Deleted note ${postId}`)
        }
    }

    static start() {
        setInterval(() => this.processQueue(), 1500)
    }
}

class MisskeySpamInterceptor extends FediverseSpamInterceptor {
    suspendUser(user: FediverseUser): void {
        if (!cfg.default.Misskey_ShouldBanUser) {return}
        MisskeyApiRequester.requestSuspend(user)
    }

    deletePost(post: FediversePost): void {
        MisskeyApiRequester.requestDelete(post)
    }
}

function parseAidx(id: string): Date {
    const TIME2000 = 946684800000;
    const TIME_LENGTH = 8;
	const time = parseInt(id.slice(0, TIME_LENGTH), 36) + TIME2000;
	return new Date(time);
}

const interceptor = new MisskeySpamInterceptor()

function processNote(note: any) {
    // Skip renotes
    if (note.renote) { return }

    // Interface
    const fediPost: FediversePost = {
        createdAt: parseAidx(note.id),
        files: note.files?.map((file: any) => {
            return {
                uri: file.url,
                blurHash: file.blurhash,
            }
        }),
        mentions: note.mentions?.length ?? 0,
        postId: note.id,
        text: note.text ?? "",
        user: {
            userId: note.user.id,
            firstSeenAt: parseAidx(note.user.id),
            avatarExists: !!note.user.avatarBlurhash,
            avatarUri: note.user.avatarUrl ?? null,
            host: note.user.host,
            nickname: note.user.name,
            username: note.user.username,
        },
        visibility: note.visibility,
    }

    interceptor.examinePost(fediPost)
}

async function fetchNotes(limit: number) {
    const notes: Array<Record<string, any>> | undefined = await mkApi("notes/global-timeline", {
        withRenotes: false,
        limit: limit,
    })

    if (notes === undefined) {
        printError("Fetch failed?! Got undefined response.")
        return
    }

    notes.forEach(processNote)
}

async function watch() {
    const wssBase = cfg.default.Site.replace(/\/$/, "").replace(/^https?:\/\//, "wss://")
    const url = wssBase + `/streaming?i=${cfg.default.ApiKey}`
    const socket = new WebSocket(url)

    await new Promise((resolve, reject) => {
        socket.addEventListener("open", resolve)
        socket.addEventListener("error", reject)
    })

    printMessage("Connected to WebSocket!")

    socket.send(
        JSON.stringify({
            type: "connect",
            body: {
                channel: "globalTimeline",
                id: "0",
            }
        })
    )

    socket.addEventListener("message", (ev) => {
        let message = null
        try {
            message = JSON.parse(ev.data)
        } catch(_) {
            return printError("Failed to parse WebSocket data as JSON:", ev.data)
        }
        
        const {body: {type, body: note}} = message
        if (type != "note") { return }

        processNote(note)
    })

    socket.addEventListener("close", (ev) => {
        printError("Websocket Closed:", ev.code, ev.reason)
    })

    socket.addEventListener("error", (ev) => printError("Got Websocket error event:", ev))

    return socket
}

export async function start(cfgModule: any) {
    cfg = cfgModule

    // setInterval(fetchNotes, 1000)
    printMessage("find_and_kill_spam (Misskey) rev", VER)
    printMessage("Started!")
    checkVersion(VER)
    
    MisskeyApiRequester.start()
    let mainSocket = await watch()
    let lastExaminedPostCount = 0

    // Version checker
    setInterval(() => checkVersion(VER), 120 * 1000)

    // WS checker
    setInterval(async () => {
        if (mainSocket.readyState === WebSocket.CLOSED) {
            // fetch 25 notes
            fetchNotes(25)

            // reconnect to WebSocket
            mainSocket = await watch()
        }
    }, 5 * 1000)

    // Status reporter
    setInterval(() => {
        printMessage("processed", interceptor.examinedPosts - lastExaminedPostCount, "notes.")
        lastExaminedPostCount = interceptor.examinedPosts
    }, 10 * 1000)

    // Initial fetching
    fetchNotes(100)

    // Refetch every 5 minutes
    setInterval(() => {
        fetchNotes(100)
    }, 300 * 1000)
}
