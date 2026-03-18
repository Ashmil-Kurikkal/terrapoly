import { X } from "lucide-react";
import type { TileData } from "../../game/data/tiles";
import PropertyCard from "./PropertyCard";

type TileInfoModalProps = {
    tileData: TileData;
    onClose: () => void;
};

export default function TileInfoModal({ tileData, onClose }: TileInfoModalProps) {
    const isProperty = tileData.type === "property";

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-auto p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
                style={{ animation: "fadeIn 0.2s ease-out" }}
            />

            {/* Modal Card */}
            <PropertyCard
                tileData={tileData}
                variant="info"
                isProperty={isProperty}
                className="w-full max-w-[420px] rounded-2xl shadow-[8px_8px_0px_rgba(0,0,0,1)] z-10"
                style={{
                    animation: "scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
                }}
            >
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 bg-red-500 text-white w-8 h-8 rounded-full border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_rgba(0,0,0,1)] z-20 transition-all font-bold"
                >
                    <X size={16} strokeWidth={3} />
                </button>
            </PropertyCard>

            {/* Keyframe animations */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
