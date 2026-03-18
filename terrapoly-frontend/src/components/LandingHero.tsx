import { motion } from "framer-motion";
import { Globe, ArrowRight, BookOpen, HeartHandshake, Leaf, Target } from "lucide-react";

type LandingHeroProps = {
    onPlay: () => void;
};

export default function LandingHero({ onPlay }: LandingHeroProps) {
    const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="w-full min-h-screen bg-[#fdfbf7] flex flex-col font-nunito text-black overflow-y-auto">
            {/* HERO SECTION */}
            <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center justify-center min-h-screen">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: { scale: 0.8, opacity: 0 },
                        visible: { scale: 1, opacity: 1, transition: { type: "spring", bounce: 0.5 } }
                    }}
                    className="mb-8"
                >
                    <img src="/logo.png" alt="Terrapoly 2030" className="w-64 sm:w-80 md:w-[400px] h-auto object-contain drop-shadow-[4px_4px_0_rgba(0,0,0,1)]" />
                </motion.div>

                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    transition={{ delay: 0.2 }}
                    className="text-center max-w-3xl mb-12"
                >
                    <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight mb-6 leading-none">
                        Save the world. <br />
                        <span className="bg-[#4ade80] px-3 border-4 border-black inline-block transform -rotate-2 mt-2">One SDG at a time.</span>
                    </h1>
                    <p className="text-xl sm:text-2xl font-bold bg-[#fde047] border-[3px] border-black p-4 shadow-[4px_4px_0px_#000] rounded-xl inline-block transform rotate-1">
                        A fast-paced multiplayer board game where your investments literally change the future.
                    </p>
                </motion.div>

                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    transition={{ delay: 0.4 }}
                    className="flex flex-col sm:flex-row gap-4 sm:gap-6"
                >
                    <button
                        onClick={onPlay}
                        className="group relative px-8 py-4 bg-[#ff90e8] text-2xl font-black uppercase tracking-widest border-4 border-black rounded-xl shadow-[8px_8px_0px_#000] hover:translate-y-[4px] hover:translate-x-[4px] hover:shadow-[4px_4px_0px_#000] active:translate-y-[8px] active:translate-x-[8px] active:shadow-none transition-all flex items-center gap-3"
                    >
                        Play Now
                        <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
                    </button>

                    <button
                        onClick={() => document.getElementById("how-to-play")?.scrollIntoView({ behavior: "smooth" })}
                        className="px-8 py-4 bg-white text-xl font-bold uppercase tracking-widest border-4 border-black rounded-xl shadow-[6px_6px_0px_#000] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[4px_4px_0px_#000] active:translate-y-[6px] active:translate-x-[6px] active:shadow-none transition-all"
                    >
                        How to Play
                    </button>
                </motion.div>
            </header>

            {/* HOW TO PLAY SECTION */}
            <section id="how-to-play" className="w-full bg-[#93c5fd] border-y-4 border-black py-20 px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5 }}
                    className="max-w-7xl mx-auto"
                >
                    <div className="text-center mb-16">
                        <h2 className="text-5xl md:text-6xl font-black uppercase inline-block bg-white border-4 border-black px-6 py-2 shadow-[6px_6px_0px_#000] transform -rotate-1">
                            How to Play
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* 1. Explore & Invest */}
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_#000] rounded-2xl flex flex-col items-center text-center"
                        >
                            <div className="bg-[#4ade80] w-20 h-20 rounded-full border-4 border-black flex items-center justify-center mb-6 shadow-[4px_4px_0px_#000]">
                                <Globe className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-black uppercase mb-4">Explore & Invest</h3>
                            <p className="text-lg font-bold opacity-80">
                                Roll the dice and travel across the globe. Land on unowned projects and invest your Impact Points to claim them!
                            </p>
                        </motion.div>

                        {/* 2. Collect SDGs */}
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_#000] rounded-2xl flex flex-col items-center text-center transform translate-y-0 md:translate-y-8"
                        >
                            <div className="bg-[#fde047] w-20 h-20 rounded-full border-4 border-black flex items-center justify-center mb-6 shadow-[4px_4px_0px_#000]">
                                <Target className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-black uppercase mb-4">Collect SDGs</h3>
                            <p className="text-lg font-bold opacity-80">
                                Every property contributes to the UN Sustainable Development Goals. Track your SDG Portfolios and dominate categories.
                            </p>
                        </motion.div>

                        {/* 3. Donate & Survive */}
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_#000] rounded-2xl flex flex-col items-center text-center"
                        >
                            <div className="bg-[#ff90e8] w-20 h-20 rounded-full border-4 border-black flex items-center justify-center mb-6 shadow-[4px_4px_0px_#000]">
                                <HeartHandshake className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-black uppercase mb-4">Donate & Survive</h3>
                            <p className="text-lg font-bold opacity-80">
                                Land on another player's project? You must donate to the World Score. Help keep the global metrics above the collapse point!
                            </p>
                        </motion.div>
                    </div>
                </motion.div>
            </section>

            {/* SDGs EXPLAINED */}
            <section className="w-full bg-[#fdfbf7] py-20 px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12"
                >
                    <div className="flex-1">
                        <h2 className="text-4xl md:text-5xl font-black uppercase mb-6 leading-tight">
                            Your Investments <br />
                            <span className="text-[#ef4444]">Mean Everything.</span>
                        </h2>
                        <p className="text-xl font-bold mb-8 opacity-80">
                            Instead of bankrupting your friends like traditional games, Terrapoly challenges you to maximize your global impact across five key pillars: Climate, Education, Health, Energy, and Justice.
                        </p>
                        <ul className="space-y-4 font-black uppercase text-lg">
                            <li className="flex items-center gap-3">
                                <Leaf className="text-[#4ade80] w-6 h-6" /> Upgrade to Flagship levels.
                            </li>
                            <li className="flex items-center gap-3">
                                <Target className="text-[#3b82f6] w-6 h-6" /> Track the Global World Score.
                            </li>
                            <li className="flex items-center gap-3">
                                <BookOpen className="text-[#f59e0b] w-6 h-6" /> Prevent global collapse.
                            </li>
                        </ul>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-4">
                        <div className="bg-[#26B68A] h-32 border-4 border-black rounded-xl shadow-[4px_4px_0px_#000] transform -rotate-3 flex items-center justify-center text-white font-black text-2xl uppercase">Climate</div>
                        <div className="bg-[#E6A70A] h-32 border-4 border-black rounded-xl shadow-[4px_4px_0px_#000] transform rotate-2 flex items-center justify-center text-white font-black text-2xl uppercase">Education</div>
                        <div className="bg-[#2B77C2] h-32 border-4 border-black rounded-xl shadow-[4px_4px_0px_#000] transform rotate-1 flex items-center justify-center text-white font-black text-2xl uppercase">Health</div>
                        <div className="bg-[#E4693F] h-32 border-4 border-black rounded-xl shadow-[4px_4px_0px_#000] transform -rotate-2 flex items-center justify-center text-white font-black text-2xl uppercase">Energy</div>
                    </div>
                </motion.div>
            </section>

            {/* THE 17 GLOBAL GOALS */}
            <section className="w-full bg-[#fdfbf7] pb-20 px-4 sm:px-6 lg:px-8 border-t-0">
                <div className="max-w-7xl mx-auto flex flex-col items-center">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-black uppercase inline-block bg-[#4ade80] text-black border-4 border-black px-6 py-2 shadow-[6px_6px_0px_#000] transform -rotate-1">
                            The 17 Global Goals
                        </h2>
                        <p className="text-xl md:text-2xl font-bold mt-8 max-w-4xl mx-auto bg-white border-[3px] border-black p-6 shadow-[4px_4px_0px_#000] rounded-xl transform rotate-1">
                            The Sustainable Development Goals (SDGs) are a universal call to action. They aim to end poverty, protect the planet, and ensure peace and prosperity for all by 2030.
                            <br /><br />
                            <span className="text-[#ef4444] bg-[#fde047] px-2 py-1 leading-snug box-decoration-clone inline-block">In Terrapoly, every property accelerates one of these critical global missions.</span>
                        </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 gap-4 w-full place-items-center">
                        {Array.from({ length: 17 }).map((_, i) => {
                            const sdgColors = [
                                "#E5243B", "#DDA63A", "#4C9F38", "#C5192D", "#FF3A21", "#26BDE2",
                                "#FCC30B", "#A21942", "#FD6925", "#DD1367", "#FD9D24", "#BF8B2E",
                                "#3F7E44", "#0A97D9", "#56C02B", "#00689D", "#19486A"
                            ];
                            const sdgTitles = [
                                "No Poverty", "Zero Hunger", "Good Health", "Quality Education", "Gender Equality", "Clean Water",
                                "Clean Energy", "Decent Work", "Industry", "Inequalities", "Sustainable Cities", "Consumption",
                                "Climate Action", "Life Below Water", "Life on Land", "Peace & Justice", "Partnerships"
                            ];
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.05 }}
                                    whileHover={{ scale: 1.05, rotate: (i % 2 === 0 ? 3 : -3) }}
                                    className="w-full aspect-square border-4 border-black rounded-xl flex flex-col items-center justify-center p-2 shadow-[4px_4px_0px_#000] text-center cursor-default transition-transform"
                                    style={{ backgroundColor: sdgColors[i] }}
                                >
                                    <span className="text-white font-black text-4xl opacity-50 mb-2">{i + 1}</span>
                                    <span className="text-white font-black text-sm sm:text-base uppercase leading-tight drop-shadow-md">
                                        {sdgTitles[i]}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* COMPREHENSIVE RULEBOOK */}
            <section className="w-full bg-[#93c5fd] border-y-4 border-black py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto flex flex-col gap-8">
                    <div className="text-center mb-8">
                        <h2 className="text-4xl md:text-5xl font-black uppercase inline-block bg-white border-4 border-black px-6 py-2 shadow-[6px_6px_0px_#000] transform rotate-1">
                            The Rulebook
                        </h2>
                    </div>

                    {/* Rule Segment 1 */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        className="bg-white border-4 border-black p-6 sm:p-8 shadow-[8px_8px_0px_#000] rounded-xl flex items-start gap-4 sm:gap-6"
                    >
                        <div className="bg-[#4ade80] min-w-[3rem] h-12 flex items-center justify-center font-black text-2xl border-4 border-black shadow-[4px_4px_0px_#000] transform -rotate-2">1</div>
                        <div>
                            <h3 className="text-2xl font-black uppercase mb-2">Turn Flow & Setup</h3>
                            <p className="text-lg font-bold opacity-80">
                                <b>Setup:</b> Host a room and configure adding up to 3 AI Bots (Greedy, Eco-Warrior, Balanced) or wait for friends. Set the total number of rounds.
                                <br /><br />
                                <b>Your Turn:</b> Roll the dice to move your token around the board. Depending on where you land, you can invest in projects, pay impact dues (rent), or trigger global events/bonuses!
                            </p>
                        </div>
                    </motion.div>

                    {/* Rule Segment 2 */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        className="bg-[#fde047] border-4 border-black p-6 sm:p-8 shadow-[8px_8px_0px_#000] rounded-xl flex items-start gap-4 sm:gap-6"
                    >
                        <div className="bg-white min-w-[3rem] h-12 flex items-center justify-center font-black text-2xl border-4 border-black shadow-[4px_4px_0px_#000] transform rotate-2">2</div>
                        <div>
                            <h3 className="text-2xl font-black uppercase mb-2">Investments & Upgrades</h3>
                            <p className="text-lg font-bold opacity-80">
                                Land on an empty project? Buy it! Projects start at the <b>Seed Level</b>.
                                <br /><br />
                                Every time you pass START, you collect baseline impact points.
                                Land on your own project? You can upgrade it: <b>Seed → Expansion → Flagship</b>.
                                Each upgrade drastically increases the Global Score contribution and the dues others must pay when they land on it.
                            </p>
                        </div>
                    </motion.div>

                    {/* Rule Segment 3 */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        className="bg-white border-4 border-black p-6 sm:p-8 shadow-[8px_8px_0px_#000] rounded-xl flex items-start gap-4 sm:gap-6"
                    >
                        <div className="bg-[#ff90e8] min-w-[3rem] h-12 flex items-center justify-center font-black text-2xl border-4 border-black shadow-[4px_4px_0px_#000] transform -rotate-1">3</div>
                        <div>
                            <h3 className="text-2xl font-black uppercase mb-2">SDG Portfolio</h3>
                            <p className="text-lg font-bold opacity-80">
                                This is the core strategy! Every property belongs to a specific <b>UN Sustainable Development Goal (SDG)</b>.
                                <br /><br />
                                The Right Sidebar visually groups your properties into SDG Portfolios. Collaborate to take the global score beyond the threshold while also competing to outscore your opponents!
                            </p>
                        </div>
                    </motion.div>

                    {/* Rule Segment 4 */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        className="bg-[#ef4444] text-white border-4 border-black p-6 sm:p-8 shadow-[8px_8px_0px_#000] rounded-xl flex items-start gap-4 sm:gap-6"
                    >
                        <div className="bg-white text-black min-w-[3rem] h-12 flex items-center justify-center font-black text-2xl border-4 border-black shadow-[4px_4px_0px_#000] transform rotate-3">4</div>
                        <div>
                            <h3 className="text-2xl font-black uppercase mb-2">The Global "World Score"</h3>
                            <p className="text-lg font-bold opacity-90">
                                Players don't get bankrupted and eliminated! When you land on another player's property, the "Rent" you pay is actually a <b>Donation</b> towards the shared Global World Score and partially to the owner.
                                <br /><br />
                                <b>If you run out of Impact Points, you skip your action. The player with the highest total value at the max round limit wins.</b>
                            </p>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
