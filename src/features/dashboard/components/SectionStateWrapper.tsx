import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export interface SectionStateWrapperProps {
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
  children: React.ReactNode;
  skeletonHeight?: string;
}

export const SectionStateWrapper: React.FC<SectionStateWrapperProps> = ({
  isLoading,
  error,
  onRetry,
  children,
  skeletonHeight = 'h-64',
}) => {
  if (isLoading) {
    return (
      <div className={`w-full ${skeletonHeight} bg-white rounded-2xl border border-[#E6E1D8] p-6 flex flex-col justify-between animate-pulse shadow-2xs`}>
        <div className="flex items-center justify-between">
          <div className="h-5 bg-stone-200 rounded-md w-1/4" />
          <div className="h-8 bg-stone-100 rounded-lg w-28" />
        </div>
        <div className="space-y-3 my-4">
          <div className="h-10 bg-stone-100 rounded-lg w-full" />
          <div className="h-16 bg-stone-50 rounded-lg w-full" />
        </div>
        <div className="h-4 bg-stone-100 rounded-md w-1/3" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`w-full ${skeletonHeight} bg-white rounded-2xl border border-rose-200 p-6 flex flex-col items-center justify-center text-center shadow-2xs`}>
        <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
          <AlertCircle className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-semibold text-stone-900 mb-1">
          Không thể tải dữ liệu
        </h4>
        <p className="text-xs text-rose-600 max-w-md mb-4">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-700 bg-white border border-stone-300 hover:bg-stone-50 transition-colors cursor-pointer shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Thử lại
          </button>
        )}
      </div>
    );
  }

  return <>{children}</>;
};
