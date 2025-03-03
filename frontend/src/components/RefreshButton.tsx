"use client";

// RefreshButton.tsx
import React from 'react';
import { RefreshButtonProps } from '@/types';
import { RefreshCcw } from 'lucide-react';

const RefreshButton = ({ onRefresh, isLoading }: RefreshButtonProps) => {
    return (
        <button
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 transition-colors cursor-pointer"
            onClick={onRefresh}
            disabled={isLoading}
        >
            <RefreshCcw size={24} className={`transition-transform ${isLoading ? 'animate-spin' : ''}`} />
        </button>
    );
};

export default RefreshButton;