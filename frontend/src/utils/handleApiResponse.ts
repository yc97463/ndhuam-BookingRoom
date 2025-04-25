import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

// interface ApiResponse {
//     error?: string;
//     status?: number;
// }

export const handleApiResponse = async (
    response: Response,
    router: AppRouterInstance
) => {
    if (response.status === 401) {
        localStorage.removeItem('adminToken');
        router.push('/auth/login');
        throw new Error('Unauthorized');
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'API Error');
    }

    return data;
};

export const fetchWithAuth = async (
    url: string,
    options: RequestInit = {}
) => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        throw new Error('No auth token');
    }

    return fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        }
    });
};
