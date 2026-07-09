/**
 * Terminal flashcard session.
 *
 * Usage: `bun run cli`
 *
 * Reads one line per turn from stdin:
 *   ENTER       → reveal the answer
 *   n + ENTER   → next card
 *   q + ENTER   → quit
 *
 * Cycles through cards once, then resets `seen` so every card can come
 * up again. No persistence beyond "which ids have already been shown
 * this session" — review state belongs in the JSON file (future work).
 */

import { join } from "node:path";
import { type Card, pickRandomCard } from "./cards.ts";
import { loadDeck } from "./deck.ts";

const DATA_PATH = process.env.MYANKI_DATA ?? join(process.cwd(), "data", "deck.json");

function readLine(): Promise<string> {
	return new Promise((resolve) => {
		const onData = (chunk: Buffer): void => {
			const s = chunk.toString("utf8");
			const idx = s.indexOf("\n");
			if (idx >= 0) {
				process.stdin.off("data", onData);
				const line = s.slice(0, idx);
				// Drain any leftover bytes from this chunk so the next read
				// starts cleanly. We don't currently support partial-line
				// buffering — but in practice one read per ENTER is enough.
				if (idx + 1 < s.length) {
					process.stdin.unshift(s.slice(idx + 1));
				}
				resolve(line);
			} else {
				// Edge case: data without newline yet (EOF mid-line). Read once more.
				process.stdin.once("data", onData);
			}
		};
		process.stdin.on("data", onData);
		process.stdin.once("end", () => resolve(""));
	});
}

async function studyCard(card: Card): Promise<"next" | "quit"> {
	console.log(`Q: ${card.question}`);
	process.stdout.write("(ENTER to flip, q to quit) > ");
	const flip = (await readLine()).trim();
	if (flip === "q") return "quit";
	console.log(`A: ${card.answer}`);
	process.stdout.write("(n) next  (q) quit  > ");
	const next = (await readLine()).trim();
	if (next === "q") return "quit";
	return "next";
}

async function main(): Promise<void> {
	const deck = await loadDeck(DATA_PATH);
	if (deck.cards.length === 0) {
		console.log(
			"Deck is empty. Add some cards via the web UI (bun run dev) or copy data/deck.json.example to data/deck.json.",
		);
		return;
	}
	console.log("");
	console.log(`📚 ${deck.name} — ${deck.cards.length} card${deck.cards.length === 1 ? "" : "s"}`);
	console.log("");
	const seen = new Set<string>();
	for (;;) {
		const card = pickRandomCard(deck, Array.from(seen));
		if (card === null) {
			console.log("");
			console.log("✓ Cycled through every card. Restarting.");
			console.log("");
			seen.clear();
			continue;
		}
		const result = await studyCard(card);
		if (result === "quit") {
			console.log("");
			console.log("Bye.");
			return;
		}
		seen.add(card.id);
		console.log("");
	}
}

await main();
