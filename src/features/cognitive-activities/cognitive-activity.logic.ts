export type CognitiveCard = {
  id: string;
  pairId: "leaf" | "cup" | "music";
  label: string;
};

export type CognitiveActivityState = {
  openCardIds: string[];
  matchedPairIds: CognitiveCard["pairId"][];
  mismatchPending: boolean;
};

const pairs = [
  { pairId: "leaf" as const, label: "Daun" },
  { pairId: "cup" as const, label: "Cangkir" },
  { pairId: "music" as const, label: "Musik" },
];

export function createCognitiveDeck(pairCount: 2 | 3): CognitiveCard[] {
  const selectedPairs = pairs.slice(0, pairCount);
  return [
    ...selectedPairs.map((pair) => ({ ...pair, id: `${pair.pairId}-a` })),
    ...selectedPairs.map((pair) => ({ ...pair, id: `${pair.pairId}-b` })),
  ];
}

export function createCognitiveActivityState(): CognitiveActivityState {
  return { openCardIds: [], matchedPairIds: [], mismatchPending: false };
}

export function selectCognitiveCard(
  state: CognitiveActivityState,
  card: CognitiveCard,
  deck: CognitiveCard[],
): CognitiveActivityState {
  if (
    state.mismatchPending ||
    state.openCardIds.includes(card.id) ||
    state.matchedPairIds.includes(card.pairId)
  ) {
    return state;
  }

  if (state.openCardIds.length === 0) {
    return { ...state, openCardIds: [card.id] };
  }

  const firstCard = deck.find((item) => item.id === state.openCardIds[0]);
  if (!firstCard) return createCognitiveActivityState();

  if (firstCard.pairId === card.pairId) {
    return {
      openCardIds: [],
      matchedPairIds: [...state.matchedPairIds, card.pairId],
      mismatchPending: false,
    };
  }

  return {
    ...state,
    openCardIds: [firstCard.id, card.id],
    mismatchPending: true,
  };
}

export function dismissCognitiveMismatch(state: CognitiveActivityState): CognitiveActivityState {
  return state.mismatchPending ? { ...state, openCardIds: [], mismatchPending: false } : state;
}

export function isCognitiveActivityComplete(state: CognitiveActivityState, pairCount: 2 | 3) {
  return state.matchedPairIds.length === pairCount;
}
