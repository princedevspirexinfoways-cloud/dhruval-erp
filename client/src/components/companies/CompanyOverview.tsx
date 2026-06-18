import React from 'react';
import { Building2, FileText, Calendar, Shield, Edit3, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface CompanyOverviewProps {
  company: {
    _id: string;
    companyName: string;
    companyCode: string;
    legalName?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt?: string;
    registrationDetails?: {
      gstin?: string;
      pan?: string;
      cin?: string;
      registrationDate?: string;
    };
  };
  editingFields: { [key: string]: boolean };
  editData: any;
  onStartEditing: (field: string) => void;
  onCancelEditing: (field: string) => void;
  onSaveField: (field: string) => void;
  onInputChange: (field: string, value: any) => void;
  onNestedChange: (parentField: string, childField: string, value: any) => void;
}

export const CompanyOverview: React.FC<CompanyOverviewProps> = ({
  company,
  editingFields,
  editData,
  onStartEditing,
  onCancelEditing,
  onSaveField,
  onInputChange,
  onNestedChange
}) => {
  const renderEditableField = (label: string, field: string, value: any) => (
    <div className="flex items-center justify-between">
      <span className="font-medium text-gray-700">{label}:</span>
      {editingFields[field] ? (
        <div className="flex items-center gap-2">
          <Input
            value={editData?.[field] || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onInputChange(field, e.target.value)}
            className="w-64"
          />
          <Button size="sm" onClick={() => onSaveField(field)} className="bg-green-600 hover:bg-green-700">
            <Save className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => onCancelEditing(field)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-gray-900">{value || 'Not provided'}</span>
          <Button size="sm" variant="ghost" onClick={() => onStartEditing(field)}>
            <Edit3 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );

  const renderEditableNestedField = (label: string, parentField: string, childField: string, value: any) => (
    <div className="flex items-center justify-between">
      <span className="font-medium text-gray-700">{label}:</span>
      {editingFields[`${parentField}_${childField}`] ? (
        <div className="flex items-center gap-2">
          <Input
            value={editData?.[parentField]?.[childField] || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onNestedChange(parentField, childField, e.target.value)}
            className="w-64"
          />
          <Button size="sm" onClick={() => onSaveField(`${parentField}_${childField}`)} className="bg-green-600 hover:bg-green-700">
            <Save className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => onCancelEditing(`${parentField}_${childField}`)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-gray-900">{value || 'Not provided'}</span>
          <Button size="sm" variant="ghost" onClick={() => onStartEditing(`${parentField}_${childField}`)}>
            <Edit3 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Basic Info */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-100">
            <CardTitle className="text-lg font-semibold text-gray-900">Basic Information</CardTitle>
            <div className="bg-blue-100 p-2 rounded-lg">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {renderEditableField('Company Name', 'companyName', company.companyName)}
            {renderEditableField('Company Code', 'companyCode', company.companyCode)}
            {renderEditableField('Legal Name', 'legalName', company.legalName)}
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Status:</span>
              <Badge variant={company.isActive ? "default" : "secondary"} className="px-3 py-1">
                {company.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Registration Details */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-100">
            <CardTitle className="text-lg font-semibold text-gray-900">Registration</CardTitle>
            <div className="bg-green-100 p-2 rounded-lg">
              <FileText className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {renderEditableNestedField('GSTIN', 'registrationDetails', 'gstin', company.registrationDetails?.gstin)}
            {renderEditableNestedField('PAN', 'registrationDetails', 'pan', company.registrationDetails?.pan)}
            {renderEditableNestedField('CIN', 'registrationDetails', 'cin', company.registrationDetails?.cin)}
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Registration Date:</span>
              <span className="text-gray-900">
                {company.registrationDetails?.registrationDate ? 
                  new Date(company.registrationDetails.registrationDate).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  }) : 
                  'Not provided'
                }
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Timestamps */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-100">
            <CardTitle className="text-lg font-semibold text-gray-900">Timestamps</CardTitle>
            <div className="bg-purple-100 p-2 rounded-lg">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Created:</span>
              <span className="text-gray-900">
                {new Date(company.createdAt).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Updated:</span>
              <span className="text-gray-900">
                {company.updatedAt ? 
                  new Date(company.updatedAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  }) : 
                  'Never'
                }
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Company Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Company Summary</h3>
            <p className="text-gray-600">
              {company.companyName} is a {company.isActive ? 'fully operational' : 'currently inactive'} company 
              established in {new Date(company.createdAt).getFullYear()}. 
              {company.registrationDetails?.gstin && ` The company is registered with GSTIN: ${company.registrationDetails.gstin}.`}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
