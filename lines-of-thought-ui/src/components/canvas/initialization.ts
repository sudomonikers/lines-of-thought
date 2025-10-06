import {
  BUILDING_COLORS,
  WINDOW_COLOR,
  BUILDING_CONFIG,
  TREE_CONFIG,
  PERSON_COLORS,
  PERSON_CONFIG,
  THOUGHT_CONFIG
} from './constants';
import type { Building, Tree, Person } from './types';

export function generateBuildings(canvasWidth: number, canvasHeight: number): Building[] {
  const buildings: Building[] = [];
  let currentX = 0;

  while (currentX < canvasWidth + 200) {
    const width = Math.floor(Math.random() * (BUILDING_CONFIG.MAX_WIDTH - BUILDING_CONFIG.MIN_WIDTH)) + BUILDING_CONFIG.MIN_WIDTH;
    const height = Math.floor(Math.random() * (BUILDING_CONFIG.MAX_HEIGHT - BUILDING_CONFIG.MIN_HEIGHT)) + BUILDING_CONFIG.MIN_HEIGHT;
    const building: Building = {
      x: currentX,
      y: canvasHeight - height,
      width,
      height,
      color: BUILDING_COLORS[Math.floor(Math.random() * BUILDING_COLORS.length)],
      windowColor: WINDOW_COLOR,
      windows: []
    };

    // Add windows
    for (let wy = building.y + BUILDING_CONFIG.WINDOW_OFFSET_TOP; wy < building.y + building.height - BUILDING_CONFIG.WINDOW_MARGIN_BOTTOM; wy += BUILDING_CONFIG.WINDOW_SPACING_Y) {
      for (let wx = building.x + BUILDING_CONFIG.WINDOW_MARGIN_SIDE; wx < building.x + building.width - BUILDING_CONFIG.WINDOW_MARGIN_SIDE; wx += BUILDING_CONFIG.WINDOW_SPACING_X) {
        if (Math.random() > (1 - BUILDING_CONFIG.WINDOW_VISIBLE_CHANCE)) {
          building.windows.push({ x: wx, y: wy });
        }
      }
    }

    buildings.push(building);
    currentX += width + Math.floor(Math.random() * (BUILDING_CONFIG.MAX_SPACING - BUILDING_CONFIG.MIN_SPACING)) + BUILDING_CONFIG.MIN_SPACING;
  }

  return buildings;
}

export function generateTrees(canvasWidth: number, canvasHeight: number): Tree[] {
  const trees: Tree[] = [];
  for (let i = 0; i < TREE_CONFIG.COUNT; i++) {
    trees.push({
      x: Math.random() * canvasWidth,
      y: canvasHeight - TREE_CONFIG.GROUND_OFFSET,
      height: Math.floor(Math.random() * (TREE_CONFIG.MAX_HEIGHT - TREE_CONFIG.MIN_HEIGHT)) + TREE_CONFIG.MIN_HEIGHT
    });
  }
  return trees;
}

export function generatePeople(canvasWidth: number, canvasHeight: number): Person[] {
  const people: Person[] = [];
  for (let i = 0; i < PERSON_CONFIG.COUNT; i++) {
    people.push({
      x: Math.random() * canvasWidth,
      y: canvasHeight - PERSON_CONFIG.GROUND_OFFSET,
      speed: Math.random() * (PERSON_CONFIG.MAX_SPEED - PERSON_CONFIG.MIN_SPEED) + PERSON_CONFIG.MIN_SPEED,
      direction: Math.random() > 0.5 ? 1 : -1,
      walkFrame: 0,
      color: PERSON_COLORS[Math.floor(Math.random() * PERSON_COLORS.length)],
      thoughtBubble: null,
      nextThoughtTime: Math.random() * THOUGHT_CONFIG.MAX_DELAY + THOUGHT_CONFIG.MIN_DELAY,
      isThinker: Math.random() < PERSON_CONFIG.THINKER_CHANCE
    });
  }
  return people;
}
