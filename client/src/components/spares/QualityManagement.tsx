'use client'

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  TrendingUp, 
  Settings, 
  Plus, 
  Edit, 
  Trash2,
  Eye,
  Download,
  Upload,
  Award,
  TestTube,
  Clipboard,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spare } from '@/lib/api/sparesApi';
import { 
  useGetQualityChecksQuery,
  useCreateQualityCheckMutation,
  useUpdateQualityCheckMutation,
  useDeleteQualityCheckMutation,
  useGetCertificationsQuery,
  useCreateCertificationMutation,
  useUpdateCertificationMutation,
  useDeleteCertificationMutation,
  useGetComplianceStandardsQuery,
  useCreateComplianceStandardMutation,
  useUpdateComplianceStandardMutation,
  useDeleteComplianceStandardMutation,
  useGetQualityAnalyticsQuery,
  QualityCheck as ApiQualityCheck,
  Certification as ApiCertification,
  ComplianceStandard as ApiComplianceStandard
} from '@/lib/api/qualityApi';

// Use API types instead of local interfaces
type QualityCheck = ApiQualityCheck;
type Certification = ApiCertification;
type ComplianceStandard = ApiComplianceStandard;

interface QualityManagementProps {
  spare: Spare;
  onUpdate: (updates: Partial<Spare>) => void;
  isEditable?: boolean;
}

