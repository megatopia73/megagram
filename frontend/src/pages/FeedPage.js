import { useState, useEffect, useCallback } from "react";
import { useWallet } from "../utils/WalletContext";
import { useFetchPosts } from "../utils/programUtils";
import CreatePostBox from "../components/CreatePostBox";
import PostCard from "../components/PostCard";

function Sidebar({ publicKey, username, onDisconnect }) {
  const short = publicKey
    ? publicKey.toBase58().slice(0, 6) + "…" + publicKey.toBase58().slice(-4)
    : "";

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="15" stroke="url(#slg)" strokeWidth="2" />
          <circle cx="16" cy="16" r="6" fill="url(#slg)" />
          <circle cx="16" cy="5" r="3" fill="url(#slg)" opacity="0.6" />
          <circle cx="27" cy="22" r="3" fill="url(#slg)" opacity="0.6" />
          <circle cx="5" cy="22" r="3" fill="url(#slg)" opacity="0.6" />
          <defs>
            <linearGradient id="slg" x1="0" y1="0" x2="32" y2="32">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
          </defs>
        </svg>
        <span className="sidebar-brand">MegaGram</span>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="nav-item active">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>Home</span>
        </div>
        <div className="nav-item" onClick={() => alert(`Wallet: ${publicKey?.toBase58()}\nUsername: @${username}\nNetwork: Devnet`)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>Profile</span>
        </div>
      </nav>

      {/* Wallet info */}
      <div className="sidebar-wallet">
        <div className="wallet-info">
          <div className="wallet-dot" />
          <div>
            <div className="wallet-username">@{username}</div>
            <div className="wallet-address">{short}</div>
          </div>
        </div>
        <button onClick={onDisconnect} className="disconnect-btn" title="Disconnect">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </aside>
  );
}

function RightPanel({ postCount }) {
  return (
    <aside className="right-panel">
      <div className="panel-card">
        <h3 className="panel-title">About MegaGram</h3>
        <p className="panel-text">
          A privacy-first social platform on Solana. Your wallet is your identity — no accounts, no tracking.
        </p>
        <div className="panel-stat">
          <span className="stat-num">{postCount}</span>
          <span className="stat-label">on-chain posts</span>
        </div>
      </div>

      <div className="panel-card">
        <h3 className="panel-title">Privacy Promise</h3>
        <ul className="privacy-list">
          <li>🔒 No email or password</li>
          <li>🚫 No cookies or tracking</li>
          <li>🌐 No central server</li>
          <li>⚡ Data lives on Solana</li>
        </ul>
      </div>

      <div className="panel-footer">
        Built on Solana · Anchor Framework
      </div>
    </aside>
  );
}

export default function FeedPage({ userProfile, onProfileUpdate, onDisconnect }) {
  const { publicKey } = useWallet();
  const fetchPosts = useFetchPosts();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPosts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const p = await fetchPosts();
      setPosts(p);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchPosts]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handlePostCreated = () => {
    onProfileUpdate && onProfileUpdate();
    setTimeout(() => loadPosts(true), 1500);
  };

  return (
    <div className="feed-root">
      <Sidebar
        publicKey={publicKey}
        username={userProfile?.username || "unknown"}
        onDisconnect={onDisconnect}
      />

      <main className="feed-main">
        <div className="feed-header">
          <h2 className="feed-title">Home</h2>
          <button
            onClick={() => loadPosts(true)}
            className="refresh-btn"
            disabled={refreshing}
            title="Refresh feed"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={refreshing ? "spinning" : ""}
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        </div>

        {/* Create post */}
        {userProfile && (
          <CreatePostBox
            userProfile={userProfile}
            onPostCreated={handlePostCreated}
          />
        )}

        {/* Feed */}
        <div className="post-list">
          {loading ? (
            <div className="feed-loading">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton-card">
                  <div className="skeleton-avatar" />
                  <div className="skeleton-lines">
                    <div className="skeleton-line w70" />
                    <div className="skeleton-line w100" />
                    <div className="skeleton-line w85" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="empty-feed">
              <div className="empty-icon">📡</div>
              <p>No posts yet. Be the first to post on-chain!</p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.publicKey.toBase58()}
                post={post}
                onUpdate={() => loadPosts(true)}
              />
            ))
          )}
        </div>
      </main>

      <RightPanel postCount={posts.length} />
    </div>
  );
}
