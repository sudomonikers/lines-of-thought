interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content help-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="color-secondary mono-font">Lines of Thought</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body help-modal-body mono-font">
          <section>
            <h3>What is this?</h3>
            <p>
              Lines of Thought is a tool for exploring and developing ideas through branching thought paths,
              inspired by the concept of "lines" in chess analysis.
            </p>
            <p>
              Just as chess engines explore different lines of play to find the best moves, you can explore
              different lines of reasoning to develop and refine your thoughts.
            </p>
          </section>

          <section>
            <h3>Perspectives</h3>
            <p>
              When creating a branch, you can optionally specify a <strong>perspective</strong> (e.g., "The Ruler",
              "The Peasant", "Long-term", "Short-term") to examine the parent thought from a specific viewpoint.
              This helps you explore how different stakeholders or timeframes might view the same idea.
            </p>
          </section>

          <section>
            <h3>Argument Strength Scores</h3>
            <p>
              When you create a branch, AI analyzes how logically it follows from the parent thought.
              Scores range from -100 (weak/fallacious) to 100 (strong/sound). This helps you identify
              which branches represent the most rigorous reasoning paths.
            </p>
          </section>

          <section>
            <h3>How it works</h3>
            <ul>
              <li><strong>Thoughts</strong> - Each card represents a single thought or idea</li>
              <li><strong>Branches</strong> - Create multiple lines of reasoning from any thought by clicking "+ Add Branch"</li>
              <li><strong>Preceding thoughts</strong> - See what thought led to the current one on the left</li>
              <li><strong>Navigation</strong> - Click on preceding thoughts or branches to navigate through your thinking</li>
              <li><strong>Search</strong> - Find any thought using semantic similarity or keyword matching</li>
            </ul>
          </section>

          <section>
            <h3>Content Moderation</h3>
            <p>
              All thoughts are moderated by AI to ensure they are meaningful philosophical contributions.
              Thoughts must be substantive, avoid logical fallacies, and contribute to productive reasoning.
              Duplicate thoughts are automatically detected to maintain the originality of your exploration.
            </p>
          </section>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-primary btn-base">
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
