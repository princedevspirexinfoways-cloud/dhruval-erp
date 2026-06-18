'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCreateUnitMutation, useGetUnitsQuery } from '@/features/unit/api/unitApi'
import { useToast } from '@/components/ui/use-toast'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import { Loader2 } from 'lucide-react'

interface QuickCreateUnitProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onUnitCreated?: (unitId: string) => void
}

export function QuickCreateUnit({ open, onOpenChange, onUnitCreated }: QuickCreateUnitProps) {
    const [name, setName] = useState('')
    const [symbol, setSymbol] = useState('')
    const [description, setDescription] = useState('')
    const [createUnit, { isLoading }] = useCreateUnitMutation()
    const { toast } = useToast()
    const theme = useSelector((state: RootState) => state.ui.theme)
    const companyId = useSelector((state: RootState) =>
        state.auth.currentCompanyId ||
        state.auth.user?.companyAccess?.[0]?.companyId ||
        state.auth.user?.currentCompanyId
    )

    // Refetch units after creation
    const { refetch: refetchUnits } = useGetUnitsQuery(
        companyId ? { companyId: companyId.toString() } : {}
    )

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const result = await createUnit({
                name,
                symbol,
                description,
                ...(companyId && { companyId }) // Only include companyId if available
            }).unwrap()

            // Refetch units to update the dropdown
            await refetchUnits()

            toast({
                title: 'Success',
                description: 'Unit created successfully'
            })

            // Call callback with new unit ID
            if (onUnitCreated && result.data?._id) {
                onUnitCreated(result.data._id)
            }

            // Reset and close
            setName('')
            setSymbol('')
            setDescription('')
            onOpenChange(false)
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error?.data?.message || 'Failed to create unit',
                variant: 'destructive'
            })
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`sm:max-w-[425px] ${theme === 'dark' ? '!bg-gray-800 !text-white !border-gray-700' : '!bg-white !text-gray-900 !border-gray-200'}`}>
                <DialogHeader>
                    <DialogTitle className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                        Quick Create Unit
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="name" className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
                            Unit Name *
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Meters, Kilograms"
                            required
                            className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}
                        />
                    </div>

                    <div>
                        <Label htmlFor="symbol" className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
                            Symbol *
                        </Label>
                        <Input
                            id="symbol"
                            value={symbol}
                            onChange={(e) => setSymbol(e.target.value)}
                            placeholder="e.g., m, kg"
                            required
                            className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}
                        />
                    </div>

                    <div>
                        <Label htmlFor="description" className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
                            Description
                        </Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of this unit"
                            rows={3}
                            className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                            className={theme === 'dark' ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : ''}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Unit'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
