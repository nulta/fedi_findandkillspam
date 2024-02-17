import {printMessage} from "./utils.ts"
import {bhes} from "./listes.ts"

export const VER = 5.0

const NEW_ACCOUNT_THRESHOLD = 1000 * 60 * 40
const MENTIONS_THRESHOLD_1 = 2
const MENTIONS_THRESHOLD_2 = 5
const IMAGE_COUNTER_THRESHOLD = 4
const IMAGE_COUNTER_DECAY_AMOUNT = 0.1
const IMAGE_COUNTER_VALUE_MAXIMUM = 30


export interface FediverseUser {
    userId: string
    username: string
    nickname: string | null
    host: string | null
    avatarExists: boolean
    avatarUri: string | null
    firstSeenAt: Date
}

export interface FediverseFile {
    uri: string
    blurHash: string | null
}

export interface FediversePost {
    postId: string
    text: string
    user: FediverseUser
    files: FediverseFile[]
    createdAt: Date
    mentions: number
    // in misskey: "public" | "home" | "followers" | "specified"
    visibility: "public" | "unlisted" | "private" | "direct"
}

export abstract class FediverseSpamInterceptor {
    abstract suspendUser(user: FediverseUser): void
    abstract deletePost(post: FediversePost): void
    constructor() {}

    imageChecker = new ImageOccurrenceChecker()

    public examinedPosts = 0
    public examinePost(post: FediversePost): void {
        this.examinedPosts += 1

        const basics = this.checkBasics(post)
        const badUser = this.checkUserSpamness(post.user)
        const badImage = this.imageChecker.checkPost(post)
        const badPost = this.checkPostSpamness(post)

        const shouldKill = basics && badUser && (badImage || badPost)
        if (shouldKill) {
            printMessage(`Caught bad post ${post.postId} from user ${post.user.username}@${post.user.host ?? "THIS_SERVER"}.`)
            printMessage(`Content: ${post.text.slice(0, 300).replaceAll("\n","\\n")}`)
            this.deletePost(post)
            this.suspendUser(post.user)
        }
    }

    checkUserSpamness(user: FediverseUser): boolean {
        const aaa = user.firstSeenAt.getTime() > Date.now() - NEW_ACCOUNT_THRESHOLD
        const bbb = !user.avatarExists
        const ccc = !user.nickname || user.username == user.nickname
        return aaa && (bbb && ccc)
    }

    checkPostSpamness(post: FediversePost): boolean {
        let score = 0
        if (post.mentions >= MENTIONS_THRESHOLD_2) { score++ }
        if (post.text.includes("#")) { score++ }
        return score >= 1
    }

    checkBasics(post: FediversePost): boolean {
        if (post.mentions < MENTIONS_THRESHOLD_1) { return false }
        return true
    }
}

class ImageOccurrenceChecker {
    constructor() {
        this.splitOccurrenceMap = new Map()
        bhes.forEach((v,k) => this.splitOccurrenceMap.set(k,v))
    }

    sameNoteSplits: Set<string> = new Set()
    splitOccurrenceMap: Map<string, number>

    public checkPost(post: FediversePost): boolean {
        if (post.files.length == 0) {return false}

        this.sameNoteSplits = new Set()
        this.decay()

        return post.files.map((f) => this.computeFile(f.blurHash)).some(b => b)
    }

    decay() {
        new Map(this.splitOccurrenceMap).forEach((v, k) => {
            v = v - IMAGE_COUNTER_DECAY_AMOUNT
            if (v <= 0) {
                this.splitOccurrenceMap.delete(k)
            } else {
                this.splitOccurrenceMap.set(k, v)
            }
        })
    }

    computeFile(blurhash: string | null): boolean {
        if (blurhash == null) {return false}

        // Split the blurhash
        const splits: string[] = blurhash.match(/.{1,6}/g) ?? []
        let detections = 0

        // To ignore small changes
        splits.forEach((v, i) => {
            const key = `${i} ${v}`

            if (this.sameNoteSplits.has(key)) { return }
            this.sameNoteSplits.add(key)
    
            let occurrences = this.splitOccurrenceMap.get(key) ?? 0
            if (occurrences < 2_147_483_647) {
                occurrences += 1
                occurrences = Math.min(occurrences, IMAGE_COUNTER_VALUE_MAXIMUM)
            }

            this.splitOccurrenceMap.set(key, occurrences)
            if (occurrences >= IMAGE_COUNTER_THRESHOLD) {
                detections += 1
            }
        })

        // 5 of 9, or 5 of 6
        return detections >= 5
    }
}

