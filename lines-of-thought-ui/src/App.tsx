import { useState } from 'react';
import './App.css';
import ThoughtTree from './components/ThoughtTree';
import SearchBar from './components/SearchBar';
import LivingWorldCanvas from './components/LivingWorldCanvas';
import HelpModal from './components/HelpModal';
import { type GraphNode } from './types/graph';

function App() {
  const [searchNavigationTarget, setSearchNavigationTarget] = useState<GraphNode | null>(null);
  const [showNewThoughtModal, setShowNewThoughtModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const handleSelectNode = (node: GraphNode) => {
    setSearchNavigationTarget(node);
    // Clear the target after a short delay to allow re-selection
    setTimeout(() => setSearchNavigationTarget(null), 100);
  };

  const handleNewThought = () => {
    setShowNewThoughtModal(true);
  };

  const handleHelp = () => {
    setShowHelpModal(true);
  };

  return (
    <>
      <LivingWorldCanvas />
      <SearchBar
        onSelectNode={handleSelectNode}
        onNewThought={handleNewThought}
        onHelp={handleHelp}
      />
      <ThoughtTree
        navigationTarget={searchNavigationTarget}
        showNewThoughtModal={showNewThoughtModal}
        onCloseNewThoughtModal={() => setShowNewThoughtModal(false)}
      />
      <HelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
    </>
  );
}

export default App;
