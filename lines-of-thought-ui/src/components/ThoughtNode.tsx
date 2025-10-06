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

// Helper function to get color class based on strength score
function getStrengthColorClass(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'strength-neutral';
  if (score >= 75) return 'strength-exceptional';
  if (score >= 50) return 'strength-strong';
  if (score >= 25) return 'strength-reasonable';
  if (score >= 0) return 'strength-weak';
  if (score >= -25) return 'strength-poor';
  if (score >= -50) return 'strength-flawed';
  return 'strength-fallacious';
}

// Helper function to get label based on strength score
function getStrengthLabel(score: number | null | undefined): string {
  if (score === null || score === undefined) return '';
  if (score >= 75) return 'Exceptional';
  if (score >= 50) return 'Strong';
  if (score >= 25) return 'Reasonable';
  if (score >= 0) return 'Weak';
  if (score >= -25) return 'Poor';
  if (score >= -50) return 'Flawed';
  return 'Fallacious';
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
              const strengthScore = relationship?.strengthScore;
              const strengthAnalysis = relationship?.strengthAnalysis;
              const strengthClass = getStrengthColorClass(strengthScore);
              const strengthLabel = getStrengthLabel(strengthScore);

              return (
                <div
                  key={index}
                  className="branch-line"
                  onClick={() => onBranchClick(index)}
                  title={strengthAnalysis || undefined}
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
                    {strengthScore !== null && strengthScore !== undefined && (
                      <span className={`branch-strength ${strengthClass}`}>
                        [{strengthScore > 0 ? '+' : ''}{strengthScore}] {strengthLabel}
                      </span>
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
