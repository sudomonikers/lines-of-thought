import { useState, useEffect, useRef } from 'react';
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
  const debounceTimerRef = useRef<number | null>(null);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setShowResults(false);
      setIsSearching(false);
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

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // If query is empty, clear results immediately
    if (!searchQuery.trim()) {
      setResults([]);
      setShowResults(false);
      setIsSearching(false);
      return;
    }

    // Show loading state immediately
    setIsSearching(true);

    // Set new timer for debounced search (500ms delay)
    debounceTimerRef.current = window.setTimeout(() => {
      performSearch(searchQuery);
    }, 500);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

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
      <div className="search-input-row">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => query && setShowResults(true)}
          onBlur={handleBlur}
          placeholder="Search thoughts..."
          className="search-input border-primary bg-input color-primary focus-ring mono-font pixelated"
        />
        <button onClick={onHelp} className="help-button border-primary color-primary mono-font pixelated btn-base">
          ?
        </button>
      </div>
      <button onClick={onNewThought} className="new-thought-button btn-base">
        + New Thought
      </button>

      {isSearching && <div className="search-loading">Searching...</div>}

      {showResults && results.length > 0 && (
        <div className="search-results">
          {results.map((node) => {
            const displayText = node.text.length > 100
              ? node.text.slice(0, 100) + '...'
              : node.text;

            return (
              <div
                key={node.elementId}
                className="search-result-item"
                onClick={() => handleSelectNode(node)}
              >
                <div className="search-result-text color-primary mono-font">{displayText}</div>
                <div className="search-result-date mono-font">
                  {new Date(node.createdAt).toLocaleDateString()}
                </div>
              </div>
            );
          })}
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
