"use client";

import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Loader2, X, Copy, Check } from 'lucide-react';

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

function ClipboardButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(text)
            .then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
            });
    };

    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                copyToClipboard();
            }}
            className={`cursor-pointer ${copied ? 'text-green-500 hover:text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
            title="Copy to clipboard"
        >
            {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
    );
}

function ApplicationModal({ application, onClose, onReview }: {
    application: Application | null,
    onClose: () => void,
    onReview: (id: number, slots: { slotId: number; status: 'confirmed' | 'rejected' }[], note: string) => Promise<void>
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [note,] = useState('');
    const [slotStatuses, setSlotStatuses] = useState<Map<number, 'confirmed' | 'rejected'>>(new Map());

    useEffect(() => {
        if (application) {
            // Initialize slots with their current status, defaulting to confirmed for pending slots
            const initialStatuses = new Map();
            application.requested_slots.forEach(slot => {
                initialStatuses.set(
                    slot.id,
                    slot.status === 'pending' ? 'confirmed' : slot.status
                );
            });
            setSlotStatuses(initialStatuses);
        }
    }, [application]);

    const toggleSlotStatus = (slotId: number) => {
        setSlotStatuses(prev => {
            const newStatuses = new Map(prev);
            newStatuses.set(slotId, prev.get(slotId) === 'confirmed' ? 'rejected' : 'confirmed');
            return newStatuses;
        });
    };

    const toggleDateGroupStatus = (date: string, status: 'confirmed' | 'rejected') => {
        setSlotStatuses(prev => {
            const newStatuses = new Map(prev);
            const slotsForDate = application?.requested_slots.filter(slot => slot.date === date) || [];
            slotsForDate.forEach(slot => {
                newStatuses.set(slot.id, status);
            });
            return newStatuses;
        });
    };

    const handleSubmit = async () => {
        if (!application) return;
        setIsSubmitting(true);
        try {
            const slots = Array.from(slotStatuses.entries()).map(([slotId, status]) => ({
                slotId,
                status
            }));
            await onReview(application.id, slots, note);
            onClose();
        } catch (error) {
            console.error('Review error:', error);
            alert('審核失敗，請稍後再試');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!application) return null;

    // Group slots by date
    const groupedSlots = application.requested_slots.reduce((groups, slot) => {
        const date = slot.date;
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(slot);
        return groups;
    }, {} as Record<string, RequestedSlot[]>);

    // Sort slots within each group by time
    Object.values(groupedSlots).forEach(slots => {
        slots.sort((a, b) => a.start_time.localeCompare(b.start_time));
    });

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 cursor-pointer" onClick={onClose}>
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
                            <div className="flex items-center gap-2">
                                <p className="font-medium">{application.email}</p>
                                <ClipboardButton text={application.email} />
                            </div>
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
                        <div className="mt-2 space-y-4">
                            {Object.entries(groupedSlots)
                                .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
                                .map(([date, slots]) => (
                                    <div key={date} className="bg-gray-50 p-3 rounded">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="font-medium">{date}</h4>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleDateGroupStatus(date, 'rejected');
                                                    }}
                                                    className="px-2 py-1 text-sm rounded bg-red-100 text-red-700 hover:bg-red-200 active:ring-2 active:ring-red-500 cursor-pointer"
                                                >
                                                    全部駁回
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleDateGroupStatus(date, 'confirmed');
                                                    }}
                                                    className="px-2 py-1 text-sm rounded bg-green-100 text-green-700 hover:bg-green-200 active:ring-2 active:ring-green-500 cursor-pointer"
                                                >
                                                    全部同意
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            {slots.map((slot) => (
                                                <div key={slot.id}
                                                    onClick={() => toggleSlotStatus(slot.id)}
                                                    className={`flex items-center justify-between p-2 rounded cursor-pointer transition-all duration-200 ease-in-out
                                                        ${slotStatuses.get(slot.id) === 'confirmed'
                                                            ? 'bg-green-50 border border-green-200 hover:bg-green-100 hover:border-green-300'
                                                            : 'bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300'
                                                        }
                                                    `}
                                                >
                                                    <span>
                                                        {slot.start_time}-{slot.end_time}
                                                        <span className="ml-2 text-gray-500">({slot.room_id})</span>
                                                        {slot.status !== 'pending' && (
                                                            <span className={`ml-2 text-sm ${slot.status === 'confirmed' ? 'text-green-600' : 'text-red-600'
                                                                }`}>
                                                                （原狀態：{slot.status === 'confirmed' ? '已同意' : '已駁回'}）
                                                            </span>
                                                        )}
                                                    </span>
                                                    <button
                                                        className={`px-3 py-1 rounded-full text-sm ${slotStatuses.get(slot.id) === 'confirmed'
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-red-100 text-red-700'
                                                            }`}
                                                    >
                                                        {slotStatuses.get(slot.id) === 'confirmed' ? '同意' : '駁回'}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                    <div className="flex justify-end mt-6">
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 cursor-pointer"
                        >
                            {isSubmitting ? '處理中...' : '確認送出'}
                        </button>
                    </div>
                </div>
            </div>
        </div >
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

    const handleReview = async (id: number, slots: { slotId: number; status: 'confirmed' | 'rejected' }[], note: string) => {
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
                slots,
                note
            })
        });

        if (!response.ok) {
            throw new Error('Review failed');
        }

        // Update local state
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
                        <div
                            className="flex gap-4">
                            <div className="justify-center items-center text-gray-500 font-bold text-lg">
                                {app.id}
                            </div>
                            <div>
                                <h3 className="font-medium">{app.name} {app.organization}</h3>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {app.requested_slots.length > 0 ? (
                                        [...new Set(app.requested_slots.map(slot => slot.date))]
                                            .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
                                            .map(date => (
                                                <span
                                                    key={date}
                                                    className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800"
                                                >
                                                    {date}
                                                </span>
                                            ))
                                    ) : (
                                        <span className="text-sm text-gray-500">無時段資料</span>
                                    )}
                                </div>
                            </div>
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
        </div >
    );
}

export default function ReviewPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ReviewContent />
        </Suspense>
    );
}
