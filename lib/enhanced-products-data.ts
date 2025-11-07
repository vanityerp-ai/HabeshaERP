// Enhanced Product Type Definition
// This file defines the enhanced product type used in the catalog

export interface EnhancedProduct {
  id: string
  name: string
  description?: string
  price: number
  cost?: number
  category: string
  type: string
  brand?: string
  sku?: string
  barcode?: string
  image?: string
  images?: string | string[]
  isRetail?: boolean
  isActive?: boolean
  isFeatured?: boolean
  isNew?: boolean
  isBestSeller?: boolean
  isSale?: boolean
  salePrice?: number
  rating?: number
  reviewCount?: number
  features?: string | string[]
  ingredients?: string | string[]
  howToUse?: string | string[]
  createdAt?: Date
  updatedAt?: Date
  // Additional properties for enhanced catalog
  size?: string
  relatedProducts?: string[]
  [key: string]: any // Allow additional properties
}