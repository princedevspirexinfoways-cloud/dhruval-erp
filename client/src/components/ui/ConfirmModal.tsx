import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  isLoading = false
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          headerBg: 'bg-red-500',
          iconColor: 'text-red-500',
          confirmButton: 'bg-red-500 hover:bg-red-600 text-white border-0'
        };
      case 'warning':
        return {
          headerBg: 'bg-yellow-500',
          iconColor: 'text-yellow-500',
          confirmButton: 'bg-yellow-500 hover:bg-yellow-600 text-white border-0'
        };
      case 'info':
        return {
          headerBg: 'bg-sky-500',
          iconColor: 'text-sky-500',
          confirmButton: 'bg-sky-500 hover:bg-sky-600 text-white border-0'
        };
      default:
        return {
          headerBg: 'bg-red-500',
          iconColor: 'text-red-500',
          confirmButton: 'bg-red-500 hover:bg-red-600 text-white border-0'
        };
    }
  };

  const styles = getTypeStyles();

  return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl border-2 border-sky-500 shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className={`${styles.headerBg} text-white px-6 py-4 flex items-center justify-between rounded-t-lg`}>
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start space-x-4">
            <div className={`flex-shrink-0 ${styles.iconColor}`}>
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <p className="text-black text-sm leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 mt-6">
            <Button
              onClick={onClose}
              variant="outline"
              disabled={isLoading}
              className="border-sky-300 text-sky-700 hover:bg-sky-50"
            >
              {cancelText}
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              className={styles.confirmButton}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                confirmText
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
