"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Printer, CheckCheck, X, Clock } from 'lucide-react';
import Link from 'next/link';
import { fetchWithAuth, handleApiResponse } from '@/utils/handleApiResponse';
import '@fontsource/noto-sans-tc/400.css';
import '@fontsource/noto-sans-tc/700.css';

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

export default function PrintPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [application, setApplication] = useState<Application | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadApplication = async () => {
            try {
                const response = await fetchWithAuth(`/api/applications/${params.id}`);
                const data = await handleApiResponse(response, router);
                setApplication(data);
            } catch (error) {
                console.error('Error loading application:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadApplication();
    }, [params.id, router]);

    useEffect(() => {
        if (!isLoading && application) {
            window.print();
        }
    }, [isLoading, application]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (!application) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-red-500">找不到申請資料</div>
            </div>
        );
    }

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
        <div className="max-w-4xl mx-auto p-8 print:p-4 font-['Noto_Sans_TC']">
            <div className="mb-8 print:hidden flex items-center justify-start gap-4">
                <Link href={`/review`}>
                    <button
                        className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 cursor-pointer"
                    >
                        <ArrowLeft size={16} />
                        <span>返回列表</span>
                    </button>
                </Link>
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer"
                >
                    <Printer size={16} />
                    <span>列印</span>
                </button>
            </div>

            <div className="bg-white p-8 print:p-0">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold mb-2">應數系空間借用申請表</h1>
                    <div className="flex items-center justify-center gap-4 text-gray-600 text-sm">
                        <div className="flex items-center gap-1">
                            <span className="font-medium">申請編號：</span>
                            <span className="bg-gray-100 px-2 py-0.5 rounded">#{application.id}</span>
                        </div>
                        <div className="w-px h-4 bg-gray-300"></div>
                        <div className="flex items-center gap-1">
                            <span className="font-medium">列印時間：</span>
                            <span className="bg-gray-100 px-2 py-0.5 rounded">
                                {new Date().toLocaleString('zh-TW', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false
                                }).replace(/\//g, '/').replace(',', ' 週')}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
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
                        <label className="text-sm text-gray-500">借用空間</label>
                        <p className="font-medium">{application.room_id}</p>
                    </div>

                    <div>
                        <label className="text-sm text-gray-500">申請時段</label>
                        <div className="mt-2 space-y-4">
                            {Object.entries(groupedSlots)
                                .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
                                .map(([date, slots]) => (
                                    <div key={date} className="border rounded p-4 print:break-inside-avoid print:mt-4">
                                        <h4 className="font-medium mb-2">
                                            {date} 星期{['日', '一', '二', '三', '四', '五', '六'][new Date(date).getDay()]}
                                        </h4>
                                        <div className="grid grid-cols-4 gap-2">
                                            {slots.map((slot) => (
                                                <div key={slot.id} className="flex flex-col items-center p-2 border rounded">
                                                    <div className="text-sm font-medium">
                                                        {slot.start_time}-{slot.end_time}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mb-1">
                                                        {slot.room_id}
                                                    </div>
                                                    <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${slot.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                        slot.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                            'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {slot.status === 'confirmed' ? (
                                                            <>
                                                                <CheckCheck size={12} />
                                                                <span>已同意</span>
                                                            </>
                                                        ) : slot.status === 'rejected' ? (
                                                            <>
                                                                <X size={12} />
                                                                <span>已駁回</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Clock size={12} />
                                                                <span>待審核</span>
                                                            </>
                                                        )}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>

                    <div className="mt-8 border-t pt-8">
                        <h2 className="text-xl font-bold mb-4">注意事項</h2>
                        <ol className="list-decimal list-inside space-y-1 text-gray-700">
                            <li>請於使用前確認空間設備是否正常，如有問題請立即通知管理單位。</li>
                            <li>使用期間請保持環境整潔，使用完畢後請將空間恢復原狀。</li>
                            <li>請勿攜帶食物或飲料進入空間。</li>
                            <li>請勿擅自移動或調整空間內的設備。</li>
                            <li>使用期間請遵守相關規定，如有違規將取消使用資格。</li>
                        </ol>
                    </div>

                    <div className="print:break-inside-avoid">

                        <div className="mt-8 space-y-4">
                            <div className="flex items-start gap-2 print:break-inside-avoid">
                                <div className="w-2/3">
                                    <p className="text-sm text-gray-500">申請人簽章：</p>
                                    <div className="h-12 border-b border-gray-300 mt-2"></div>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500">簽章日期：</p>
                                    <div className="h-12 border-b border-gray-300 mt-2"></div>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500">預計歸還日：</p>
                                    <div className="h-12 border-b border-gray-300 mt-2"></div>
                                </div>
                            </div>
                            <div className="flex items-start gap-2 print:break-inside-avoid">
                                <div className="w-2/3">
                                    <p className="text-sm text-gray-500">管理單位簽章：</p>
                                    <div className="h-12 border-b border-gray-300 mt-2"></div>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500">日期：</p>
                                    <div className="h-12 border-b border-gray-300 mt-2"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 border-t pt-8 print:break-inside-avoid">
                        <h2 className="text-xl font-bold mb-4">設備檢查清單</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border border-gray-400 rounded"></div>
                                <span>鑰匙</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border border-gray-400 rounded"></div>
                                <span>冷氣遙控器</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border border-gray-400 rounded"></div>
                                <span>投影設備</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border border-gray-400 rounded"></div>
                                <span>音響設備</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border border-gray-400 rounded"></div>
                                <span>桌椅數量</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border border-gray-400 rounded"></div>
                                <span>電源插座</span>
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="flex items-start gap-2 print:break-inside-avoid">
                                <div className="w-2/3">
                                    <p className="text-sm text-gray-500">檢查人員簽章：</p>
                                    <div className="h-12 border-b border-gray-300 mt-2"></div>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500">確認日期：</p>
                                    <div className="h-12 border-b border-gray-300 mt-2"></div>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500">歸還日期：</p>
                                    <div className="h-12 border-b border-gray-300 mt-2"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 