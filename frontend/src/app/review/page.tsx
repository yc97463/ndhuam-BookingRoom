"use client";

import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

const API_URL = `/api`;

interface RequestedSlot {
    id: number;
    application_id: number;
    room_id: string;
    date: string;
    start_time: string;
    end_time: string;
}

interface Application {
    id: number;
    name: string;
    email: string;
    organization: string;
    phone: string;
    purpose: string;
    room_id: string;
    submitted_at: string;
    status: 'pending' | 'approved' | 'rejected';
    requested_slots: RequestedSlot[];
}

function ReviewContent() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [applications, setApplications] = useState<Application[]>([]);

    useEffect(() => {
        const adminToken = localStorage.getItem('adminToken');
        if (!adminToken) {
            router.push('/auth/login');
            return;
        }

        fetch(`${API_URL}/applications`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        })
            .then(res => {
                if (res.status === 401) {
                    throw new Error('Unauthorized');
                }
                if (!res.ok) {
                    throw new Error('API Error');
                }
                return res.json();
            })
            .then(data => {
                setApplications(data);
                setIsLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setIsLoading(false);
                if (err.message === 'Unauthorized') {
                    localStorage.removeItem('adminToken');
                    router.push('/auth/login');
                }
            });
    }, [router]);

    const handleApprove = async (id: string) => {
        // Implement approval logic
    };

    const handleReject = async (id: string) => {
        // Implement rejection logic
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-red-500">Error: {error}</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">空間申請審核列表</h1>
            <div className="grid gap-4">
                {applications.map(app => (
                    <div key={app.id} className="border rounded-lg p-4 shadow bg-white">
                        <div className="flex justify-between items-start mb-4">
                            <div className="space-y-2">
                                <h2 className="text-lg font-semibold">申請人: {app.name}</h2>
                                <p className="text-gray-600">Email: {app.email}</p>
                                <p className="text-gray-600">單位: {app.organization}</p>
                                <p className="text-gray-600">聯絡電話: {app.phone}</p>
                                <p className="text-gray-600">用途: {app.purpose}</p>
                                <div className="mt-4">
                                    <h3 className="font-medium mb-2">申請時段：</h3>
                                    <div className="space-y-1">
                                        {app.requested_slots.map((slot, index) => (
                                            <p key={index} className="text-gray-600">
                                                {slot.date} {slot.start_time}-{slot.end_time} (房間: {slot.room_id})
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    // onClick={() => handleApprove(app.id)}
                                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                >
                                    同意
                                </button>
                                <button
                                    // onClick={() => handleReject(app.id)}
                                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                                >
                                    拒絕
                                </button>
                            </div>
                        </div>
                        <div className="text-sm text-gray-500">
                            申請時間: {new Date(app.submitted_at).toLocaleString()}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function ReviewPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ReviewContent />
        </Suspense>
    );
}
