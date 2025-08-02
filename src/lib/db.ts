// IndexedDB wrapper for storing music files and metadata
const DB_NAME = 'MusicPlayerDB'
const DB_VERSION = 1

export interface StoredFile {
  id: string
  type: 'audio' | 'image' | 'lyrics'
  name: string
  blob: Blob
  createdAt: Date
}

class MusicDB {
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        reject(new Error('Failed to open database'))
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create object store for files
        if (!db.objectStoreNames.contains('files')) {
          const fileStore = db.createObjectStore('files', { keyPath: 'id' })
          fileStore.createIndex('type', 'type', { unique: false })
          fileStore.createIndex('createdAt', 'createdAt', { unique: false })
        }

        // Create object store for metadata (songs, playlists, etc.)
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' })
        }
      }
    })
  }

  async storeFile(file: File, type: 'audio' | 'image' | 'lyrics'): Promise<string> {
    if (!this.db) await this.init()
    
    const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const storedFile: StoredFile = {
      id,
      type,
      name: file.name,
      blob: file,
      createdAt: new Date()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['files'], 'readwrite')
      const store = transaction.objectStore('files')
      const request = store.add(storedFile)

      request.onsuccess = () => resolve(id)
      request.onerror = () => reject(new Error('Failed to store file'))
    })
  }

  async getFile(id: string): Promise<StoredFile | null> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['files'], 'readonly')
      const store = transaction.objectStore('files')
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(new Error('Failed to get file'))
    })
  }

  async getFileUrl(id: string): Promise<string | null> {
    try {
      const file = await this.getFile(id)
      if (!file || !file.blob) {
        console.error('File not found or invalid:', id)
        return null
      }
      
      // Verify blob is valid
      if (file.blob.size === 0) {
        console.error('File blob is empty:', id)
        return null
      }
      
      return URL.createObjectURL(file.blob)
    } catch (error) {
      console.error('Error getting file URL:', error)
      return null
    }
  }

  async deleteFile(id: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['files'], 'readwrite')
      const store = transaction.objectStore('files')
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to delete file'))
    })
  }

  async getAllFiles(type?: 'audio' | 'image' | 'lyrics'): Promise<StoredFile[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['files'], 'readonly')
      const store = transaction.objectStore('files')
      const request = type
        ? store.index('type').getAll(type)
        : store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(new Error('Failed to get files'))
    })
  }

  async saveMetadata(key: string, data: unknown): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['metadata'], 'readwrite')
      const store = transaction.objectStore('metadata')
      const request = store.put({ key, data })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to save metadata'))
    })
  }

  async getMetadata(key: string): Promise<unknown | null> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['metadata'], 'readonly')
      const store = transaction.objectStore('metadata')
      const request = store.get(key)

      request.onsuccess = () => {
        const result = request.result
        resolve(result ? result.data : null)
      }
      request.onerror = () => reject(new Error('Failed to get metadata'))
    })
  }

  async clearAll(): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['files', 'metadata'], 'readwrite')
      const fileStore = transaction.objectStore('files')
      const metadataStore = transaction.objectStore('metadata')

      fileStore.clear()
      metadataStore.clear()

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(new Error('Failed to clear database'))
    })
  }
}

export const musicDB = new MusicDB()