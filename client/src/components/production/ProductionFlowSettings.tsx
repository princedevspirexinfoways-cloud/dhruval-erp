'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Settings, 
  Save, 
  RefreshCw,
  Bell,
  Clock,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

export function ProductionFlowSettings() {
  const [settings, setSettings] = useState({
    // Notification Settings
    notifications: {
      stageCompletion: true,
      qualityAlerts: true,
      delayAlerts: true,
      emailNotifications: false,
      smsNotifications: false
    },
    // Production Settings
    production: {
      autoAdvanceStages: false,
      qualityCheckRequired: true,
      defaultQualityGrade: 'B',
      maxDefectRate: 5,
      autoHoldOnDefects: false
    },
    // Timing Settings
    timing: {
      defaultStageDuration: 120, // minutes
      bufferTime: 30, // minutes
      overtimeThreshold: 2, // hours
      weekendProduction: false
    },
    // Quality Settings
    quality: {
      inspectionRequired: true,
      photoRequired: true,
      notesRequired: false,
      autoRejectThreshold: 10 // percentage
    }
  });

  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Save settings logic here
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Settings saved:', settings);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    // Reset to default settings
    setSettings({
      notifications: {
        stageCompletion: true,
        qualityAlerts: true,
        delayAlerts: true,
        emailNotifications: false,
        smsNotifications: false
      },
      production: {
        autoAdvanceStages: false,
        qualityCheckRequired: true,
        defaultQualityGrade: 'B',
        maxDefectRate: 5,
        autoHoldOnDefects: false
      },
      timing: {
        defaultStageDuration: 120,
        bufferTime: 30,
        overtimeThreshold: 2,
        weekendProduction: false
      },
      quality: {
        inspectionRequired: true,
        photoRequired: true,
        notesRequired: false,
        autoRejectThreshold: 10
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Production Flow Settings</h2>
          <p className="text-gray-600">Configure production flow parameters and notifications</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="stageCompletion">Stage Completion Notifications</Label>
              <Switch
                id="stageCompletion"
                checked={settings.notifications.stageCompletion}
                onCheckedChange={(checked) =>
                  setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, stageCompletion: checked }
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="qualityAlerts">Quality Alerts</Label>
              <Switch
                id="qualityAlerts"
                checked={settings.notifications.qualityAlerts}
                onCheckedChange={(checked) =>
                  setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, qualityAlerts: checked }
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="delayAlerts">Delay Alerts</Label>
              <Switch
                id="delayAlerts"
                checked={settings.notifications.delayAlerts}
                onCheckedChange={(checked) =>
                  setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, delayAlerts: checked }
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="emailNotifications">Email Notifications</Label>
              <Switch
                id="emailNotifications"
                checked={settings.notifications.emailNotifications}
                onCheckedChange={(checked) =>
                  setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, emailNotifications: checked }
                  }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Production Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Production Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="autoAdvanceStages">Auto Advance Stages</Label>
              <Switch
                id="autoAdvanceStages"
                checked={settings.production.autoAdvanceStages}
                onCheckedChange={(checked) =>
                  setSettings(prev => ({
                    ...prev,
                    production: { ...prev.production, autoAdvanceStages: checked }
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="qualityCheckRequired">Quality Check Required</Label>
              <Switch
                id="qualityCheckRequired"
                checked={settings.production.qualityCheckRequired}
                onCheckedChange={(checked) =>
                  setSettings(prev => ({
                    ...prev,
                    production: { ...prev.production, qualityCheckRequired: checked }
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultQualityGrade">Default Quality Grade</Label>
              <Select
                value={settings.production.defaultQualityGrade}
                onValueChange={(value) =>
                  setSettings(prev => ({
                    ...prev,
                    production: { ...prev.production, defaultQualityGrade: value }
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                  <SelectItem value="A" className="bg-white hover:bg-gray-50">A - Excellent</SelectItem>
                  <SelectItem value="B" className="bg-white hover:bg-gray-50">B - Good</SelectItem>
                  <SelectItem value="C" className="bg-white hover:bg-gray-50">C - Fair</SelectItem>
                  <SelectItem value="D" className="bg-white hover:bg-gray-50">D - Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxDefectRate">Max Defect Rate (%)</Label>
              <Input
                id="maxDefectRate"
                type="number"
                value={settings.production.maxDefectRate}
                onChange={(e) =>
                  setSettings(prev => ({
                    ...prev,
                    production: { ...prev.production, maxDefectRate: parseInt(e.target.value) }
                  }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timing Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timing Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="defaultStageDuration">Default Stage Duration (minutes)</Label>
              <Input
                id="defaultStageDuration"
                type="number"
                value={settings.timing.defaultStageDuration}
                onChange={(e) =>
                  setSettings(prev => ({
                    ...prev,
                    timing: { ...prev.timing, defaultStageDuration: parseInt(e.target.value) }
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bufferTime">Buffer Time (minutes)</Label>
              <Input
                id="bufferTime"
                type="number"
                value={settings.timing.bufferTime}
                onChange={(e) =>
                  setSettings(prev => ({
                    ...prev,
                    timing: { ...prev.timing, bufferTime: parseInt(e.target.value) }
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="overtimeThreshold">Overtime Threshold (hours)</Label>
              <Input
                id="overtimeThreshold"
                type="number"
                value={settings.timing.overtimeThreshold}
                onChange={(e) =>
                  setSettings(prev => ({
                    ...prev,
                    timing: { ...prev.timing, overtimeThreshold: parseInt(e.target.value) }
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="weekendProduction">Weekend Production</Label>
              <Switch
                id="weekendProduction"
                checked={settings.timing.weekendProduction}
                onCheckedChange={(checked) =>
                  setSettings(prev => ({
                    ...prev,
                    timing: { ...prev.timing, weekendProduction: checked }
                  }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quality Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Quality Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="inspectionRequired">Inspection Required</Label>
              <Switch
                id="inspectionRequired"
                checked={settings.quality.inspectionRequired}
                onCheckedChange={(checked) =>
                  setSettings(prev => ({
                    ...prev,
                    quality: { ...prev.quality, inspectionRequired: checked }
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="photoRequired">Photo Required</Label>
              <Switch
                id="photoRequired"
                checked={settings.quality.photoRequired}
                onCheckedChange={(checked) =>
                  setSettings(prev => ({
                    ...prev,
                    quality: { ...prev.quality, photoRequired: checked }
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="notesRequired">Notes Required</Label>
              <Switch
                id="notesRequired"
                checked={settings.quality.notesRequired}
                onCheckedChange={(checked) =>
                  setSettings(prev => ({
                    ...prev,
                    quality: { ...prev.quality, notesRequired: checked }
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="autoRejectThreshold">Auto Reject Threshold (%)</Label>
              <Input
                id="autoRejectThreshold"
                type="number"
                value={settings.quality.autoRejectThreshold}
                onChange={(e) =>
                  setSettings(prev => ({
                    ...prev,
                    quality: { ...prev.quality, autoRejectThreshold: parseInt(e.target.value) }
                  }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ProductionFlowSettings;
