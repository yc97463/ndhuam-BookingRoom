export const dynamic = "force-dynamic"; // 確保 API 每次都執行，避免快取
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const params = new URLSearchParams(searchParams);
    const action = params.get("action") || "";
    params.delete("action");
    const queryString = params.toString();

    const id = "AKfycbwFbIhVzVNMl9kQsAt7HDPxOfEIBOkrLF6Wtw5tflJFvNJecorIoQVRuGGiEcEi5dZliQ";
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
