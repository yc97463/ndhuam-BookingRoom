"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

const API_URL = `/api`;

function VerifyContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    useEffect(() => {
        if (!token) return;

        fetch(`${API_URL}/auth/verify?token=${token}`)
            .then(response => response.json())
            .then(data => {
                if (data.success && data.token) {
                    localStorage.setItem('adminToken', data.token);
                    router.push('/review');
                } else {
                    throw new Error(data.error || 'Verification failed');
                }
            })
            .catch(error => {
                console.error('Verification error:', error);
                // You might want to set some error state here to show to the user
            });
    }, [token, router]);

    if (!token) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-4">
                <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full text-center">
                    <AlertTriangle className="mx-auto mb-4 text-red-500" size={64} />
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Invalid Request</h2>
                    <p className="text-gray-700">No verification token provided.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="text-center">
                <Loader2 className="mx-auto mb-4 animate-spin text-blue-500" size={64} />
                <p className="text-xl text-gray-700">Verifying your request...</p>
            </div>
        </div>
    );
}

export default function VerifyPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-center">
                    <Loader2 className="mx-auto mb-4 animate-spin text-blue-500" size={64} />
                    <p className="text-xl text-gray-700">Loading verification page...</p>
                </div>
            </div>
        }>
            <VerifyContent />
        </Suspense>
    );
}
