"use client";

// RefreshButton.tsx
import React from 'react';
import { RefreshButtonProps } from '@/types';
import { RefreshCcw } from 'lucide-react';

const RefreshButton = ({ onRefresh, isLoading, className }: RefreshButtonProps) => {
    return (
        <button
            className={className}
            onClick={onRefresh}
            disabled={isLoading}
        >
            <RefreshCcw size={24} className={`transition-transform ${isLoading ? 'animate-spin' : ''}`} />
        </button>
    );
};

export default RefreshButton;