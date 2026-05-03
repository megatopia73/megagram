import { useState, useCallback } from "react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { useWallet } from "./WalletContext";

const PROGRAM_ID = new PublicKey("6YrK9zX5BdiYFpYRm16AA6vaUmFgaUKaEs3Ut7dWzSPX");

// ─── Derive PDAs ─────────────────────────────────────────────────────────────

export function deriveProfilePDA(ownerPubkey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("profile"), ownerPubkey.toBuffer()],
    PROGRAM_ID
  );
}

export function derivePostPDA(authorPubkey, postCount) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("post"),
      authorPubkey.toBuffer(),
      new BN(postCount).toArrayLike(Buffer, "le", 8),
    ],
    PROGRAM_ID
  );
}

export function deriveLikePDA(likerPubkey, postPubkey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("like"), likerPubkey.toBuffer(), postPubkey.toBuffer()],
    PROGRAM_ID
  );
}

export function deriveCommentPDA(authorPubkey, postPubkey, commentCount) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("comment"),
      authorPubkey.toBuffer(),
      postPubkey.toBuffer(),
      new BN(commentCount).toArrayLike(Buffer, "le", 8),
    ],
    PROGRAM_ID
  );
}

// ─── Fetch user profile ──────────────────────────────────────────────────────

export function useFetchProfile() {
  const { program } = useWallet();

  return useCallback(
    async (ownerPubkey) => {
      if (!program) return null;
      try {
        const [profilePDA] = deriveProfilePDA(ownerPubkey);
        const profile = await program.account.userProfile.fetch(profilePDA);
        return profile;
      } catch {
        return null;
      }
    },
    [program]
  );
}

// ─── Set username ─────────────────────────────────────────────────────────────

export function useSetUsername() {
  const { program, publicKey } = useWallet();
  const [loading, setLoading] = useState(false);

  const setUsername = useCallback(
    async (username) => {
      if (!program || !publicKey) throw new Error("Wallet not connected");
      setLoading(true);
      try {
        const [profilePDA] = deriveProfilePDA(publicKey);
        const tx = await program.methods
          .setUsername(username)
          .accounts({
            userProfile: profilePDA,
            user: publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        return tx;
      } finally {
        setLoading(false);
      }
    },
    [program, publicKey]
  );

  return { setUsername, loading };
}

// ─── Create post ──────────────────────────────────────────────────────────────

export function useCreatePost() {
  const { program, publicKey } = useWallet();
  const [loading, setLoading] = useState(false);

  const createPost = useCallback(
    async (content, userProfile) => {
      if (!program || !publicKey) throw new Error("Wallet not connected");
      setLoading(true);
      try {
        const [profilePDA] = deriveProfilePDA(publicKey);
        const [postPDA] = derivePostPDA(publicKey, userProfile.postCount.toNumber());
        const tx = await program.methods
          .createPost(content)
          .accounts({
            post: postPDA,
            userProfile: profilePDA,
            author: publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        return { tx, postPDA };
      } finally {
        setLoading(false);
      }
    },
    [program, publicKey]
  );

  return { createPost, loading };
}

// ─── Like post ────────────────────────────────────────────────────────────────

export function useLikePost() {
  const { program, publicKey } = useWallet();
  const [loading, setLoading] = useState(false);

  const likePost = useCallback(
    async (postPubkey) => {
      if (!program || !publicKey) throw new Error("Wallet not connected");
      setLoading(true);
      try {
        const [likePDA] = deriveLikePDA(publicKey, postPubkey);
        const tx = await program.methods
          .likePost()
          .accounts({
            like: likePDA,
            post: postPubkey,
            liker: publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        return tx;
      } finally {
        setLoading(false);
      }
    },
    [program, publicKey]
  );

  return { likePost, loading };
}

// ─── Add comment ──────────────────────────────────────────────────────────────

export function useAddComment() {
  const { program, publicKey } = useWallet();
  const [loading, setLoading] = useState(false);

  const addComment = useCallback(
    async (content, postPubkey, postCommentCount) => {
      if (!program || !publicKey) throw new Error("Wallet not connected");
      setLoading(true);
      try {
        const [profilePDA] = deriveProfilePDA(publicKey);
        const [commentPDA] = deriveCommentPDA(publicKey, postPubkey, postCommentCount);
        const tx = await program.methods
          .addComment(content)
          .accounts({
            comment: commentPDA,
            post: postPubkey,
            userProfile: profilePDA,
            author: publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        return tx;
      } finally {
        setLoading(false);
      }
    },
    [program, publicKey]
  );

  return { addComment, loading };
}

// ─── Fetch all posts ──────────────────────────────────────────────────────────

export function useFetchPosts() {
  const { program } = useWallet();

  return useCallback(async () => {
    if (!program) return [];
    try {
      const posts = await program.account.post.all();
      return posts
        .map((p) => ({
          publicKey: p.publicKey,
          ...p.account,
          likeCount: p.account.likeCount.toNumber(),
          commentCount: p.account.commentCount.toNumber(),
          createdAt: p.account.createdAt.toNumber(),
        }))
        .sort((a, b) => b.createdAt - a.createdAt);
    } catch {
      return [];
    }
  }, [program]);
}

// ─── Fetch comments for a post ────────────────────────────────────────────────

export function useFetchComments() {
  const { program } = useWallet();

  return useCallback(
    async (postPubkey) => {
      if (!program) return [];
      try {
        const allComments = await program.account.comment.all([
          {
            memcmp: {
              offset: 8 + 32 + 4 + 32, // discriminator + author + username_prefix + post pubkey
              bytes: postPubkey.toBase58(),
            },
          },
        ]);
        return allComments
          .map((c) => ({
            publicKey: c.publicKey,
            ...c.account,
            createdAt: c.account.createdAt.toNumber(),
          }))
          .sort((a, b) => a.createdAt - b.createdAt);
      } catch {
        return [];
      }
    },
    [program]
  );
}

// ─── Check if wallet has liked a post ────────────────────────────────────────

export function useCheckLiked() {
  const { program, publicKey } = useWallet();

  return useCallback(
    async (postPubkey) => {
      if (!program || !publicKey) return false;
      try {
        const [likePDA] = deriveLikePDA(publicKey, postPubkey);
        await program.account.like.fetch(likePDA);
        return true;
      } catch {
        return false;
      }
    },
    [program, publicKey]
  );
}
