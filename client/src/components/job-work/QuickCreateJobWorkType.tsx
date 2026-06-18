'use client'

import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCreateJobWorkTypeMutation, useGetJobWorkTypesQuery } from '@/lib/api/jobWorkTypeApi'
import { toast } from 'sonner'

interface QuickCreateJobWorkTypeProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onJobWorkTypeCreated?: (jobWorkTypeId: string) => void
}

export function QuickCreateJobWorkType({ 
    open, 
    onOpenChange, 
    onJobWorkTypeCreated 
}: QuickCreateJobWorkTypeProps) {
    const theme = useSelector((state: RootState) => state.ui.theme)
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [color, setColor] = useState('#6b7280')
    
    const [createJobWorkType, { isLoading }] = useCreateJobWorkTypeMutation()
    const { refetch: refetchJobWorkTypes } = useGetJobWorkTypesQuery({})

    useEffect(() => {
        if (!open) {
            setName('')
            setDescription('')
            setColor('#6b7280')
        }
    }, [open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!name.trim()) {
            toast.error('Job work type name is required')
            return
        }

        try {
            const result = await createJobWorkType({
                name: name.trim(),
                description: description.trim() || undefined,
                color: color || undefined
            }).unwrap()

            // Refetch job work types to update the dropdown
            await refetchJobWorkTypes()

            toast.success('Job work type created successfully')

            // Call callback with new job work type ID
            if (onJobWorkTypeCreated && result.data?._id) {
                onJobWorkTypeCreated(result.data._id)
            }

            // Reset and close
            setName('')
            setDescription('')
            setColor('#6b7280')
            onOpenChange(false)
        } catch (error: any) {
            toast.error(error?.data?.message || 'Failed to create job work type')
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} max-w-md`}>
                <DialogHeader>
                    <DialogTitle className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                        Create New Job Work Type
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
                            Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Printing, Dyeing, Washing"
                            className={`${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                            required
                        />
                    </div>
                    <div>
                        <Label className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
                            Description
                        </Label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Optional description"
                            className={`${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                            rows={3}
                        />
                    </div>
                    <div>
                        <Label className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
                            Color
                        </Label>
                        <div className="flex items-center gap-2">
                            <Input
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="w-16 h-10"
                            />
                            <Input
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                placeholder="#6b7280"
                                className={`flex-1 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className={theme === 'dark' ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : ''}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || !name.trim()}
                            className="bg-sky-600 hover:bg-sky-700 text-white"
                        >
                            {isLoading ? 'Creating...' : 'Create'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}















