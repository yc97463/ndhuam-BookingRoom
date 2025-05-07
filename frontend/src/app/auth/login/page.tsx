"use client";

import React, { useState } from 'react';
import { ArrowLeft, Loader2, Mail, Shield, CheckCircle, Send } from 'lucide-react';
import Link from 'next/link';
import Turnstile from '@/components/Turnstile';

const API_URL = `/api`;

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [turnstileToken, setTurnstileToken] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');

        // 檢查 Turnstile token
        if (!turnstileToken) {
            setStatus('error');
            setMessage('請完成人機驗證');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    turnstileToken
                })
            });

            const data = await response.json();

            if (response.ok) {
                setStatus('success');
                if (data.message === "Please check your email for verification link. You will receive a mail if you are the admins.") {
                    setMessage('如果您的信箱為有效管理員信箱，將會收到一封驗證信，請檢查信箱並使用連結登入。');
                } else {
                    setMessage('驗證信已發送至您的信箱，請檢查信箱並使用連結進行登入。');
                }
                // 重置表單
                setEmail('');
                setTurnstileToken('');
            } else {
                setStatus('error');
                setMessage(data.error || '發送驗證信失敗');
                setTurnstileToken('');
            }
        } catch (err) {
            console.log(err);
            setStatus('error');
            setMessage('系統錯誤，請稍後再試');
            setTurnstileToken('');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
            <div className="max-w-md w-full mx-auto">
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-sm">
                                <Shield size={20} />
                            </div>
                            <div className="space-y-0.5">
                                <h2 className="text-xl font-bold text-gray-900">管理員登入</h2>
                                <p className="text-sm text-gray-500">使用校園信箱進行驗證</p>
                            </div>
                        </div>

                        {status === 'success' ? (
                            <div className="bg-green-50 border border-green-200 p-5 rounded-lg text-green-700">
                                <div className="flex items-center gap-2 mb-3">
                                    <CheckCircle size={18} className="text-green-600" />
                                    <p className="font-medium text-green-800">驗證信已發送</p>
                                </div>
                                <p className="mb-3">{message}</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        校園信箱
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail size={16} className="text-gray-400" />
                                        </div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="請輸入 @ndhu.edu.tw 信箱"
                                            required
                                            pattern=".*@(.*\.)?ndhu\.edu\.tw$"
                                            className="w-full py-2.5 pl-10 pr-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        將發送一封驗證信至您的校園信箱進行管理權限驗證
                                    </p>
                                </div>

                                <Turnstile
                                    siteKey="0x4AAAAAABbGMDA-o4GXTrWo"
                                    onVerify={setTurnstileToken}
                                    onError={() => setTurnstileToken('')}
                                />

                                {status === 'error' && (
                                    <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
                                        {message}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={status === 'loading' || !turnstileToken}
                                    className="w-full bg-blue-600 text-white p-2.5 rounded-lg hover:bg-blue-700 
                                         disabled:bg-blue-300 flex items-center justify-center cursor-pointer shadow-sm transition-colors"
                                >
                                    {status === 'loading' ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <Loader2 className="animate-spin" size={18} />
                                            <span>發送中...</span>
                                        </div>
                                    ) : (
                                        <span>
                                            {!turnstileToken ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <Loader2 className="animate-spin" size={18} />
                                                    <span>機器人驗證中...</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center gap-2">
                                                    <Send size={18} />
                                                    <span>發送驗證信</span>
                                                </div>
                                            )}
                                        </span>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>

                    <div className="px-2">
                        <Link href="/" className="text-blue-600 hover:text-blue-800 flex items-center gap-1.5 transition-colors">
                            <ArrowLeft size={16} />
                            <span>返回首頁</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
