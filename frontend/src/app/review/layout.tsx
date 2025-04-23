"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

    return <>{children}</>;
}
