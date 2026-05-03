import { useState } from "react";
import { useWallet } from "../utils/WalletContext";
import { useCreatePost } from "../utils/programUtils";

export default function CreatePostBox({ userProfile, onPostCreated }) {
  const { publicKey } = useWallet();
  const { createPost, loading } = useCreatePost();
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const charsLeft = 280 - content.length;
  const isOver = charsLeft < 0;
  const isNearLimit = charsLeft >= 0 && charsLeft < 20;

  const handleSubmit = async () => {
    if (!content.trim()) { setError("Post cannot be empty"); return; }
    if (isOver) { setError("Post too long"); return; }
    try {
      await createPost(content.trim(), userProfile);
      setContent("");
      setError("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      onPostCreated && onPostCreated();
    } catch (e) {
      setError(e?.message || "Transaction failed");
    }
  };

  const initials = userProfile?.username
    ? userProfile.username.slice(0, 2).toUpperCase()
    : publicKey?.toBase58().slice(0, 2).toUpperCase() || "?";
  const hue = userProfile?.username
    ? userProfile.username.charCodeAt(0) * 37
    : 180;

  return (
    <div className="create-post-box">
      <div className="create-post-inner">
        <div
          className="post-avatar"
          style={{ background: `hsl(${hue % 360}, 65%, 55%)` }}
        >
          {initials}
        </div>
        <div className="create-post-right">
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setError("");
            }}
            placeholder="What's on your mind? (on-chain, forever)"
            className="create-textarea"
            rows={3}
            maxLength={300}
          />

          {error && <p className="create-error">{error}</p>}
          {success && <p className="create-success">✓ Post published on-chain!</p>}

          <div className="create-footer">
            <div className="create-footer-left">
              <span
                className={`char-indicator ${isOver ? "over" : isNearLimit ? "warn" : ""}`}
              >
                {charsLeft}
              </span>
              <div
                className="char-ring"
                style={{
                  background: `conic-gradient(
                    ${isOver ? "#f87171" : isNearLimit ? "#fbbf24" : "#a78bfa"} 
                    ${Math.min((content.length / 280) * 360, 360)}deg, 
                    rgba(255,255,255,0.1) 0deg
                  )`,
                }}
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading || !content.trim() || isOver}
              className="post-submit-btn"
            >
              {loading ? <span className="spinner-sm" /> : "Post"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
