import { useState, useEffect } from "react";

export type HeadlineModalProps = {
    headline: {
        title: string;
        description: string;
        impactChange: number;
        icon: string;
        type: 'positive' | 'negative';
    };
    onClose: () => void;
};

export default function HeadlineModal({ headline, onClose }: HeadlineModalProps) {
    const [closeTimer, setCloseTimer] = useState<number>(6);

    useEffect(() => {
        let timerId: ReturnType<typeof setInterval>;
        if (closeTimer > 0) {
            timerId = setInterval(() => {
                setCloseTimer((prev) => prev - 1);
            }, 1000);
        } else if (closeTimer === 0) {
            onClose();
        }

        return () => {
            if (timerId) clearInterval(timerId);
        };
    }, [closeTimer, onClose]);

    const isPositive = headline.type === 'positive';
    const bgColor = isPositive ? '#4ade80' : '#ef4444'; // Green or Red
    const textColor = isPositive ? 'text-green-900' : 'text-red-900';

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-auto">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                style={{ animation: 'fadeIn 0.2s ease-out' }}
                onClick={onClose}
            />

            {/* Modal Card */}
            <div
                className="relative w-full max-w-sm rounded-2xl overflow-hidden border-4 border-black shadow-[8px_8px_0px_#000] font-nunito text-black"
                style={{
                    backgroundColor: bgColor,
                    animation: 'scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
            >
                {/* Header Strip */}
                <div className="bg-black text-white text-center py-2 border-b-4 border-black font-black uppercase tracking-[0.2em] text-sm">
                    {isPositive ? "BREAKING GOOD NEWS" : "WORLDWIDE HEADLINE"}
                </div>

                <div className="p-6 text-center">
                    {/* Icon */}
                    <div className="text-6xl mb-4 drop-shadow-md animate-bounce">
                        {headline.icon}
                    </div>

                    {/* Content */}
                    <h2 className={`text-2xl font-black mb-3 leading-tight uppercase ${textColor} drop-shadow-[1px_1px_0_rgba(255,255,255,0.5)]`}>
                        {headline.title}
                    </h2>

                    <div className="bg-black/10 rounded-xl p-4 border-2 border-black/20 mb-6 shadow-inner">
                        <p className="font-bold text-black/80 text-sm leading-relaxed">
                            {headline.description}
                        </p>
                    </div>

                    {/* Impact Result */}
                    <div className="mb-6">
                        <div className="text-xs font-bold uppercase opacity-70 mb-1">Impact Result</div>
                        <div className={`text-4xl font-black ${isPositive ? 'text-white drop-shadow-[2px_2px_0_#14532d]' : 'text-white drop-shadow-[2px_2px_0_#7f1d1d]'}`}>
                            {isPositive ? '+' : ''}{headline.impactChange} PTS
                        </div>
                    </div>

                    {/* Action */}
                    <div className="flex flex-col items-center gap-2">
                        <button
                            onClick={onClose}
                            className="w-full bg-white text-black font-black text-xl py-3 rounded-xl border-4 border-black active:translate-y-1 active:shadow-none transition-all shadow-[0_4px_0_#000]"
                        >
                            CONTINUE
                        </button>
                        {closeTimer > 0 && (
                            <p className={`text-sm font-bold ${isPositive ? 'text-green-900' : 'text-red-900'} opacity-80 mt-1`}>
                                Auto-closing in {closeTimer}s...
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes scaleUp {
                    from { transform: scale(0.9); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
