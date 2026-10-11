// Tests only: in-memory simulated chrome APIs

type Listener = (changes: Record<string, { oldValue?: unknown; newValue?: unknown }>, area: string) => void

// chrome.storage.local simulated in memory, copying values like Chrome does
export function createFakeChrome() {
  const data: Record<string, unknown> = {}
  const listeners: Listener[] = []
  const notify = (changes: Record<string, { oldValue?: unknown; newValue?: unknown }>) =>
    listeners.forEach((listener) => listener(changes, 'local'))

  return {
    storage: {
      local: {
        async get(keys: string | null) {
          if (keys === null) return structuredClone(data)
          return keys in data ? { [keys]: structuredClone(data[keys]) } : {}
        },
        async set(items: Record<string, unknown>) {
          const changes: Record<string, { oldValue?: unknown; newValue?: unknown }> = {}
          for (const [key, value] of Object.entries(items)) {
            changes[key] = { oldValue: data[key], newValue: structuredClone(value) }
            data[key] = structuredClone(value)
          }
          notify(changes)
        },
        async remove(keys: string | string[]) {
          const changes: Record<string, { oldValue?: unknown }> = {}
          for (const key of Array.isArray(keys) ? keys : [keys]) {
            if (!(key in data)) continue
            changes[key] = { oldValue: data[key] }
            delete data[key]
          }
          if (Object.keys(changes).length > 0) notify(changes)
        },
      },
      onChanged: {
        addListener: (listener: Listener) => listeners.push(listener),
      },
    },
    alarms: {
      created: new Map<string, { periodInMinutes?: number; delayInMinutes?: number }>(),
      async create(name: string, info: { periodInMinutes?: number; delayInMinutes?: number }) {
        this.created.set(name, info)
      },
      async get(name: string) {
        const info = this.created.get(name)
        return info ? { name, ...info } : undefined
      },
      async clear(name: string) {
        return this.created.delete(name)
      },
    },
    downloads: {
      downloaded: [] as { url: string; filename: string; conflictAction?: string; saveAs?: boolean }[],
      async download(options: { url: string; filename: string; conflictAction?: string; saveAs?: boolean }) {
        this.downloaded.push(options)
        return this.downloaded.length
      },
    },
  }
}
