"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminNavMenu from '@/components/AdminNavMenu';

export default function ReviewLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            router.push('/login');
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
