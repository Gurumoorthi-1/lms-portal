'use client';
import React from 'react';
import { motion } from 'framer-motion';

export default function Skeleton({ className, width, height, rounded = 'rounded-lg' }) {
  return (
    <div 
      className={`relative overflow-hidden bg-gray-200 ${rounded} ${className}`}
      style={{ width: width || '100%', height: height || '20px' }}
    >
      <motion.div
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: "linear",
        }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
      />
    </div>
  );
}
