const anchor = require("@coral-xyz/anchor");
const { PublicKey, SystemProgram } = anchor.web3;
const assert = require("assert");

describe("megagram", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Megagram;
  const user = provider.wallet.publicKey;

  let profilePDA, postPDA, postPDA2, commentPDA, likePDA;

  const deriveProfile = (owner) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("profile"), owner.toBuffer()],
      program.programId
    );

  const derivePost = (author, count) =>
    PublicKey.findProgramAddressSync(
      [
        Buffer.from("post"),
        author.toBuffer(),
        new anchor.BN(count).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

  const deriveLike = (liker, post) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("like"), liker.toBuffer(), post.toBuffer()],
      program.programId
    );

  const deriveComment = (author, post, count) =>
    PublicKey.findProgramAddressSync(
      [
        Buffer.from("comment"),
        author.toBuffer(),
        post.toBuffer(),
        new anchor.BN(count).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

  it("sets a username", async () => {
    [profilePDA] = deriveProfile(user);
    await program.methods
      .setUsername("test_user")
      .accounts({
        userProfile: profilePDA,
        user,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const profile = await program.account.userProfile.fetch(profilePDA);
    assert.equal(profile.username, "test_user");
    assert.ok(profile.owner.equals(user));
    console.log("✓ Username set:", profile.username);
  });

  it("creates a post", async () => {
    const profile = await program.account.userProfile.fetch(profilePDA);
    [postPDA] = derivePost(user, profile.postCount.toNumber());

    await program.methods
      .createPost("Hello Solana! This is my first on-chain post 🚀")
      .accounts({
        post: postPDA,
        userProfile: profilePDA,
        author: user,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const post = await program.account.post.fetch(postPDA);
    assert.equal(post.content, "Hello Solana! This is my first on-chain post 🚀");
    assert.equal(post.likeCount.toNumber(), 0);
    console.log("✓ Post created:", post.content);
  });

  it("likes a post", async () => {
    [likePDA] = deriveLike(user, postPDA);
    await program.methods
      .likePost()
      .accounts({
        like: likePDA,
        post: postPDA,
        liker: user,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const post = await program.account.post.fetch(postPDA);
    assert.equal(post.likeCount.toNumber(), 1);
    console.log("✓ Post liked. Like count:", post.likeCount.toNumber());
  });

  it("adds a comment", async () => {
    [commentPDA] = deriveComment(user, postPDA, 0);
    await program.methods
      .addComment("Great first post!")
      .accounts({
        comment: commentPDA,
        post: postPDA,
        userProfile: profilePDA,
        author: user,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const comment = await program.account.comment.fetch(commentPDA);
    const post = await program.account.post.fetch(postPDA);
    assert.equal(comment.content, "Great first post!");
    assert.equal(post.commentCount.toNumber(), 1);
    console.log("✓ Comment added:", comment.content);
  });

  it("rejects empty post", async () => {
    const profile = await program.account.userProfile.fetch(profilePDA);
    [postPDA2] = derivePost(user, profile.postCount.toNumber());
    try {
      await program.methods
        .createPost("   ")
        .accounts({
          post: postPDA2,
          userProfile: profilePDA,
          author: user,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      assert.fail("Should have thrown");
    } catch (e) {
      assert.ok(e.message.includes("PostEmpty") || e.error?.errorMessage?.includes("empty"));
      console.log("✓ Empty post correctly rejected");
    }
  });

  it("rejects posts over 280 chars", async () => {
    const profile = await program.account.userProfile.fetch(profilePDA);
    [postPDA2] = derivePost(user, profile.postCount.toNumber());
    const longPost = "x".repeat(281);
    try {
      await program.methods
        .createPost(longPost)
        .accounts({
          post: postPDA2,
          userProfile: profilePDA,
          author: user,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      assert.fail("Should have thrown");
    } catch (e) {
      assert.ok(e.message.includes("PostTooLong") || e.error?.errorMessage?.includes("280"));
      console.log("✓ Long post correctly rejected");
    }
  });

  it("fetches all posts", async () => {
    const posts = await program.account.post.all();
    assert.ok(posts.length >= 1);
    console.log("✓ Total posts on chain:", posts.length);
  });
});
