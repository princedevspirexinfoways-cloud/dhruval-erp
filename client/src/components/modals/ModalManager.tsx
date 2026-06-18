'use client'

import React from 'react'
import { useModal } from '@/components/providers/ModalProvider'

// Import all modal components
import { CreateEditModal } from './CreateEditModal'
import { CrudModal } from '@/components/ui/CrudModal'
import CustomerFormModal from '@/components/customers/modals/CustomerFormModal'
import DeleteCustomerModal from '@/components/customers/modals/DeleteCustomerModal'
import CustomerDetailsModal from '@/components/customers/modals/CustomerDetailsModal'
import UserFormModal from '@/components/users/modals/UserFormModal'
import UserDetailsModal from '@/components/users/modals/UserDetailsModal'
import DeleteUserModal from '@/components/users/modals/DeleteUserModal'
import PasswordModal from '@/components/users/modals/PasswordModal'
import Toggle2FAModal from '@/components/users/modals/Toggle2FAModal'
import VehicleFormModal from '@/components/vehicles/modals/VehicleFormModal'
import CustomerVisitFormModal from '@/components/hospitality/modals/CustomerVisitFormModal'

export const ModalManager: React.FC = () => {
  const { isOpen, modalType, modalProps, closeModal } = useModal()

  if (!isOpen || !modalType) return null

  const renderModal = () => {
    switch (modalType) {
      case 'CREATE_EDIT':
        return (
          <CreateEditModal
            isOpen={isOpen}
            onClose={closeModal}
            {...modalProps}
          />
        )
      
      case 'CRUD':
        return (
          <CrudModal
            isOpen={isOpen}
            onClose={closeModal}
            {...modalProps}
          />
        )
      
      case 'CUSTOMER_FORM':
        return (
          <CustomerFormModal
            isOpen={isOpen}
            onClose={closeModal}
            {...modalProps}
          />
        )
      
      case 'DELETE_CUSTOMER':
        return (
          <DeleteCustomerModal
            isOpen={isOpen}
            onClose={closeModal}
            {...modalProps}
          />
        )
      
      case 'CUSTOMER_DETAILS':
        return (
          <CustomerDetailsModal
            isOpen={isOpen}
            onClose={closeModal}
            {...modalProps}
          />
        )
      
      case 'USER_FORM':
        return (
          <UserFormModal
            isOpen={isOpen}
            onClose={closeModal}
            {...modalProps}
          />
        )

      case 'USER_DETAILS':
        return (
          <UserDetailsModal
            isOpen={isOpen}
            onClose={closeModal}
            {...modalProps}
          />
        )

      case 'DELETE_USER':
        return (
          <DeleteUserModal
            isOpen={isOpen}
            onClose={closeModal}
            {...modalProps}
          />
        )

      case 'PASSWORD_MODAL':
        return (
          <PasswordModal
            isOpen={isOpen}
            onClose={closeModal}
            {...modalProps}
          />
        )

      case 'TOGGLE_2FA':
        return (
          <Toggle2FAModal
            isOpen={isOpen}
            onClose={closeModal}
            {...modalProps}
          />
        )
      
      case 'VEHICLE_FORM':
        return (
          <VehicleFormModal
            isOpen={isOpen}
            onClose={closeModal}
            {...modalProps}
          />
        )
      
      case 'CUSTOMER_VISIT_FORM':
        return (
          <CustomerVisitFormModal
            isOpen={isOpen}
            onClose={closeModal}
            {...modalProps}
          />
        )
      
      default:
        console.warn(`Unknown modal type: ${modalType}`)
        return null
    }
  }

  return <>{renderModal()}</>
}