export const QualityManagement: React.FC<QualityManagementProps> = ({
  spare,
  onUpdate,
  isEditable = true
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showCheckForm, setShowCheckForm] = useState(false);
  const [showCertificationForm, setShowCertificationForm] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState<QualityCheck | null>(null);
  const [selectedCertification, setSelectedCertification] = useState<Certification | null>(null);

  // Real API calls
  const { data: checksData, isLoading: checksLoading } = useGetQualityChecksQuery(spare._id);
  const { data: certificationsData, isLoading: certificationsLoading } = useGetCertificationsQuery(spare._id);
  const { data: complianceData, isLoading: complianceLoading } = useGetComplianceStandardsQuery(spare._id);
  const { data: analyticsData, isLoading: analyticsLoading } = useGetQualityAnalyticsQuery(spare._id);

  const [createCheck] = useCreateQualityCheckMutation();
  const [updateCheck] = useUpdateQualityCheckMutation();
  const [deleteCheck] = useDeleteQualityCheckMutation();
  const [createCertification] = useCreateCertificationMutation();
  const [updateCertification] = useUpdateCertificationMutation();
  const [deleteCertification] = useDeleteCertificationMutation();
  const [createCompliance] = useCreateComplianceStandardMutation();
  const [updateCompliance] = useUpdateComplianceStandardMutation();
  const [deleteCompliance] = useDeleteComplianceStandardMutation();

  const qualityChecks = checksData?.data || [];
  const certifications = certificationsData?.data || [];
  const complianceStandards = complianceData?.data || [];
  const analytics = analyticsData?.data;

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+': return 'text-green-600 bg-green-100';
      case 'A': return 'text-green-600 bg-green-100';
      case 'B+': return 'text-blue-600 bg-blue-100';
      case 'B': return 'text-yellow-600 bg-yellow-100';
      case 'C': return 'text-orange-600 bg-orange-100';
      case 'Reject': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'compliant': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'in-progress': return 'text-blue-600 bg-blue-100';
      case 'expired': return 'text-red-600 bg-red-100';
      case 'non-compliant': return 'text-red-600 bg-red-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'suspended': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getParameterStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'text-green-600 bg-green-100';
      case 'fail': return 'text-red-600 bg-red-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getQualityScore = () => {
    const scores = qualityChecks.map(check => check.score);
    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  };

  const getActiveCertifications = () => {
    return certifications.filter(cert => cert.status === 'active').length;
  };

  const getCompliantStandards = () => {
    return complianceStandards.filter(std => std.status === 'compliant').length;
  };

  const isQualityCheckDue = () => {
    const lastCheck = qualityChecks[0];
    if (!lastCheck?.nextCheckDate) return false;
    return new Date(lastCheck.nextCheckDate) <= new Date();
  };

  const isQualityCheckDueSoon = (days: number = 30) => {
    const lastCheck = qualityChecks[0];
    if (!lastCheck?.nextCheckDate) return false;
    const nextCheck = new Date(lastCheck.nextCheckDate);
    const now = new Date();
    const diffTime = nextCheck.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= days && diffDays > 0;
  };

  const getQualityTrend = () => {
    if (qualityChecks.length < 2) return 'stable';
    const recent = qualityChecks[0].score;
    const previous = qualityChecks[1].score;
    if (recent > previous) return 'improving';
    if (recent < previous) return 'declining';
    return 'stable';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Quality Management</h2>
          <p className="text-gray-600">Monitor quality control, certifications, and compliance</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={getGradeColor(spare.quality?.qualityGrade || 'A')}>
            GRADE {spare.quality?.qualityGrade || 'A'}
          </Badge>
          {spare.quality?.qualityCheckRequired && (
            <Badge className="text-blue-600 bg-blue-100">INSPECTION REQUIRED</Badge>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Eye },
            { id: 'inspections', label: 'Inspections', icon: TestTube },
            { id: 'certifications', label: 'Certifications', icon: Award },
            { id: 'compliance', label: 'Compliance', icon: Shield },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Quality Score</p>
                <p className="text-2xl font-bold text-gray-900">{getQualityScore()}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
            <div className="mt-2">
              <Badge className={getGradeColor(spare.quality?.qualityGrade || 'A')}>
                GRADE {spare.quality?.qualityGrade || 'A'}
              </Badge>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Next Inspection</p>
                <p className="text-2xl font-bold text-gray-900">
                  {qualityChecks[0]?.nextCheckDate ? 
                    new Date(qualityChecks[0].nextCheckDate).toLocaleDateString() : 
                    'Not Scheduled'
                  }
                </p>
              </div>
              <TestTube className="w-8 h-8 text-blue-500" />
            </div>
            {qualityChecks[0]?.nextCheckDate && (
              <div className="mt-2">
                {isQualityCheckDue() ? (
                  <Badge className="text-red-600 bg-red-100">Due</Badge>
                ) : isQualityCheckDueSoon() ? (
                  <Badge className="text-yellow-600 bg-yellow-100">Due Soon</Badge>
                ) : (
                  <Badge className="text-green-600 bg-green-100">On Track</Badge>
                )}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Certifications</p>
                <p className="text-2xl font-bold text-gray-900">{getActiveCertifications()}</p>
              </div>
              <Award className="w-8 h-8 text-purple-500" />
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Total: {certifications.length}
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Compliance Standards</p>
                <p className="text-2xl font-bold text-gray-900">{getCompliantStandards()}</p>
              </div>
              <Shield className="w-8 h-8 text-orange-500" />
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Total: {complianceStandards.length}
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Inspections Tab */}
      {activeTab === 'inspections' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Quality Inspections</h3>
            {isEditable && (
              <Button onClick={() => setShowCheckForm(true)} className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add Inspection</span>
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {qualityChecks.map((check) => (
              <Card key={check._id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Quality Inspection #{check._id?.slice(-6) || 'N/A'}</h4>
                    <p className="text-sm text-gray-500">
                      {new Date(check.date).toLocaleDateString()} • Inspector: {check.inspector}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(check.status)}>
                      {check.status.toUpperCase()}
                    </Badge>
                    <Badge className={getGradeColor(check.grade)}>
                      GRADE {check.grade}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Quality Score</p>
                    <p className="text-lg font-medium text-gray-900">{check.score}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Parameters Tested</p>
                    <p className="text-lg font-medium text-gray-900">{check.parameters.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Next Check</p>
                    <p className="text-lg font-medium text-gray-900">
                      {check.nextCheckDate ? 
                        new Date(check.nextCheckDate).toLocaleDateString() : 
                        'Not Scheduled'
                      }
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">Test Parameters:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {check.parameters.map((param, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{param.name}</p>
                          <p className="text-sm text-gray-600">{param.value}</p>
                        </div>
                        <Badge className={getParameterStatusColor(param.status)}>
                          {param.status.toUpperCase()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {check.notes && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-900 mb-1">Notes:</p>
                    <p className="text-sm text-gray-600">{check.notes}</p>
                  </div>
                )}

                {isEditable && (
                  <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCheck(check as any);
                        setShowCheckForm(true);
                      }}
                      className="flex items-center space-x-1"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Edit</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (check._id) {
                          deleteCheck(check._id);
                        }
                      }}
                      className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Certifications Tab */}
      {activeTab === 'certifications' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Certifications & Standards</h3>
            {isEditable && (
              <Button onClick={() => setShowCertificationForm(true)} className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add Certification</span>
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {certifications.map((cert) => (
              <Card key={cert._id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900">{cert.name}</h4>
                    <p className="text-sm text-gray-500">{cert.issuingAuthority}</p>
                  </div>
                  <Badge className={getStatusColor(cert.status)}>
                    {cert.status.toUpperCase()}
                  </Badge>
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Certificate Number</p>
                    <p className="text-sm font-medium text-gray-900">{cert.certificateNumber}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Issue Date</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(cert.issueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Expiry Date</p>
                      <p className="text-sm font-medium text-gray-900">
                        {cert.expiryDate ? 
                          new Date(cert.expiryDate).toLocaleDateString() : 
                          'No Expiry'
                        }
                      </p>
                    </div>
                  </div>

                  {cert.expiryDate && (
                    <div>
                      {new Date(cert.expiryDate) < new Date() ? (
                        <Badge className="text-red-600 bg-red-100">Expired</Badge>
                      ) : new Date(cert.expiryDate) <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) ? (
                        <Badge className="text-yellow-600 bg-yellow-100">Expiring Soon</Badge>
                      ) : (
                        <Badge className="text-green-600 bg-green-100">Valid</Badge>
                      )}
                    </div>
                  )}
                </div>

                {cert.documentUrl && (
                  <div className="mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(cert.documentUrl, '_blank')}
                      className="flex items-center space-x-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>View Certificate</span>
                    </Button>
                  </div>
                )}

                {isEditable && (
                  <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCertification(cert as any);
                        setShowCertificationForm(true);
                      }}
                      className="flex items-center space-x-1"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Edit</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (cert._id) {
                          deleteCertification(cert._id);
                        }
                      }}
                      className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Compliance Tab */}
      {activeTab === 'compliance' && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Compliance Standards</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {complianceStandards.map((standard) => (
              <Card key={standard._id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900">{standard.name}</h4>
                    <p className="text-sm text-gray-500">{standard.code}</p>
                  </div>
                  <Badge className={getStatusColor(standard.status)}>
                    {standard.status.toUpperCase()}
                  </Badge>
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Description</p>
                    <p className="text-sm text-gray-900">{standard.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Last Audit</p>
                      <p className="text-sm font-medium text-gray-900">
                        {standard.lastAuditDate ? 
                          new Date(standard.lastAuditDate).toLocaleDateString() : 
                          'Not Audited'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Next Audit</p>
                      <p className="text-sm font-medium text-gray-900">
                        {standard.nextAuditDate ? 
                          new Date(standard.nextAuditDate).toLocaleDateString() : 
                          'Not Scheduled'
                        }
                      </p>
                    </div>
                  </div>

                  {standard.nextAuditDate && (
                    <div>
                      {new Date(standard.nextAuditDate) < new Date() ? (
                        <Badge className="text-red-600 bg-red-100">Audit Overdue</Badge>
                      ) : new Date(standard.nextAuditDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? (
                        <Badge className="text-yellow-600 bg-yellow-100">Audit Due Soon</Badge>
                      ) : (
                        <Badge className="text-green-600 bg-green-100">Compliant</Badge>
                      )}
                    </div>
                  )}
                </div>

                {standard.auditNotes && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-900 mb-1">Audit Notes:</p>
                    <p className="text-sm text-gray-600">{standard.auditNotes}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Quality Analytics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h4 className="font-medium text-gray-900 mb-4">Quality Score Trend</h4>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Current Average Score</p>
                  <p className="text-2xl font-bold text-gray-900">{getQualityScore()}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Quality Trend</p>
                  <Badge className={
                    getQualityTrend() === 'improving' ? 'text-green-600 bg-green-100' :
                    getQualityTrend() === 'declining' ? 'text-red-600 bg-red-100' :
                    'text-yellow-600 bg-yellow-100'
                  }>
                    {getQualityTrend().toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Inspections</p>
                  <p className="text-lg font-medium text-gray-900">{qualityChecks.length}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h4 className="font-medium text-gray-900 mb-4">Grade Distribution</h4>
              <div className="space-y-3">
                {['A+', 'A', 'B+', 'B', 'C', 'Reject'].map((grade) => {
                  const count = qualityChecks.filter(check => check.grade === grade).length;
                  const percentage = qualityChecks.length > 0 ? 
                    Math.round((count / qualityChecks.length) * 100) : 0;
                  
                  return (
                    <div key={grade} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Grade {grade}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h4 className="font-medium text-gray-900 mb-4">Certification Status</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{getActiveCertifications()}</p>
                <p className="text-sm text-gray-600">Active</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {certifications.filter(c => c.status === 'pending').length}
                </p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {certifications.filter(c => c.status === 'expired').length}
                </p>
                <p className="text-sm text-gray-600">Expired</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h4 className="font-medium text-gray-900 mb-4">Compliance Overview</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{getCompliantStandards()}</p>
                <p className="text-sm text-gray-600">Compliant</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {complianceStandards.filter(s => s.status === 'pending').length}
                </p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {complianceStandards.filter(s => s.status === 'non-compliant').length}
                </p>
                <p className="text-sm text-gray-600">Non-Compliant</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Quality Settings</h3>
          
          <Card className="p-6">
            <h4 className="font-medium text-gray-900 mb-4">Quality Control Settings</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Quality Grade
                </label>
                <select
                  value={spare.quality?.qualityGrade || 'A'}
                  onChange={(e) => onUpdate({
                    quality: {
                      ...spare.quality,
                      qualityGrade: e.target.value as 'A+' | 'A' | 'B+' | 'B' | 'C'
                    }
                  })}
                  disabled={!isEditable}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="A+">A+</option>
                  <option value="A">A</option>
                  <option value="B+">B+</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="qualityCheckRequired"
                  checked={spare.quality?.qualityCheckRequired || false}
                  onChange={(e) => onUpdate({
                    quality: {
                      ...spare.quality,
                      qualityCheckRequired: e.target.checked
                    }
                  })}
                  disabled={!isEditable}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="qualityCheckRequired" className="ml-2 text-sm text-gray-700">
                  Quality check required before use
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quality Parameters
                </label>
                <textarea
                  value={spare.quality?.qualityParameters?.join(', ') || ''}
                  onChange={(e) => onUpdate({
                    quality: {
                      ...spare.quality,
                      qualityParameters: e.target.value.split(',').map(p => p.trim()).filter(Boolean)
                    }
                  })}
                  disabled={!isEditable}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Enter quality parameters separated by commas"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quality Notes
                </label>
                <textarea
                  value={spare.quality?.qualityNotes || ''}
                  onChange={(e) => onUpdate({
                    quality: {
                      ...spare.quality,
                      qualityNotes: e.target.value
                    }
                  })}
                  disabled={!isEditable}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Enter quality notes"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certifications
                </label>
                <textarea
                  value={spare.quality?.certifications?.join(', ') || ''}
                  onChange={(e) => onUpdate({
                    quality: {
                      ...spare.quality,
                      certifications: e.target.value.split(',').map(c => c.trim()).filter(Boolean)
                    }
                  })}
                  disabled={!isEditable}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Enter certifications separated by commas"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compliance Standards
                </label>
                <textarea
                  value={spare.quality?.complianceStandards?.join(', ') || ''}
                  onChange={(e) => onUpdate({
                    quality: {
                      ...spare.quality,
                      complianceStandards: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    }
                  })}
                  disabled={!isEditable}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Enter compliance standards separated by commas"
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Quality Check Form Modal */}
      {showCheckForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {selectedCheck ? 'Edit' : 'Add'} Quality Inspection
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inspection Date
                  </label>
                  <Input type="date" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inspector
                  </label>
                  <Input placeholder="Enter inspector name" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quality Grade
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="A+">A+</option>
                    <option value="A">A</option>
                    <option value="B+">B+</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="Reject">Reject</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quality Score (%)
                  </label>
                  <Input type="number" placeholder="Enter score" min="0" max="100" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Enter inspection notes"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Next Check Date
                </label>
                <Input type="date" />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCheckForm(false);
                  setSelectedCheck(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={() => {
                // TODO: Add form data collection and API call
                const formData = {
                  spareId: spare._id,
                  date: new Date().toISOString(),
                  inspector: 'Current User', // TODO: Get from auth
                  grade: 'A' as const,
                  score: 95,
                  parameters: [],
                  status: 'completed' as const,
                  notes: 'Quality check completed'
                };
                
                if (selectedCheck) {
                  updateCheck({ id: selectedCheck._id || '', data: formData });
                } else {
                  createCheck(formData);
                }
                
                setShowCheckForm(false);
                setSelectedCheck(null);
              }}>
                {selectedCheck ? 'Update' : 'Create'} Inspection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Certification Form Modal */}
      {showCertificationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {selectedCertification ? 'Edit' : 'Add'} Certification
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certification Name
                </label>
                <Input placeholder="Enter certification name" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issuing Authority
                </label>
                <Input placeholder="Enter issuing authority" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Issue Date
                  </label>
                  <Input type="date" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry Date
                  </label>
                  <Input type="date" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certificate Number
                </label>
                <Input placeholder="Enter certificate number" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="expired">Expired</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Enter certification notes"
                ></textarea>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCertificationForm(false);
                  setSelectedCertification(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={() => {
                // TODO: Add form data collection and API call
                const formData = {
                  spareId: spare._id,
                  name: 'ISO 9001 Certification',
                  issuingAuthority: 'ISO',
                  issueDate: new Date().toISOString(),
                  certificateNumber: 'CERT-001',
                  status: 'active' as const,
                  notes: 'Certification created'
                };
                
                if (selectedCertification) {
                  updateCertification({ id: selectedCertification._id || '', data: formData });
                } else {
                  createCertification(formData);
                }
                
                setShowCertificationForm(false);
                setSelectedCertification(null);
              }}>
                {selectedCertification ? 'Update' : 'Create'} Certification
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
