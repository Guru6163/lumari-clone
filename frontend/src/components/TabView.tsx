import React from 'react';
import { Code2, Eye } from 'lucide-react';

interface TabViewProps {
  activeTab: 'code' | 'preview';
  onTabChange: (tab: 'code' | 'preview') => void;
}

export function TabView({ activeTab, onTabChange }: TabViewProps) {
  return (
    <div className="flex-shrink-0 border-b border-gray-200 bg-white">
      <div className="flex">
        <button
          onClick={() => onTabChange('code')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${
            activeTab === 'code'
              ? 'text-gray-900 border-purple-500 bg-purple-50'
              : 'text-gray-500 hover:text-gray-700 border-transparent hover:bg-gray-50'
          }`}
        >
          <Code2 className="w-4 h-4" />
          Code
        </button>
        <button
          onClick={() => onTabChange('preview')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${
            activeTab === 'preview'
              ? 'text-gray-900 border-purple-500 bg-purple-50'
              : 'text-gray-500 hover:text-gray-700 border-transparent hover:bg-gray-50'
          }`}
        >
          <Eye className="w-4 h-4" />
          Preview
        </button>
      </div>
    </div>
  );
}