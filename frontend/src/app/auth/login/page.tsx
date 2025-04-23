"use client";

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

const API_URL = `/api`;

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                setStatus('success');
                setMessage('驗證信已發送至您的信箱，請查收並點擊連結進行登入。');
            } else {
                setStatus('error');
                setMessage(data.error || '發送驗證信失敗');
            }
        } catch (err) {
            console.log(err);
            setStatus('error');
            setMessage('系統錯誤，請稍後再試');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
            <div className="max-w-md w-full mx-auto">
                <div className="bg-white p-8 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold mb-6 text-center">系統管理登入</h2>

                    {status === 'success' ? (
                        <div className="bg-green-50 border border-green-200 p-4 rounded-md text-green-700">
                            {message}
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    校園信箱
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="請輸入 @ndhu.edu.tw 信箱"
                                    required
                                    pattern=".*@ndhu\.edu\.tw$"
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {status === 'error' && (
                                <div className="text-red-600 text-sm">{message}</div>
                            )}

                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 
                                         disabled:bg-blue-300 flex items-center justify-center"
                            >
                                {status === 'loading' ? (
                                    <>
                                        <Loader2 className="animate-spin mr-2" size={18} />
                                        發送驗證信中...
                                    </>
                                ) : (
                                    '發送驗證信'
                                )}
                            </button>

                            <p className="text-sm text-gray-500 text-center mt-4">
                                將發送驗證信至您的校園信箱
                            </p>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
