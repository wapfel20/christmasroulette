export enum SegmentColor {
  RED = '#D42426',
  GREEN = '#2F5D35',
  WHITE = '#FDFBF7',
  GOLD = '#EAB308',
  SKY = '#7DD3FC',
  MIDNIGHT = '#1E3A8A',
  BEIGE = '#F3E5AB',
  
  // Wrapping Paper Patterns
  // 1. Santa's Choice 1
  PATTERN_CANDY_CANE = 'url(#pattern-candy-cane)',
  // 2. Fresh From The Sleigh
  PATTERN_SNOWFLAKE_BLUE = 'url(#pattern-snowflake-blue)',
  // 3. Santa's Choice 2
  PATTERN_RED_DOTS = 'url(#pattern-red-dots)',
  // 4. The Sticky Bandit
  PATTERN_PLAID = 'url(#pattern-plaid)',
  // 5. The Ice Breaker
  PATTERN_GOLD_FOIL = 'url(#pattern-gold-foil)',
  // 6. Santa's Choice 3
  PATTERN_STRIPES_RG = 'url(#pattern-stripes-rg)',
  // 7. Shake The Box
  PATTERN_KRAFT = 'url(#pattern-kraft)',
  // 8. Santa's Choice 4
  PATTERN_ZIGZAG_RED = 'url(#pattern-zigzag-red)',
  // 9. The Fruitcake Shuffle
  PATTERN_HOLLY = 'url(#pattern-holly)',
  // 10. Silent Night
  PATTERN_MIDNIGHT = 'url(#pattern-midnight)',
  // 11. Santa's Choice 5
  PATTERN_SNOWFLAKE_RED = 'url(#pattern-snowflake-red)',
  // 12. Rudolph's Radar
  PATTERN_GINGERBREAD = 'url(#pattern-gingerbread)',
}

export interface WheelSegment {
  id: string;
  label: string;
  description: string;
  color: SegmentColor | string;
  textColor: string;
  icon: string;
}

export interface Player {
  id: string;
  name: string;
  hasGone: boolean;
  giftNumber?: number;
}

export enum GameState {
  LOBBY = 'LOBBY',
  DETERMINING_ORDER = 'DETERMINING_ORDER',
  PLAYING = 'PLAYING',
  FINISHED = 'FINISHED',
}