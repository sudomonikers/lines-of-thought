import { useState, useEffect, useCallback, useRef } from 'react';
import { getAllNodes, getBatchNodesWithChildren } from '../shared/graph.service';
import type { GraphNode, GraphRelationship } from '../types/graph';
import { logError } from '../utils/errorHandling';

interface ExploreProps {
  onSelectNode: (node: GraphNode) => void;
  onPreloadedData?: (nodes: Map<string, GraphNode>, relationships: GraphRelationship[]) => void;
  initialSkip?: number;
  onSkipChange?: (skip: number) => void;
}

export default function Explore({ onSelectNode, onPreloadedData, initialSkip = 0, onSkipChange }: ExploreProps) {
  const [displayedNodes, setDisplayedNodes] = useState<GraphNode[]>([]);
  const [nextNodes, setNextNodes] = useState<GraphNode[]>([]);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentSkip, setCurrentSkip] = useState(0);
  const [total, setTotal] = useState(0);
  const totalRef = useRef(0);
  const preloadedRef = useRef<GraphNode[]>([]);
  const exploreViewRef = useRef<HTMLDivElement>(null);

  const loadNodes = useCallback(async (skip: number, usePreloaded: boolean = false) => {
    setLoading(true);
    try {
      let response;

      // Use preloaded data if available, otherwise fetch
      if (usePreloaded && preloadedRef.current.length > 0) {
        response = {
          nodes: preloadedRef.current,
          total: totalRef.current,
          limit: 9,
          skip: skip,
          hasMore: skip + 9 < totalRef.current
        };
        preloadedRef.current = []; // Clear preloaded data after use
      } else {
        response = await getAllNodes(9, skip);
      }

      if (response.total === 0) {
        setDisplayedNodes([]);
        setTotal(0);
        return;
      }

      setDisplayedNodes(response.nodes);
      setTotal(response.total);
      totalRef.current = response.total;
      setCurrentSkip(skip);

      // Notify parent of skip change
      if (onSkipChange) {
        onSkipChange(skip);
      }

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

      // Preload next set of nodes in the background
      const nextSkip = skip + 9;
      const adjustedNextSkip = nextSkip >= response.total ? 0 : nextSkip;

      // Only preload if not already preloaded and not at the end cycling back to start
      if (!usePreloaded && adjustedNextSkip !== skip) {
        try {
          const nextResponse = await getAllNodes(9, adjustedNextSkip);
          preloadedRef.current = nextResponse.nodes;
        } catch (error) {
          logError(error, 'Failed to preload next nodes');
        }
      }
    } catch (error) {
      logError(error, 'Failed to load nodes');
    } finally {
      setLoading(false);
    }
  }, [onPreloadedData]);

  useEffect(() => {
    loadNodes(initialSkip);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle transition end event - reset the slider position without animation
  useEffect(() => {
    const element = exploreViewRef.current;
    if (!element) return;

    const handleTransitionEnd = () => {
      if (nextNodes.length > 0) {
        // Temporarily disable transitions
        element.style.transition = 'none';

        // Update state and reset position
        setDisplayedNodes(nextNodes);
        setNextNodes([]);
        setSlideDirection(null);

        // Force a reflow to ensure the transition: none takes effect
        void element.offsetHeight;

        // Re-enable transitions
        element.style.transition = '';
      }
    };

    element.addEventListener('transitionend', handleTransitionEnd);
    return () => element.removeEventListener('transitionend', handleTransitionEnd);
  }, [nextNodes]);

  const handleNext = async () => {
    // Calculate next skip, wrapping around to 0 if we've reached the end
    const nextSkip = currentSkip + 9;
    const adjustedSkip = nextSkip >= total ? 0 : nextSkip;

    // Use preloaded data if we have it and we're moving to the next sequential page
    const hasPreloadedData = preloadedRef.current.length > 0 && adjustedSkip === nextSkip;

    if (hasPreloadedData) {
      // Use preloaded data and start slide immediately
      const nextNodesData = preloadedRef.current;
      preloadedRef.current = []; // Clear preloaded data

      // Update skip for the preloaded data
      setCurrentSkip(adjustedSkip);

      // Notify parent of skip change
      if (onSkipChange) {
        onSkipChange(adjustedSkip);
      }

      // Start the slide animation immediately
      setNextNodes(nextNodesData);
      setTimeout(() => {
        setSlideDirection('right');
      }, 10);

      // Preload next set in background (async, doesn't block animation)
      if (adjustedSkip !== 0) { // Don't preload if we wrapped around
        try {
          const nextNextSkip = adjustedSkip + 9;
          const adjustedNextNextSkip = nextNextSkip >= total ? 0 : nextNextSkip;
          if (adjustedNextNextSkip !== adjustedSkip) {
            const nextResponse = await getAllNodes(9, adjustedNextNextSkip);
            preloadedRef.current = nextResponse.nodes;
          }
        } catch (error) {
          logError(error, 'Failed to preload next nodes');
        }
      }
    } else {
      // Fetch data if not preloaded - this will block until data is loaded
      try {
        const response = await getAllNodes(9, adjustedSkip);
        const nextNodesData = response.nodes;
        setCurrentSkip(adjustedSkip);
        setTotal(response.total);
        totalRef.current = response.total;

        // Notify parent of skip change
        if (onSkipChange) {
          onSkipChange(adjustedSkip);
        }

        // Start the slide animation after data is loaded
        setNextNodes(nextNodesData);
        setTimeout(() => {
          setSlideDirection('right');
        }, 10);

        // Preload next set in background
        const nextNextSkip = adjustedSkip + 9;
        const adjustedNextNextSkip = nextNextSkip >= response.total ? 0 : nextNextSkip;
        if (adjustedNextNextSkip !== adjustedSkip) {
          try {
            const nextResponse = await getAllNodes(9, adjustedNextNextSkip);
            preloadedRef.current = nextResponse.nodes;
          } catch (error) {
            logError(error, 'Failed to preload next nodes');
          }
        }
      } catch (error) {
        logError(error, 'Failed to load nodes');
        return;
      }
    }
  };

  if (loading && displayedNodes.length === 0 && preloadedRef.current.length === 0) {
    return (
      <div className="explore-container">
        <div className="explore-loading color-secondary mono-font">Loading thoughts...</div>
      </div>
    );
  }

  const renderGrid = (nodes: GraphNode[]) => (
    <div className="explore-grid">
      {nodes.map((node) => (
        <div
          key={node.elementId}
          className="explore-card border-primary bg-card backdrop-blur pixelated transition-standard"
          onClick={() => onSelectNode(node)}
        >
          <div className="explore-card-text color-primary mono-font">{node.text}</div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="explore-container">
      <div className="explore-slider-container">
        <div
          ref={exploreViewRef}
          className={`explore-slider ${slideDirection ? `slide-${slideDirection}` : ''} ${nextNodes.length > 0 ? 'transitioning' : ''}`}
        >
          <div className="explore-slide">
            {renderGrid(displayedNodes)}
          </div>
          {slideDirection === 'right' && nextNodes.length > 0 && (
            <div className="explore-slide">
              {renderGrid(nextNodes)}
            </div>
          )}
        </div>
      </div>
      {displayedNodes.length > 0 && (
        <button className="explore-next-btn btn-base" onClick={handleNext}>
          Next →
        </button>
      )}
    </div>
  );
}
