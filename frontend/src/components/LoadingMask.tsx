"use client";

import React from "react";
import { LoadingMaskProps } from "@/types";

export default function LoadingMask({ loading }: LoadingMaskProps) {
    if (!loading) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-3 text-gray-700 font-medium">載入中...</p>
            </div>
        </div>
    );
}