import type { GameState } from "../../hooks/useGameSocket";

type Props = {
    room: GameState["room"];
};

export default function SDGBar({ room }: Props) {
    const bars = [
        { label: "Climate", value: room.sdgClimate, color: "#26B68A" }, // From Green (e.g. Solar Farms SDG 7, Reforestation)
        { label: "Education", value: room.sdgEducation, color: "#E6A70A" }, // From Yellow (e.g. Girls Education SDG 4&5)
        { label: "Health", value: room.sdgHealth, color: "#2B77C2" }, // From Blue (e.g. Clean Water SDG 6, Healthcare)
        { label: "Energy", value: room.sdgEnergy, color: "#E4693F" }, // From Orange (e.g. Green Jobs SDG 8)
        { label: "Justice", value: room.sdgJustice, color: "#DBADCA" }, // From Pink/Purple (e.g. Anti-Corruption SDG 16)
    ];

    return (
        <div className="flex justify-between items-end gap-2 mt-4 h-32">
            {bars.map((b) => (
                <div key={b.label} className="flex flex-col items-center h-full w-full justify-end">
                    <div className="text-[10px] font-bold mb-1">{b.value}</div>
                    <div className="text-[10px] font-bold mb-1">{b.label}</div>
                    <div className="w-6 bg-[#eee] border-2 border-black rounded overflow-hidden h-full flex items-end">
                        <div
                            className="w-full border-t-2 border-black transition-[height] duration-300"
                            style={{ height: `${b.value}%`, background: b.color }}
                        />

                    </div>
                </div>
            ))}
        </div>
    );
}
