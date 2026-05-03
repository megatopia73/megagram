import { useState, useEffect, useCallback } from "react";
import { useWallet } from "../utils/WalletContext";
import {
  useLikePost,
  useAddComment,
  useFetchComments,
  useCheckLiked,
} from "../utils/programUtils";

function timeAgo(timestamp) {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function Avatar({ username }) {
  const initials = username ? username.slice(0, 2).toUpperCase() : "??";
  const hue = username
    ? username.charCodeAt(0) * 37 + (username.charCodeAt(1) || 0) * 17
    : 0;
  return (
    <div
      className="post-avatar"
      style={{ background: `hsl(${hue % 360}, 65%, 55%)` }}
    >
      {initials}
    </div>
  );
}

export default function PostCard({ post, onUpdate }) {
  const { publicKey } = useWallet();
  const { likePost, loading: likeLoading } = useLikePost();
  const { addComment, loading: commentLoading } = useAddComment();
  const fetchComments = useFetchComments();
  const checkLiked = useCheckLiked();

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [liked, setLiked] = useState(false);
  const [localLikeCount, setLocalLikeCount] = useState(post.likeCount);
  const [localCommentCount, setLocalCommentCount] = useState(post.commentCount);
  const [commentError, setCommentError] = useState("");

  useEffect(() => {
    if (publicKey) {
      checkLiked(post.publicKey).then(setLiked);
    }
  }, [publicKey, post.publicKey, checkLiked]);

  const loadComments = useCallback(async () => {
    const c = await fetchComments(post.publicKey);
    setComments(c);
  }, [fetchComments, post.publicKey]);

  const handleToggleComments = () => {
    if (!showComments) loadComments();
    setShowComments((v) => !v);
  };

  const handleLike = async () => {
    if (liked || likeLoading) return;
    try {
      await likePost(post.publicKey);
      setLiked(true);
      setLocalLikeCount((c) => c + 1);
      onUpdate && onUpdate();
    } catch (e) {
      console.error("Like error:", e);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    if (commentText.length > 280) {
      setCommentError("Max 280 characters");
      return;
    }
    try {
      await addComment(commentText.trim(), post.publicKey, localCommentCount);
      setCommentText("");
      setCommentError("");
      setLocalCommentCount((c) => c + 1);
      loadComments();
      onUpdate && onUpdate();
    } catch (e) {
      setCommentError(e?.message || "Failed to add comment");
    }
  };

  const isOwnPost =
    publicKey && post.author.toBase58() === publicKey.toBase58();

  return (
    <article className="post-card">
      {/* Post header */}
      <div className="post-header">
        <Avatar username={post.username} />
        <div className="post-meta">
          <span className="post-username">@{post.username}</span>
          {isOwnPost && <span className="own-badge">you</span>}
          <span className="post-time">{timeAgo(post.createdAt)}</span>
        </div>
      </div>

      {/* Post content */}
      <p className="post-content">{post.content}</p>

      {/* Actions */}
      <div className="post-actions">
        <button
          onClick={handleLike}
          disabled={liked || likeLoading}
          className={`action-btn like-btn ${liked ? "liked" : ""}`}
          title={liked ? "Already liked" : "Like"}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill={liked ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span>{localLikeCount}</span>
        </button>

        <button
          onClick={handleToggleComments}
          className={`action-btn comment-btn ${showComments ? "active" : ""}`}
          title="Comments"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>{localCommentCount}</span>
        </button>

        <div className="post-address">
          {post.author.toBase58().slice(0, 6)}…{post.author.toBase58().slice(-4)}
        </div>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="comments-section">
          {/* Comment input */}
          <div className="comment-input-wrap">
            <Avatar username={publicKey?.toBase58().slice(0, 5) || "?"} />
            <div className="comment-input-inner">
              <textarea
                value={commentText}
                onChange={(e) => {
                  setCommentText(e.target.value);
                  setCommentError("");
                }}
                placeholder="Add a comment…"
                className="comment-textarea"
                rows={2}
                maxLength={280}
              />
              {commentError && (
                <p className="comment-error">{commentError}</p>
              )}
              <div className="comment-actions-row">
                <span className="comment-chars">{280 - commentText.length}</span>
                <button
                  onClick={handleComment}
                  disabled={!commentText.trim() || commentLoading}
                  className="comment-submit-btn"
                >
                  {commentLoading ? <span className="spinner-sm" /> : "Reply"}
                </button>
              </div>
            </div>
          </div>

          {/* Comment list */}
          {comments.length === 0 ? (
            <p className="no-comments">No comments yet. Be the first!</p>
          ) : (
            <div className="comment-list">
              {comments.map((c) => (
                <div key={c.publicKey.toBase58()} className="comment-item">
                  <Avatar username={c.username} />
                  <div className="comment-body">
                    <div className="comment-meta">
                      <span className="comment-username">@{c.username}</span>
                      <span className="comment-time">{timeAgo(c.createdAt)}</span>
                    </div>
                    <p className="comment-text">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
