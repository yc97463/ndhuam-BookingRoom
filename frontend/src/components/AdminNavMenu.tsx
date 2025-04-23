'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, ClipboardList, Settings } from 'lucide-react';

export default function AdminNavMenu() {
    const pathname = usePathname();

    const menuItems = [
        {
            href: '/',
            label: '回到申請單',
            icon: ArrowLeft
        },
        {
            href: '/review',
            label: '申請審核',
            icon: ClipboardList
        },
        {
            href: '/settings',
            label: '系統設定',
            icon: Settings
        }
    ];

    return (
        <nav className="bg-white border-b">
            <div className="container mx-auto px-4">
                <div className="flex gap-4">
                    {menuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                                ${pathname === item.href
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <item.icon size={16} />
                            {item.label}
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    );
}
