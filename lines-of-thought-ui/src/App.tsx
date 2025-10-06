import { useState } from 'react';
import './App.css';
import ThoughtTree from './components/ThoughtTree';
import SearchBar from './components/SearchBar';
import LivingWorldCanvas from './components/canvas/LivingWorldCanvas';
import HelpModal from './components/HelpModal';
import Explore from './components/Explore';
import CreateThoughtModal from './components/CreateThoughtModal';
import { type GraphNode, type GraphRelationship } from './types/graph';
import { createNode } from './shared/graph.service';
import { handleError } from './utils/errorHandling';

function App() {
  const [viewingNode, setViewingNode] = useState<GraphNode | null>(null);
  const [showNewThoughtModal, setShowNewThoughtModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [preloadedNodes, setPreloadedNodes] = useState<Map<string, GraphNode>>(new Map());
  const [preloadedRelationships, setPreloadedRelationships] = useState<GraphRelationship[]>([]);

  const handleSelectNode = (node: GraphNode) => {
    setViewingNode(node);
  };

  const handleBackToExplore = () => {
    setViewingNode(null);
  };

  const handleNewThought = () => {
    setShowNewThoughtModal(true);
  };

  const handleHelp = () => {
    setShowHelpModal(true);
  };

  const handleCreateNewThought = async (text: string) => {
    try {
      // Create a new Parent thought
      const newNode = await createNode({ text, isParent: true });

      // Navigate to the new thought
      setViewingNode({
        elementId: newNode.elementId,
        text: newNode.text,
        createdAt: newNode.createdAt
      });

      setShowNewThoughtModal(false);
    } catch (error) {
      // Parse API error to check for specific error codes
      let errorMessage = 'Failed to create thought. Please try again.';

      if (error instanceof Error) {
        const apiErrorMatch = error.message.match(/API Error: (\d+) - (.+)/);
        if (apiErrorMatch) {
          try {
            const errorData = JSON.parse(apiErrorMatch[2]);

            if (errorData.errorCode === 'DUPLICATE_THOUGHT') {
              errorMessage = errorData.message || 'A very similar thought already exists. Please try a different perspective.';
            } else if (errorData.errorCode === 'MODERATION_FAILED') {
              errorMessage = errorData.reason || 'Content rejected by moderation.';
            } else {
              errorMessage = errorData.error || errorData.message || errorMessage;
            }
          } catch {
            errorMessage = error.message;
          }
        } else {
          errorMessage = error.message;
        }
      }

      handleError(error, errorMessage);
    }
  };

  const handlePreloadedData = (nodes: Map<string, GraphNode>, relationships: GraphRelationship[]) => {
    setPreloadedNodes(nodes);
    setPreloadedRelationships(relationships);
  };

  return (
    <>
      <LivingWorldCanvas />
      <SearchBar
        onSelectNode={handleSelectNode}
        onNewThought={handleNewThought}
        onHelp={handleHelp}
      />
      {viewingNode ? (
        <ThoughtTree
          navigationTarget={viewingNode}
          onBackToExplore={handleBackToExplore}
          preloadedNodes={preloadedNodes}
          preloadedRelationships={preloadedRelationships}
        />
      ) : (
        <Explore
          onSelectNode={handleSelectNode}
          onPreloadedData={handlePreloadedData}
        />
      )}
      <CreateThoughtModal
        isOpen={showNewThoughtModal}
        onClose={() => setShowNewThoughtModal(false)}
        onSubmit={handleCreateNewThought}
      />
      <HelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
    </>
  );
}

export default App;
