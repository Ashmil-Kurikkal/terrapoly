import { X, BookOpen, AlertTriangle, Target, HandCoins } from "lucide-react";

type Props = {
    onClose: () => void;
};

export default function QuickGuideModal({ onClose }: Props) {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div
                className="relative w-full max-w-3xl bg-[#fcf8f2] rounded-2xl border-4 border-black shadow-[8px_8px_0px_#000] flex flex-col max-h-[90vh] overflow-hidden"
                style={{ animation: 'slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b-4 border-black bg-[#ff5e5e] text-white">
                    <div className="flex items-center gap-3">
                        <BookOpen className="w-8 h-8" />
                        <h2 className="text-3xl font-black uppercase tracking-wider">
                            Quick Guide
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-black/20 rounded-full transition-colors group"
                    >
                        <X className="w-8 h-8 text-white" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto flex flex-col gap-8 text-black" style={{ scrollbarWidth: 'thin' }}>

                    {/* Goal */}
                    <section>
                        <h3 className="text-2xl font-black uppercase mb-3 flex items-center gap-2 border-b-2 border-black/10 pb-2">
                            <Target className="w-6 h-6 text-blue-600" /> Goal of the Game
                        </h3>
                        <p className="font-bold text-gray-700 leading-relaxed text-lg">
                            Terrapoly is a cooperative and competitive strategy game where players invest in the <span className="text-blue-600 font-black">UN Sustainable Development Goals (SDGs)</span> to prevent global collapse. Maximize your Impact Points while ensuring the World Score survives!
                        </p>
                    </section>

                    {/* Gameplay Basics */}
                    <section>
                        <h3 className="text-2xl font-black uppercase mb-3 flex items-center gap-2 border-b-2 border-black/10 pb-2">
                            <HandCoins className="w-6 h-6 text-green-600" /> Playing a Turn
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white border-2 border-black p-4 rounded-xl shadow-[4px_4px_0px_#000]">
                                <div className="font-black text-lg mb-2">🎲 Movement</div>
                                <p className="text-sm font-bold text-gray-600">Roll the dice to move around the board. When you pass START, you collect 200 Impact Points.</p>
                            </div>
                            <div className="bg-white border-2 border-black p-4 rounded-xl shadow-[4px_4px_0px_#000]">
                                <div className="font-black text-lg mb-2">💰 Investing</div>
                                <p className="text-sm font-bold text-gray-600">Land on an unowned project to invest Impact Points. You can upgrade projects to Seed, Growth, and Scale levels.</p>
                            </div>
                            <div className="bg-white border-2 border-black p-4 rounded-xl shadow-[4px_4px_0px_#000]">
                                <div className="font-black text-lg mb-2">🤝 Donations & Alliances</div>
                                <p className="text-sm font-bold text-gray-600">Land on another player's project to pay them Impact Points (Rent). This models global collaboration!</p>
                            </div>
                            <div className="bg-white border-2 border-black p-4 rounded-xl shadow-[4px_4px_0px_#000]">
                                <div className="font-black text-lg mb-2">⏳ Time Limit</div>
                                <p className="text-sm font-bold text-gray-600">You have a limited time of 20s to make decisions. If you run out of time, you auto-pass.</p>
                            </div>
                        </div>
                    </section>

                    {/* Events & Crises */}
                    <section>
                        <h3 className="text-2xl font-black uppercase mb-3 flex items-center gap-2 border-b-2 border-black/10 pb-2 text-red-600">
                            <AlertTriangle className="w-6 h-6" /> Events & Crises
                        </h3>
                        <div className="bg-red-50 border-2 border-red-200 p-5 rounded-xl space-y-4">
                            <div>
                                <h4 className="font-black text-red-800 text-lg">🌎 Global Headlines</h4>
                                <p className="text-sm font-bold text-red-900/80">Landing on Headline tiles triggers random world events. These can grant massive boosts to your Impact Points or deliver devastating losses based on real-world scenarios.</p>
                            </div>
                            <div>
                                <h4 className="font-black text-red-800 text-lg">🔥 Climate Tipping Points</h4>
                                <p className="text-sm font-bold text-red-900/80">Every few rounds, or when landing on specific corners, the World Score is checked. The most NEGLECTED sustainable development category triggers a Global Crisis!</p>
                            </div>
                            <div className="bg-red-900 text-white p-3 rounded-lg border border-red-950 font-bold text-sm">
                                <strong>WARNING:</strong> Crises drain points from EVERYONE. Neglecting certain sectors will cause interdependent cascading effects, punishing players who hoarded resources!
                            </div>
                        </div>
                    </section>

                </div>
            </div>

            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
