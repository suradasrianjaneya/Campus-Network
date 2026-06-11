import React from 'react';

export const CardSkeleton = () => {
  return (
    <div className="glass-card-premium rounded-2xl p-4 shadow-premium animate-pulse border border-white/10">
      <div className="bg-gradient-to-r from-primary-500/10 to-accent-500/10 h-48 rounded-xl mb-4 w-full"></div>
      <div className="h-4 bg-primary-500/10 rounded w-1/3 mb-2"></div>
      <div className="h-6 bg-primary-500/15 rounded w-3/4 mb-3"></div>
      <div className="h-4 bg-primary-500/10 rounded w-1/2 mb-4"></div>
      <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/5">
        <div className="h-8 bg-primary-500/10 rounded w-20"></div>
        <div className="h-8 bg-accent-500/10 rounded w-16"></div>
      </div>
    </div>
  );
};

export const ListSkeleton = () => {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((n) => (
        <div key={n} className="glass-card-premium rounded-2xl p-5 shadow-premium animate-pulse flex items-start gap-4 border border-white/10">
          <div className="bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-full h-12 w-12 flex-shrink-0"></div>
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-4 bg-primary-500/10 rounded w-1/4"></div>
              <div className="h-3 bg-accent-500/10 rounded w-1/6"></div>
            </div>
            <div className="h-4 bg-primary-500/10 rounded w-full"></div>
            <div className="h-4 bg-primary-500/10 rounded w-5/6"></div>
            <div className="flex gap-4 pt-2">
              <div className="h-4 bg-primary-500/10 rounded w-12"></div>
              <div className="h-4 bg-accent-500/10 rounded w-12"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const DetailSkeleton = () => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-pulse">
      <div className="flex items-center gap-2 mb-6">
        <div className="h-4 bg-primary-500/10 rounded w-16"></div>
        <div className="h-4 bg-accent-500/10 rounded w-24"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-card-premium rounded-2xl h-96 w-full border border-white/10"></div>
        <div className="space-y-4">
          <div className="h-8 bg-primary-500/15 rounded w-3/4"></div>
          <div className="h-4 bg-primary-500/10 rounded w-1/4"></div>
          <div className="h-20 bg-primary-500/10 rounded w-full"></div>
          <div className="h-12 bg-accent-500/10 rounded w-1/3"></div>
          <div className="pt-6 border-t border-white/5 space-y-3">
            <div className="h-6 bg-primary-500/10 rounded w-1/2"></div>
            <div className="h-4 bg-primary-500/10 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
