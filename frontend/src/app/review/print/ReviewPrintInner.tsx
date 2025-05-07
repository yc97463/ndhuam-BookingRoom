'use client';

import { useSearchParams } from 'next/navigation';
import PrintPage from './PrintPage';

export default function ReviewPrintInner() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');

    if (!id) return <p>❌ 缺少 id 參數</p>;

    return <PrintPage params={{ id }} />;
}