'use client'

import { createContextualCan } from '@casl/react'
import { createContext, useContext } from 'react'
import { AppAbility } from './ability'

export const AbilityContext = createContext<AppAbility | undefined>(undefined)

export const Can = createContextualCan(AbilityContext.Consumer as React.Consumer<AppAbility>)

export function useAbility() {
  const ability = useContext(AbilityContext)
  if (!ability) {
    throw new Error('useAbility must be used within an AbilityProvider')
  }
  return ability
}

export function AbilityProvider({ 
  children, 
  ability 
}: { 
  children: React.ReactNode
  ability: AppAbility 
}) {
  return (
    <AbilityContext.Provider value={ability}>
      {children}
    </AbilityContext.Provider>
  )
}
