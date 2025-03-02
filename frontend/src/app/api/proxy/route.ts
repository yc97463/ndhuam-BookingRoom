export const dynamic = "force-dynamic"; // 確保 API 每次都執行，避免快取

const id = "AKfycbxfjXMOhQO5FMZCms2rV7ZdrYeW9lEPjIE9thVg2b9yziCtNYBkhW9KQHoEqX7MYpNn3w";

// 處理 GET 請求
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const params = new URLSearchParams(searchParams);
    const action = params.get("action") || "";
    params.delete("action");
    const queryString = params.toString();


    const GOOGLE_SCRIPT_URL = `https://script.google.com/macros/s/${id}/exec`;

    const requestUrl = `${GOOGLE_SCRIPT_URL}?action=${action}&${queryString}`;
    console.log(`GET ${requestUrl}`);

    const response = await fetch(`${requestUrl}`, {
        headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
        },
    });

    const data = await response.json();
    return Response.json(data);
}

// 處理 POST 請求
export async function POST(request: Request) {
    try {
        const GOOGLE_SCRIPT_URL = `https://script.google.com/macros/s/${id}/exec`;

        // 獲取請求 body
        const requestData = await request.json();
        console.log(`POST to Google Script API with data:`, requestData);

        // 發送 POST 請求到 Google Script
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
        });

        // 獲取回應
        const data = await response.json();
        return Response.json(data);
    } catch (error) {
        console.error('Proxy POST error:', error);
        return Response.json({
            success: false,
            error: '處理請求時發生錯誤'
        }, { status: 500 });
    }
}