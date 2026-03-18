type CrisisModalProps = {
    category: string;
    crisis: {
        crisisName: string;
        description: string;
        basePenalty: number;
        interdependentPenalty: number;
        interdependentMessage: string;
    };
    interDependentVictims: string[];
    myPlayerId: string;
    players: { id: string; name: string }[];
    onClose: () => void;
};

export default function CrisisModal({ category, crisis, interDependentVictims, myPlayerId, players, onClose }: CrisisModalProps) {
    const amIVictim = interDependentVictims.includes(myPlayerId);

    // Map of category to danger colors
    const catColors: Record<string, string> = {
        'Climate': '#166534',
        'Education': '#a16207',
        'Health': '#1e3a8a',
        'Energy': '#9a3412',
        'Justice': '#831843'
    };

    const bannerColor = catColors[category] || '#991b1b';

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-auto">
            {/* Backdrop with aggressive red tint */}
            <div
                className="absolute inset-0 bg-red-950/80 backdrop-blur-md"
                style={{ animation: 'fadeIn 0.2s ease-out' }}
                onClick={onClose}
            />

            {/* Modal Card */}
            <div
                className="relative w-full max-w-md rounded-2xl overflow-hidden border-4 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)] font-nunito text-white bg-black"
                style={{ animation: 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both' }}
            >
                {/* Header Strip */}
                <div
                    className="text-center py-3 border-b-4 border-red-500 font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2"
                    style={{ backgroundColor: bannerColor }}
                >
                    <span className="text-xl animate-pulse">⚠️</span>
                    GLOBAL CRISIS EVENT
                    <span className="text-xl animate-pulse">⚠️</span>
                </div>

                <div className="p-6 text-center">
                    <div className="inline-block bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 border border-red-400">
                        {category} Neglected
                    </div>

                    <h2 className="text-3xl font-black mb-3 leading-tight uppercase text-red-500 drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">
                        {crisis.crisisName}
                    </h2>

                    <p className="font-bold text-gray-300 text-sm leading-relaxed mb-6">
                        {crisis.description}
                    </p>

                    <div className="bg-red-950/50 rounded-xl p-4 border-2 border-red-900/50 mb-6">
                        <div className="text-xl font-black mb-1">EVERYONE LOSES {Math.abs(crisis.basePenalty)} PTS</div>
                        <div className="text-xs text-red-400 font-bold uppercase tracking-widest">Global Shockwave</div>
                    </div>

                    {/* Interdependent Effect Section */}
                    {interDependentVictims.length > 0 && (
                        <div className="bg-orange-950/40 rounded-xl p-4 border border-orange-900/50 mb-6 text-left">
                            <h3 className="text-orange-500 font-black uppercase text-sm mb-2 flex items-center gap-2">
                                <span>🔗</span> Interdependent Cascades
                            </h3>
                            <p className="text-xs font-bold text-gray-400 mb-3 leading-snug">
                                {crisis.interdependentMessage}
                            </p>

                            <div className="flex flex-col gap-2">
                                {interDependentVictims.map((vid) => {
                                    const p = players.find(player => player.id === vid);
                                    const isMe = vid === myPlayerId;
                                    return (
                                        <div key={vid} className={`flex justify-between items-center text-xs font-bold p-2 rounded ${isMe ? 'bg-orange-500 text-black' : 'bg-black/40 text-orange-200'}`}>
                                            <span className="truncate pr-2">{isMe ? "YOU" : p?.name}</span>
                                            <span className="flex-none bg-red-600 text-white px-2 py-0.5 rounded-sm">
                                                -{Math.abs(crisis.interdependentPenalty)} PTS
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {amIVictim && (
                        <div className="mb-6 text-red-500 font-black animate-pulse bg-red-950 p-2 rounded border border-red-900">
                            Your properties were caught in the crossfire!
                        </div>
                    )}

                    {/* Action */}
                    <button
                        onClick={onClose}
                        className="w-full bg-red-600 hover:bg-red-500 text-white font-black text-xl py-3 rounded-xl border-4 border-red-800 active:translate-y-1 active:border-b-0 transition-transform shadow-[inset_0_-4px_0_rgba(0,0,0,0.3)]"
                    >
                        ENDURE
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes shake {
                    10%, 90% { transform: translate3d(-1px, 0, 0); }
                    20%, 80% { transform: translate3d(2px, 0, 0); }
                    30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                    40%, 60% { transform: translate3d(4px, 0, 0); }
                }
            `}</style>
        </div>
    );
}
