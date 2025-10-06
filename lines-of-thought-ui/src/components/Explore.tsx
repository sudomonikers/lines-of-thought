import { useState, useEffect } from 'react';
import { getAllNodes, getBatchNodesWithChildren } from '../shared/graph.service';
import type { GraphNode } from '../types/graph';
import { logError } from '../utils/errorHandling';

interface ExploreProps {
  onSelectNode: (node: GraphNode) => void;
  onPreloadedData?: (nodes: Map<string, GraphNode>, relationships: any[]) => void;
}

export default function Explore({ onSelectNode, onPreloadedData }: ExploreProps) {
  const [displayedNodes, setDisplayedNodes] = useState<GraphNode[]>([]);
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

      // Preload children for all displayed nodes
      const elementIds = response.nodes.map(node => node.elementId);
      if (elementIds.length > 0) {
        try {
          const preloadedData = await getBatchNodesWithChildren(elementIds);
          if (onPreloadedData) {
            const nodesMap = new Map<string, GraphNode>();
            preloadedData.nodes.forEach(node => {
              nodesMap.set(node.elementId, node);
            });
            onPreloadedData(nodesMap, preloadedData.relationships);
          }
        } catch (error) {
          logError(error, 'Failed to preload node children');
        }
      }
    } catch (error) {
      logError(error, 'Failed to load nodes');
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
        <div className="explore-loading color-secondary mono-font">Loading thoughts...</div>
      </div>
    );
  }

  return (
    <div className="explore-container">
      <div className="explore-grid">
        {displayedNodes.map((node) => (
          <div
            key={node.elementId}
            className="explore-card border-primary bg-card backdrop-blur pixelated transition-standard"
            onClick={() => onSelectNode(node)}
          >
            <div className="explore-card-text color-primary mono-font">{node.text}</div>
          </div>
        ))}
      </div>
      {displayedNodes.length > 0 && (
        <button className="explore-next-btn btn-base" onClick={handleNext}>
          Next →
        </button>
      )}
    </div>
  );
}
