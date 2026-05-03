import { useEffect, useState } from "react";
import { useWallet } from "../utils/WalletContext";

export default function LandingPage() {
  const { connect, connected } = useWallet();
  const [hasPhantom, setHasPhantom] = useState(false);
  const [ripple, setRipple] = useState(false);

  useEffect(() => {
    setHasPhantom(
      typeof window !== "undefined" && !!window.solana?.isPhantom
    );
  }, []);

  const handleConnect = () => {
    setRipple(true);
    setTimeout(() => setRipple(false), 600);
    connect();
  };

  return (
    <div className="landing-root">
      {/* Animated background orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <div className="landing-card">
        {/* Logo */}
        <div className="logo-wrap">
          <div className="logo-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="15" stroke="url(#lg)" strokeWidth="2" />
              <circle cx="16" cy="16" r="6" fill="url(#lg)" />
              <circle cx="16" cy="5" r="3" fill="url(#lg)" opacity="0.6" />
              <circle cx="27" cy="22" r="3" fill="url(#lg)" opacity="0.6" />
              <circle cx="5" cy="22" r="3" fill="url(#lg)" opacity="0.6" />
              <defs>
                <linearGradient id="lg" x1="0" y1="0" x2="32" y2="32">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#60a5fa" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="logo-text">MegaGram</span>
        </div>

        <h1 className="landing-title">Your voice,<br />no middleman.</h1>
        <p className="landing-sub">
          Decentralized social on Solana. No emails. No tracking.<br />
          Just your wallet — you own your identity.
        </p>

        {/* Feature badges */}
        <div className="feature-pills">
          <span className="pill">🔒 Privacy-first</span>
          <span className="pill">⚡ Solana speed</span>
          <span className="pill">🌐 Fully on-chain</span>
        </div>

        <button
          onClick={handleConnect}
          className={`connect-btn ${ripple ? "ripple" : ""}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
            <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
          </svg>
          {hasPhantom ? "Connect Phantom Wallet" : "Install Phantom Wallet"}
        </button>

        {!hasPhantom && (
          <p className="phantom-hint">
            Phantom is required.{" "}
            <a href="https://phantom.app/" target="_blank" rel="noreferrer">
              Download here →
            </a>
          </p>
        )}

        <div className="landing-footer">
          <span>No cookies · No ads · No servers</span>
        </div>
      </div>
    </div>
  );
}
