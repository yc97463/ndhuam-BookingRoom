'use client';

import React, { useEffect, useState, useCallback } from 'react';

interface TurnstileOptions {
    sitekey: string;
    callback: (token: string) => void;
    'error-callback'?: () => void;
}

interface TurnstileInstance {
    render: (container: string | HTMLElement, options: TurnstileOptions) => string;
    reset: (widgetId: string) => void;
}

declare global {
    interface Window {
        turnstile: TurnstileInstance;
    }
}

interface TurnstileProps {
    siteKey: string;
    onVerify: (token: string) => void;
    onError?: () => void;
}

export const Turnstile: React.FC<TurnstileProps> = ({ siteKey, onVerify, onError }) => {
    const [widgetId, setWidgetId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    const reset = useCallback(() => {
        if (widgetId && window.turnstile) {
            window.turnstile.reset(widgetId);
            setIsLoading(true);
        }
    }, [widgetId]);

    const handleError = useCallback(() => {
        reset();
        if (onError) onError();
    }, [reset, onError]);

    useEffect(() => {
        const initTurnstile = () => {
            if (window.turnstile) {
                // 檢查是否已經存在 widget
                const existingWidget = document.querySelector('#turnstile-container');
                if (existingWidget && existingWidget.children.length > 0) {
                    setIsLoading(false);
                    return;
                }

                try {
                    const id = window.turnstile.render('#turnstile-container', {
                        sitekey: siteKey,
                        callback: (token: string) => {
                            onVerify(token);
                            setIsLoading(false);
                        },
                        'error-callback': handleError,
                    });
                    setWidgetId(id);
                } catch (error) {
                    console.error('Turnstile initialization error:', error);
                    handleError();
                }
            }
        };

        // 如果 Turnstile 已經載入，直接初始化
        if (window.turnstile) {
            initTurnstile();
        } else {
            // 如果 Turnstile 還沒載入，等待載入完成後初始化
            const checkTurnstile = setInterval(() => {
                if (window.turnstile) {
                    initTurnstile();
                    clearInterval(checkTurnstile);
                }
            }, 100);

            // 清理定時器
            return () => clearInterval(checkTurnstile);
        }
    }, [siteKey, onVerify, handleError]);

    // 組件卸載時清理
    useEffect(() => {
        return () => {
            if (widgetId && window.turnstile) {
                window.turnstile.reset(widgetId);
            }
        };
    }, [widgetId]);

    return (
        <div className="flex justify-center items-center gap-4">
            <div id="turnstile-container" className={isLoading ? 'opacity-50' : ''} />
            <button
                onClick={reset}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer hidden"
                type="button"
            >
                重設驗證
            </button>
        </div>
    );
};

export default Turnstile; 