import { useState, useEffect } from 'react';
import ThoughtCard from './ThoughtNode';
import CreateThoughtModal from './CreateThoughtModal';
import { getChildNodes, getParentNode, type GraphData, type GraphNode } from '../types/graph';
import { createNode, createRelationship, getNodeWithChildren } from '../shared/graph.service';

interface ThoughtTreeProps {
  navigationTarget?: GraphNode | null;
  showNewThoughtModal?: boolean;
  onCloseNewThoughtModal?: () => void;
}

export default function ThoughtTree({ navigationTarget, showNewThoughtModal, onCloseNewThoughtModal }: ThoughtTreeProps) {
  const [graph, setGraph] = useState<GraphData>({ nodes: new Map(), relationships: [] });
  const [navigationStack, setNavigationStack] = useState<string[]>([]);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load the initial node from the API
  useEffect(() => {
    const loadInitialNode = async () => {
      try {
        const elementId = '4:386e1efa-9332-4ed8-9c4f-5a8675571758:0';
        const graphData = await getNodeWithChildren(elementId);

        const nodesMap = new Map<string, GraphNode>();
        graphData.nodes.forEach(node => {
          nodesMap.set(node.elementId, node);
        });

        setGraph({
          nodes: nodesMap,
          relationships: graphData.relationships
        });
        setNavigationStack([elementId]);
      } catch (error) {
        console.error('Failed to load initial node:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialNode();
  }, []);

  const currentNodeId = navigationStack[navigationStack.length - 1];
  const currentNode = graph.nodes.get(currentNodeId);
  const childNodes = currentNode ? getChildNodes(currentNodeId, graph) : [];
  const parentNode = currentNode ? getParentNode(currentNodeId, graph) : null;

  // Handle navigation from search
  useEffect(() => {
    if (navigationTarget && navigationTarget.elementId !== currentNodeId) {
      // Load the node with its full graph context
      const loadNodeContext = async () => {
        try {
          const graphData = await getNodeWithChildren(navigationTarget.elementId);

          const nodesMap = new Map(graph.nodes);
          graphData.nodes.forEach(node => {
            nodesMap.set(node.elementId, node);
          });

          const updatedRelationships = [...graph.relationships];
          graphData.relationships.forEach(rel => {
            if (!updatedRelationships.find(r => r.elementId === rel.elementId)) {
              updatedRelationships.push(rel);
            }
          });

          setGraph({
            nodes: nodesMap,
            relationships: updatedRelationships
          });
        } catch (error) {
          console.error('Failed to load node context:', error);
        }
      };

      loadNodeContext();

      // Navigate to the target node
      setSlideDirection('right');
      setTimeout(() => {
        setNavigationStack([navigationTarget.elementId]);
        setSlideDirection(null);
      }, 50);
    }
  }, [navigationTarget]);

  const navigateToBranch = (branchIndex: number) => {
    const targetNode = childNodes[branchIndex];
    if (targetNode) {
      setSlideDirection('right');
      setTimeout(() => {
        setNavigationStack([...navigationStack, targetNode.elementId]);
        setSlideDirection(null);
      }, 50);
    }
  };

  const navigateBack = () => {
    if (navigationStack.length > 1) {
      setSlideDirection('left');
      setTimeout(() => {
        setNavigationStack(navigationStack.slice(0, -1));
        setSlideDirection(null);
      }, 50);
    }
  };

  const navigateToParent = () => {
    if (parentNode) {
      setSlideDirection('left');
      setTimeout(() => {
        setNavigationStack([...navigationStack, parentNode.elementId]);
        setSlideDirection(null);
      }, 50);
    }
  };

  const handleCreateBranch = async (text: string) => {
    if (!currentNode) return;

    setIsLoading(true);
    try {
      // Create the new node
      const newNode = await createNode({ text });

      // Create relationship from current node to new node
      const relationship = await createRelationship({
        fromElementId: currentNode.elementId,
        toElementId: newNode.elementId,
        type: 'BRANCHES_TO'
      });

      // Update local graph state
      const updatedNodes = new Map(graph.nodes);
      updatedNodes.set(newNode.elementId, {
        elementId: newNode.elementId,
        text: newNode.text,
        createdAt: newNode.createdAt
      });

      const updatedRelationships = [...graph.relationships, {
        elementId: relationship.elementId,
        fromElementId: relationship.fromElementId,
        toElementId: relationship.toElementId,
        type: relationship.type
      }];

      setGraph({
        nodes: updatedNodes,
        relationships: updatedRelationships
      });

      // Navigate to the new branch
      setSlideDirection('right');
      setTimeout(() => {
        setNavigationStack([...navigationStack, newNode.elementId]);
        setSlideDirection(null);
      }, 50);
    } catch (error) {
      console.error('Failed to create branch:', error);
      alert('Failed to create branch. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewThought = async (text: string) => {
    setIsLoading(true);
    try {
      // Create a standalone new node
      const newNode = await createNode({ text });

      // Update local graph state
      const updatedNodes = new Map(graph.nodes);
      updatedNodes.set(newNode.elementId, {
        elementId: newNode.elementId,
        text: newNode.text,
        createdAt: newNode.createdAt
      });

      setGraph({
        nodes: updatedNodes,
        relationships: graph.relationships
      });

      // Navigate to the new thought
      setSlideDirection('right');
      setTimeout(() => {
        setNavigationStack([newNode.elementId]);
        setSlideDirection(null);
      }, 50);

      // Close the modal
      onCloseNewThoughtModal?.();
    } catch (error) {
      console.error('Failed to create thought:', error);
      alert('Failed to create thought. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentNode) {
    return <div>Node not found</div>;
  }

  return (
    <div className="thought-tree">
      <div className={`thought-view ${slideDirection === 'left' ? 'slide-left' : ''} ${slideDirection === 'right' ? 'slide-right' : ''}`}>
        <ThoughtCard
          node={currentNode}
          branchCount={childNodes.length}
          onBranchClick={navigateToBranch}
          onAddBranch={() => setIsModalOpen(true)}
          onBack={navigationStack.length > 1 ? navigateBack : undefined}
          parentNode={parentNode}
          onParentClick={parentNode ? navigateToParent : undefined}
        />
      </div>

      <CreateThoughtModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateBranch}
        parentText={currentNode.text}
      />

      <CreateThoughtModal
        isOpen={showNewThoughtModal || false}
        onClose={() => onCloseNewThoughtModal?.()}
        onSubmit={handleCreateNewThought}
        parentText=""
      />

      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner">Creating thought...</div>
        </div>
      )}
    </div>
  );
}
