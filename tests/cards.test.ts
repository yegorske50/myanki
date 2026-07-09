import { describe, expect, test } from "bun:test";
import {
	addCardToDeck,
	CardValidationError,
	type Deck,
	filterByTags,
	findCardById,
	makeCard,
	pickRandomCard,
	removeCardFromDeck,
} from "../src/cards.ts";

const emptyDeck: Deck = { id: "test", name: "Test Deck", cards: [] };

describe("makeCard", () => {
	test("creates a card with required fields populated", () => {
		const card = makeCard({ question: "What is X?", answer: "Y" });
		expect(card.question).toBe("What is X?");
		expect(card.answer).toBe("Y");
		expect(card.id).toBeTruthy();
		expect(card.createdAt).toBeTruthy();
		expect(card.tags).toBeUndefined();
	});

	test("trims surrounding whitespace", () => {
		const card = makeCard({ question: "  X  ", answer: "  Y  " });
		expect(card.question).toBe("X");
		expect(card.answer).toBe("Y");
	});

	test("throws on empty question", () => {
		expect(() => makeCard({ question: "  ", answer: "Y" })).toThrow(CardValidationError);
	});

	test("throws on empty answer", () => {
		expect(() => makeCard({ question: "X", answer: "  " })).toThrow(CardValidationError);
	});

	test("preserves optional tags verbatim", () => {
		const card = makeCard({ question: "Q", answer: "A", tags: ["arrays", "hash"] });
		expect(card.tags).toEqual(["arrays", "hash"]);
	});
});

describe("addCardToDeck", () => {
	test("appends a card to an empty deck", () => {
		const card = makeCard({ question: "Q", answer: "A" });
		const updated = addCardToDeck(emptyDeck, card);
		expect(updated.cards).toHaveLength(1);
		expect(updated.cards[0]?.id).toBe(card.id);
	});

	test("does not mutate the input deck", () => {
		const card = makeCard({ question: "Q", answer: "A" });
		const original = emptyDeck;
		addCardToDeck(original, card);
		expect(original.cards).toHaveLength(0);
	});

	test("throws on duplicate id", () => {
		const card = makeCard({ question: "Q", answer: "A" });
		const withCard = addCardToDeck(emptyDeck, card);
		expect(() => addCardToDeck(withCard, card)).toThrow(CardValidationError);
	});
});

describe("removeCardFromDeck", () => {
	test("removes by id and returns a new deck", () => {
		const a = makeCard({ question: "Q1", answer: "A1" });
		const b = makeCard({ question: "Q2", answer: "A2" });
		const deck: Deck = addCardToDeck(addCardToDeck(emptyDeck, a), b);

		const after = removeCardFromDeck(deck, a.id);
		expect(after.cards).toHaveLength(1);
		expect(after.cards[0]?.id).toBe(b.id);
	});

	test("no-ops gracefully when id is not found", () => {
		const card = makeCard({ question: "Q", answer: "A" });
		const deck = addCardToDeck(emptyDeck, card);
		const after = removeCardFromDeck(deck, "no-such-id");
		expect(after.cards).toHaveLength(1);
	});
});

describe("pickRandomCard", () => {
	test("returns null on an empty deck", () => {
		expect(pickRandomCard(emptyDeck)).toBeNull();
	});

	test("returns a card when the deck is non-empty", () => {
		const card = makeCard({ question: "Q", answer: "A" });
		const deck = addCardToDeck(emptyDeck, card);
		const picked = pickRandomCard(deck);
		expect(picked?.id).toBe(card.id);
	});

	test("respects excludeIds", () => {
		const a = makeCard({ question: "Q1", answer: "A1" });
		const b = makeCard({ question: "Q2", answer: "A2" });
		const deck: Deck = addCardToDeck(addCardToDeck(emptyDeck, a), b);
		const picked = pickRandomCard(deck, [a.id]);
		expect(picked?.id).toBe(b.id);
	});

	test("returns null when all cards are excluded", () => {
		const a = makeCard({ question: "Q1", answer: "A1" });
		const deck = addCardToDeck(emptyDeck, a);
		expect(pickRandomCard(deck, [a.id])).toBeNull();
	});
});

describe("filterByTags", () => {
	test("returns all cards when no tags are passed", () => {
		const a = makeCard({ question: "Q1", answer: "A1", tags: ["x"] });
		const b = makeCard({ question: "Q2", answer: "A2" });
		const deck: Deck = addCardToDeck(addCardToDeck(emptyDeck, a), b);
		expect(filterByTags(deck, [])).toHaveLength(2);
	});

	test("returns only cards that carry at least one matching tag", () => {
		const a = makeCard({ question: "Q1", answer: "A1", tags: ["arrays"] });
		const b = makeCard({ question: "Q2", answer: "A2", tags: ["graphs"] });
		const deck: Deck = addCardToDeck(addCardToDeck(emptyDeck, a), b);
		const filtered = filterByTags(deck, ["arrays"]);
		expect(filtered).toHaveLength(1);
		expect(filtered[0]?.id).toBe(a.id);
	});
});

describe("findCardById", () => {
	test("returns the card when present", () => {
		const card = makeCard({ question: "Q", answer: "A" });
		const deck = addCardToDeck(emptyDeck, card);
		expect(findCardById(deck, card.id)?.question).toBe("Q");
	});

	test("returns null when not present", () => {
		expect(findCardById(emptyDeck, "missing")).toBeNull();
	});
});
