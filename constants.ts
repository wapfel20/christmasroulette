import { SegmentColor, WheelSegment } from './types';

const SANTAS_CHOICE_DESC = "You are on the Nice List. You may Unwrap a New Gift OR Steal an available gift.";

export const WHEEL_SEGMENTS: WheelSegment[] = [
  {
    id: '1',
    label: "Santa's Choice",
    description: SANTAS_CHOICE_DESC,
    color: SegmentColor.PATTERN_CANDY_CANE,
    textColor: '#FFFFFF',
    icon: 'santa'
  },
  {
    id: '2',
    label: "Fresh From Sleigh",
    description: "No stealing allowed! You must pick a wrapped gift from the center pile.",
    color: SegmentColor.PATTERN_SNOWFLAKE_BLUE,
    textColor: '#FFFFFF',
    icon: 'snowflake'
  },
  {
    id: '3',
    label: "Santa's Choice",
    description: SANTAS_CHOICE_DESC,
    color: SegmentColor.PATTERN_RED_DOTS,
    textColor: '#FFFFFF',
    icon: 'santa'
  },
  {
    id: '4',
    label: "The Sticky Bandit",
    description: "You must steal an open gift from someone else. You cannot open a new gift.",
    color: SegmentColor.PATTERN_PLAID,
    textColor: '#FFFFFF',
    icon: 'hand'
  },
  {
    id: '5',
    label: "The Ice Breaker",
    description: "You may steal a Frozen (locked) gift that has already been stolen 3 times.",
    color: SegmentColor.PATTERN_GOLD_FOIL,
    textColor: '#713f12', // Dark Brown text for Gold
    icon: 'hammer'
  },
  {
    id: '6',
    label: "Santa's Choice",
    description: SANTAS_CHOICE_DESC,
    color: SegmentColor.PATTERN_STRIPES_RG,
    textColor: '#FFFFFF',
    icon: 'santa'
  },
  {
    id: '7',
    label: "Shake The Box",
    description: "Pick a wrapped gift and unwrap it privately. You may Keep it or Re-wrap and steal.",
    color: SegmentColor.PATTERN_KRAFT,
    textColor: '#422006', // Dark Brown text for Kraft
    icon: 'box'
  },
  {
    id: '8',
    label: "Santa's Choice",
    description: SANTAS_CHOICE_DESC,
    color: SegmentColor.PATTERN_ZIGZAG_RED,
    textColor: '#FFFFFF',
    icon: 'santa'
  },
  {
    id: '9',
    label: "Fruitcake Shuffle",
    description: "Unwrap a new gift. You must immediately swap it with the person holding the lowest number.",
    color: SegmentColor.PATTERN_HOLLY,
    textColor: '#14532d', // Dark Green for light holly background
    icon: 'shuffle'
  },
  {
    id: '10',
    label: "Silent Night",
    description: "Take a normal turn. Afterward, you receive the Immunity Token.",
    color: SegmentColor.PATTERN_MIDNIGHT,
    textColor: '#fbbf24', // Amber/Gold text
    icon: 'moon'
  },
  {
    id: '11',
    label: "Santa's Choice",
    description: SANTAS_CHOICE_DESC,
    color: SegmentColor.PATTERN_SNOWFLAKE_RED,
    textColor: '#FFFFFF',
    icon: 'santa'
  },
  {
    id: '12',
    label: "Rudolph's Radar",
    description: "You must steal from a person matching a criteria announced by the host.",
    color: SegmentColor.PATTERN_GINGERBREAD,
    textColor: '#FFFFFF',
    icon: 'radar'
  }
];