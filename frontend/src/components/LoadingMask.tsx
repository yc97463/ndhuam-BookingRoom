"use client";

import { LoadingMaskProps } from "@/types";

export default function LoadingMask({ loading }: LoadingMaskProps) {
    if (!loading) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded shadow-lg">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-2 text-center">載入中...</p>
            </div>
        </div>
    );
}
