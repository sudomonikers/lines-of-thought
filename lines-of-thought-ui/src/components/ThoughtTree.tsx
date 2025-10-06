import { useState, useEffect, useCallback, useRef } from 'react';
import ThoughtCard from './ThoughtNode';
import CreateThoughtModal from './CreateThoughtModal';
import { getChildNodes, getParentNode, getChildRelationships, type GraphData, type GraphNode, type GraphRelationship } from '../types/graph';
import { createNode, createRelationship, getNodeWithChildren, getBatchNodesWithChildren, type GraphResponse, type CreateNodeResponse } from '../shared/graph.service';
import { logError, handleError } from '../utils/errorHandling';

interface ThoughtTreeProps {
  navigationTarget?: GraphNode | null;
  onBackToExplore?: () => void;
  preloadedNodes?: Map<string, GraphNode>;
  preloadedRelationships?: GraphRelationship[];
}

export default function ThoughtTree({ navigationTarget, onBackToExplore, preloadedNodes, preloadedRelationships }: ThoughtTreeProps) {
  const [graph, setGraph] = useState<GraphData>({ nodes: new Map(), relationships: [] });
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [nextNodeId, setNextNodeId] = useState<string | null>(null);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const thoughtViewRef = useRef<HTMLDivElement>(null);

  // Load the initial node from the API or use preloaded data
  useEffect(() => {
    const loadInitialNode = async () => {
      if (!navigationTarget?.elementId) {
        setIsLoading(false);
        return;
      }

      try {
        // Check if we have preloaded data
        if (preloadedNodes && preloadedNodes.size > 0 && preloadedRelationships) {
          setGraph({
            nodes: new Map(preloadedNodes),
            relationships: [...preloadedRelationships]
          });
          setCurrentNodeId(navigationTarget.elementId);
        } else {
          // Fetch from API if not preloaded
          const graphData = await getNodeWithChildren(navigationTarget.elementId);

          const nodesMap = new Map<string, GraphNode>();
          graphData.nodes.forEach(node => {
            nodesMap.set(node.elementId, node);
          });

          setGraph({
            nodes: nodesMap,
            relationships: graphData.relationships
          });
          setCurrentNodeId(navigationTarget.elementId);
        }
      } catch (error) {
        logError(error, 'Failed to load initial node');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialNode();
  }, [navigationTarget?.elementId, preloadedNodes, preloadedRelationships]);

  // Handle transition end event - reset the slider position without animation
  useEffect(() => {
    const element = thoughtViewRef.current;
    if (!element) return;

    const handleTransitionEnd = () => {
      if (nextNodeId) {
        // Temporarily disable transitions
        element.style.transition = 'none';

        // Update state and reset position
        setCurrentNodeId(nextNodeId);
        setNextNodeId(null);
        setSlideDirection(null);

        // Force a reflow to ensure the transition: none takes effect
        element.offsetHeight;

        // Re-enable transitions
        element.style.transition = '';
      }
    };

    element.addEventListener('transitionend', handleTransitionEnd);
    return () => element.removeEventListener('transitionend', handleTransitionEnd);
  }, [nextNodeId]);

  const currentNode = currentNodeId ? graph.nodes.get(currentNodeId) : null;
  const childNodes = currentNode && currentNodeId ? getChildNodes(currentNodeId, graph) : [];
  const childRelationships = currentNode && currentNodeId ? getChildRelationships(currentNodeId, graph) : [];
  const parentNode = currentNode && currentNodeId ? getParentNode(currentNodeId, graph) : null;

  const nextNode = nextNodeId ? graph.nodes.get(nextNodeId) : null;
  const nextChildNodes = nextNode && nextNodeId ? getChildNodes(nextNodeId, graph) : [];
  const nextChildRelationships = nextNode && nextNodeId ? getChildRelationships(nextNodeId, graph) : [];
  const nextParentNode = nextNode && nextNodeId ? getParentNode(nextNodeId, graph) : null;

  // Helper function to merge graph data
  const mergeGraphData = useCallback((currentGraph: GraphData, newData: GraphResponse): GraphData => {
    const updatedNodes = new Map(currentGraph.nodes);
    newData.nodes.forEach(node => {
      if (!updatedNodes.has(node.elementId)) {
        updatedNodes.set(node.elementId, node);
      }
    });

    const existingRelIds = new Set(currentGraph.relationships.map(r => r.elementId));
    const newRelationships = newData.relationships.filter(
      r => !existingRelIds.has(r.elementId)
    );

    return {
      nodes: updatedNodes,
      relationships: [...currentGraph.relationships, ...newRelationships]
    };
  }, []);

  // Helper function to navigate to a node
  const navigateToNode = useCallback(async (targetNodeId: string, direction: 'left' | 'right') => {
    // Check if this node's children are already loaded
    const targetChildren = getChildNodes(targetNodeId, graph);

    // If no children are in the graph, fetch them from the API
    if (targetChildren.length === 0) {
      try {
        const graphData = await getNodeWithChildren(targetNodeId);
        setGraph(currentGraph => mergeGraphData(currentGraph, graphData));
      } catch (error) {
        logError(error, 'Failed to load node children');
      }
    }

    // Preload sibling branches if navigating to a child
    if (direction === 'right') {
      const targetNode = graph.nodes.get(targetNodeId);
      if (targetNode) {
        const siblings = getChildNodes(targetNodeId, graph);
        if (siblings.length > 0) {
          const siblingIds = siblings.map(s => s.elementId);
          try {
            const preloadedData = await getBatchNodesWithChildren(siblingIds);
            setGraph(currentGraph => mergeGraphData(currentGraph, preloadedData));
          } catch (error) {
            logError(error, 'Failed to preload sibling branches');
          }
        }
      }
    }

    // For left navigation, we need to set the direction first (without transition)
    // then add the next node to trigger the transition
    if (direction === 'left') {
      // Set direction first to position the slider at -100%
      setSlideDirection(direction);
      // Wait a frame, then set next node which will add 'transitioning' class
      setTimeout(() => {
        setNextNodeId(targetNodeId);
      }, 10);
    } else {
      // For right navigation, set next node then direction
      setNextNodeId(targetNodeId);
      setTimeout(() => {
        setSlideDirection(direction);
      }, 10);
    }
  }, [graph, mergeGraphData]);

  const navigateToBranch = async (branchIndex: number) => {
    const targetNode = childNodes[branchIndex];
    if (targetNode) {
      await navigateToNode(targetNode.elementId, 'right');
    }
  };

  const navigateBack = async () => {
    if (parentNode) {
      await navigateToNode(parentNode.elementId, 'left');
    } else if (onBackToExplore) {
      onBackToExplore();
    }
  };

  const navigateToParent = async () => {
    if (parentNode) {
      await navigateToNode(parentNode.elementId, 'left');
    }
  };

  const handleCreateBranch = async (text: string, perspective?: string) => {
    if (!currentNode) return;

    setIsLoading(true);
    setLoadingError(null);

    // Rotate through loading messages
    const messages = [
      'Creating thought...',
      'Moderating content...',
      'Checking for fallacies...',
      'Analyzing strength...',
      'Checking for originality...'
    ];

    let messageIndex = 0;
    setLoadingMessage(messages[0]);

    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % messages.length;
      setLoadingMessage(messages[messageIndex]);
    }, 1500);

    try {
      // Create the new node and relationship in one API call
      const response = await createNode({
        text,
        parentId: currentNode.elementId,
        perspective: perspective || undefined
      });

      clearInterval(messageInterval);

      // Update local graph state
      const updatedNodes = new Map(graph.nodes);
      updatedNodes.set(response.elementId, {
        elementId: response.elementId,
        text: response.text,
        createdAt: response.createdAt
      });

      let updatedRelationships = graph.relationships;

      // Add the relationship if it was created
      if (response.relationship) {
        updatedRelationships = [...graph.relationships, {
          elementId: response.relationship.elementId,
          fromElementId: response.relationship.fromElementId,
          toElementId: response.relationship.toElementId,
          type: response.relationship.type,
          perspective: response.relationship.perspective
        }];
      }

      setGraph({
        nodes: updatedNodes,
        relationships: updatedRelationships
      });

      // Navigate to the new branch using CSS transition
      setNextNodeId(response.elementId);
      setIsLoading(false);
      setTimeout(() => {
        setSlideDirection('right');
      }, 10);
    } catch (error) {
      clearInterval(messageInterval);

      // Extract error message
      let errorMessage = 'Failed to create branch. Please try again.';

      if (error instanceof Error) {
        // Parse API error format
        const apiErrorMatch = error.message.match(/API Error: (\d+) - (.+)/);
        if (apiErrorMatch) {
          const statusCode = apiErrorMatch[1];
          const errorBody = apiErrorMatch[2];

          // Try to parse JSON error response
          try {
            const errorData = JSON.parse(errorBody);
            if (statusCode === '400' && errorData.error) {
              // Content moderation or validation error
              errorMessage = errorData.reason
                ? `Content rejected: ${errorData.reason}`
                : errorData.error;
            } else {
              errorMessage = errorData.error || errorData.message || errorMessage;
            }
          } catch {
            // If not JSON, use the raw error text
            errorMessage = errorBody || errorMessage;
          }
        } else {
          errorMessage = error.message;
        }
      }

      setLoadingError(errorMessage);
      logError(error, 'Failed to create branch');
      // Keep isLoading true to show the error overlay
    }
  };

  const closeLoadingOverlay = () => {
    setIsLoading(false);
    setLoadingError(null);
  };

  if (!currentNode) {
    return <div>Node not found</div>;
  }

  return (
    <div className="thought-tree">
      <div className="thought-slider-container">
        <div
          ref={thoughtViewRef}
          className={`thought-slider ${slideDirection ? `slide-${slideDirection}` : ''} ${nextNodeId ? 'transitioning' : ''}`}
        >
          {slideDirection === 'left' && nextNode && (
            <div className="thought-slide">
              <ThoughtCard
                node={nextNode}
                branchCount={nextChildNodes.length}
                childRelationships={nextChildRelationships}
                onBranchClick={() => {}}
                onAddBranch={() => {}}
                onBack={nextParentNode ? () => {} : undefined}
                parentNode={nextParentNode}
                onParentClick={() => {}}
              />
            </div>
          )}
          <div className="thought-slide">
            <ThoughtCard
              node={currentNode}
              branchCount={childNodes.length}
              childRelationships={childRelationships}
              onBranchClick={navigateToBranch}
              onAddBranch={() => setIsModalOpen(true)}
              onBack={parentNode || onBackToExplore ? navigateBack : undefined}
              parentNode={parentNode}
              onParentClick={parentNode ? navigateToParent : undefined}
            />
          </div>
          {slideDirection === 'right' && nextNode && (
            <div className="thought-slide">
              <ThoughtCard
                node={nextNode}
                branchCount={nextChildNodes.length}
                childRelationships={nextChildRelationships}
                onBranchClick={() => {}}
                onAddBranch={() => {}}
                onBack={nextParentNode ? () => {} : undefined}
                parentNode={nextParentNode}
                onParentClick={() => {}}
              />
            </div>
          )}
        </div>
      </div>

      <CreateThoughtModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateBranch}
        parentText={currentNode.text}
      />

      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            {loadingError ? (
              <>
                <button className="loading-close" onClick={closeLoadingOverlay}>×</button>
                <div className="loading-error">
                  <div className="error-title mono-font">Error</div>
                  <div className="error-message mono-font">{loadingError}</div>
                </div>
              </>
            ) : (
              <div className="loading-message mono-font">
                {loadingMessage.replace('...', '')}
                <span className="loading-dots">
                  <span className="dot">.</span>
                  <span className="dot">.</span>
                  <span className="dot">.</span>
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
