import Link from 'next/link';
import { ExternalLink, School, Mail, Phone, MapPin } from 'lucide-react';

export default function AppFooter() {
    return (
        <footer className="mt-auto backdrop-blur-sm border-t">
            <div className="absolute inset-x-0 h-32 bg-gradient-to-b from-white via-white to-transparent" />
            <div className="mx-w-screen px-4 py-8 relative">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 md:gap-12">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20">
                                <School size={20} />
                            </div>
                            <div className="space-y-0.5">
                                <h3 className="text-gray-950 font-bold">國立東華大學</h3>
                                <p className="text-sm text-gray-500">應用數學系</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <a href="mailto:am@gms.ndhu.edu.tw"
                                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors group">
                                <Mail size={14} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                                am@gms.ndhu.edu.tw
                            </a>
                            <a href="tel:03-8903513"
                                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors group">
                                <Phone size={14} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                                03-8903513
                            </a>
                            <div className="flex items-center gap-2 text-sm text-gray-500 group">
                                <MapPin size={14} className="text-gray-400" />
                                974301 花蓮縣壽豐鄉志學村大學路二段1號
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href="https://am.ndhu.edu.tw"
                            target="_blank"
                            className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 hover:text-blue-600 rounded-xl hover:bg-blue-50/80 border border-gray-100 transition-all duration-200 group"
                        >
                            系網
                            <ExternalLink size={14} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                        </Link>
                        <Link
                            href="/review"
                            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
                        >
                            管理後台
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
