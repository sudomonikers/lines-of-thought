import { type GraphNode, type GraphRelationship } from '../types/graph';

interface ThoughtCardProps {
  node: GraphNode;
  branchCount: number;
  childRelationships: GraphRelationship[];
  onBranchClick: (index: number) => void;
  onAddBranch: () => void;
  onBack?: () => void;
  parentNode?: GraphNode | null;
  onParentClick?: () => void;
}

export default function ThoughtCard({
  node,
  branchCount,
  childRelationships,
  onBranchClick,
  onAddBranch,
  onBack,
  parentNode,
  onParentClick
}: ThoughtCardProps) {
  return (
    <div className="thought-card-container">
      {onBack && (
        <button className="back-button border-primary mono-font btn-base transition-standard" onClick={onBack}>
          ← Back
        </button>
      )}

      <div className="thought-card-wrapper">
        {parentNode && onParentClick && (
          <div className="parent-thought">
            <div
              className="parent-thought-card border-secondary"
              onClick={onParentClick}
            >
              <div className="parent-thought-label mono-font">← Preceding thought</div>
              <div className="parent-thought-text mono-font">{parentNode.text}</div>
            </div>
          </div>
        )}

        <div className="thought-card bg-card backdrop-blur pixelated">
          <div className="thought-card-content color-primary mono-font">
            {node.text}
          </div>

          <button className="add-branch-btn btn-base" onClick={onAddBranch}>
            + Add Branch
          </button>
        </div>

        {branchCount > 0 && (
          <div className="branch-lines">
            {Array.from({ length: branchCount }).map((_, index) => {
              const relationship = childRelationships[index];
              const perspective = relationship?.perspective;

              return (
                <div
                  key={index}
                  className="branch-line"
                  onClick={() => onBranchClick(index)}
                >
                  <div className="branch-line-path transition-standard pixelated"></div>
                  <div className="branch-line-label color-primary mono-font transition-standard">
                    {perspective ? (
                      <>
                        <span className="branch-perspective">{perspective}</span>
                        <span className="branch-number">→ Branch {index + 1}</span>
                      </>
                    ) : (
                      `Branch ${index + 1}`
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
