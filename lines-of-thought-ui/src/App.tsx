import { useState } from 'react';
import './App.css';
import ThoughtTree from './components/ThoughtTree';
import SearchBar from './components/SearchBar';
import LivingWorldCanvas from './components/LivingWorldCanvas';
import HelpModal from './components/HelpModal';
import Explore from './components/Explore';
import CreateThoughtModal from './components/CreateThoughtModal';
import { type GraphNode } from './types/graph';
import { type ThoughtNode, createNode } from './shared/graph.service';

function App() {
  const [viewingNode, setViewingNode] = useState<GraphNode | null>(null);
  const [showNewThoughtModal, setShowNewThoughtModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const handleSelectNode = (node: GraphNode | ThoughtNode) => {
    setViewingNode(node as GraphNode);
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
      console.error('Failed to create thought:', error);
      alert('Failed to create thought. Please try again.');
    }
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
        />
      ) : (
        <Explore onSelectNode={handleSelectNode} />
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
