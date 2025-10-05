import { type GraphNode } from '../types/graph';

interface ThoughtCardProps {
  node: GraphNode;
  branchCount: number;
  onBranchClick: (index: number) => void;
  onAddBranch: () => void;
  onBack?: () => void;
  parentNode?: GraphNode | null;
  onParentClick?: () => void;
}

export default function ThoughtCard({
  node,
  branchCount,
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
            {Array.from({ length: branchCount }).map((_, index) => (
              <div
                key={index}
                className="branch-line"
                onClick={() => onBranchClick(index)}
              >
                <div className="branch-line-path"></div>
                <div className="branch-line-label">Branch {index + 1}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
