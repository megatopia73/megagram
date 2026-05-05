import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Connection, clusterApiUrl, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import idl from "../idl/megagram.json";

const PROGRAM_ID = new PublicKey("6YrK9zX5BdiYFpYRm16AA6vaUmFgaUKaEs3Ut7dWzSPX");
const NETWORK = "https://api.devnet.solana.com";  // localnet

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [wallet, setWallet] = useState(null);
  const [publicKey, setPublicKey] = useState(null);
  const [connected, setConnected] = useState(false);
  const [program, setProgram] = useState(null);
  const [connection] = useState(() => new Connection(NETWORK, "confirmed"));

  const getPhantom = () => {
    if (typeof window !== "undefined" && window.solana && window.solana.isPhantom) {
      return window.solana;
    }
    return null;
  };

  const setupProgram = useCallback((phantomWallet, pubKey) => {
    const anchorWallet = {
      publicKey: pubKey,
      signTransaction: (tx) => phantomWallet.signTransaction(tx),
      signAllTransactions: (txs) => phantomWallet.signAllTransactions(txs),
    };
    const provider = new AnchorProvider(connection, anchorWallet, {
      preflightCommitment: "confirmed",
    });
    const prog = new Program(idl, PROGRAM_ID, provider);
    setProgram(prog);
  }, [connection]);

  const connect = useCallback(async () => {
    const phantom = getPhantom();
    if (!phantom) {
      window.open("https://phantom.app/", "_blank");
      return;
    }
    try {
      const resp = await phantom.connect();
      const pubKey = resp.publicKey;
      setWallet(phantom);
      setPublicKey(pubKey);
      setConnected(true);
      setupProgram(phantom, pubKey);
    } catch (err) {
      console.error("Connection error:", err);
    }
  }, [setupProgram]);

  const disconnect = useCallback(async () => {
    const phantom = getPhantom();
    if (phantom) await phantom.disconnect();
    setWallet(null);
    setPublicKey(null);
    setConnected(false);
    setProgram(null);
  }, []);

  // Auto-connect if already approved
  useEffect(() => {
    const phantom = getPhantom();
    if (phantom?.isConnected) {
      connect();
    }
    if (phantom) {
      phantom.on("connect", (pk) => {
        setPublicKey(pk);
        setConnected(true);
        setupProgram(phantom, pk);
      });
      phantom.on("disconnect", () => {
        setWallet(null);
        setPublicKey(null);
        setConnected(false);
        setProgram(null);
      });
    }
  }, [connect, setupProgram]);

  return (
    <WalletContext.Provider
      value={{ wallet, publicKey, connected, program, connection, connect, disconnect }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
