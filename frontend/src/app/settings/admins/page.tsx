"use client";

import { useState } from 'react';
import { Loader2, Plus, Trash2, Save, Users, Mail, User, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth, handleApiResponse } from '@/utils/handleApiResponse';
import useSWR from 'swr';

interface Admin {
    id?: number;
    email: string;
    name: string;
    isActive: boolean;
    notifyReview: boolean;
    tempId?: string;
}

interface AdminFormData {
    email: string;
    name: string;
}

export default function AdminsPage() {
    const [isSaving, setIsSaving] = useState(false);
    const [nextTempId, setNextTempId] = useState(1);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const router = useRouter();

    const fetcher = async (url: string) => {
        const response = await fetchWithAuth(url);
        const data = await handleApiResponse(response, router);
        return data;
    };

    const { data: admins = [], error, isLoading, mutate: mutateAdmins } = useSWR<Admin[]>('/api/admin/admins', fetcher);

    const validateAdmin = (admin: AdminFormData): boolean => {
        const errors: Record<string, string> = {};

        if (!admin.email) {
            errors.email = '請輸入電子郵件';
        } else if (!admin.email.endsWith('@ndhu.edu.tw')) {
            errors.email = '請使用東華大學信箱';
        }

        if (!admin.name) {
            errors.name = '請輸入姓名';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const addAdmin = () => {
        const tempId = `TEMP-${nextTempId}`;
        setNextTempId(prev => prev + 1);

        const newAdmin: Admin = {
            tempId,
            email: '',
            name: '',
            isActive: true,
            notifyReview: true
        };

        mutateAdmins([...admins, newAdmin], false);
    };

    const updateAdmin = (index: number, updates: Partial<Admin>) => {
        const newAdmins = [...admins];
        newAdmins[index] = { ...newAdmins[index], ...updates };
        mutateAdmins(newAdmins, false);

        // Clear form errors when updating
        if (updates.email || updates.name) {
            setFormErrors({});
        }
    };

    const removeAdmin = (index: number) => {
        mutateAdmins(admins.filter((_, i) => i !== index), false);
        setFormErrors({});
    };

    const saveAdmins = async () => {
        // Validate all admins before saving
        const hasErrors = admins.some(admin => !validateAdmin(admin));
        if (hasErrors) {
            return;
        }

        setIsSaving(true);
        try {
            // Filter out tempId and ensure isActive is a number
            const adminsToSave = admins.map(({ tempId, ...admin }) => ({
                ...admin,
                isActive: admin.isActive ? 1 : 0
            }));

            const response = await fetchWithAuth('/api/admin/admins', {
                method: 'POST',
                body: JSON.stringify({ admins: adminsToSave })
            });

            await handleApiResponse(response, router);
            await mutateAdmins();
            setFormErrors({});
        } catch (err) {
            console.error('Save error:', err);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[40vh]">
                <Loader2 className="animate-spin text-blue-500" size={30} />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 max-w-3xl">
            {/* Header Section */}
            <div className="mb-8 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-sm">
                            <Users size={20} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">管理員管理</h1>
                            <p className="text-gray-500 text-sm">您可以在這裡新增、修改、刪除管理員帳號</p>
                        </div>
                    </div>
                    <button
                        onClick={saveAdmins}
                        disabled={isSaving}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2 hover:bg-blue-600 disabled:opacity-50 shadow-sm transition-colors cursor-pointer"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="animate-spin" size={16} />
                                <span>儲存中...</span>
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                <span>儲存變更</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="text-red-500 mt-0.5" size={20} />
                    <p className="text-red-700">{error.message || '載入管理員資料失敗'}</p>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 space-y-4">
                    {admins.length === 0 ? (
                        <div className="text-center py-10">
                            <User size={40} className="text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">目前尚未設定任何管理員</p>
                            <button
                                onClick={addAdmin}
                                className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg flex items-center gap-2 hover:bg-blue-100 transition-colors mx-auto"
                            >
                                <Plus size={16} />
                                <span>新增管理員</span>
                            </button>
                        </div>
                    ) : (
                        <>
                            {admins.map((admin, index) => (
                                <div
                                    key={admin.tempId || admin.id}
                                    className="bg-white border border-gray-200 rounded-lg p-4 transition-all hover:shadow-sm"
                                >
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="flex-1 grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">電子郵件</label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <Mail size={16} className="text-gray-400" />
                                                    </div>
                                                    <input
                                                        type="email"
                                                        value={admin.email}
                                                        onChange={(e) => updateAdmin(index, { email: e.target.value })}
                                                        placeholder="請輸入 @ndhu.edu.tw 信箱"
                                                        className={`px-3 py-2 pl-10 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${formErrors[`${index}-email`] ? 'border-red-300' : 'border-gray-200'
                                                            }`}
                                                    />
                                                </div>
                                                {formErrors[`${index}-email`] && (
                                                    <p className="mt-1 text-sm text-red-500">{formErrors[`${index}-email`]}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">姓名</label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <User size={16} className="text-gray-400" />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={admin.name}
                                                        onChange={(e) => updateAdmin(index, { name: e.target.value })}
                                                        placeholder="請輸入姓名"
                                                        className={`px-3 py-2 pl-10 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${formErrors[`${index}-name`] ? 'border-red-300' : 'border-gray-200'
                                                            }`}
                                                    />
                                                </div>
                                                {formErrors[`${index}-name`] && (
                                                    <p className="mt-1 text-sm text-red-500">{formErrors[`${index}-name`]}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <button
                                                onClick={() => updateAdmin(index, { isActive: !admin.isActive })}
                                                className={`h-[42px] px-3 py-2 rounded-lg text-sm min-w-[5rem] font-medium transition-colors cursor-pointer ${admin.isActive
                                                    ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {admin.isActive ? '啟用中' : '已停用'}
                                            </button>
                                            <button
                                                onClick={() => updateAdmin(index, { notifyReview: !admin.notifyReview })}
                                                className={`h-[42px] px-3 py-2 rounded-lg text-sm min-w-[5rem] font-medium transition-colors cursor-pointer ${admin.notifyReview
                                                    ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {admin.notifyReview ? '接收通知' : '不接收通知'}
                                            </button>
                                            <button
                                                onClick={() => removeAdmin(index)}
                                                className="h-[42px] px-3 py-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>

                {admins.length > 0 && (
                    <div className="p-4 border-t border-gray-100">
                        <button
                            onClick={addAdmin}
                            className="w-full py-3 text-gray-500 hover:text-gray-700 flex items-center justify-center gap-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                        >
                            <Plus size={18} />
                            <span>新增管理員</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
} 