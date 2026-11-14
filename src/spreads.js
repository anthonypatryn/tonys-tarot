// The 8 sample spreads from the deck's instruction cards.
// Slot coordinates are in "slot units": x = card columns, y = card rows (center of each card).
// Positions are listed in draw order.

export const SPREADS = [
  {
    id: 'one-card',
    number: 1,
    name: 'One-Card Pull',
    blurb: 'A single card to reflect on. Great as a daily practice.',
    about: 'Pull one card, take in the image, and think about what it means for your life right now. Doing one card a day (and writing down what you notice) is a great way to get to know the deck and yourself.',
    questions: ['Where do I need to place my attention today?', 'What do I need to focus on?'],
    positions: [{ label: 'My feelings', x: 0, y: 0 }],
  },
  {
    id: 'resolving',
    number: 2,
    name: 'Resolving an Issue',
    blurb: 'Two cards: the problem, and advice for fixing it.',
    about: 'A quick look at how to resolve a problem. The left card shows the issue; the right card offers advice for resolving it. It adapts to almost any situation.',
    questions: ['How can I resolve the issue at hand?', 'What do I need to know to change this situation for the better?'],
    positions: [
      { label: 'Issue', x: -0.55, y: 0 },
      { label: 'Advice for resolution', x: 0.55, y: 0 },
    ],
  },
  {
    id: 'obstacles',
    number: 3,
    name: 'Overcoming Obstacles',
    blurb: 'What is holding you back, and how to move past it.',
    about: 'Use this to see which obstacle is holding you back. It clarifies the situation, what stands in the way, and how to get past it. Turn the cards over starting at the top, then bottom left, then bottom right.',
    questions: ['What situation in my life needs adjusting?', 'What obstacle stands in my way?', 'How can I move forward?'],
    positions: [
      { label: 'Current situation', x: 0, y: 0 },
      { label: 'Obstacle', x: -1, y: 1 },
      { label: 'Solution', x: 1, y: 1 },
    ],
  },
  {
    id: 'ppf',
    number: 4,
    name: 'Past, Present, and Future',
    blurb: 'How you got here, where you are, where it may go.',
    about: 'The left card shows how the situation came about, the middle card shows where things stand now, and the right card shows the likely outcome. Nothing about the future is set in stone. Use the three together to build a story about your direction, values, or goals.',
    questions: ['What do I need to understand about this situation?'],
    positions: [
      { label: 'Past', x: -1, y: 0 },
      { label: 'Present', x: 0, y: 0 },
      { label: 'Future', x: 1, y: 0 },
    ],
  },
  {
    id: 'relationships',
    number: 5,
    name: 'Relationships',
    blurb: 'Partners, friends, family: what each of you brings.',
    about: 'For partners, friends, or family. The top card is your feelings, the middle card is the other person’s feelings, and the bottom card is how you both affect the relationship. This spread works well with follow-up questions, so draw a clarifying card if you need one.',
    questions: ['How do this person and I feel toward each other right now?', 'How do we each influence our relationship?'],
    positions: [
      { label: 'My feelings', x: 0, y: 0 },
      { label: 'Other person’s feelings', x: 0, y: 1 },
      { label: 'Effect on relationship', x: 0, y: 2 },
    ],
  },
  {
    id: 'insight',
    number: 6,
    name: 'Gaining Insight',
    blurb: 'Three cards that tell a story about your question.',
    about: 'Hold a question or situation in mind while you shuffle, then pull three cards. Look at how they flow, the story they tell together, and the imagery, and let the message settle. Pull an extra card if you need more clarity.',
    questions: ['What insight can I gain into this topic or situation?'],
    positions: [
      { label: 'Insight', x: -1, y: 0 },
      { label: 'Further meaning', x: 0, y: 0 },
      { label: 'Final thought', x: 1, y: 0 },
    ],
  },
  {
    id: 'full-picture',
    number: 7,
    name: 'Seeing the Full Picture',
    blurb: 'A situation and the factors shaping it.',
    about: 'For when you need more information to see the whole picture. The top card is what you’re wondering about. The three cards below show what you need to know.',
    questions: ['What do I need to know about this situation?', 'What do I need to understand?'],
    positions: [
      { label: 'The situation', x: 0, y: 0 },
      { label: 'What I need to know', x: -1, y: 1 },
      { label: 'Influencing factors', x: 0, y: 1 },
      { label: 'My role in the situation', x: 1, y: 1 },
    ],
  },
  {
    id: 'unveiling',
    number: 8,
    name: 'Unveiling Insight',
    blurb: 'Five cards to uncover a hidden influence.',
    about: 'Use this when you need to uncover a hidden influence. It looks from the past into the future. The first card goes at the top, the second and third work from the bottom up, and the fourth and fifth complete a pyramid.',
    questions: ['How can I move forward from my hardship?', 'What stands in my way?'],
    positions: [
      { label: 'What is concealed', x: 0, y: 0 },
      { label: 'The past', x: -2, y: 1.35 },
      { label: 'The present', x: -1, y: 0.55 },
      { label: 'Advice', x: 1, y: 0.55 },
      { label: 'Likely outcome', x: 2, y: 1.35 },
    ],
  },
];

export const SPREAD_BY_ID = Object.fromEntries(SPREADS.map(s => [s.id, s]));

// Short reference meanings from the deck's "Overview of the 78 Cards" cards.
export const SUIT_MEANINGS = {
  Cups: 'emotions, feelings, and creativity',
  Pentacles: 'career, earthly possessions, and finances',
  Swords: 'logic, intellect, and actions',
  Wands: 'inspirations, ideas, and passions',
  'Major Arcana': 'major themes and life events (the Fool’s Journey)',
};
export const RANK_MEANINGS = {
  Ace: 'new beginnings', Two: 'balance', Three: 'creation', Four: 'foundation', Five: 'change',
  Six: 'harmony', Seven: 'reflection', Eight: 'mastery', Nine: 'accomplishment', Ten: 'completion',
  Page: 'youth, service, communication', Knight: 'movement, energy, action',
  Queen: 'compassion, creativity, caring', King: 'leadership, authority, accomplishment',
};

// The deck's own instruction cards (the EXTRAS), shown in the Guide.
export const GUIDE_CARDS = Array.from({ length: 28 }, (_, i) => `X-T${String(i + 1).padStart(2, '0')}`);
