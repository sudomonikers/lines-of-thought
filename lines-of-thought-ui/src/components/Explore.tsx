import { useState, useEffect } from 'react';
import { getAllNodes, type ThoughtNode } from '../shared/graph.service';

interface ExploreProps {
  onSelectNode: (node: ThoughtNode) => void;
}

export default function Explore({ onSelectNode }: ExploreProps) {
  const [displayedNodes, setDisplayedNodes] = useState<ThoughtNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadRandomNodes();
  }, []);

  const loadRandomNodes = async () => {
    setLoading(true);
    try {
      // Get total count first
      const response = await getAllNodes(1, 0);
      setTotal(response.total);

      if (response.total === 0) {
        setDisplayedNodes([]);
        return;
      }

      // Generate random skip offset (ensure we can get 9 nodes)
      const maxSkip = Math.max(0, response.total - 9);
      const randomSkip = Math.floor(Math.random() * (maxSkip + 1));

      // Fetch 9 random nodes
      const randomResponse = await getAllNodes(9, randomSkip);
      setDisplayedNodes(randomResponse.nodes);
    } catch (error) {
      console.error('Failed to load nodes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    loadRandomNodes();
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
