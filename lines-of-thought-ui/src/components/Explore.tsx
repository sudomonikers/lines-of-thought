import { useState, useEffect } from 'react';
import { getAllNodes, type ThoughtNode } from '../shared/graph.service';

interface ExploreProps {
  onSelectNode: (node: ThoughtNode) => void;
}

export default function Explore({ onSelectNode }: ExploreProps) {
  const [displayedNodes, setDisplayedNodes] = useState<ThoughtNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentSkip, setCurrentSkip] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadNodes(0);
  }, []);

  const loadNodes = async (skip: number) => {
    setLoading(true);
    try {
      const response = await getAllNodes(9, skip);

      if (response.total === 0) {
        setDisplayedNodes([]);
        setTotal(0);
        return;
      }

      setDisplayedNodes(response.nodes);
      setTotal(response.total);
      setCurrentSkip(skip);
    } catch (error) {
      console.error('Failed to load nodes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    // Calculate next skip, wrapping around to 0 if we've reached the end
    const nextSkip = currentSkip + 9;
    const adjustedSkip = nextSkip >= total ? 0 : nextSkip;
    loadNodes(adjustedSkip);
  };

  if (loading) {
    return (
      <div className="explore-container">
        <div className="explore-loading">Loading thoughts...</div>
      </div>
    );
  }

  return (
    <div className="explore-container">
      <div className="explore-grid">
        {displayedNodes.map((node) => (
          <div
            key={node.elementId}
            className="explore-card"
            onClick={() => onSelectNode(node)}
          >
            <div className="explore-card-text">{node.text}</div>
          </div>
        ))}
      </div>
      {displayedNodes.length > 0 && (
        <button className="explore-next-btn" onClick={handleNext}>
          Next →
        </button>
      )}
    </div>
  );
}
