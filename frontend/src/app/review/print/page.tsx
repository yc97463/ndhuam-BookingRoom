'use client';

import { Suspense } from 'react';
import ReviewPrintInner from './ReviewPrintInner';

export default function ReviewPrint() {
    return (
        <Suspense fallback={<p>載入中...</p>}>
            <ReviewPrintInner />
        </Suspense>
    );
}
