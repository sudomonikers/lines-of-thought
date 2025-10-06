export interface Building {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  windowColor: string;
  windows: { x: number; y: number }[];
}

export interface Tree {
  x: number;
  y: number;
  height: number;
}

export interface Person {
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

export interface ThoughtBubble {
  text: string;
  lifetime: number;
  maxLifetime: number;
}
