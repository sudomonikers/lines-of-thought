// Canvas constants
export const PIXEL_SIZE = 4;

// Colors
export const BUILDING_COLORS = ['#3a3f52', '#4a4f62', '#2a2f42', '#5a5f72'];
export const WINDOW_COLOR = '#d8b86a';
export const PERSON_COLORS = ['#8b9dc3', '#a8b8d8', '#c8d5e8', '#6b7d8f', '#5a6578'];

// Sky gradient colors
export const SKY_GRADIENT = {
  TOP: '#1a1d2e',
  MIDDLE: '#2a2d3a',
  BOTTOM: '#3a3d4a'
};

// Moon
export const MOON_CONFIG = {
  X_PERCENT: 0.8,
  Y_PERCENT: 0.15,
  SIZE: 60,
  GLOW_PADDING: 8,
  BODY_COLOR: '#f8f8e0',
  GLOW_COLOR: '#e8e8d0',
  CRATER_COLOR: '#e0e0c8'
};

// Stars
export const STAR_CONFIG = {
  COUNT: 80,
  COLOR: '#ffffff',
  MAX_HEIGHT_PERCENT: 0.6
};

// Buildings
export const BUILDING_CONFIG = {
  MIN_WIDTH: 60,
  MAX_WIDTH: 140,
  MIN_HEIGHT: 150,
  MAX_HEIGHT: 350,
  MIN_SPACING: 10,
  MAX_SPACING: 30,
  WINDOW_SPACING_X: 20,
  WINDOW_SPACING_Y: 24,
  WINDOW_OFFSET_TOP: 20,
  WINDOW_MARGIN_SIDE: 12,
  WINDOW_MARGIN_BOTTOM: 10,
  WINDOW_VISIBLE_CHANCE: 0.7,
  WINDOW_SIZE_WIDTH: 8,
  WINDOW_SIZE_HEIGHT: 12,
  WINDOW_FLICKER_CHANCE: 0.002
};

// Ground/Street
export const GROUND_CONFIG = {
  HEIGHT: 30,
  COLOR: '#4a4f62',
  EDGE_COLOR: '#6a6f82',
  EDGE_HEIGHT: 2,
  LINE_SPACING: 40,
  LINE_WIDTH: 20,
  LINE_HEIGHT: 2,
  LINE_Y_OFFSET: 15,
  LINE_COLOR: '#d8b86a'
};

// Trees
export const TREE_CONFIG = {
  COUNT: 12,
  MIN_HEIGHT: 40,
  MAX_HEIGHT: 70,
  GROUND_OFFSET: 30,
  TRUNK_COLOR: '#5a4a3a',
  TRUNK_WIDTH_RATIO: 0.17,
  TRUNK_HEIGHT_RATIO: 0.4,
  CANOPY_WIDTH_RATIO: 0.6,
  CANOPY_HEIGHT_RATIO: 0.6,
  LAYER_COLORS: ['#4a6a4a', '#5a7a5a', '#6a8a6a']
};

// People
export const PERSON_CONFIG = {
  COUNT: 8,
  MIN_SPEED: 0.1,
  MAX_SPEED: 0.3,
  GROUND_OFFSET: 20,
  THINKER_CHANCE: 0.3,
  BODY_WIDTH: 8,
  BODY_HEIGHT: 12,
  BODY_Y_OFFSET: 16,
  HEAD_SIZE: 8,
  HEAD_Y_OFFSET: 24,
  LEG_WIDTH: 3,
  LEG_HEIGHT: 4,
  LEG_Y_OFFSET: 4,
  LEG_X_START: 1,
  LEG_X_ANIMATED: 5,
  ARM_WIDTH: 2,
  ARM_HEIGHT: 6,
  ARM_Y_OFFSET: 12,
  ARM_X_LEFT: -2,
  ARM_X_RIGHT: 8,
  WALK_ANIMATION_SPEED: 0.3,
  WALK_ANIMATION_AMPLITUDE: 3,
  EDGE_BUFFER: 20
};

// Thought bubbles
export const THOUGHT_CONFIG = {
  MIN_DELAY: 200,
  MAX_DELAY: 500,
  LIFETIME: 1200,
  Y_OFFSET: 60,
  MIN_WIDTH: 60,
  PADDING: 16,
  HEIGHT: 32,
  BG_COLOR: '#f0f0f0',
  INNER_COLOR: '#ffffff',
  TEXT_COLOR: '#2a2d3a',
  BORDER_PADDING: 3,
  BORDER_INNER_PADDING: 6,
  TAIL_X_OFFSET: 2,
  TAIL_Y_OFFSET_1: 32,
  TAIL_SIZE_1: 6,
  TAIL_X_OFFSET_2: 4,
  TAIL_Y_OFFSET_2: 28,
  TAIL_SIZE_2: 4,
  TEXT_Y_OFFSET: 44,
  FONT: '11px Courier New',
  FADE_DURATION: 20
};

// Philosophical thought texts
export const THOUGHT_TEXTS = [
  'I think therefore I am',
  'Know thyself',
  'The unexamined life...',
  'To be is to be perceived',
  'I know that I know nothing',
  'God is dead',
  'Cogito, ergo sum',
  'All is flux',
  'The only constant is change',
  'Man is the measure',
  'Life is suffering',
  'Existence precedes essence',
  'Being and nothingness',
  'Time is an illusion'
];
