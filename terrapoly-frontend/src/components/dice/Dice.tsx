import { useState } from "react";
import { Dices } from "lucide-react";

type Props = {
  onRoll: (total: number) => void;
  disabled?: boolean;
};

export default function Dice({ onRoll, disabled }: Props) {
  const [dice1, setDice1] = useState(1);
  const [dice2, setDice2] = useState(1);
  const [rolling, setRolling] = useState(false);

  const rollDice = () => {
    if (rolling || disabled) return;

    console.log("🎲 Roll button clicked");
    setRolling(true);

    let rolls = 0;

    const interval = setInterval(() => {
      setDice1(Math.floor(Math.random() * 6) + 1);
      setDice2(Math.floor(Math.random() * 6) + 1);
      rolls++;

      if (rolls > 15) {
        clearInterval(interval);

        const final1 = Math.floor(Math.random() * 6) + 1;
        const final2 = Math.floor(Math.random() * 6) + 1;
        const total = final1 + final2;

        setDice1(final1);
        setDice2(final2);
        setRolling(false);

        console.log(`🎲 Final Dice: ${final1} + ${final2} = ${total}`);

        onRoll(total);
      }
    }, 100);
  };

  const getRotation = (value: number) => {
    const rotations: Record<number, string> = {
      1: "rotateX(0deg) rotateY(0deg)",
      2: "rotateX(-90deg) rotateY(0deg)",
      3: "rotateX(0deg) rotateY(-90deg)",
      4: "rotateX(0deg) rotateY(90deg)",
      5: "rotateX(90deg) rotateY(0deg)",
      6: "rotateX(180deg) rotateY(0deg)",
    };
    return rotations[value] || rotations[1];
  };

  const Face = ({ value, transform }: { value: number; transform: string }) => {
    const dotMap: Record<number, number[]> = {
      1: [4],
      2: [0, 8],
      3: [0, 4, 8],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8],
    };

    return (
      <div
        className="absolute bg-[#fdfdfd] rounded-xl shadow-[inset_0_0_0_1px_#ddd,inset_0_0_15px_rgba(0,0,0,0.1)] [backface-visibility:hidden] p-2 box-border"
        style={{
          transform,
          width: "clamp(35px, 12cqi, 60px)",
          height: "clamp(35px, 12cqi, 60px)",
        }}
      >
        <div className="grid grid-cols-3 grid-rows-3 w-full h-full">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="flex justify-center items-center">
              {dotMap[value].includes(i) && <div className="w-2 h-2 bg-[#333] rounded-full shadow-[inset_0_1px_1px_rgba(0,0,0,0.5)]" />}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const Cube = ({ value }: { value: number }) => (
    <div style={{ width: "clamp(35px, 12cqi, 60px)", height: "clamp(35px, 12cqi, 60px)", perspective: "600px" }}>
      <div
        className="w-full h-full relative transition-[transform] duration-150 ease-out [transform-style:preserve-3d]"
        style={{ transform: getRotation(value) }}
      >
        <Face value={1} transform="rotateY(0deg) translateZ(calc(clamp(35px, 12cqi, 60px) / 2))" />
        <Face value={6} transform="rotateX(180deg) translateZ(calc(clamp(35px, 12cqi, 60px) / 2))" />
        <Face value={3} transform="rotateY(90deg) translateZ(calc(clamp(35px, 12cqi, 60px) / 2))" />
        <Face value={4} transform="rotateY(-90deg) translateZ(calc(clamp(35px, 12cqi, 60px) / 2))" />
        <Face value={2} transform="rotateX(90deg) translateZ(calc(clamp(35px, 12cqi, 60px) / 2))" />
        <Face value={5} transform="rotateX(-90deg) translateZ(calc(clamp(35px, 12cqi, 60px) / 2))" />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-2">
      <div className="flex gap-4 justify-center">
        <Cube value={dice1} />
        <Cube value={dice2} />
      </div>

      <button
        onClick={rollDice}
        disabled={rolling || disabled}
        className={`mt-1 py-2 px-4 text-sm font-normal text-white rounded transition-all duration-200 bg-[rgba(74,146,240,0.49)] backdrop-blur-md border border-[rgba(35,90,178,0.15)] shadow-[0_4px_20px_rgba(0,0,0,0.4)] font-nunito ${rolling || disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
          }`}
        style={{ width: "clamp(90px, 28cqi, 140px)", fontSize: "clamp(11px, 2.8cqi, 16px)" }}
      >
        <Dices className="inline-block mr-1 -mt-1 align-middle" style={{ width: "clamp(14px, 3.5cqi, 20px)", height: "clamp(14px, 3.5cqi, 20px)" }} />
        {rolling ? "Rolling..." : "Roll Dice"}
      </button>
    </div>
  );
}
