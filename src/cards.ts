/**
 * Card and Deck data model for myanki.
 *
 * Pure functions only. Persistence is in `./deck.ts`; HTTP layer in `./server.ts`;
 * CLI consumer in `./cli.ts`. Keeping this file side-effect-free keeps the
 * unit tests fast and lets warren agents reason about the data shape.
 */

export interface Card {
	readonly id: string;
	readonly question: string;
	readonly answer: string;
	readonly tags?: readonly string[];
	readonly createdAt: string;
}

export interface Deck {
	readonly id: string;
	readonly name: string;
	readonly cards: readonly Card[];
}

export class CardValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "CardValidationError";
	}
}

export function makeCard(input: {
	readonly question: string;
	readonly answer: string;
	readonly tags?: readonly string[];
}): Card {
	const question = input.question.trim();
	const answer = input.answer.trim();
	if (question === "") throw new CardValidationError("question must be non-empty");
	if (answer === "") throw new CardValidationError("answer must be non-empty");
	return {
		id: crypto.randomUUID(),
		question,
		answer,
		...(input.tags !== undefined ? { tags: input.tags } : {}),
		createdAt: new Date().toISOString(),
	};
}

export function addCardToDeck(deck: Deck, card: Card): Deck {
	if (deck.cards.some((c) => c.id === card.id)) {
		throw new CardValidationError(`card with id ${card.id} already in deck`);
	}
	return { ...deck, cards: [...deck.cards, card] };
}

export function removeCardFromDeck(deck: Deck, cardId: string): Deck {
	return { ...deck, cards: deck.cards.filter((c) => c.id !== cardId) };
}

export function pickRandomCard(deck: Deck, excludeIds: readonly string[] = []): Card | null {
	const exclude = new Set(excludeIds);
	const candidates = deck.cards.filter((c) => !exclude.has(c.id));
	if (candidates.length === 0) return null;
	const idx = Math.floor(Math.random() * candidates.length);
	// `noUncheckedIndexedAccess` widens the access to `Card | undefined`.
	const card = candidates[idx];
	return card ?? null;
}

export function filterByTags(deck: Deck, tags: readonly string[]): readonly Card[] {
	if (tags.length === 0) return deck.cards;
	const wanted = new Set(tags);
	return deck.cards.filter((c) => c.tags?.some((t) => wanted.has(t)) === true);
}

export function findCardById(deck: Deck, id: string): Card | null {
	return deck.cards.find((c) => c.id === id) ?? null;
}
