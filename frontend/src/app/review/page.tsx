"use client";

import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';

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
    status: 'pending' | 'confirmed' | 'rejected';
    requested_slots: RequestedSlot[];
}

function ApplicationModal({ application, onClose, onReview }: {
    application: Application | null,
    onClose: () => void,
    onReview: (id: number, status: 'confirmed' | 'rejected', note: string) => Promise<void>
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [note,] = useState(''); // setNote is not used

    const handleReview = async (status: 'confirmed' | 'rejected') => {
        if (!application) return;
        setIsSubmitting(true);
        try {
            await onReview(application.id, status, note);
            onClose();
        } catch (error) {
            console.error('Review error:', error);
            alert('審核失敗，請稍後再試');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!application) return null;

    return (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 cursor-pointer" onClick={onClose}>
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative cursor-default" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                >
                    <X size={24} />
                </button>
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold">申請詳情</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-gray-500">申請人</label>
                            <p className="font-medium">{application.name}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">Email</label>
                            <p className="font-medium">{application.email}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">單位</label>
                            <p className="font-medium">{application.organization}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">聯絡電話</label>
                            <p className="font-medium">{application.phone}</p>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm text-gray-500">用途</label>
                        <p className="font-medium">{application.purpose}</p>
                    </div>
                    <div>
                        <label className="text-sm text-gray-500">申請時段</label>
                        <div className="mt-2 space-y-2">
                            {application.requested_slots.map((slot, index) => (
                                <div key={index} className="bg-gray-50 p-2 rounded">
                                    {slot.date} {slot.start_time}-{slot.end_time}
                                    <span className="ml-2 text-gray-500">({slot.room_id})</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* <div>
                        <label className="text-sm text-gray-500">審核備註</label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full mt-1 p-2 border rounded"
                            placeholder="可選填審核意見"
                            rows={3}
                        />
                    </div> */}
                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={() => handleReview('rejected')}
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                        >
                            {isSubmitting ? '處理中...' : '拒絕'}
                        </button>
                        <button
                            onClick={() => handleReview('confirmed')}
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                        >
                            {isSubmitting ? '處理中...' : '同意'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ReviewContent() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [applications, setApplications] = useState<Application[]>([]);
    const [filter, setFilter] = useState<'pending' | 'reviewed'>('pending');
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);

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

    const handleReview = async (id: number, status: 'confirmed' | 'rejected', note: string) => {
        const adminToken = localStorage.getItem('adminToken');
        if (!adminToken) {
            router.push('/auth/login');
            return;
        }

        const response = await fetch(`${API_URL}/admin/review`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                applicationId: id,
                status,
                note
            })
        });

        if (!response.ok) {
            throw new Error('Review failed');
        }

        // 更新本地狀態
        setApplications(apps =>
            apps.map(app =>
                app.id === id
                    ? { ...app, status }
                    : app
            )
        );
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

    const filteredApplications = applications.filter(app => {
        if (filter === 'pending') return app.status === 'pending';
        return app.status === 'confirmed' || app.status === 'rejected';
    });

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">空間申請審核列表</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-4 py-2 rounded-full cursor-pointer ${filter === 'pending'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700'
                            }`}
                    >
                        待審核
                    </button>
                    <button
                        onClick={() => setFilter('reviewed')}
                        className={`px-4 py-2 rounded-full cursor-pointer ${filter === 'reviewed'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700'
                            }`}
                    >
                        已處理
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {filteredApplications.map(app => (
                    <div
                        key={app.id}
                        onClick={() => setSelectedApp(app)}
                        className="flex justify-between items-center p-4 bg-white rounded-lg shadow hover:shadow-md cursor-pointer"
                    >
                        <div>
                            <h3 className="font-medium">{app.name}</h3>
                            <p className="text-sm text-gray-500">{app.organization}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">
                                {new Date(app.submitted_at).toLocaleDateString()}
                            </p>
                            <p className={`text-sm ${app.status === 'pending' ? 'text-yellow-500' :
                                app.status === 'confirmed' ? 'text-green-500' :
                                    'text-red-500'
                                }`}>
                                {app.status === 'pending' ? '待審核' :
                                    app.status === 'confirmed' ? '已同意' : '已拒絕'}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <ApplicationModal
                application={selectedApp}
                onClose={() => setSelectedApp(null)}
                onReview={handleReview}
            />
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
