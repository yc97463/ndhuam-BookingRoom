'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, ClipboardList, Users, LogOut, DoorOpen } from 'lucide-react';

export default function AdminNavMenu() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        router.push('/auth/login');
    };

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
            href: '/settings/spaces',
            label: '空間管理',
            icon: DoorOpen
        },
        {
            href: '/settings/admins',
            label: '管理員管理',
            icon: Users
        }
    ];

    return (
        <nav className="bg-white border-b print:hidden">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center">
                    <div className="flex-1 overflow-x-auto whitespace-nowrap scrollbar-hide">
                        <div className="flex gap-4">
                            {menuItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer
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
                    <div className="flex-shrink-0">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-1 px-4 py-3 text-sm font-medium text-red-500 hover:text-red-700 transition-colors cursor-pointer
                                border-b-2 border-transparent hover:border-red-300  shadow-[-2px_0_4px_-1px_rgba(0,0,0,0.1)]"
                        >
                            <LogOut size={16} />
                            登出
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
