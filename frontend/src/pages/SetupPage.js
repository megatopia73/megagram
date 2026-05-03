import { useState } from "react";
import { useWallet } from "../utils/WalletContext";
import { useSetUsername } from "../utils/programUtils";

export default function SetupPage({ onComplete }) {
  const { publicKey } = useWallet();
  const { setUsername, loading } = useSetUsername();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const shortKey = publicKey
    ? publicKey.toBase58().slice(0, 6) + "..." + publicKey.toBase58().slice(-4)
    : "";

  const validate = (v) => {
    if (v.length < 2) return "At least 2 characters required";
    if (v.length > 32) return "Maximum 32 characters";
    if (!/^[a-zA-Z0-9_]+$/.test(v)) return "Letters, numbers, and _ only";
    return "";
  };

  const handleChange = (e) => {
    const v = e.target.value;
    setValue(v);
    if (v) setError(validate(v));
    else setError("");
  };

  const handleSubmit = async () => {
    const err = validate(value);
    if (err) { setError(err); return; }
    try {
      await setUsername(value.trim());
      setSuccess(true);
      setTimeout(() => onComplete(value.trim()), 1200);
    } catch (e) {
      if (e?.message?.includes("already in use")) {
        setError("Username already taken on-chain.");
      } else {
        setError(e?.message || "Transaction failed. Make sure localnet is running.");
      }
    }
  };

  const charsLeft = 32 - value.length;

  return (
    <div className="setup-root">
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <div className="setup-card">
        <div className="setup-avatar">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>

        <h2 className="setup-title">Choose your handle</h2>
        <p className="setup-sub">
          This username is stored on-chain and linked to your wallet.<br />
          It cannot be changed later.
        </p>

        <div className="wallet-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 11.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0Z" fill="currentColor" />
            <path d="M2 10V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3" />
          </svg>
          {shortKey}
        </div>

        <div className="input-group">
          <span className="input-prefix">@</span>
          <input
            type="text"
            className={`username-input ${error ? "has-error" : ""} ${success ? "has-success" : ""}`}
            placeholder="your_username"
            value={value}
            onChange={handleChange}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            maxLength={32}
            autoFocus
          />
          <span className={`char-count ${charsLeft < 5 ? "warn" : ""}`}>{charsLeft}</span>
        </div>

        {error && (
          <div className="input-error">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {success && (
          <div className="input-success">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Username set! Entering the feed…
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !value || !!error || success}
          className="setup-btn"
        >
          {loading ? (
            <span className="spinner" />
          ) : success ? (
            "✓ Done"
          ) : (
            "Claim username →"
          )}
        </button>

        <p className="setup-note">
          Your wallet signs this transaction. No personal data is stored.
        </p>
      </div>
    </div>
  );
}
