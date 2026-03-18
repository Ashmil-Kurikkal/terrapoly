import React from "react";
import type { LogEntry } from "../hooks/useGameSocket";

const baseColors = ["#ff5e5e", "#5ea1ff", "#5eff9b", "#ffd45e"];

type PlayerInfo = { id: string; name: string };

/**
 * Renders a structured log entry with colored player names.
 * Replaces the local player's name with "You".
 */
export function renderLog(
    log: LogEntry,
    myPlayerId: string | null,
    allPlayers: PlayerInfo[]
): React.ReactNode[] {
    const { message, players } = log;

    if (!players || players.length === 0) {
        return [message];
    }

    // Build a map of player name → colored element
    const playerMap = new Map<string, { id: string; color: string }>();
    for (const p of players) {
        const idx = allPlayers.findIndex(ap => ap.id === p.id);
        const color = idx >= 0 ? baseColors[idx % baseColors.length] : "#ccc";
        playerMap.set(p.name, { id: p.id, color });
    }

    // Sort names by length (longest first) to avoid partial matches
    const sortedNames = [...playerMap.keys()].sort((a, b) => b.length - a.length);

    // Split the message by player names and wrap them in colored spans
    const parts: React.ReactNode[] = [];
    let remaining = message;
    let keyIdx = 0;

    while (remaining.length > 0) {
        let earliestIdx = Infinity;
        let matchedName = "";

        for (const name of sortedNames) {
            const idx = remaining.indexOf(name);
            if (idx !== -1 && idx < earliestIdx) {
                earliestIdx = idx;
                matchedName = name;
            }
        }

        if (matchedName && earliestIdx !== Infinity) {
            // Add text before the match
            if (earliestIdx > 0) {
                parts.push(remaining.slice(0, earliestIdx));
            }

            const info = playerMap.get(matchedName)!;
            const displayName = info.id === myPlayerId ? "You" : matchedName;

            parts.push(
                <span key={keyIdx++} style={{ color: info.color, fontWeight: 700 }}>
                    {displayName}
                </span>
            );

            remaining = remaining.slice(earliestIdx + matchedName.length);
        } else {
            parts.push(remaining);
            break;
        }
    }

    return parts;
}
