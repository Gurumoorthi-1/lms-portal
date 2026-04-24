'use client';

import React from 'react';

export default function Skeleton({ className = '', variant = 'rect' }) {
  const baseClass = 'bg-slate-200 animate-pulse';
  const variantClass = variant === 'circle' ? 'rounded-full' : 'rounded-xl';
  
  return (
    <div className={`${baseClass} ${variantClass} ${className}`} />
  );
}
