"use client";

import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Loader2, CheckCheck, Hourglass, Mail, Phone } from 'lucide-react';
import { fetchWithAuth, handleApiResponse } from '@/utils/handleApiResponse';
import ApplicationModal from '@/components/ApplicationModal';

const API_URL = `/api`;

interface RequestedSlot {
    id: number;
    application_id: number;
    room_id: string;
    date: string;
    start_time: string;
    end_time: string;
    status: 'pending' | 'confirmed' | 'rejected';
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

function ReviewContent() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [applications, setApplications] = useState<Application[]>([]);
    const [filter, setFilter] = useState<'pending' | 'reviewed'>('pending');
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);

    useEffect(() => {
        const loadApplications = async () => {
            try {
                const response = await fetchWithAuth(`${API_URL}/applications`);
                const data = await handleApiResponse(response, router);
                setApplications(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setIsLoading(false);
            }
        };

        loadApplications();
    }, [router]);

    const handleReview = async (id: number, slots: { slotId: number; status: 'confirmed' | 'rejected' }[], note: string) => {
        try {
            const response = await fetchWithAuth(`${API_URL}/admin/review`, {
                method: 'POST',
                body: JSON.stringify({ applicationId: id, slots, note })
            });

            await handleApiResponse(response, router);

            // Update local state only after successful API call
            setApplications(apps =>
                apps.map(app =>
                    app.id === id
                        ? {
                            ...app,
                            status: slots.some(s => s.status === 'confirmed') ? 'confirmed' : 'rejected',
                            requested_slots: app.requested_slots.map(slot => ({
                                ...slot,
                                status: slots.find(s => s.slotId === slot.id)?.status || slot.status
                            }))
                        }
                        : app
                )
            );
        } catch (err) {
            console.error('Review error:', err);
            alert('審核失敗，請稍後再試');
        }
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
        <div className="container mx-auto p-4 max-w-5xl">
            <div className="mb-8 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">空間申請審核</h1>
                        <p className="text-gray-500 text-sm mt-1">管理所有的空間預約申請，審核或查看歷史紀錄</p>
                    </div>
                    <div className="bg-gray-50 p-1 rounded-lg border border-gray-200 flex">
                        <button
                            onClick={() => setFilter('pending')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'pending'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-800'
                                }`}
                        >
                            <div className="flex items-center gap-1.5 cursor-pointer">
                                <Hourglass size={14} />
                                <span>待審核</span>
                                {applications.filter(app => app.status === 'pending').length > 0 && (
                                    <span className="flex items-center justify-center h-5 min-w-5 px-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                                        {applications.filter(app => app.status === 'pending').length}
                                    </span>
                                )}
                            </div>
                        </button>
                        <button
                            onClick={() => setFilter('reviewed')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'reviewed'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-800'
                                }`}
                        >
                            <div className="flex items-center gap-1.5 cursor-pointer">
                                <CheckCheck size={14} />
                                <span>已處理</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {filteredApplications.length === 0 && (
                    <div className="bg-white border border-gray-100 rounded-xl p-10 text-center space-y-3 shadow-sm">
                        <div className="w-16 h-16 bg-blue-50 rounded-full mx-auto flex items-center justify-center">
                            <CheckCheck size={28} className="text-blue-500" />
                        </div>
                        <p className="text-lg font-medium text-gray-700">
                            {filter === 'pending' ? '目前沒有待審核的申請' : '還沒有已處理的申請'}
                        </p>
                        <p className="text-gray-500 max-w-md mx-auto">
                            {filter === 'pending'
                                ? '所有的申請都已審核完畢，可以切換到「已處理」查看歷史紀錄。'
                                : '審核完成的申請將會顯示在這裡，方便您查看歷史紀錄。'}
                        </p>
                    </div>
                )}

                {filteredApplications.map(app => (
                    <div
                        key={app.id}
                        onClick={() => setSelectedApp(app)}
                        className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden group"
                    >
                        <div className={`absolute top-0 left-0 w-1 h-full ${app.status === 'pending' ? 'bg-yellow-400' :
                            app.status === 'confirmed' ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>

                        <div className="flex gap-4 ml-2">
                            <div className="shrink-0">
                                <div className="bg-gray-50/80 border border-gray-100 rounded-lg p-3 text-center w-16">
                                    <div className="text-xs text-gray-500 uppercase">申請</div>
                                    <div className="text-xl font-bold text-gray-800">#{app.id}</div>
                                </div>
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-medium text-lg">{app.name}</h3>
                                    <span className="text-sm text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                        {app.organization}
                                    </span>
                                    <span className={`ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                        ${app.status === 'pending'
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : app.status === 'confirmed'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}
                                    >
                                        {app.status === 'pending' ? '待審核' :
                                            app.status === 'confirmed' ? '已同意' : '已拒絕'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-3">
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">借用空間</div>
                                        <div className="flex items-center">
                                            <div className="px-2.5 py-1 bg-blue-50 border border-blue-100 text-blue-700 rounded font-medium text-sm">
                                                {app.room_id}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">聯絡方式</div>
                                        <div className="flex items-center gap-3 text-sm text-gray-600">
                                            <div className="flex items-center gap-1">
                                                <Mail size={14} className="text-gray-400" />
                                                <span>{app.email.split('@')[0]}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Phone size={14} className="text-gray-400" />
                                                <span>{app.phone || '-'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-3">
                                    <div className="text-xs text-gray-500 mb-1">預約日期</div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {app.requested_slots.length > 0 ? (
                                            [...new Set(app.requested_slots.map(slot => slot.date))]
                                                .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
                                                .map(date => {
                                                    const dateObj = new Date(date);
                                                    const month = dateObj.getMonth() + 1;
                                                    const day = dateObj.getDate();
                                                    const weekday = ['日', '一', '二', '三', '四', '五', '六'][dateObj.getDay()];
                                                    return (
                                                        <div
                                                            key={date}
                                                            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-gray-700 text-sm"
                                                        >
                                                            <span>{month}月{day}日</span>
                                                            <span className="text-xs text-gray-500">週{weekday}</span>
                                                        </div>
                                                    );
                                                })
                                        ) : (
                                            <span className="text-sm text-gray-400">無時段資料</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-sm font-medium">
                                查看詳細資訊
                            </div>
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
