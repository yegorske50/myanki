/**
 * HTTP server for myanki.
 *
 * `Bun.serve` over port 3000 (overridable via MYANKI_PORT). Serves static
 * assets from `public/`, JSON API for the deck, and a small handful of
 * REST endpoints that map 1:1 to the `cards.ts` operations.
 *
 * Persistence is via `src/deck.ts`; the active deck file path is
 * `MYANKI_DATA` or `<cwd>/data/deck.json`. If the file doesn't exist,
 * the loader seeds it from DEFAULT_DECK.
 */

import { join } from "node:path";
import {
	addCardToDeck,
	CardValidationError,
	type Deck,
	makeCard,
	pickRandomCard,
	removeCardFromDeck,
} from "./cards.ts";
import { loadDeck, saveDeck } from "./deck.ts";

const PORT = Number(process.env.MYANKI_PORT ?? "3000");
const DATA_PATH = process.env.MYANKI_DATA ?? join(process.cwd(), "data", "deck.json");
const PUBLIC_DIR = join(import.meta.dir, "..", "public");

let deck: Deck = await loadDeck(DATA_PATH);

async function persist(): Promise<void> {
	await saveDeck(DATA_PATH, deck);
}

function jsonResponse(body: unknown, status = 200): Response {
	return Response.json(body, { status });
}

function errorResponse(err: unknown): Response {
	const message = err instanceof Error ? err.message : "internal error";
	return jsonResponse({ error: message }, 400);
}

async function readJsonBody<T>(req: Request): Promise<T> {
	const text = await req.text();
	if (text === "") return {} as T;
	return JSON.parse(text) as T;
}

Bun.serve({
	port: PORT,
	async fetch(req: Request): Promise<Response> {
		const url = new URL(req.url);
		const path = url.pathname;

		try {
			// Static assets
			if (path === "/" || path === "/index.html") {
				return new Response(Bun.file(join(PUBLIC_DIR, "index.html")));
			}
			if (path === "/app.js") {
				return new Response(Bun.file(join(PUBLIC_DIR, "app.js")), {
					headers: { "content-type": "application/javascript" },
				});
			}
			if (path === "/style.css") {
				return new Response(Bun.file(join(PUBLIC_DIR, "style.css")), {
					headers: { "content-type": "text/css" },
				});
			}

			// API
			if (path === "/api/deck" && req.method === "GET") {
				return jsonResponse(deck);
			}
			if (path === "/api/next" && req.method === "GET") {
				const card = pickRandomCard(deck);
				if (card === null) return new Response(null, { status: 204 });
				return jsonResponse(card);
			}
			if (path === "/api/cards" && req.method === "POST") {
				const body = await readJsonBody<{
					question?: unknown;
					answer?: unknown;
					tags?: unknown;
				}>(req);
				const question = typeof body.question === "string" ? body.question : "";
				const answer = typeof body.answer === "string" ? body.answer : "";
				const tags = Array.isArray(body.tags)
					? body.tags.filter((t): t is string => typeof t === "string")
					: undefined;
				const card = makeCard({
					question,
					answer,
					...(tags !== undefined ? { tags } : {}),
				});
				deck = addCardToDeck(deck, card);
				await persist();
				return jsonResponse(card, 201);
			}
			const deleteMatch = path.match(/^\/api\/cards\/([\w-]+)$/);
			if (deleteMatch !== null && req.method === "DELETE") {
				const id = deleteMatch[1];
				if (id === undefined) return new Response(null, { status: 400 });
				deck = removeCardFromDeck(deck, id);
				await persist();
				return new Response(null, { status: 204 });
			}

			return new Response("not found", { status: 404 });
		} catch (err) {
			if (err instanceof CardValidationError) {
				return errorResponse(err);
			}
			console.error("unhandled error:", err);
			return errorResponse(err);
		}
	},
});

console.log(`myanki listening on http://localhost:${PORT}`);
console.log(`deck data at ${DATA_PATH}`);
