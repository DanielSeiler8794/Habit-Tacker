import type { AppState } from './types'

/** The stored document: the whole app state as JSON plus when it last changed. */
export interface CloudDoc {
  json: string
  updatedAt: number
}

interface DocSnapshot {
  exists: boolean
  data(): Record<string, unknown> | undefined
  metadata: { fromCache: boolean }
}
interface DocRef {
  set(data: Record<string, unknown>): Promise<void>
  onSnapshot(next: (s: DocSnapshot) => void, error?: (e: { code: string }) => void): () => void
}
interface Db {
  doc(path: string): DocRef
}
interface User {
  id(): Promise<string | null>
}
type Host = { use?: (name: string) => Promise<unknown> }

export interface Cloud {
  /** `confirmed` is false for cached or not yet answered snapshots */
  subscribe(next: (doc: CloudDoc | null, confirmed: boolean) => void, onError: () => void): () => void
  /** Coalesces bursts of changes into one write per pause, one write at a time. */
  save(state: AppState, updatedAt: number): void
}

/**
 * Connects to the viewer's private document in the artifact's database, when the
 * app runs as a claude.ai artifact with the db capability; null everywhere else.
 */
export async function openCloud(): Promise<Cloud | null> {
  const host = (window as unknown as { claude?: Host }).claude
  if (typeof host?.use !== 'function') return null
  try {
    const [db, user] = (await Promise.all([host.use('db'), host.use('user')])) as [Db | null, User | null]
    if (!db || !user) return null
    const id = await user.id()
    if (!id) return null
    const ref = db.doc(`data/users/${id}/state`)

    let writing: Promise<void> = Promise.resolve()
    let pending: CloudDoc | null = null
    let timer: number | undefined
    const flush = () => {
      const body = pending
      pending = null
      if (!body) return
      writing = writing.then(() => ref.set({ ...body })).catch(() => {})
    }

    return {
      subscribe(next, onError) {
        return ref.onSnapshot(
          (s) => {
            const d = s.exists ? s.data() : undefined
            const doc = d && typeof d.json === 'string' && typeof d.updatedAt === 'number' ? (d as unknown as CloudDoc) : null
            next(doc, !s.metadata.fromCache)
          },
          () => onError(),
        )
      },
      save(state, updatedAt) {
        pending = { json: JSON.stringify(state), updatedAt }
        window.clearTimeout(timer)
        timer = window.setTimeout(flush, 800)
      },
    }
  } catch {
    return null
  }
}
