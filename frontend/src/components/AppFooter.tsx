import Link from 'next/link';

export default function AppFooter() {
    return (
        <footer className="bg-white border-t mt-auto">
            <div className="container mx-auto px-4 py-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-gray-600 text-sm">
                        <p>國立東華大學應用數學系</p>
                        <p>電話：<a href="tel:03-8903513" className="text-blue-500 hover:underline">03-8903513</a></p>
                    </div>
                    <div className="flex gap-4 text-sm">
                        <Link href="https://am.ndhu.edu.tw" className="text-gray-600 hover:text-gray-800">
                            應數系網
                        </Link>
                        <Link href="/review" className="text-gray-600 hover:text-gray-800">
                            管理後台
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
