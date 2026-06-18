import { AlertTriangle } from 'lucide-react'
import clsx from 'clsx'

interface Alert {
  _id: string
  itemName: string
  itemCode: string
  currentStock: number
  minStock: number
  shortage: number
  urgency: 'critical' | 'warning'
}

interface InventoryAlertsProps {
  alerts: Alert[]
}

export function InventoryAlerts({ alerts }: InventoryAlertsProps) {
  // Ensure alerts is always an array
  const alertsArray = Array.isArray(alerts) ? alerts : []
  
  if (alertsArray.length === 0) return null

  return (
    <div className="bg-white rounded-xl border-2 border-red-500 p-4 sm:p-6">
      <div className="flex items-center mb-4">
        <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
        <h3 className="text-lg font-semibold text-black">Low Stock Alerts ({alertsArray.length})</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {alertsArray.slice(0, 6).map((alert) => (
          <div key={alert._id} className="p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-black text-sm">{alert.itemName}</h4>
              <span
                className={clsx(
                  'px-2 py-1 text-xs rounded-full',
                  alert.urgency === 'critical'
                    ? 'bg-red-100 text-red-600'
                    : 'bg-orange-100 text-orange-600'
                )}
              >
                {alert.urgency}
              </span>
            </div>
            <div className="text-xs text-black opacity-75">
              <p>Current: {alert.currentStock} {alert.itemCode}</p>
              <p>Minimum: {alert.minStock}</p>
              <p>Shortage: {alert.shortage}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

