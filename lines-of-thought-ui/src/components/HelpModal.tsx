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
            <h3>How it works</h3>
            <ul>
              <li><strong>Thoughts</strong> - Each card represents a single thought or idea</li>
              <li><strong>Branches</strong> - Create multiple lines of reasoning from any thought by clicking "+ Add Branch"</li>
              <li><strong>Preceding thoughts</strong> - See what thought led to the current one on the left</li>
              <li><strong>Navigation</strong> - Click on preceding thoughts or branches to navigate through your thinking</li>
              <li><strong>Search</strong> - Find any thought you've created using the search bar</li>
            </ul>
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
