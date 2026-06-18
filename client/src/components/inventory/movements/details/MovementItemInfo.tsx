'use client'

import { Package } from 'lucide-react'
import { StockMovement } from '../types'

interface MovementItemInfoProps {
  theme: 'light' | 'dark'
  movement: StockMovement
}

export function MovementItemInfo({ theme, movement }: MovementItemInfoProps) {
  // Handle when itemId is a string (not populated) or an object
  const item = typeof movement.itemId === 'object' && movement.itemId !== null 
    ? movement.itemId 
    : null

  // If itemId is just a string, we can't show item details
  const hasItemDetails = item && typeof item === 'object' && 'itemName' in item

  if (!hasItemDetails && typeof movement.itemId === 'string') {
    return (
      <div className={`rounded-xl border p-6 transition-theme ${
        theme === 'dark'
          ? 'bg-gray-800/50 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 flex items-center space-x-2 ${
          theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
        }`}>
          <Package className={`w-5 h-5 ${theme === 'dark' ? 'text-sky-400' : 'text-sky-600'}`} />
          <span>Item Information</span>
        </h3>
        <div className="text-center py-4">
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Item details are being loaded...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-xl border p-6 transition-theme ${
      theme === 'dark'
        ? 'bg-gray-800/50 border-gray-700'
        : 'bg-white border-gray-200'
    }`}>
      <h3 className={`text-lg font-semibold mb-4 flex items-center space-x-2 ${
        theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
      }`}>
        <Package className={`w-5 h-5 ${theme === 'dark' ? 'text-sky-400' : 'text-sky-600'}`} />
        <span>Item Information</span>
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={`block text-sm font-medium mb-1 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>Item Name</label>
          <p className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
            {item?.itemName || movement.itemName || 'N/A'}
          </p>
        </div>
        <div>
          <label className={`block text-sm font-medium mb-1 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>Item Code</label>
          <p className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
            {item?.itemCode || movement.companyItemCode || movement.itemCode || 'N/A'}
          </p>
        </div>
        <div>
          <label className={`block text-sm font-medium mb-1 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>Category</label>
          <p className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>
            {item?.category?.primary || (movement as any).category?.primary || 'N/A'}
            {item?.category?.secondary && ` • ${item.category.secondary}`}
            {item?.category?.tertiary && ` • ${item.category.tertiary}`}
          </p>
        </div>
        <div>
          <label className={`block text-sm font-medium mb-1 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>Unit</label>
          <p className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>
            {item?.stock?.unit || movement.stock?.unit || movement.unit || 'PCS'}
          </p>
        </div>
        {item?.pricing && (
          <>
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Cost Price</label>
              <p className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>
                ₹{item.pricing.costPrice || 0}
              </p>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Selling Price</label>
              <p className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>
                ₹{item.pricing.sellingPrice || 0}
              </p>
            </div>
          </>
        )}
        {item?.stock && (
          <>
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Current Stock</label>
              <p className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>
                {item.stock.currentStock || 0} {item.stock.unit || 'PCS'}
              </p>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Available Stock</label>
              <p className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>
                {item.stock.availableStock || 0} {item.stock.unit || 'PCS'}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

