'use client'

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Camera, Upload, X, Eye, Download, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from './Button'
import { fileUploadApi } from '@/lib/api/fileUploadApi'

interface ImageUploadProps {
  onImagesSelect: (images: File[]) => void
  onImagesRemove: (index: number) => void
  images: File[]
  maxFiles?: number
  maxSize?: number // in MB
  accept?: string[]
  disabled?: boolean
  uploadProgress?: { [key: string]: number }
  uploadStatus?: { [key: string]: 'uploading' | 'success' | 'error' }
  showPreview?: boolean
  className?: string
}

export function ImageUpload({
  onImagesSelect,
  onImagesRemove,
  images,
  maxFiles = 5,
  maxSize = 5,
  accept = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  disabled = false,
  uploadProgress = {},
  uploadStatus = {},
  showPreview = true,
  className = ''
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploadedUrls, setUploadedUrls] = useState<{ [key: string]: string }>({})

  const [getUploadUrl] = fileUploadApi.useGetUploadUrlMutation()
  const [uploadToS3] = fileUploadApi.useUploadToS3Mutation()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (disabled) return

    const validFiles = acceptedFiles.filter(file => {
      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        console.warn(`File ${file.name} is too large. Max size: ${maxSize}MB`)
        return false
      }

      // Check file type
      if (!accept.includes(file.type)) {
        console.warn(`File type ${file.type} is not allowed`)
        return false
      }

      return true
    })

    if (validFiles.length > 0) {
      onImagesSelect(validFiles)
    }
  }, [disabled, maxSize, accept, onImagesSelect])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxFiles,
    disabled
  })

  const handleRemoveImage = (index: number) => {
    onImagesRemove(index)
  }

  const handleUploadImage = async (file: File, index: number) => {
    try {
      // Get presigned URL
      const { uploadUrl, key, expiresAt } = await getUploadUrl({
        fileName: file.name,
        contentType: file.type,
        fileType: 'images'
      }).unwrap()

      // Upload to S3
      await uploadToS3({
        uploadUrl,
        file,
        onProgress: (progress: number) => {
          // Progress is handled by the mutation
        }
      })

      // Store the uploaded URL
      setUploadedUrls(prev => ({
        ...prev,
        [file.name]: key
      }))

      console.log('Image uploaded successfully:', key)
    } catch (error) {
      console.error('Failed to upload image:', error)
    }
  }

  const getFilePreview = (file: File) => {
    return URL.createObjectURL(file)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive || dragActive 
            ? 'border-emerald-500 bg-emerald-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragEnter={() => setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center space-y-2">
          <Camera className="h-8 w-8 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              {isDragActive ? 'Drop images here' : 'Drag & drop images here'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              or click to select files
            </p>
          </div>
          <div className="text-xs text-gray-400">
            Max {maxFiles} files, {maxSize}MB each
          </div>
          <div className="text-xs text-gray-400">
            Accepted: {accept.map(type => type.split('/')[1]).join(', ')}
          </div>
        </div>
      </div>

      {/* Selected Images */}
      {images.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">
            Selected Images ({images.length}/{maxFiles})
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="relative group border rounded-lg overflow-hidden bg-white shadow-sm"
              >
                {/* Image Preview */}
                {showPreview && (
                  <div className="aspect-square bg-gray-100">
                    <img
                      src={getFilePreview(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                      onLoad={(e) => {
                        // Clean up object URL
                        URL.revokeObjectURL((e.target as HTMLImageElement).src)
                      }}
                    />
                  </div>
                )}

                {/* File Info */}
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    
                    {/* Upload Status */}
                    <div className="flex items-center space-x-1">
                      {uploadStatus[file.name] === 'uploading' && (
                        <div className="flex items-center space-x-1">
                          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs text-emerald-600">
                            {uploadProgress[file.name] || 0}%
                          </span>
                        </div>
                      )}
                      
                      {uploadStatus[file.name] === 'success' && (
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      )}
                      
                      {uploadStatus[file.name] === 'error' && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUploadImage(file, index)}
                      disabled={uploadStatus[file.name] === 'uploading'}
                      className="flex-1"
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      Upload
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveImage(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Uploaded URL */}
                  {uploadedUrls[file.name] && (
                    <div className="mt-2 p-2 bg-emerald-50 rounded text-xs">
                      <p className="text-emerald-700 font-medium">Uploaded:</p>
                      <p className="text-emerald-600 truncate">
                        {uploadedUrls[file.name]}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload All Button */}
      {images.length > 0 && (
        <div className="flex justify-center">
          <Button
            onClick={() => {
              images.forEach((file, index) => {
                if (uploadStatus[file.name] !== 'uploading') {
                  handleUploadImage(file, index)
                }
              })
            }}
            disabled={images.some(file => uploadStatus[file.name] === 'uploading')}
            className="px-6"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload All Images
          </Button>
        </div>
      )}
    </div>
  )
}
