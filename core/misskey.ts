import { FediversePost, FediverseSpamInterceptor, FediverseUser, VER } from "./interceptor_core.ts?v=5"
import { printMessage, printError, checkVersion } from "./utils.ts?v=5"

// import * as cfg from "../config.json" with {type: "json"}
let cfg: any = null

async function mkApi(endpoint: string, body: any) {
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
        printError(`API Request to ${endpoint} Failed:`, res.status)
        printError(`body:`, await res.text().catch(e => "(failed to parse)"))
        return undefined
    }

    const resJson = await res.json().catch(_ => undefined)
    return resJson
}

class MisskeySpamInterceptor extends FediverseSpamInterceptor {
    suspendUser(user: FediverseUser): void {
        if (!cfg.default.Misskey_ShouldBanUser) {return}
        printMessage("Suspended user", `${user.username}@${user.host ?? "THIS_SERVER"}`)
        mkApi("admin/suspend-user", {userId: user.userId})
    }

    deletePost(post: FediversePost): void {
        printMessage("Removed post", post.postId)
        mkApi("notes/delete", {noteId: post.postId})
    }
}

function parseAidx(id: string): Date {
    const TIME2000 = 946684800000;
    const TIME_LENGTH = 8;
	const time = parseInt(id.slice(0, TIME_LENGTH), 36) + TIME2000;
	return new Date(time);
}

const interceptor = new MisskeySpamInterceptor()
let lastId: string | undefined = undefined

async function fetchNotes() {
    try {
        const notes: Array<Record<string, any>> | undefined = await mkApi("notes/global-timeline", {
            withRenotes: false,
            sinceId: lastId,
            limit: 100,
        })

        if (notes === undefined) {
            printError("Fetch failed?! Got undefined response.")
            return
        }

        notes.forEach(note => {
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
            lastId = note.id
        })
    } catch (e) {
        printError(e)
    }
}

export async function start(cfgModule: any) {
    cfg = cfgModule

    setInterval(fetchNotes, 1000)
    printMessage("find_and_kill_spam (Misskey) rev", VER)
    printMessage("Started!")
    checkVersion(VER)

    // Status reporter
    let lastExaminedPostCount = 0
    setInterval(() => {
        printMessage("processed", interceptor.examinedPosts - lastExaminedPostCount, "notes.")
        lastExaminedPostCount = interceptor.examinedPosts
    }, 10 * 1000)

    setInterval(() => {
        checkVersion(VER)
    }, 120 * 1000)
}
