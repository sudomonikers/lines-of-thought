import { useEffect, useRef } from 'react';
import { drawPixelRect, drawTree, drawPerson, drawThoughtBubble } from './drawing';
import { generateBuildings, generateTrees, generatePeople } from './initialization';
import {
  PIXEL_SIZE,
  SKY_GRADIENT,
  MOON_CONFIG,
  STAR_CONFIG,
  BUILDING_CONFIG,
  GROUND_CONFIG,
  PERSON_CONFIG,
  THOUGHT_CONFIG,
  THOUGHT_TEXTS
} from './constants';
import type { Building, Tree, Person } from './types';

// Pixel art city background with walking people and thought bubbles
const LivingWorldCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Disable image smoothing for pixel art effect
    ctx.imageSmoothingEnabled = false;

    let buildings: Building[] = [];
    let trees: Tree[] = [];
    let people: Person[] = [];

    // Set canvas size to window size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Regenerate buildings when canvas is resized
      buildings = generateBuildings(canvas.width, canvas.height);

      // Generate trees scattered around the street
      trees = generateTrees(canvas.width, canvas.height);

      // Update people y position or create if doesn't exist
      if (people.length === 0) {
        people = generatePeople(canvas.width, canvas.height);
      } else {
        people.forEach(person => {
          person.y = canvas.height - PERSON_CONFIG.GROUND_OFFSET;
        });
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Animation loop
    let animationFrame: number;
    let time = 0;

    const animate = () => {
      time += 1;

      // Sky gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, SKY_GRADIENT.TOP);
      gradient.addColorStop(0.7, SKY_GRADIENT.MIDDLE);
      gradient.addColorStop(1, SKY_GRADIENT.BOTTOM);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw moon
      const moonX = canvas.width * MOON_CONFIG.X_PERCENT;
      const moonY = canvas.height * MOON_CONFIG.Y_PERCENT;

      // Moon glow
      ctx.globalAlpha = 0.3;
      drawPixelRect(
        ctx,
        moonX - MOON_CONFIG.SIZE / 2 - MOON_CONFIG.GLOW_PADDING,
        moonY - MOON_CONFIG.SIZE / 2 - MOON_CONFIG.GLOW_PADDING,
        MOON_CONFIG.SIZE + MOON_CONFIG.GLOW_PADDING * 2,
        MOON_CONFIG.SIZE + MOON_CONFIG.GLOW_PADDING * 2,
        MOON_CONFIG.GLOW_COLOR
      );
      ctx.globalAlpha = 1;

      // Moon body
      drawPixelRect(ctx, moonX - MOON_CONFIG.SIZE / 2, moonY - MOON_CONFIG.SIZE / 2, MOON_CONFIG.SIZE, MOON_CONFIG.SIZE, MOON_CONFIG.BODY_COLOR);

      // Moon craters (darker spots)
      drawPixelRect(ctx, moonX - 10, moonY - 15, 12, 12, MOON_CONFIG.CRATER_COLOR);
      drawPixelRect(ctx, moonX + 8, moonY - 5, 16, 16, MOON_CONFIG.CRATER_COLOR);
      drawPixelRect(ctx, moonX - 5, moonY + 10, 10, 10, MOON_CONFIG.CRATER_COLOR);

      // Draw stars
      for (let i = 0; i < STAR_CONFIG.COUNT; i++) {
        const x = (i * 73) % canvas.width;
        const y = (i * 97) % (canvas.height * STAR_CONFIG.MAX_HEIGHT_PERCENT);
        const twinkle = Math.sin(time * 0.05 + i) * 0.3 + 0.7;
        ctx.globalAlpha = twinkle;
        drawPixelRect(ctx, x, y, PIXEL_SIZE, PIXEL_SIZE, STAR_CONFIG.COLOR);
        ctx.globalAlpha = 1;
      }

      // Draw buildings
      buildings.forEach((building) => {
        // Building body
        drawPixelRect(ctx, building.x, building.y, building.width, building.height, building.color);

        // Building outline
        drawPixelRect(ctx, building.x, building.y, building.width, PIXEL_SIZE, '#5a5f72');

        // Windows (rarely flicker)
        building.windows.forEach((window) => {
          const flicker = Math.random() > (1 - BUILDING_CONFIG.WINDOW_FLICKER_CHANCE) ? 0.3 : 1;
          ctx.globalAlpha = flicker;
          drawPixelRect(ctx, window.x, window.y, BUILDING_CONFIG.WINDOW_SIZE_WIDTH, BUILDING_CONFIG.WINDOW_SIZE_HEIGHT, building.windowColor);
          ctx.globalAlpha = 1;
        });
      });

      // Ground/street
      drawPixelRect(ctx, 0, canvas.height - GROUND_CONFIG.HEIGHT, canvas.width, GROUND_CONFIG.HEIGHT, GROUND_CONFIG.COLOR);
      drawPixelRect(ctx, 0, canvas.height - GROUND_CONFIG.HEIGHT - GROUND_CONFIG.EDGE_HEIGHT, canvas.width, GROUND_CONFIG.EDGE_HEIGHT, GROUND_CONFIG.EDGE_COLOR);

      // Street lines
      for (let i = 0; i < canvas.width; i += GROUND_CONFIG.LINE_SPACING) {
        drawPixelRect(ctx, i, canvas.height - GROUND_CONFIG.LINE_Y_OFFSET, GROUND_CONFIG.LINE_WIDTH, GROUND_CONFIG.LINE_HEIGHT, GROUND_CONFIG.LINE_COLOR);
      }

      // Draw trees
      trees.forEach((tree) => {
        drawTree(ctx, tree);
      });

      // Update and draw people
      people.forEach((person) => {
        // Move person
        person.x += person.speed * person.direction;
        person.walkFrame += person.speed;

        // Wrap around screen
        if (person.x > canvas.width + PERSON_CONFIG.EDGE_BUFFER) {
          person.x = -PERSON_CONFIG.EDGE_BUFFER;
        } else if (person.x < -PERSON_CONFIG.EDGE_BUFFER) {
          person.x = canvas.width + PERSON_CONFIG.EDGE_BUFFER;
        }

        // Update thought bubble (only for thinkers)
        if (person.isThinker) {
          if (person.thoughtBubble) {
            person.thoughtBubble.lifetime--;
            if (person.thoughtBubble.lifetime <= 0) {
              person.thoughtBubble = null;
              person.nextThoughtTime = Math.random() * THOUGHT_CONFIG.MAX_DELAY + THOUGHT_CONFIG.MIN_DELAY;
            }
          } else {
            person.nextThoughtTime--;
            if (person.nextThoughtTime <= 0) {
              person.thoughtBubble = {
                text: THOUGHT_TEXTS[Math.floor(Math.random() * THOUGHT_TEXTS.length)],
                lifetime: THOUGHT_CONFIG.LIFETIME,
                maxLifetime: THOUGHT_CONFIG.LIFETIME
              };
            }
          }
        }

        // Draw person
        drawPerson(ctx, person);

        // Draw thought bubble
        if (person.thoughtBubble) {
          const fadeIn = Math.min(1, (person.thoughtBubble.maxLifetime - person.thoughtBubble.lifetime) / THOUGHT_CONFIG.FADE_DURATION);
          const fadeOut = Math.min(1, person.thoughtBubble.lifetime / THOUGHT_CONFIG.FADE_DURATION);
          const alpha = Math.min(fadeIn, fadeOut);
          drawThoughtBubble(ctx, person.x + 4, person.y - PERSON_CONFIG.HEAD_Y_OFFSET, person.thoughtBubble.text, alpha);
        }
      });

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        imageRendering: 'pixelated'
      }}
    />
  );
};

export default LivingWorldCanvas;
