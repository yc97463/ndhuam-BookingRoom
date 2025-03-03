"use client";

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import useSWR from 'swr';
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

const API_URL = `https://ndhuam-bookingroom-proxy.deershark-tech.workers.dev/`;

const fetcher = (url: string) => fetch(url).then(res => res.json());

function VerifyContent() {
    const searchParams = useSearchParams();
    const groupId = searchParams.get('groupId');
    const token = searchParams.get('token');
    const isApproved = searchParams.get('isApproved') || 'false';

    const { data, error } = useSWR(
        token ? `${API_URL}?action=reviewBooking&groupId=${groupId}&token=${token}&isApproved=${isApproved}` : null,
        fetcher,
        {
            dedupingInterval: 0,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            shouldRetryOnError: false
        }
    );

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-4">
                <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full text-center">
                    <AlertTriangle className="mx-auto mb-4 text-red-500" size={64} />
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Verification Error</h2>
                    <p className="text-gray-700">Failed to verify. Please check your verification link or try again later.</p>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-center">
                    <Loader2 className="mx-auto mb-4 animate-spin text-blue-500" size={64} />
                    <p className="text-xl text-gray-700">Verifying your request...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex items-center justify-center min-h-screen ${data.success ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="bg-white shadow-lg rounded-lg p-8 max-w-xl w-full text-center">
                {data.success ? (
                    <CheckCircle2 className="mx-auto mb-4 text-green-500" size={64} />
                ) : (
                    <AlertTriangle className="mx-auto mb-4 text-red-500" size={64} />
                )}

                <h2 className={`text-2xl font-bold mb-4 ${data.success ? 'text-green-600' : 'text-red-600'}`}>
                    {data.success ? 'Verification Successful' : 'Verification Failed'}
                </h2>

                {groupId && (
                    <div className="mb-4 bg-gray-100 rounded p-3">
                        <p className="text-gray-700 break-all">
                            <span className="font-semibold">Group ID:</span> {groupId}
                        </p>
                    </div>
                )}

                {token && (
                    <div className="mb-4 bg-gray-100 rounded p-3">
                        <p className="text-gray-700 break-all">
                            <span className="font-semibold">Admin Token:</span> {token}
                        </p>
                    </div>
                )}

                <p className={`text-lg ${data.success ? 'text-green-700' : 'text-red-700'}`}>
                    {data.success ? data.message : data.error}
                </p>
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
