export interface Headline {
    id: string;
    title: string;
    description: string;
    impactChange: number;
    icon: string;
    type: 'positive' | 'negative';
}

export const HEADLINES: Headline[] = [
    // Positive Headlines
    {
        id: "h1",
        title: "Breakthrough in Fusion Energy",
        description: "A major research lab achieves net-positive fusion. Global markets soar on the news of limitless clean energy.",
        impactChange: 50,
        icon: "⚡",
        type: "positive"
    },
    {
        id: "h2",
        title: "Universal Literacy Milestone",
        description: "Global illiteracy rates hit an all-time low thanks to grassroots educational campaigns.",
        impactChange: 30,
        icon: "📚",
        type: "positive"
    },
    {
        id: "h3",
        title: "Pandemic Averted",
        description: "Early detection AI systems isolate a novel virus before it can spread internationally.",
        impactChange: 40,
        icon: "🛡️",
        type: "positive"
    },
    {
        id: "h4",
        title: "Historic Peace Treaty Signed",
        description: "Decades-long regional conflict ends with a comprehensive justice and reconciliation agreement.",
        impactChange: 60,
        icon: "🕊️",
        type: "positive"
    },
    {
        id: "h5",
        title: "Corporate Philanthropy Boom",
        description: "Top tech giants pledge billions to sustainable development, injecting capital into global projects.",
        impactChange: 45,
        icon: "🤝",
        type: "positive"
    },

    // Negative Headlines
    {
        id: "h6",
        title: "Global Supply Chain Collapse",
        description: "A critical maritime chokepoint is blocked, causing massive disruptions to project materials worldwide.",
        impactChange: -40,
        icon: "🚢",
        type: "negative"
    },
    {
        id: "h7",
        title: "Cyberattack on Global Banks",
        description: "A coordinated ransomware attack freezes assets. Your investments suffer a sudden liquidity crisis.",
        impactChange: -50,
        icon: "💻",
        type: "negative"
    },
    {
        id: "h8",
        title: "Historic Drought",
        description: "Failing crops and water scarcity severely impact agricultural and community development projects.",
        impactChange: -35,
        icon: "☀️",
        type: "negative"
    },
    {
        id: "h9",
        title: "Misinformation Epidemic",
        description: "Viral deepfakes cause public panic and distrust in scientific institutions.",
        impactChange: -25,
        icon: "📱",
        type: "negative"
    },
    {
        id: "h10",
        title: "Economic Recession Declared",
        description: "Global markets tumble as inflation soars. Funding for non-essential projects dries up overnight.",
        impactChange: -60,
        icon: "📉",
        type: "negative"
    }
];

export interface CrisisEffect {
    basePenalty: number;
    interdependentPenalty: number;
    affectedCategories: string[]; // e.g., 'Energy', 'Education'
    crisisName: string;
    description: string;
    interdependentMessage: string;
}

// Maps the lowest SDG category to its specific Crisis
export const CRISES: Record<string, CrisisEffect> = {
    'Climate': {
        crisisName: "Runaway Climate Catastrophe",
        description: "Ignored environmental warnings have led to devastating global superstorms. Infrastructure worldwide is severely damaged.",
        basePenalty: -30,
        affectedCategories: ['Health', 'Energy'],
        interdependentPenalty: -20,
        interdependentMessage: "Health and Energy projects took massive hits from infrastructure destruction!"
    },
    'Education': {
        crisisName: "Global Skills Shortage",
        description: "A generational lack of education funding has crippled the global workforce. Innovation and productivity grind to a halt.",
        basePenalty: -30,
        affectedCategories: ['Energy', 'Justice'], // "Economy" falls under Justice/Energy in this context usually, but we use board categories
        interdependentPenalty: -20,
        interdependentMessage: "Energy grids fail and Justice courts stall without qualified professionals to run them!"
    },
    'Health': {
        crisisName: "Global Pandemic",
        description: "Underfunded healthcare systems collapse under the strain of a rapidly spreading viral mutation.",
        basePenalty: -30,
        affectedCategories: ['Education', 'Justice'],
        interdependentPenalty: -20,
        interdependentMessage: "Schools close and courts shut down to prevent transmission!"
    },
    'Energy': {
        crisisName: "Global Blackout",
        description: "Aging and overburdened energy grids fail catastrophically across multiple continents.",
        basePenalty: -30,
        affectedCategories: ['Health', 'Climate'],
        interdependentPenalty: -20,
        interdependentMessage: "Hospitals lose power and Climate sensors go dark during the blackout!"
    },
    'Justice': {
        crisisName: "Institutional Collapse",
        description: "Rampant corruption and inequality lead to mass civil unrest and the breakdown of international law.",
        basePenalty: -30,
        affectedCategories: ['Education', 'Climate'],
        interdependentPenalty: -20,
        interdependentMessage: "Schools are looted and Climate treaties are abandoned during the chaos!"
    }
};

export function getRandomHeadline(type?: 'positive' | 'negative'): Headline {
    let pool = HEADLINES;
    if (type) {
        pool = HEADLINES.filter(h => h.type === type);
    }
    const index = Math.floor(Math.random() * pool.length);
    return pool[index];
}
