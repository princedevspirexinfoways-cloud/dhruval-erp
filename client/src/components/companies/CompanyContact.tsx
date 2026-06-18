import React from 'react';
import { Mail, Phone, Globe, Linkedin, Edit3, Save, X, Send, MessageCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface CompanyContactProps {
  company: {
    contactInfo?: {
      phones?: Array<{ type: string; label: string }>;
      emails?: Array<{ type: string; label: string }>;
      website?: string;
      socialMedia?: {
        linkedin?: string;
      };
    };
  };
  editingFields: { [key: string]: boolean };
  editData: any;
  onStartEditing: (field: string) => void;
  onCancelEditing: (field: string) => void;
  onSaveField: (field: string) => void;
  onNestedChange: (parentField: string, childField: string, value: any) => void;
}

export const CompanyContact: React.FC<CompanyContactProps> = ({
  company,
  editingFields,
  editData,
  onStartEditing,
  onCancelEditing,
  onSaveField,
  onNestedChange
}) => {
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

  const renderContactItem = (icon: React.ReactNode, label: string, value: string, type: 'email' | 'phone' | 'website' | 'linkedin') => {
    const getActionButton = () => {
      switch (type) {
        case 'email':
          return (
            <Button size="sm" variant="outline" className="text-blue-600 border-blue-300 hover:bg-blue-50">
              <Send className="h-4 w-4 mr-2" />
              Send Email
            </Button>
          );
        case 'phone':
          return (
            <Button size="sm" variant="outline" className="text-green-600 border-green-300 hover:bg-green-50">
              <MessageCircle className="h-4 w-4 mr-2" />
              Call
            </Button>
          );
        case 'website':
        case 'linkedin':
          return (
            <Button size="sm" variant="outline" className="text-purple-600 border-purple-300 hover:bg-purple-50">
              <ExternalLink className="h-4 w-4 mr-2" />
              Visit
            </Button>
          );
        default:
          return null;
      }
    };

    return (
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-lg shadow-sm">
            {icon}
          </div>
          <div>
            <p className="text-sm text-gray-600">{label}</p>
            <p className="font-medium text-gray-900">{value}</p>
          </div>
        </div>
        {getActionButton()}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Information */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-100">
            <CardTitle className="text-lg font-semibold text-gray-900">Contact Information</CardTitle>
            <div className="bg-blue-100 p-2 rounded-lg">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {/* Emails */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-500" />
                Email Addresses
              </h4>
              {company.contactInfo?.emails && company.contactInfo.emails.length > 0 ? (
                <div className="space-y-3">
                  {company.contactInfo.emails.map((email, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <Mail className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">{email.label}</p>
                          <p className="font-medium text-gray-900">{email.type}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="text-blue-600 border-blue-300 hover:bg-blue-50">
                        <Send className="h-4 w-4 mr-2" />
                        Send Email
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm italic">No email addresses specified</p>
              )}
            </div>

            {/* Phones */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Phone className="h-4 w-4 text-green-500" />
                Phone Numbers
              </h4>
              {company.contactInfo?.phones && company.contactInfo.phones.length > 0 ? (
                <div className="space-y-3">
                  {company.contactInfo.phones.map((phone, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <Phone className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">{phone.label}</p>
                          <p className="font-medium text-gray-900">{phone.type}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="text-green-600 border-green-300 hover:bg-green-50">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Call
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm italic">No phone numbers specified</p>
              )}
            </div>

            {/* Website */}
            {company.contactInfo?.website && (
              <div>
                <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-purple-500" />
                  Website
                </h4>
                {renderContactItem(
                  <Globe className="h-4 w-4 text-purple-600" />,
                  'Website',
                  company.contactInfo.website,
                  'website'
                )}
              </div>
            )}

            {/* LinkedIn */}
            {company.contactInfo?.socialMedia?.linkedin && (
              <div>
                <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Linkedin className="h-4 w-4 text-blue-600" />
                  LinkedIn
                </h4>
                {renderContactItem(
                  <Linkedin className="h-4 w-4 text-blue-600" />,
                  'LinkedIn Profile',
                  company.contactInfo.socialMedia.linkedin,
                  'linkedin'
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-100">
            <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
            <div className="bg-purple-100 p-2 rounded-lg">
              <MessageCircle className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-3">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl shadow-lg">
                <Mail className="h-5 w-5 mr-3" />
                Send Bulk Email
              </Button>
              
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl shadow-lg">
                <Phone className="h-5 w-5 mr-3" />
                Schedule Call
              </Button>
              
              <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-xl shadow-lg">
                <Globe className="h-5 w-5 mr-3" />
                Visit Website
              </Button>
              
              <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-xl shadow-lg">
                <Linkedin className="h-5 w-5 mr-3" />
                Connect on LinkedIn
              </Button>
            </div>

            {/* Contact Statistics */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-3">Contact Statistics</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Total Emails</p>
                  <p className="font-semibold text-gray-900">
                    {company.contactInfo?.emails?.length || 0}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Total Phones</p>
                  <p className="font-semibold text-gray-900">
                    {company.contactInfo?.phones?.length || 0}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Contact Summary</h3>
            <p className="text-gray-600">
              {company.contactInfo?.emails?.length || 0} email addresses and {company.contactInfo?.phones?.length || 0} phone numbers are configured for this company.
              {company.contactInfo?.website && ' The company maintains an active web presence.'}
              {company.contactInfo?.socialMedia?.linkedin && ' Professional networking is available through LinkedIn.'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};




