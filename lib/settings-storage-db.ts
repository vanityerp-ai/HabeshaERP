"use client"

/**
 * Database-backed Settings Storage Service
 * 
 * This service provides persistent storage for application settings using:
 * 1. PostgreSQL database as primary storage
 * 2. localStorage as fallback/cache
 * 3. In-memory cache for performance
 */

import { BrandingSettings, GeneralSettings, CheckoutSettings } from './settings-storage'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

class SettingsStorageDB {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private cacheTTL = 5 * 60 * 1000 // 5 minutes default TTL
  private isInitialized = false
  private initPromise: Promise<void> | null = null

  /**
   * Initialize the service by syncing with database
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return
    if (this.initPromise) return this.initPromise

    this.initPromise = this._initialize()
    return this.initPromise
  }

  private async _initialize(): Promise<void> {
    try {
      // Fetch all settings from database
      const response = await fetch('/api/settings')
      if (response.ok) {
        const settings = await response.json()
        // Populate cache from database
        Object.entries(settings).forEach(([key, value]) => {
          this.cache.set(key, {
            data: value,
            timestamp: Date.now(),
            ttl: this.cacheTTL
          })
        })
      }
    } catch (error) {
      console.warn('Failed to initialize settings from database, using localStorage:', error)
    }
    this.isInitialized = true
  }

  /**
   * Get a setting value with caching
   */
  async getSetting<T>(key: string, defaultValue: T): Promise<T> {
    await this.initialize()

    // Check cache first
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data as T
    }

    try {
      // Fetch from database
      const response = await fetch(`/api/settings?key=${key}`)
      if (response.ok) {
        const data = await response.json()
        this.cache.set(key, {
          data,
          timestamp: Date.now(),
          ttl: this.cacheTTL
        })
        return data as T
      }
    } catch (error) {
      console.warn(`Failed to fetch setting ${key} from database:`, error)
    }

    // Fallback to localStorage
    return this.getFromStorage<T>(key, defaultValue)
  }

  /**
   * Save a setting value
   */
  async saveSetting<T>(key: string, value: T, category = 'general'): Promise<void> {
    await this.initialize()

    try {
      // Save to database
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value, category })
      })

      if (response.ok) {
        // Update cache
        this.cache.set(key, {
          data: value,
          timestamp: Date.now(),
          ttl: this.cacheTTL
        })
        // Also save to localStorage as backup
        this.saveToStorage(key, value)
        return
      }
    } catch (error) {
      console.warn(`Failed to save setting ${key} to database:`, error)
    }

    // Fallback to localStorage only
    this.saveToStorage(key, value)
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Invalidate specific cache entry
   */
  invalidateCache(key: string): void {
    this.cache.delete(key)
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private getFromStorage<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue

    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : defaultValue
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error)
      return defaultValue
    }
  }

  private saveToStorage<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error)
    }
  }
}

export const settingsStorageDB = new SettingsStorageDB()

