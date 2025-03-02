export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "";

    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbySTwT7heZuvjzoU_JXMsaGeEm8I2xzilzlRTBFpsvgm-z5Z7qvOdvRhi3RvoZJJH3Kvg/exec";

    const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=${action}`, {
        headers: {
            "Content-Type": "application/json",
        },
    });

    const data = await response.json();
    return Response.json(data);
}
