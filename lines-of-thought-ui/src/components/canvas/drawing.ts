import { PIXEL_SIZE, TREE_CONFIG, PERSON_CONFIG, THOUGHT_CONFIG } from './constants';
import type { Tree, Person } from './types';

// Draw pixelated rectangle
export function drawPixelRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string
) {
  ctx.fillStyle = color;
  const pixelX = Math.floor(x / PIXEL_SIZE) * PIXEL_SIZE;
  const pixelY = Math.floor(y / PIXEL_SIZE) * PIXEL_SIZE;
  const pixelWidth = Math.ceil(width / PIXEL_SIZE) * PIXEL_SIZE;
  const pixelHeight = Math.ceil(height / PIXEL_SIZE) * PIXEL_SIZE;
  ctx.fillRect(pixelX, pixelY, pixelWidth, pixelHeight);
}

// Draw tree
export function drawTree(ctx: CanvasRenderingContext2D, tree: Tree) {
  const { x, y, height } = tree;
  const trunkWidth = height * TREE_CONFIG.TRUNK_WIDTH_RATIO;
  const trunkHeight = height * TREE_CONFIG.TRUNK_HEIGHT_RATIO;
  const canopyWidth = height * TREE_CONFIG.CANOPY_WIDTH_RATIO;
  const canopyHeight = height * TREE_CONFIG.CANOPY_HEIGHT_RATIO;

  // Tree trunk
  drawPixelRect(ctx, x - trunkWidth / 2, y - trunkHeight, trunkWidth, trunkHeight, TREE_CONFIG.TRUNK_COLOR);

  // Tree canopy (triangular/bushy shape using rectangles)
  const canopyY = y - trunkHeight - canopyHeight;

  // Bottom layer
  drawPixelRect(
    ctx,
    x - canopyWidth / 2,
    canopyY + canopyHeight * 0.6,
    canopyWidth,
    canopyHeight * 0.4,
    TREE_CONFIG.LAYER_COLORS[0]
  );

  // Middle layer
  drawPixelRect(
    ctx,
    x - (canopyWidth * 0.7) / 2,
    canopyY + canopyHeight * 0.3,
    canopyWidth * 0.7,
    canopyHeight * 0.4,
    TREE_CONFIG.LAYER_COLORS[1]
  );

  // Top layer
  drawPixelRect(
    ctx,
    x - (canopyWidth * 0.4) / 2,
    canopyY,
    canopyWidth * 0.4,
    canopyHeight * 0.4,
    TREE_CONFIG.LAYER_COLORS[2]
  );
}

// Draw person
export function drawPerson(ctx: CanvasRenderingContext2D, person: Person) {
  const { x, y, color, walkFrame } = person;
  const legOffset = Math.sin(walkFrame * PERSON_CONFIG.WALK_ANIMATION_SPEED) * PERSON_CONFIG.WALK_ANIMATION_AMPLITUDE;

  // Body
  drawPixelRect(ctx, x, y - PERSON_CONFIG.BODY_Y_OFFSET, PERSON_CONFIG.BODY_WIDTH, PERSON_CONFIG.BODY_HEIGHT, color);

  // Head
  drawPixelRect(ctx, x, y - PERSON_CONFIG.HEAD_Y_OFFSET, PERSON_CONFIG.HEAD_SIZE, PERSON_CONFIG.HEAD_SIZE, color);

  // Legs (animated)
  drawPixelRect(ctx, x + PERSON_CONFIG.LEG_X_START, y - PERSON_CONFIG.LEG_Y_OFFSET, PERSON_CONFIG.LEG_WIDTH, PERSON_CONFIG.LEG_HEIGHT, color);
  drawPixelRect(ctx, x + PERSON_CONFIG.LEG_X_ANIMATED + legOffset, y - PERSON_CONFIG.LEG_Y_OFFSET, PERSON_CONFIG.LEG_WIDTH, PERSON_CONFIG.LEG_HEIGHT, color);

  // Arms
  drawPixelRect(ctx, x + PERSON_CONFIG.ARM_X_LEFT, y - PERSON_CONFIG.ARM_Y_OFFSET, PERSON_CONFIG.ARM_WIDTH, PERSON_CONFIG.ARM_HEIGHT, color);
  drawPixelRect(ctx, x + PERSON_CONFIG.ARM_X_RIGHT, y - PERSON_CONFIG.ARM_Y_OFFSET, PERSON_CONFIG.ARM_WIDTH, PERSON_CONFIG.ARM_HEIGHT, color);
}

// Draw thought bubble
export function drawThoughtBubble(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, alpha: number) {
  ctx.globalAlpha = alpha;

  // Measure text to size bubble
  ctx.font = THOUGHT_CONFIG.FONT;
  const textMetrics = ctx.measureText(text);
  const textWidth = textMetrics.width;
  const bubbleWidth = Math.max(textWidth + THOUGHT_CONFIG.PADDING, THOUGHT_CONFIG.MIN_WIDTH);

  // Bubble background
  drawPixelRect(ctx, x - bubbleWidth / 2, y - THOUGHT_CONFIG.Y_OFFSET, bubbleWidth, THOUGHT_CONFIG.HEIGHT, THOUGHT_CONFIG.BG_COLOR);
  drawPixelRect(
    ctx,
    x - bubbleWidth / 2 + THOUGHT_CONFIG.BORDER_PADDING,
    y - THOUGHT_CONFIG.Y_OFFSET + THOUGHT_CONFIG.BORDER_PADDING,
    bubbleWidth - THOUGHT_CONFIG.BORDER_INNER_PADDING,
    THOUGHT_CONFIG.HEIGHT - THOUGHT_CONFIG.BORDER_INNER_PADDING,
    THOUGHT_CONFIG.INNER_COLOR
  );

  // Bubble tail (small circles)
  drawPixelRect(ctx, x + THOUGHT_CONFIG.TAIL_X_OFFSET, y - THOUGHT_CONFIG.TAIL_Y_OFFSET_1, THOUGHT_CONFIG.TAIL_SIZE_1, THOUGHT_CONFIG.TAIL_SIZE_1, THOUGHT_CONFIG.BG_COLOR);
  drawPixelRect(ctx, x + THOUGHT_CONFIG.TAIL_X_OFFSET_2, y - THOUGHT_CONFIG.TAIL_Y_OFFSET_2, THOUGHT_CONFIG.TAIL_SIZE_2, THOUGHT_CONFIG.TAIL_SIZE_2, THOUGHT_CONFIG.BG_COLOR);

  // Text
  ctx.fillStyle = THOUGHT_CONFIG.TEXT_COLOR;
  ctx.font = THOUGHT_CONFIG.FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y - THOUGHT_CONFIG.TEXT_Y_OFFSET);

  ctx.globalAlpha = 1;
}
