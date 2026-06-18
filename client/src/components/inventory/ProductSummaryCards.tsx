'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/Button'
import { Eye, Package, Palette, Ruler, Award, TrendingUp } from 'lucide-react'
import { useGetProductSummaryQuery } from '@/lib/features/inventory/enhancedInventoryApi'

export function ProductSummaryCards() {
  const { data: productData, isLoading, error } = useGetProductSummaryQuery()

  const getProductTypeIcon = (type: string) => {
    const icons = {
      saree: '🥻',
      african: '👗',
      garment: '👔',
      digital_print: '🖨️',
      yarn: '🧶',
      thread: '🪡',
      chemical: '🧪',
      dye: '🎨',
      machinery: '⚙️',
      custom: '📦'
    }
    return icons[type as keyof typeof icons] || '📦'
  }

  const getProductTypeColor = (type: string) => {
    const colors = {
      saree: 'bg-pink-100 text-pink-800 border-pink-200',
      african: 'bg-orange-100 text-orange-800 border-orange-200',
      garment: 'bg-blue-100 text-blue-800 border-blue-200',
      digital_print: 'bg-purple-100 text-purple-800 border-purple-200',
      yarn: 'bg-green-100 text-green-800 border-green-200',
      thread: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      chemical: 'bg-red-100 text-red-800 border-red-200',
      dye: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      machinery: 'bg-gray-100 text-gray-800 border-gray-200',
      custom: 'bg-slate-100 text-slate-800 border-slate-200'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getQualityDistribution = (qualityArray: string[]) => {
    const distribution = qualityArray.reduce((acc, grade) => {
      acc[grade] = (acc[grade] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const total = qualityArray.length
    return Object.entries(distribution).map(([grade, count]) => ({
      grade,
      count,
      percentage: (count / total) * 100
    }))
  }

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading product summary data
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalItems = productData?.data?.reduce((sum, product) => sum + product.totalItems, 0) || 0
  const totalValue = productData?.data?.reduce((sum, product) => sum + product.totalValue, 0) || 0

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{totalItems}</div>
                <div className="text-sm text-gray-600">Total Products</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">₹{(totalValue / 100000).toFixed(1)}L</div>
                <div className="text-sm text-gray-600">Total Value</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Palette className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">
                  {productData?.data?.reduce((sum, product) => sum + product.uniqueColorsCount, 0) || 0}
                </div>
                <div className="text-sm text-gray-600">Unique Colors</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Ruler className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">
                  {productData?.data?.reduce((sum, product) => sum + product.uniqueDesignsCount, 0) || 0}
                </div>
                <div className="text-sm text-gray-600">Unique Designs</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Type Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {productData?.data?.map((product) => (
          <Card key={product.productType} className={`border-2 ${getProductTypeColor(product.productType)}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">{getProductTypeIcon(product.productType)}</div>
                  <div>
                    <CardTitle className="text-lg capitalize">
                      {product.productType.replace('_', ' ')}
                    </CardTitle>
                    <CardDescription>
                      {product.totalItems} items • ₹{(product.totalValue / 1000).toFixed(1)}K
                    </CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-white/50 rounded-lg">
                  <div className="text-lg font-bold">{product.totalQuantity.toLocaleString()}</div>
                  <div className="text-xs text-gray-600">Total Quantity</div>
                </div>
                <div className="text-center p-3 bg-white/50 rounded-lg">
                  <div className="text-lg font-bold">
                    {product.avgGSM ? `${product.avgGSM} GSM` : 'N/A'}
                  </div>
                  <div className="text-xs text-gray-600">Avg GSM</div>
                </div>
              </div>

              {/* Color & Design Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Colors Available</span>
                  <Badge variant="secondary">{product.uniqueColorsCount}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Design Variants</span>
                  <Badge variant="secondary">{product.uniqueDesignsCount}</Badge>
                </div>
              </div>

              {/* Quality Distribution */}
              {product.qualityDistribution && product.qualityDistribution.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Award className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium">Quality Distribution</span>
                  </div>
                  <div className="space-y-1">
                    {getQualityDistribution(product.qualityDistribution).slice(0, 3).map((quality) => (
                      <div key={quality.grade} className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Grade {quality.grade}</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={quality.percentage} className="w-16 h-2" />
                          <span className="text-xs text-gray-500">{quality.percentage.toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Value Distribution */}
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Avg Value per Item</span>
                  <span className="font-medium">
                    ₹{(product.totalValue / product.totalItems).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Product Summary Table</CardTitle>
          <CardDescription>Detailed breakdown of all product types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Product Type</th>
                  <th className="text-right p-2">Items</th>
                  <th className="text-right p-2">Quantity</th>
                  <th className="text-right p-2">Value</th>
                  <th className="text-right p-2">Avg GSM</th>
                  <th className="text-right p-2">Colors</th>
                  <th className="text-right p-2">Designs</th>
                </tr>
              </thead>
              <tbody>
                {productData?.data?.map((product) => (
                  <tr key={product.productType} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <div className="flex items-center space-x-2">
                        <span>{getProductTypeIcon(product.productType)}</span>
                        <span className="capitalize">{product.productType.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="text-right p-2 font-medium">{product.totalItems}</td>
                    <td className="text-right p-2">{product.totalQuantity.toLocaleString()}</td>
                    <td className="text-right p-2">₹{(product.totalValue / 1000).toFixed(1)}K</td>
                    <td className="text-right p-2">{product.avgGSM || 'N/A'}</td>
                    <td className="text-right p-2">{product.uniqueColorsCount}</td>
                    <td className="text-right p-2">{product.uniqueDesignsCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
