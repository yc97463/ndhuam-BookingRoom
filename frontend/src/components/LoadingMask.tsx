"use client";

import React from 'react';
interface LoadingMaskProps {
    loading: boolean;
}

export default function LoadingMask({ loading }: LoadingMaskProps) {
    if (!loading) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-white/30 z-10 backdrop-blur-sm backdrop-filter">
            <div className="bg-white/80 p-4 rounded-lg shadow-lg text-center">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-2 text-gray-700 font-medium">載入中...</p>
            </div>
        </div>
    );
}