import Link from 'next/link';
import { ExternalLink, School } from 'lucide-react';

export default function AppFooter() {
    return (
        <footer className="mt-auto border-t border-gray-100">
            <div className="container mx-auto px-4 py-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 flex items-center justify-center bg-blue-50 text-blue-500 rounded-lg">
                            <School size={18} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-gray-700">國立東華大學應用數學系</p>
                                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded">NDHU AM</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                <a href="mailto:am@gms.ndhu.edu.tw" className="hover:text-blue-600 transition-colors">
                                    am@gms.ndhu.edu.tw
                                </a>
                                <span className="h-1 w-1 rounded-full bg-gray-300"></span>
                                <a href="tel:03-8903513" className="hover:text-blue-600 transition-colors">
                                    03-8903513
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                        <Link
                            href="https://am.ndhu.edu.tw"
                            target="_blank"
                            className="px-3 py-1.5 text-gray-500 hover:text-gray-800 flex items-center gap-1 group"
                        >
                            <span>系網</span>
                            <ExternalLink size={14} className="opacity-70 group-hover:opacity-100" />
                        </Link>
                        <span className="h-4 w-px bg-gray-200"></span>
                        <Link
                            href="/review"
                            className="px-3 py-1.5 text-gray-500 hover:text-gray-800"
                        >
                            管理後台
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
