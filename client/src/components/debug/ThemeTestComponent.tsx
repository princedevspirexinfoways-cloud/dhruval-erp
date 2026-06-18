'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { selectTheme } from '@/lib/features/ui/uiSlice';

export const ThemeTestComponent = () => {
  const theme = useSelector(selectTheme);
  
  return (
    <div className={`p-4 rounded-lg transition-theme ${
      theme === 'dark' 
        ? 'bg-gray-800 text-gray-100' 
        : 'bg-white text-gray-900'
    }`}>
      <h2 className="text-xl font-bold mb-2">Theme Test</h2>
      <p>Current theme: <span className="font-semibold">{theme}</span></p>
      <div className={`mt-4 p-2 rounded ${
        theme === 'dark' 
          ? 'bg-gray-700 text-gray-200' 
          : 'bg-gray-100 text-gray-800'
      }`}>
        This component should change colors when the theme switches.
      </div>
    </div>
  );
};

