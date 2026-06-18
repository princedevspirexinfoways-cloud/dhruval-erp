'use client'

import React from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { TransportFormData } from './types'
import { Truck } from 'lucide-react'

interface TransportDetailsSectionProps {
    transportData: TransportFormData
    onTransportChange: (field: keyof TransportFormData, value: string) => void
}

export function TransportDetailsSection({
    transportData,
    onTransportChange
}: TransportDetailsSectionProps) {
    const theme = useSelector((state: RootState) => state.ui.theme)

    return (
        <div className="space-y-4">
            <h3 className={`text-lg font-semibold border-b pb-2 flex items-center gap-2 ${theme === 'dark' ? 'text-white border-gray-700' : 'text-gray-900 border-gray-200'}`}>
                <Truck className="h-5 w-5 text-sky-500 dark:text-sky-400" />
                Transport Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="transportName" className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
                        Transport Name
                    </Label>
                    <Input
                        id="transportName"
                        value={transportData.transportName}
                        onChange={(e) => onTransportChange('transportName', e.target.value)}
                        className={`border-2 border-sky-200 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-gray-900'}`}
                        placeholder="Enter Transport Name"
                    />
                </div>

                <div>
                    <Label htmlFor="transportNumber" className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
                        Transport Number
                    </Label>
                    <Input
                        id="transportNumber"
                        value={transportData.transportNumber}
                        onChange={(e) => onTransportChange('transportNumber', e.target.value)}
                        className={`border-2 border-sky-200 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-gray-900'}`}
                        placeholder="Enter Transport Number"
                    />
                </div>
            </div>
        </div>
    )
}















