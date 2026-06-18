'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { FileText } from 'lucide-react'
import toast from 'react-hot-toast'

interface ImageUploaderProps {
  selectedImages: File[]
  imagePreviews: string[]
  uploadProgress: { [fileName: string]: number }
  uploadStatus: { [fileName: string]: 'uploading' | 'success' | 'error' }
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveImage: (index: number) => void
}

export const ImageUploader = ({
  selectedImages,
  imagePreviews,
  uploadProgress,
  uploadStatus,
  onImageSelect,
  onRemoveImage
}: ImageUploaderProps) => {
  return (
    <div className="bg-green-50 p-4 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <FileText className="h-5 w-5 text-green-600" />
        Upload Images (Optional)
      </h3>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-white">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={onImageSelect}
          className="hidden"
          id="image-upload"
        />
        <label htmlFor="image-upload" className="cursor-pointer">
          <div className="text-gray-600">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="mt-2">Click to upload images</p>
            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB each (will be compressed)</p>
          </div>
        </label>
      </div>
      
      {/* Image Previews */}
      {imagePreviews.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Images ({imagePreviews.length}):</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => onRemoveImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                >
                  ×
                </button>
                {uploadStatus[selectedImages[index]?.name] === 'uploading' && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
                      <div className="text-xs">
                        {uploadProgress[selectedImages[index]?.name] || 0}%
                      </div>
                    </div>
                  </div>
                )}
                {uploadStatus[selectedImages[index]?.name] === 'success' && (
                  <div className="absolute inset-0 bg-green-500 bg-opacity-50 rounded-lg flex items-center justify-center">
                    <div className="text-white text-xs">✓</div>
                  </div>
                )}
                {uploadStatus[selectedImages[index]?.name] === 'error' && (
                  <div className="absolute inset-0 bg-red-500 bg-opacity-50 rounded-lg flex items-center justify-center">
                    <div className="text-white text-xs">✗</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

