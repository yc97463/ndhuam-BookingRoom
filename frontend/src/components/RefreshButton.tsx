"use client";

// RefreshButton.tsx
import React from 'react';
import { RefreshButtonProps } from '@/types';

const RefreshButton = ({ onRefresh, isLoading }: RefreshButtonProps) => {
    return (
        <button
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
            onClick={onRefresh}
            disabled={isLoading}
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38" />
            </svg>
        </button>
    );
};

export default RefreshButton;