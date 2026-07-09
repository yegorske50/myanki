/**
 * File-based persistence for decks.
 *
 * One JSON file per deck under `data/<deck-id>.json`. Reads return the
 * default empty deck when the file is absent so a fresh checkout can run
 * without manual seeding; writers ensure the parent directory exists.
 */

import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Deck } from "./cards.ts";

export const DEFAULT_DECK: Deck = {
	id: "default",
	name: "LeetCode Patterns",
	cards: [],
};

export async function loadDeck(path: string): Promise<Deck> {
	if (!existsSync(path)) return DEFAULT_DECK;
	const raw = await readFile(path, "utf8");
	const parsed = JSON.parse(raw) as unknown;
	if (
		typeof parsed !== "object" ||
		parsed === null ||
		typeof (parsed as { id?: unknown }).id !== "string" ||
		!Array.isArray((parsed as { cards?: unknown }).cards)
	) {
		throw new Error(`malformed deck file at ${path}: expected { id: string, cards: [] }`);
	}
	return parsed as Deck;
}

export async function saveDeck(path: string, deck: Deck): Promise<void> {
	await mkdir(dirname(path), { recursive: true });
	await writeFile(path, JSON.stringify(deck, null, "\t"), "utf8");
}

export function deckPath(dataDir: string, deckId: string): string {
	return join(dataDir, `${deckId}.json`);
}
