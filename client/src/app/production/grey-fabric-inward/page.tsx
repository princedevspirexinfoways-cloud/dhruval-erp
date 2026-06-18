'use client';

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import GreyFabricInwardDashboard from '@/components/production/grey-fabric-inward/GreyFabricInwardDashboard';

export default function GreyFabricInwardPage() {
  return (
    <AppLayout>
      <GreyFabricInwardDashboard />
    </AppLayout>
  );
}
