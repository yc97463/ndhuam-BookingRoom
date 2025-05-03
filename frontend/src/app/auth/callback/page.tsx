"use client";

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            localStorage.setItem('adminToken', token);
            router.push('/review');
        } else {
            router.push('/auth/login');
        }
    }, [router, searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <p className="text-lg">驗證成功，正在重新導向...</p>
            </div>
        </div>
    );
}

export default function CallbackPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="mx-auto mb-4 animate-spin text-blue-500" size={64} />
                        <p className="text-lg">載入中...</p>
                    </div>
                </div>
            }
        >
            <CallbackContent />
        </Suspense>
    );
}
