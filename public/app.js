/* eslint-env browser */
const $ = (id) => document.getElementById(id);

const state = {
	deck: { id: "default", name: "", cards: [] },
	current: null,
	flipped: false,
};

function setStatus(text, isError = false) {
	const el = $("add-status");
	el.textContent = text;
	el.style.color = isError ? "var(--accent)" : "var(--muted)";
}

async function loadDeck() {
	const res = await fetch("/api/deck");
	if (!res.ok) {
		setStatus("failed to load deck", true);
		return;
	}
	state.deck = await res.json();
	$("deck-name").textContent = `${state.deck.name} — ${state.deck.cards.length} cards`;
	$("card-count").textContent =
		`${state.deck.cards.length} card${state.deck.cards.length === 1 ? "" : "s"}`;
	renderCardList();
	await nextCard();
}

async function nextCard() {
	const res = await fetch("/api/next");
	if (res.status === 204) {
		state.current = null;
		state.flipped = false;
		$("question").textContent = "All cards reviewed. Add more or click Next to recyle.";
		$("answer").textContent = "";
		$("front-face")?.classList.remove("hidden");
		$("back-face").classList.add("hidden");
		$("flip").classList.add("hidden");
		$("next").classList.remove("hidden");
		return;
	}
	state.current = await res.json();
	state.flipped = false;
	$("question").textContent = state.current.question;
	$("answer").textContent = state.current.answer;
	$("front-face")?.classList.remove("hidden");
	$("back-face").classList.add("hidden");
	$("flip").classList.remove("hidden");
	$("next").classList.add("hidden");
}

function flip() {
	if (state.current === null) return;
	state.flipped = true;
	$("back-face").classList.remove("hidden");
	$("flip").classList.add("hidden");
	$("next").classList.remove("hidden");
}

function renderCardList() {
	const ul = $("card-list");
	ul.innerHTML = "";
	for (const card of state.deck.cards) {
		const li = document.createElement("li");
		const q = document.createElement("div");
		q.className = "q";
		q.textContent = card.question;
		const a = document.createElement("div");
		a.className = "a";
		a.textContent = card.answer;
		li.append(q, a);
		if (card.tags && card.tags.length > 0) {
			const tags = document.createElement("div");
			tags.className = "tags";
			for (const tag of card.tags) {
				const span = document.createElement("span");
				span.className = "tag";
				span.textContent = tag;
				tags.appendChild(span);
			}
			li.appendChild(tags);
		}
		ul.appendChild(li);
	}
}

async function addCard(evt) {
	evt.preventDefault();
	const form = evt.currentTarget;
	const data = {
		question: form.question.value,
		answer: form.answer.value,
		tags: form.tags.value
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean),
	};
	const res = await fetch("/api/cards", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(data),
	});
	if (!res.ok) {
		const err = await res.json().catch(() => ({ error: "unknown" }));
		setStatus(`❌ ${err.error ?? "failed to add card"}`, true);
		return;
	}
	setStatus("✅ added");
	form.reset();
	await loadDeck();
}

$("flip").addEventListener("click", flip);
$("next").addEventListener("click", nextCard);
$("add-form").addEventListener("submit", addCard);

loadDeck();
