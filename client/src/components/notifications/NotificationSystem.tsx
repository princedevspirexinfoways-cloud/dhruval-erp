'use client'

import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { 
  Bell, 
  X, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  XCircle,
  Clock,
  User,
  Package,
  Zap,
  Shield,
  Settings
} from 'lucide-react'
import { selectCurrentUser } from '@/lib/features/auth/authSlice'
import clsx from 'clsx'

export interface Notification {
  id: string
  type: 'success' | 'warning' | 'error' | 'info'
  title: string
  message: string
  category: 'system' | 'inventory' | 'orders' | 'security' | 'maintenance' | 'energy'
  timestamp: string
  read: boolean
  actionUrl?: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  userId?: string
}

interface NotificationSystemProps {
  className?: string
}

export function NotificationSystem({ className }: NotificationSystemProps) {
  const user = useSelector(selectCurrentUser)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Mock real-time notifications - replace with real WebSocket/SSE
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'warning',
        title: 'Low Stock Alert',
        message: 'Safety Helmets inventory is below minimum threshold (5 remaining)',
        category: 'inventory',
        timestamp: new Date().toISOString(),
        read: false,
        priority: 'high',
        actionUrl: '/inventory/items'
      },
      {
        id: '2',
        type: 'success',
        title: 'Order Completed',
        message: 'Sales Order SO-2025-001 has been successfully delivered',
        category: 'orders',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        read: false,
        priority: 'medium',
        actionUrl: '/sales/orders'
      },
      {
        id: '3',
        type: 'error',
        title: 'System Alert',
        message: 'Boiler Unit B2 temperature exceeding safe limits (520°C)',
        category: 'maintenance',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        read: false,
        priority: 'critical',
        actionUrl: '/operations/boiler'
      },
      {
        id: '4',
        type: 'info',
        title: 'Visitor Check-in',
        message: 'New visitor Rajesh Kumar checked in at Main Gate',
        category: 'security',
        timestamp: new Date(Date.now() - 900000).toISOString(),
        read: true,
        priority: 'low',
        actionUrl: '/security/visitors'
      },
      {
        id: '5',
        type: 'warning',
        title: 'Energy Consumption',
        message: 'Power usage 15% above normal levels in Production Line 2',
        category: 'energy',
        timestamp: new Date(Date.now() - 1200000).toISOString(),
        read: false,
        priority: 'medium',
        actionUrl: '/operations/electricity'
      }
    ]

    setNotifications(mockNotifications)
    setUnreadCount(mockNotifications.filter(n => !n.read).length)

    // Simulate real-time notifications
    const interval = setInterval(() => {
      const newNotification: Notification = {
        id: Date.now().toString(),
        type: ['success', 'warning', 'error', 'info'][Math.floor(Math.random() * 4)] as any,
        title: 'New System Alert',
        message: 'This is a simulated real-time notification',
        category: ['system', 'inventory', 'orders', 'security', 'maintenance', 'energy'][Math.floor(Math.random() * 6)] as any,
        timestamp: new Date().toISOString(),
        read: false,
        priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any
      }

      setNotifications(prev => [newNotification, ...prev.slice(0, 19)]) // Keep only 20 notifications
      setUnreadCount(prev => prev + 1)
    }, 30000) // New notification every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const getNotificationIcon = (type: string, category: string) => {
    if (category === 'inventory') return <Package className="h-5 w-5" />
    if (category === 'orders') return <CheckCircle className="h-5 w-5" />
    if (category === 'security') return <Shield className="h-5 w-5" />
    if (category === 'maintenance') return <Settings className="h-5 w-5" />
    if (category === 'energy') return <Zap className="h-5 w-5" />

    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />
      case 'error':
        return <XCircle className="h-5 w-5" />
      default:
        return <Info className="h-5 w-5" />
    }
  }

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'critical') return 'text-red-600 bg-red-50 border-red-200'
    
    switch (type) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200'
    }
  }

  const getPriorityBadge = (priority: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full"
    switch (priority) {
      case 'critical':
        return `${baseClasses} bg-red-100 text-red-600`
      case 'high':
        return `${baseClasses} bg-orange-100 text-orange-600`
      case 'medium':
        return `${baseClasses} bg-yellow-100 text-yellow-600`
      default:
        return `${baseClasses} bg-gray-100 text-gray-600`
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const removeNotification = (notificationId: string) => {
    const notification = notifications.find(n => n.id === notificationId)
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }

  return (
    <div className={clsx("relative", className)}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={clsx(
                    "p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer",
                    !notification.read && "bg-blue-50"
                  )}
                  onClick={() => {
                    if (!notification.read) markAsRead(notification.id)
                    if (notification.actionUrl) {
                      window.location.href = notification.actionUrl
                    }
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <div className={clsx(
                      "flex-shrink-0 p-2 rounded-lg",
                      getNotificationColor(notification.type, notification.priority)
                    )}>
                      {getNotificationIcon(notification.type, notification.category)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </p>
                        <div className="flex items-center space-x-2">
                          <span className={getPriorityBadge(notification.priority)}>
                            {notification.priority}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              removeNotification(notification.id)
                            }}
                            className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            <X className="h-3 w-3 text-gray-400" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTimestamp(notification.timestamp)}
                        </span>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium">
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
