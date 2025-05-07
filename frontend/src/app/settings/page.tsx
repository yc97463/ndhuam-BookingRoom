"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SettingsLandingPage() {
    const router = useRouter();

    useEffect(() => {
        router.push('/settings/admins');
    }, [router]);

}
