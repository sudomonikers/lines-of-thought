import { useState } from 'react';
import { type GraphNode } from '../types/graph';

interface SearchBarProps {
  onSelectNode: (node: GraphNode) => void;
  onNewThought: () => void;
  onHelp: () => void;
}

export default function SearchBar({ onSelectNode, onNewThought, onHelp }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GraphNode[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);

    if (!searchQuery.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const { searchNodes } = await import('../shared/graph.service');
      const nodes = await searchNodes(searchQuery);
      setResults(nodes);
      setShowResults(true);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectNode = (node: GraphNode) => {
    onSelectNode(node);
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  const handleBlur = () => {
    // Delay to allow click on result
    setTimeout(() => setShowResults(false), 200);
  };

  return (
    <div className="search-bar">
      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={() => query && setShowResults(true)}
        onBlur={handleBlur}
        placeholder="Search thoughts..."
        className="search-input"
      />
      <button onClick={onNewThought} className="new-thought-button">
        + New Thought
      </button>
      <button onClick={onHelp} className="help-button">
        ?
      </button>

      {isSearching && <div className="search-loading">Searching...</div>}

      {showResults && results.length > 0 && (
        <div className="search-results">
          {results.map((node) => (
            <div
              key={node.elementId}
              className="search-result-item"
              onClick={() => handleSelectNode(node)}
            >
              <div className="search-result-text">{node.text}</div>
              <div className="search-result-date">
                {new Date(node.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {showResults && results.length === 0 && !isSearching && (
        <div className="search-results">
          <div className="search-no-results">No thoughts found</div>
        </div>
      )}
    </div>
  );
}
