export function OrderDetailsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-lg h-24"></div>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="xl:col-span-2 space-y-6">
          {/* Customer Info Skeleton */}
          <div className="bg-gray-200 rounded-lg h-48"></div>
          
          {/* Order Items Skeleton */}
          <div className="bg-gray-200 rounded-lg h-64"></div>
          
          {/* Delivery Info Skeleton */}
          <div className="bg-gray-200 rounded-lg h-32"></div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Actions Skeleton */}
          <div className="bg-gray-200 rounded-lg h-48"></div>
          
          {/* Order Summary Skeleton */}
          <div className="bg-gray-200 rounded-lg h-40"></div>
          
          {/* Payment Details Skeleton */}
          <div className="bg-gray-200 rounded-lg h-32"></div>
          
          {/* Timeline Skeleton */}
          <div className="bg-gray-200 rounded-lg h-24"></div>
        </div>
      </div>
    </div>
  )
}