'use client';

import React, { useEffect, useState } from 'react';

declare global {
    interface Window {
        turnstile: {
            render: (container: string | HTMLElement, options: any) => string;
            reset: (widgetId: string) => void;
        };
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
                        'error-callback': () => {
                            if (onError) onError();
                            setIsLoading(false);
                        },
                    });
                    setWidgetId(id);
                } catch (error) {
                    console.error('Turnstile initialization error:', error);
                    if (onError) onError();
                    setIsLoading(false);
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
    }, [siteKey, onVerify, onError]);

    const reset = () => {
        if (widgetId && window.turnstile) {
            window.turnstile.reset(widgetId);
            setIsLoading(true);
        }
    };

    return (
        <div className="flex justify-center">
            <div id="turnstile-container" className={isLoading ? 'opacity-50' : ''} />
        </div>
    );
};

export default Turnstile; 