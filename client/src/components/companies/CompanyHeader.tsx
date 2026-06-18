import React from 'react';
import { Building2, MapPin, Calendar, Users, Shield, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/card';

interface CompanyHeaderProps {
  company: {
    _id: string;
    companyName: string;
    companyCode: string;
    legalName?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt?: string;
    addresses?: {
      registeredOffice?: {
        city?: string;
        state?: string;
      };
    };
    contactInfo?: {
      emails?: Array<{ type: string; label: string }>;
      phones?: Array<{ type: string; label: string }>;
      website?: string;
    };
  };
  onEdit?: () => void;
  onViewUsers?: () => void;
}

export const CompanyHeader: React.FC<CompanyHeaderProps> = ({ 
  company, 
  onEdit, 
  onViewUsers 
}) => {
  const primaryEmail = company.contactInfo?.emails?.find(e => e.label === 'Primary')?.type;
  const primaryPhone = company.contactInfo?.phones?.find(p => p.label === 'Primary')?.type;
  const location = company.addresses?.registeredOffice;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
      <div className="container mx-auto px-4 py-8">
        {/* Main Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Company Info */}
          <div className="flex-1">
            <div className="flex items-start gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-lg border border-blue-100">
                <Building2 className="h-12 w-12 text-blue-600" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold text-gray-900">{company.companyName}</h1>
                  <Badge 
                    variant={company.isActive ? "default" : "secondary"}
                    className="text-sm px-3 py-1"
                  >
                    {company.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                
                <p className="text-xl text-gray-600 mb-3">
                  Company Code: <span className="font-semibold text-blue-600">{company.companyCode}</span>
                </p>
                
                {company.legalName && company.legalName !== company.companyName && (
                  <p className="text-lg text-gray-700 italic">
                    Legal Name: {company.legalName}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {onEdit && (
              <Button 
                onClick={onEdit}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-lg"
              >
                <Shield className="h-5 w-5 mr-2" />
                Edit Company
              </Button>
            )}
            
            {onViewUsers && (
              <Button 
                onClick={onViewUsers}
                variant="outline"
                className="border-blue-300 text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-xl"
              >
                <Users className="h-5 w-5 mr-2" />
                View Users
              </Button>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <Card className="bg-white/80 backdrop-blur-sm border-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <MapPin className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-semibold text-gray-900">
                    {location?.city && location?.state 
                      ? `${location.city}, ${location.state}` 
                      : 'Not specified'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Established</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(company.createdAt).getFullYear()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Contact</p>
                  <p className="font-semibold text-gray-900">
                    {primaryEmail ? 'Email' : primaryPhone ? 'Phone' : 'Not specified'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-semibold text-gray-900">
                    {company.isActive ? 'Operating' : 'Inactive'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Quick Info */}
        {(primaryEmail || primaryPhone || company.contactInfo?.website) && (
          <div className="mt-6 p-4 bg-white/60 rounded-xl border border-blue-100">
            <div className="flex flex-wrap items-center gap-6 text-sm">
              {primaryEmail && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium text-gray-900">{primaryEmail}</span>
                </div>
              )}
              
              {primaryPhone && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium text-gray-900">{primaryPhone}</span>
                </div>
              )}
              
              {company.contactInfo?.website && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-gray-600">Website:</span>
                  <a 
                    href={company.contactInfo.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {company.contactInfo.website}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};




