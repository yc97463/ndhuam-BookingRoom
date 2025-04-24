"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminNavMenu from '@/components/AdminNavMenu';

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            router.push('/auth/login?redirect=/settings');
        }
    }, [router]);

    return (
        <div className="min-h-screen bg-gray-50">
            <AdminNavMenu />
            <main>
                {children}
            </main>
        </div>
    );
}
