import { useEffect, useRef } from 'react';

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

    // Pixel size for retro effect
    const pixelSize = 4;

    // Draw pixelated rectangle
    const drawPixelRect = (x: number, y: number, width: number, height: number, color: string) => {
      ctx.fillStyle = color;
      const pixelX = Math.floor(x / pixelSize) * pixelSize;
      const pixelY = Math.floor(y / pixelSize) * pixelSize;
      const pixelWidth = Math.ceil(width / pixelSize) * pixelSize;
      const pixelHeight = Math.ceil(height / pixelSize) * pixelSize;
      ctx.fillRect(pixelX, pixelY, pixelWidth, pixelHeight);
    };

    // Building definition
    interface Building {
      x: number;
      y: number;
      width: number;
      height: number;
      color: string;
      windowColor: string;
      windows: { x: number; y: number }[];
    }

    const buildings: Building[] = [];
    const buildingColors = ['#3a3f52', '#4a4f62', '#2a2f42', '#5a5f72'];
    const windowColor = '#d8b86a';

    // Trees
    interface Tree {
      x: number;
      y: number;
      height: number;
    }

    const trees: Tree[] = [];

    // Person walking
    interface Person {
      x: number;
      y: number;
      speed: number;
      direction: number; // 1 for right, -1 for left
      walkFrame: number;
      color: string;
      thoughtBubble: ThoughtBubble | null;
      nextThoughtTime: number;
      isThinker: boolean; // Only 30% of people are thinkers
    }

    interface ThoughtBubble {
      text: string;
      lifetime: number;
      maxLifetime: number;
    }

    const people: Person[] = [];
    const personColors = ['#8b9dc3', '#a8b8d8', '#c8d5e8', '#6b7d8f', '#5a6578'];
    const thoughtTexts = [
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

    // Create initial people (very slow contemplative speed, 30% are thinkers)
    for (let i = 0; i < 8; i++) {
      people.push({
        x: Math.random() * canvas.width,
        y: canvas.height - 20,
        speed: Math.random() * 0.2 + 0.1, // Very slow: 0.1-0.3 instead of 0.2-0.6
        direction: Math.random() > 0.5 ? 1 : -1,
        walkFrame: 0,
        color: personColors[Math.floor(Math.random() * personColors.length)],
        thoughtBubble: null,
        nextThoughtTime: Math.random() * 300 + 200,
        isThinker: Math.random() < 0.3 // 30% chance to be a thinker
      });
    }

    // Set canvas size to window size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Regenerate buildings when canvas is resized
      buildings.length = 0;
      let currentX = 0;
      while (currentX < canvas.width + 200) {
        const width = Math.floor(Math.random() * 80) + 60;
        const height = Math.floor(Math.random() * 200) + 150;
        const building: Building = {
          x: currentX,
          y: canvas.height - height,
          width,
          height,
          color: buildingColors[Math.floor(Math.random() * buildingColors.length)],
          windowColor,
          windows: []
        };

        // Add windows
        for (let wy = building.y + 20; wy < building.y + building.height - 10; wy += 24) {
          for (let wx = building.x + 12; wx < building.x + building.width - 12; wx += 20) {
            if (Math.random() > 0.3) {
              building.windows.push({ x: wx, y: wy });
            }
          }
        }

        buildings.push(building);
        currentX += width + Math.floor(Math.random() * 20) + 10;
      }

      // Generate trees scattered around the street
      trees.length = 0;
      for (let i = 0; i < 12; i++) {
        trees.push({
          x: Math.random() * canvas.width,
          y: canvas.height - 30, // On the ground
          height: Math.floor(Math.random() * 30) + 40
        });
      }

      // Update people y position
      people.forEach(person => {
        person.y = canvas.height - 20;
      });
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Draw tree
    const drawTree = (tree: Tree) => {
      const { x, y, height } = tree;
      const trunkWidth = 12;
      const trunkHeight = height * 0.4;
      const canopyWidth = height * 0.6;
      const canopyHeight = height * 0.6;

      // Tree trunk
      drawPixelRect(x - trunkWidth / 2, y - trunkHeight, trunkWidth, trunkHeight, '#5a4a3a');

      // Tree canopy (triangular/bushy shape using rectangles)
      const canopyY = y - trunkHeight - canopyHeight;

      // Bottom layer
      drawPixelRect(x - canopyWidth / 2, canopyY + canopyHeight * 0.6, canopyWidth, canopyHeight * 0.4, '#4a6a4a');

      // Middle layer
      drawPixelRect(x - canopyWidth * 0.7 / 2, canopyY + canopyHeight * 0.3, canopyWidth * 0.7, canopyHeight * 0.4, '#5a7a5a');

      // Top layer
      drawPixelRect(x - canopyWidth * 0.4 / 2, canopyY, canopyWidth * 0.4, canopyHeight * 0.4, '#6a8a6a');
    };

    // Draw person
    const drawPerson = (person: Person) => {
      const { x, y, color, walkFrame } = person;
      const legOffset = Math.sin(walkFrame * 0.3) * 3;

      // Body
      drawPixelRect(x, y - 16, 8, 12, color);

      // Head
      drawPixelRect(x, y - 24, 8, 8, color);

      // Legs (animated)
      drawPixelRect(x + 1, y - 4, 3, 4, color);
      drawPixelRect(x + 5 + legOffset, y - 4, 3, 4, color);

      // Arms
      drawPixelRect(x - 2, y - 12, 2, 6, color);
      drawPixelRect(x + 8, y - 12, 2, 6, color);
    };

    // Draw thought bubble
    const drawThoughtBubble = (x: number, y: number, text: string, alpha: number) => {
      ctx.globalAlpha = alpha;

      // Measure text to size bubble
      ctx.font = '11px Courier New';
      const textMetrics = ctx.measureText(text);
      const textWidth = textMetrics.width;
      const bubbleWidth = Math.max(textWidth + 16, 60);
      const bubbleHeight = 32;

      // Bubble background
      drawPixelRect(x - bubbleWidth / 2, y - 60, bubbleWidth, bubbleHeight, '#f0f0f0');
      drawPixelRect(x - bubbleWidth / 2 + 3, y - 57, bubbleWidth - 6, bubbleHeight - 6, '#ffffff');

      // Bubble tail (small circles)
      drawPixelRect(x + 2, y - 32, 6, 6, '#f0f0f0');
      drawPixelRect(x + 4, y - 28, 4, 4, '#f0f0f0');

      // Text
      ctx.fillStyle = '#2a2d3a';
      ctx.font = '11px Courier New';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x, y - 44);

      ctx.globalAlpha = 1;
    };

    // Animation loop
    let animationFrame: number;
    let time = 0;

    const animate = () => {
      time += 1;

      // Sky gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#1a1d2e');
      gradient.addColorStop(0.7, '#2a2d3a');
      gradient.addColorStop(1, '#3a3d4a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw moon
      const moonX = canvas.width * 0.8;
      const moonY = canvas.height * 0.15;
      const moonSize = 60;

      // Moon glow
      ctx.globalAlpha = 0.3;
      drawPixelRect(moonX - moonSize / 2 - 8, moonY - moonSize / 2 - 8, moonSize + 16, moonSize + 16, '#e8e8d0');
      ctx.globalAlpha = 1;

      // Moon body
      drawPixelRect(moonX - moonSize / 2, moonY - moonSize / 2, moonSize, moonSize, '#f8f8e0');

      // Moon craters (darker spots)
      drawPixelRect(moonX - 10, moonY - 15, 12, 12, '#e0e0c8');
      drawPixelRect(moonX + 8, moonY - 5, 16, 16, '#e0e0c8');
      drawPixelRect(moonX - 5, moonY + 10, 10, 10, '#e0e0c8');

      // Draw stars
      for (let i = 0; i < 80; i++) {
        const x = (i * 73) % canvas.width;
        const y = (i * 97) % (canvas.height * 0.6);
        const twinkle = Math.sin(time * 0.05 + i) * 0.3 + 0.7;
        ctx.globalAlpha = twinkle;
        drawPixelRect(x, y, pixelSize, pixelSize, '#ffffff');
        ctx.globalAlpha = 1;
      }

      // Draw buildings
      buildings.forEach((building) => {
        // Building body
        drawPixelRect(building.x, building.y, building.width, building.height, building.color);

        // Building outline
        drawPixelRect(building.x, building.y, building.width, pixelSize, '#5a5f72');

        // Windows (rarely flicker - only 0.2% chance per frame)
        building.windows.forEach((window) => {
          const flicker = Math.random() > 0.998 ? 0.3 : 1;
          ctx.globalAlpha = flicker;
          drawPixelRect(window.x, window.y, 8, 12, building.windowColor);
          ctx.globalAlpha = 1;
        });
      });

      // Ground/street
      drawPixelRect(0, canvas.height - 30, canvas.width, 30, '#4a4f62');
      drawPixelRect(0, canvas.height - 32, canvas.width, 2, '#6a6f82');

      // Street lines
      for (let i = 0; i < canvas.width; i += 40) {
        drawPixelRect(i, canvas.height - 15, 20, 2, '#d8b86a');
      }

      // Draw trees
      trees.forEach((tree) => {
        drawTree(tree);
      });

      // Update and draw people
      people.forEach((person) => {
        // Move person
        person.x += person.speed * person.direction;
        person.walkFrame += person.speed;

        // Wrap around screen
        if (person.x > canvas.width + 20) {
          person.x = -20;
        } else if (person.x < -20) {
          person.x = canvas.width + 20;
        }

        // Update thought bubble (only for thinkers)
        if (person.isThinker) {
          if (person.thoughtBubble) {
            person.thoughtBubble.lifetime--;
            if (person.thoughtBubble.lifetime <= 0) {
              person.thoughtBubble = null;
              person.nextThoughtTime = Math.random() * 300 + 200;
            }
          } else {
            person.nextThoughtTime--;
            if (person.nextThoughtTime <= 0) {
              person.thoughtBubble = {
                text: thoughtTexts[Math.floor(Math.random() * thoughtTexts.length)],
                lifetime: 1200,
                maxLifetime: 1200
              };
            }
          }
        }

        // Draw person
        drawPerson(person);

        // Draw thought bubble
        if (person.thoughtBubble) {
          const fadeIn = Math.min(1, (person.thoughtBubble.maxLifetime - person.thoughtBubble.lifetime) / 20);
          const fadeOut = Math.min(1, person.thoughtBubble.lifetime / 20);
          const alpha = Math.min(fadeIn, fadeOut);
          drawThoughtBubble(person.x + 4, person.y - 24, person.thoughtBubble.text, alpha);
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
