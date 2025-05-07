export interface Env {
    DB: D1Database & {
        transaction<T>(callback: (tx: D1Database) => Promise<T>): Promise<T>;
    };
    JWT_SECRET: string;
    APP_URL: string;
    GAS_EMAIL_API_URL: string;
    TURNSTILE_SECRET_KEY: string;
}
