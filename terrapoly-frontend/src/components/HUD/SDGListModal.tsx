import { X } from "lucide-react";
import { tiles } from "../../game/data/tiles";
import type { TileData } from "../../game/data/tiles";

type Props = {
    onClose: () => void;
};

// 17 UN SDGs with their official colors
const SDGs = [
    { id: "SDG 1", name: "No Poverty", color: "#E5243B" },
    { id: "SDG 2", name: "Zero Hunger", color: "#DDA63A" },
    { id: "SDG 3", name: "Good Health and Well-being", color: "#4C9F38" },
    { id: "SDG 4", name: "Quality Education", color: "#C5192D" },
    { id: "SDG 5", name: "Gender Equality", color: "#FF3A21" },
    { id: "SDG 6", name: "Clean Water and Sanitation", color: "#26BDE2" },
    { id: "SDG 7", name: "Affordable and Clean Energy", color: "#FCC30B" },
    { id: "SDG 8", name: "Decent Work and Economic Growth", color: "#A21942" },
    { id: "SDG 9", name: "Industry, Innovation and Infrastructure", color: "#FD6925" },
    { id: "SDG 10", name: "Reduced Inequality", color: "#DD1367" },
    { id: "SDG 11", name: "Sustainable Cities and Communities", color: "#FD9D24" },
    { id: "SDG 12", name: "Responsible Consumption and Production", color: "#BF8B2E" },
    { id: "SDG 13", name: "Climate Action", color: "#3F7E44" },
    { id: "SDG 14", name: "Life Below Water", color: "#0A97D9" },
    { id: "SDG 15", name: "Life on Land", color: "#56C02B" },
    { id: "SDG 16", name: "Peace and Justice Strong Institutions", color: "#00689D" },
    { id: "SDG 17", name: "Partnerships to achieve the Goal", color: "#19486A" },
];

export default function SDGListModal({ onClose }: Props) {
    // Map properties to their related SDGs
    // Some tiles might mention multiple SDGs like "SDG 4&5", so we check inclusion
    const sdgMap = new Map<string, TileData[]>();

    tiles.forEach(tile => {
        if (tile.type === "property" && tile.sdgno) {
            SDGs.forEach(sdg => {
                if (tile.sdgno!.includes(sdg.id)) {
                    const existing = sdgMap.get(sdg.id) || [];
                    sdgMap.set(sdg.id, [...existing, tile]);
                }
            });
        }
    });

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div
                className="relative w-full max-w-4xl bg-[#fcf8f2] rounded-2xl border-4 border-black shadow-[8px_8px_0px_#000] flex flex-col max-h-[90vh] overflow-hidden"
                style={{ animation: 'scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b-4 border-black bg-white">
                    <h2 className="text-3xl font-black uppercase tracking-wider text-black">
                        17 UN Sustainable Development Goals
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-red-100 rounded-full transition-colors group"
                    >
                        <X className="w-8 h-8 text-black group-hover:text-red-600" />
                    </button>
                </div>

                {/* Content area: Grid of SDGs */}
                <div className="p-6 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {SDGs.map((sdg, idx) => {
                            const projects = sdgMap.get(sdg.id) || [];
                            return (
                                <div
                                    key={sdg.id}
                                    className="border-2 border-black rounded-xl overflow-hidden shadow-[4px_4px_0px_#000] flex flex-col bg-white hover:-translate-y-1 hover:shadow-[6px_6px_0px_#000] transition-all"
                                >
                                    {/* SDG Header Banner */}
                                    <div
                                        className="text-white p-3 font-black flex items-center justify-between gap-2"
                                        style={{ backgroundColor: sdg.color }}
                                    >
                                        <div className="text-xl opacity-90">#{idx + 1}</div>
                                        <div className="text-right leading-tight text-sm uppercase">{sdg.name}</div>
                                    </div>

                                    {/* Project List */}
                                    <div className="p-4 flex-1 flex flex-col justify-start">
                                        <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 border-b-2 border-dashed border-gray-200 pb-1">
                                            Related Projects on Board
                                        </div>
                                        {projects.length > 0 ? (
                                            <ul className="flex flex-col gap-2">
                                                {projects.map(p => (
                                                    <li key={p.id} className="text-sm font-bold flex items-start gap-2 text-gray-800">
                                                        <span className="text-[10px] mt-1 text-black">⬛</span>
                                                        <span className="leading-snug">{p.prop?.replace(/^[^\s]+\s/, '') || p.name}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <div className="text-gray-400 italic text-sm font-semibold my-auto text-center py-4">
                                                No projects map directly to this goal.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes scaleUp {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
