import React from 'react';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import { Step } from '../types';

interface StepsListProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (stepId: number) => void;
  loading?: boolean;
}

export function StepsList({ steps, currentStep, onStepClick, loading }: StepsListProps) {
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
          Build Steps
        </h2>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="p-3 space-y-2">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm text-gray-500">Generating steps...</p>
            </div>
          ) : steps.length === 0 ? (
            <div className="text-center py-8">
              <Circle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No steps available</p>
            </div>
          ) : (
            steps.map((step) => (
              <div
                key={step.id}
                className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                  currentStep === step.id
                    ? 'bg-purple-50 border-purple-200 shadow-sm'
                    : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
                onClick={() => onStepClick(step.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {step.status === 'completed' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : step.status === 'in-progress' ? (
                      <Clock className="w-4 h-4 text-blue-500" />
                    ) : (
                      <Circle className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 leading-tight">
                      {step.title}
                    </h3>
                    {step.description && (
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed line-clamp-2">
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}