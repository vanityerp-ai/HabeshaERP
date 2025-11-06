/**
 * Production Cache Configuration
 * 
 * Defines caching strategies for different types of data
 * to optimize performance in production.
 */

export interface CacheConfig {
  ttl: number // Time to live in seconds
  staleWhileRevalidate?: number // Serve stale content while revalidating
  tags?: string[] // Cache tags for invalidation
}

/**
 * Cache TTL configurations for different data types
 */
export const CACHE_CONFIG = {
  // Static data (rarely changes)
  STATIC: {
    ttl: parseInt(process.env.CACHE_TTL_STATIC || '3600'), // 1 hour
    staleWhileRevalidate: 7200, // 2 hours
    tags: ['static'],
  } as CacheConfig,

  // Dynamic data (changes frequently)
  DYNAMIC: {
    ttl: parseInt(process.env.CACHE_TTL_DYNAMIC || '60'), // 1 minute
    staleWhileRevalidate: 120, // 2 minutes
    tags: ['dynamic'],
  } as CacheConfig,

  // Default cache
  DEFAULT: {
    ttl: parseInt(process.env.CACHE_TTL_DEFAULT || '300'), // 5 minutes
    staleWhileRevalidate: 600, // 10 minutes
    tags: ['default'],
  } as CacheConfig,

  // User-specific data
  USER: {
    ttl: 300, // 5 minutes
    tags: ['user'],
  } as CacheConfig,

  // Services and products
  SERVICES: {
    ttl: 1800, // 30 minutes
    staleWhileRevalidate: 3600,
    tags: ['services'],
  } as CacheConfig,

  PRODUCTS: {
    ttl: 1800, // 30 minutes
    staleWhileRevalidate: 3600,
    tags: ['products'],
  } as CacheConfig,

  // Inventory (needs to be fresh)
  INVENTORY: {
    ttl: 60, // 1 minute
    staleWhileRevalidate: 120,
    tags: ['inventory'],
  } as CacheConfig,

  // Appointments (time-sensitive)
  APPOINTMENTS: {
    ttl: 120, // 2 minutes
    staleWhileRevalidate: 240,
    tags: ['appointments'],
  } as CacheConfig,

  // Staff data
  STAFF: {
    ttl: 600, // 10 minutes
    staleWhileRevalidate: 1200,
    tags: ['staff'],
  } as CacheConfig,

  // Clients
  CLIENTS: {
    ttl: 600, // 10 minutes
    staleWhileRevalidate: 1200,
    tags: ['clients'],
  } as CacheConfig,

  // Analytics and reports
  ANALYTICS: {
    ttl: 1800, // 30 minutes
    staleWhileRevalidate: 3600,
    tags: ['analytics'],
  } as CacheConfig,

  // Settings
  SETTINGS: {
    ttl: 3600, // 1 hour
    staleWhileRevalidate: 7200,
    tags: ['settings'],
  } as CacheConfig,

  // Locations
  LOCATIONS: {
    ttl: 3600, // 1 hour
    staleWhileRevalidate: 7200,
    tags: ['locations'],
  } as CacheConfig,
} as const

/**
 * Cache key generators
 */
export const CacheKeys = {
  // User-related
  user: (userId: string) => `user:${userId}`,
  userSettings: (userId: string) => `user:${userId}:settings`,
  userPermissions: (userId: string) => `user:${userId}:permissions`,

  // Services
  services: (locationId?: string) => 
    locationId ? `services:location:${locationId}` : 'services:all',
  service: (serviceId: string) => `service:${serviceId}`,
  serviceCategories: () => 'service:categories',

  // Products
  products: (locationId?: string) => 
    locationId ? `products:location:${locationId}` : 'products:all',
  product: (productId: string) => `product:${productId}`,
  productCategories: () => 'product:categories',

  // Inventory
  inventory: (locationId: string) => `inventory:location:${locationId}`,
  inventoryItem: (productId: string, locationId: string) => 
    `inventory:${productId}:${locationId}`,
  inventoryLevels: (locationId: string) => `inventory:levels:${locationId}`,

  // Appointments
  appointments: (date: string, locationId?: string) => 
    locationId 
      ? `appointments:${date}:location:${locationId}` 
      : `appointments:${date}`,
  appointment: (appointmentId: string) => `appointment:${appointmentId}`,
  staffSchedule: (staffId: string, date: string) => 
    `staff:${staffId}:schedule:${date}`,

  // Staff
  staff: (locationId?: string) => 
    locationId ? `staff:location:${locationId}` : 'staff:all',
  staffMember: (staffId: string) => `staff:${staffId}`,

  // Clients
  clients: (locationId?: string) => 
    locationId ? `clients:location:${locationId}` : 'clients:all',
  client: (clientId: string) => `client:${clientId}`,
  clientHistory: (clientId: string) => `client:${clientId}:history`,

  // Analytics
  analytics: (type: string, period: string, locationId?: string) => 
    locationId 
      ? `analytics:${type}:${period}:${locationId}` 
      : `analytics:${type}:${period}`,

  // Settings
  settings: (type: string) => `settings:${type}`,
  generalSettings: () => 'settings:general',

  // Locations
  locations: () => 'locations:all',
  location: (locationId: string) => `location:${locationId}`,
} as const

/**
 * Cache invalidation helpers
 */
export const invalidateCache = {
  // Invalidate all user-related caches
  user: (userId: string) => [
    CacheKeys.user(userId),
    CacheKeys.userSettings(userId),
    CacheKeys.userPermissions(userId),
  ],

  // Invalidate service-related caches
  services: (locationId?: string) => [
    CacheKeys.services(locationId),
    CacheKeys.serviceCategories(),
  ],

  // Invalidate product-related caches
  products: (locationId?: string) => [
    CacheKeys.products(locationId),
    CacheKeys.productCategories(),
  ],

  // Invalidate inventory caches
  inventory: (locationId: string) => [
    CacheKeys.inventory(locationId),
    CacheKeys.inventoryLevels(locationId),
  ],

  // Invalidate appointment caches
  appointments: (date: string, locationId?: string) => [
    CacheKeys.appointments(date, locationId),
  ],

  // Invalidate all caches (use sparingly)
  all: () => ['*'],
} as const

/**
 * Get cache configuration for a specific data type
 */
export function getCacheConfig(type: keyof typeof CACHE_CONFIG): CacheConfig {
  return CACHE_CONFIG[type] || CACHE_CONFIG.DEFAULT
}

/**
 * Check if caching is enabled
 */
export function isCacheEnabled(): boolean {
  // Disable caching in development unless explicitly enabled
  if (process.env.NODE_ENV === 'development') {
    return process.env.ENABLE_CACHE === 'true'
  }
  
  // Always enable caching in production
  return true
}

/**
 * Get cache headers for HTTP responses
 */
export function getCacheHeaders(config: CacheConfig): Record<string, string> {
  const headers: Record<string, string> = {}
  
  if (config.staleWhileRevalidate) {
    headers['Cache-Control'] = 
      `public, max-age=${config.ttl}, stale-while-revalidate=${config.staleWhileRevalidate}`
  } else {
    headers['Cache-Control'] = `public, max-age=${config.ttl}`
  }
  
  return headers
}

