"use client";

import PrintPage from './PrintPage'
import { useParams } from 'next/navigation';

export default function Page() {
    const params = useParams<{ id: string }>();
    return <PrintPage params={params} />;
} 