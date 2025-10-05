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
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
      )}

      <div className="thought-card-wrapper">
        {parentNode && onParentClick && (
          <div className="parent-thought">
            <div
              className="parent-thought-card"
              onClick={onParentClick}
            >
              <div className="parent-thought-label">← Preceding thought</div>
              <div className="parent-thought-text">{parentNode.text}</div>
            </div>
          </div>
        )}

        <div className="thought-card">
          <div className="thought-card-content">
            {node.text}
          </div>

          <button className="add-branch-btn" onClick={onAddBranch}>
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
                  <div className="branch-line-path"></div>
                  <div className="branch-line-label">
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
