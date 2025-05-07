"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Loader2, LogIn } from 'lucide-react';

const API_URL = `/api`;

// Add custom animation styles
const fadeAnimation = {
    animation: 'fade 2s ease-in-out infinite',
    '@keyframes fade': {
        '0%, 100%': { opacity: 0.4 },
        '50%': { opacity: 1 }
    }
};

function VerifyContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [adminInfo, setAdminInfo] = useState<{ name: string } | null>(null);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return '早安';
        if (hour < 18) return '午安';
        return '晚安';
    };

    useEffect(() => {
        if (!token) return;

        fetch(`${API_URL}/auth/verify?token=${token}`)
            .then(response => response.json())
            .then(data => {
                if (data.success && data.token) {
                    localStorage.setItem('adminToken', data.token);
                    setIsSuccess(true);

                    // Fetch admin profile
                    fetch(`${API_URL}/auth/profile`, {
                        headers: {
                            'Authorization': `Bearer ${data.token}`
                        }
                    })
                        .then(response => response.json())
                        .then(profileData => {
                            if (profileData.success) {
                                setAdminInfo(profileData.data);
                            }
                        })
                        .catch(error => {
                            console.error('Profile fetch error:', error);
                        });

                    // Wait for 2 seconds before redirecting
                    setTimeout(() => {
                        router.push('/review');
                    }, 2000);
                } else {
                    setError(data.error || 'Verification failed');
                }
            })
            .catch(error => {
                console.error('Verification error:', error);
                setError('An error occurred during verification. Please try again.');
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

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-4">
                <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full text-center">
                    <AlertTriangle className="mx-auto mb-4 text-red-500" size={64} />
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Verification Failed</h2>
                    <p className="text-gray-700 mb-6">{error}</p>
                    <button
                        onClick={() => router.push('/auth/login')}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                        <LogIn className="mr-2" size={20} />
                        Return to Login
                    </button>
                </div>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-green-50 p-4">
                <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full text-center">
                    <div className="mx-auto mb-6 text-green-500">
                        <CheckCircle className="mx-auto mb-4 text-green-500" size={64} />
                    </div>
                    <h2 className="text-2xl font-bold text-green-600 mb-2">驗證成功</h2>
                    {adminInfo && (
                        <div className="mb-6">
                            <h3 className="text-3xl font-bold text-gray-800 mb-2">
                                {getGreeting()}，{adminInfo.name}
                            </h3>
                            <p className="text-xl text-gray-600">歡迎回來～</p>
                        </div>
                    )}
                    <p className="text-gray-500 text-sm animate-pulse">
                        即將為您導向至審核頁面...
                    </p>
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
