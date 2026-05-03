import { useState, useEffect, useCallback } from "react";
import { WalletProvider, useWallet } from "./utils/WalletContext";
import { useFetchProfile } from "./utils/programUtils";
import LandingPage from "./pages/LandingPage";
import SetupPage from "./pages/SetupPage";
import FeedPage from "./pages/FeedPage";
import "./styles/global.css";

// ─── App states ──────────────────────────────────────────────────────────────
// "landing" → "setup" → "feed"

function AppInner() {
  const { connected, publicKey, disconnect } = useWallet();
  const fetchProfile = useFetchProfile();
  const [page, setPage] = useState("landing");
  const [userProfile, setUserProfile] = useState(null);
  const [checking, setChecking] = useState(false);

  const checkProfile = useCallback(async () => {
    if (!publicKey) return;
    setChecking(true);
    try {
      const profile = await fetchProfile(publicKey);
      if (profile) {
        setUserProfile({
          ...profile,
          postCount: profile.postCount,
        });
        setPage("feed");
      } else {
        setPage("setup");
      }
    } catch {
      setPage("setup");
    } finally {
      setChecking(false);
    }
  }, [publicKey, fetchProfile]);

  useEffect(() => {
    if (connected && publicKey) {
      checkProfile();
    } else {
      setPage("landing");
      setUserProfile(null);
    }
  }, [connected, publicKey, checkProfile]);

  const handleUsernameSet = (username) => {
    setUserProfile({ username, postCount: { toNumber: () => 0 } });
    setPage("feed");
  };

  const handleDisconnect = async () => {
    await disconnect();
    setPage("landing");
    setUserProfile(null);
  };

  const handleProfileUpdate = useCallback(async () => {
    if (!publicKey) return;
    const profile = await fetchProfile(publicKey);
    if (profile) setUserProfile(profile);
  }, [publicKey, fetchProfile]);

  if (!connected || page === "landing") {
    return <LandingPage />;
  }

  if (checking) {
    return (
      <div className="full-center">
        <div className="loading-pulse">
          <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="15" stroke="url(#plg)" strokeWidth="2" />
            <circle cx="16" cy="16" r="6" fill="url(#plg)" />
            <defs>
              <linearGradient id="plg" x1="0" y1="0" x2="32" y2="32">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#60a5fa" />
              </linearGradient>
            </defs>
          </svg>
          <span>Checking identity…</span>
        </div>
      </div>
    );
  }

  if (page === "setup") {
    return <SetupPage onComplete={handleUsernameSet} />;
  }

  return (
    <FeedPage
      userProfile={userProfile}
      onProfileUpdate={handleProfileUpdate}
      onDisconnect={handleDisconnect}
    />
  );
}

export default function App() {
  return (
    <WalletProvider>
      <AppInner />
    </WalletProvider>
  );
}
