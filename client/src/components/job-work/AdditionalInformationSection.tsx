'use client'

import React from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CreateJobWorkRequest } from '@/lib/api/jobWorkApi'

interface AdditionalInformationSectionProps {
    qualityAgreement: string
    remarks: string
    onQualityAgreementChange: (value: string) => void
    onRemarksChange: (value: string) => void
}

export function AdditionalInformationSection({
    qualityAgreement,
    remarks,
    onQualityAgreementChange,
    onRemarksChange
}: AdditionalInformationSectionProps) {
    const theme = useSelector((state: RootState) => state.ui.theme)

    return (
        <div className="space-y-4">
            <h3 className={`text-lg font-semibold border-b pb-2 ${theme === 'dark' ? 'text-white border-gray-700' : 'text-gray-900 border-gray-200'}`}>Additional Information</h3>

            <div>
                <Label htmlFor="qualityAgreement" className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
                    Quality Agreement
                </Label>
                <Textarea
                    id="qualityAgreement"
                    value={qualityAgreement}
                    onChange={(e) => onQualityAgreementChange(e.target.value)}
                    className={`border-2 border-sky-200 min-h-[100px] ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-gray-900'}`}
                    placeholder="Enter quality agreement details..."
                />
            </div>

            <div>
                <Label htmlFor="remarks" className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
                    Additional Information
                </Label>
                <Textarea
                    id="remarks"
                    value={remarks}
                    onChange={(e) => onRemarksChange(e.target.value)}
                    className={`border-2 border-sky-200 min-h-[100px] ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-gray-900'}`}
                    placeholder="Enter any additional information..."
                />
            </div>
        </div>
    )
}
