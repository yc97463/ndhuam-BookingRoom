import Link from 'next/link';
import { ExternalLink, Building2, Phone } from 'lucide-react';

export default function AppFooter() {
    return (
        <footer className="mt-auto">
            <div className="bg-gradient-to-b from-white via-gray-50/50 to-gray-50 border-t backdrop-blur-xl">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Building2 size={16} className="text-blue-500" />
                                <span>國立東華大學應用數學系</span>
                            </div>
                            <div className="mt-2 flex items-center gap-2 text-sm">
                                <Phone size={14} className="text-gray-400" />
                                <a href="tel:03-8903513"
                                    className="text-gray-500 hover:text-gray-800 transition-colors">
                                    03-8903513
                                </a>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Link
                                href="https://am.ndhu.edu.tw"
                                target="_blank"
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-blue-600 rounded-lg hover:bg-blue-50/50 border border-transparent hover:border-blue-100 transition-all duration-200"
                            >
                                <ExternalLink size={14} />
                                <span>系網</span>
                            </Link>
                            <div className="h-4 w-px bg-gray-200 my-auto" />
                            <Link
                                href="/review"
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-50 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100/70 border border-gray-200/50 hover:border-gray-200 transition-all duration-200"
                            >
                                管理員登入
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
