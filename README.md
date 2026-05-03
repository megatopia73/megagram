# 🌐 MegaGram — Privacy-First Web3 Social dApp

# MegaGram 🌐

A privacy-first decentralized social media dApp built on Solana. 
No email. No password. No tracking. Just your wallet.

Post, like, and comment — all stored on-chain. 
Your wallet is your identity.

Built with Rust + Anchor (smart contracts) and React (frontend).
---

## 📁 Folder Structure

```
megagram/
├── anchor/                         # Solana smart contract
│   ├── Anchor.toml                 # Anchor config (localnet)
│   ├── Cargo.toml                  # Workspace manifest
│   ├── package.json                # Test dependencies
│   ├── programs/
│   │   └── megagram/
│   │       ├── Cargo.toml          # Program dependencies
│   │       └── src/
│   │           └── lib.rs          # ← Smart contract (Rust + Anchor)
│   └── tests/
│       └── megagram.js             # Anchor integration tests
│
└── frontend/                       # React app
    ├── public/
    │   └── index.html
    ├── package.json
    ├── config-overrides.js         # Webpack polyfills for Solana
    └── src/
        ├── App.js                  # Root component + routing
        ├── index.js                # Entry point
        ├── styles/
        │   └── global.css          # All styles (dark theme)
        ├── idl/
        │   └── megagram.json       # Contract IDL for frontend
        ├── utils/
        │   ├── WalletContext.js    # Phantom wallet + Anchor provider
        │   └── programUtils.js     # All on-chain interaction hooks
        ├── pages/
        │   ├── LandingPage.js      # Connect wallet screen
        │   ├── SetupPage.js        # Username setup screen
        │   └── FeedPage.js         # Main feed (sidebar + posts)
        └── components/
            ├── PostCard.js         # Post display + like + comments
            └── CreatePostBox.js    # New post composer
```

---

## ⚙️ Prerequisites

Install these tools first:

| Tool | Version | Install |
|------|---------|---------|
| Rust | stable | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| Solana CLI | 1.18+ | `sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"` |
| Anchor CLI | 0.29.0 | `cargo install --git https://github.com/coral-xyz/anchor avm --locked --force && avm install 0.29.0 && avm use 0.29.0` |
| Node.js | 18+ | https://nodejs.org |
| Yarn | 1.x | `npm install -g yarn` |
| Phantom Wallet | latest | https://phantom.app (browser extension) |

---

## Step-by-Step Setup

### Step 1 — Configure Solana for localhost

```bash
solana config set --url localhost
solana-keygen new --no-bip39-passphrase   # creates ~/.config/solana/id.json
solana config get                          # verify: RPC URL = http://127.0.0.1:8899
```

### Step 2 — Start the local validator

Open a **new terminal** and keep it running:

```bash
solana-test-validator
```

You should see blocks streaming. Leave this terminal open.

### Step 3 — Airdrop SOL to your wallet

```bash
solana airdrop 10
solana balance    # should show 10 SOL
```

### Step 4 — Build & deploy the smart contract

```bash
cd megagram/anchor
yarn install          # install test deps
anchor build          # compiles Rust → BPF bytecode (~2 min first time)
anchor deploy         # deploys to localnet
```

After deploy, copy the **Program ID** from output. If it differs from the default, update:
- `anchor/programs/megagram/src/lib.rs` → `declare_id!("YOUR_ID")`
- `frontend/src/idl/megagram.json` → `"address": "YOUR_ID"`
- `frontend/src/utils/WalletContext.js` → `PROGRAM_ID = new PublicKey("YOUR_ID")`
- `frontend/src/utils/programUtils.js` → `PROGRAM_ID = new PublicKey("YOUR_ID")`

Then rebuild:
```bash
anchor build && anchor deploy
```

### Step 5 — Copy IDL to frontend (optional)

Anchor generates the IDL automatically. You can sync it:

```bash
cp anchor/target/idl/megagram.json frontend/src/idl/megagram.json
```

### Step 6 — Run tests

```bash
cd megagram/anchor
anchor test --skip-local-validator
```

Expected output:
```
  megagram
    ✓ sets a username
    ✓ creates a post
    ✓ likes a post
    ✓ adds a comment
    ✓ rejects empty post
    ✓ rejects posts over 280 chars
    ✓ fetches all posts

  7 passing
```

### Step 7 — Start the frontend

```bash
cd megagram/frontend
npm install
npm install --save-dev react-app-rewired customize-cra stream-browserify buffer process
```

Update `package.json` scripts to use `react-app-rewired`:
```json
"scripts": {
  "start": "react-app-rewired start",
  "build": "react-app-rewired build",
  "test": "react-app-rewired test"
}
```

Then start:
```bash
npm start
```

Open **http://localhost:3000** 🎉

---

## Using the App

### Connect Wallet
1. Open http://localhost:3000
2. Click **"Connect Phantom Wallet"**
3. Phantom prompts → approve connection

### Configure Phantom for Localnet
1. Open Phantom settings → Developer Settings
2. Change network to **Localhost** (http://127.0.0.1:8899)
3. Your SOL balance should show ~10 SOL

### Setup Username
- Enter a unique username (2–32 chars, letters/numbers/underscore)
- Click "Claim username →"
- Approve the Solana transaction in Phantom
- This writes your profile to the blockchain

### Post, Like, Comment
- Type up to 280 characters in the post box → click **Post**
- Click ❤️ to like a post (one like per wallet per post, enforced on-chain)
- Click 💬 to expand comments → type a reply → click **Reply**

---

## Smart Contract Architecture

### Accounts & PDAs

| Account | PDA Seeds | Data |
|---------|-----------|------|
| `UserProfile` | `["profile", wallet]` | username, postCount, createdAt |
| `Post` | `["post", author, postCount]` | content, likeCount, commentCount, createdAt |
| `Like` | `["like", liker, post]` | liker, post pubkey |
| `Comment` | `["comment", author, post, commentCount]` | content, username, createdAt |

### Instructions

| Instruction | On-chain checks |
|-------------|-----------------|
| `set_username` | 2–32 chars, alphanumeric + underscore, wallet-unique |
| `create_post` | 1–280 chars, requires existing profile |
| `like_post` | One like per wallet (PDA uniqueness enforces this) |
| `add_comment` | 1–280 chars, requires existing profile |

---

## Privacy Design

- **Wallet-only identity** — no email, no password, no OAuth
- **No backend** — all data lives on Solana accounts
- **No cookies** — session state is React in-memory only
- **No tracking** — no analytics, no pixel, no fingerprinting
- **No centralized DB** — posts are Solana PDAs owned by users

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Phantom not found" | Install Phantom browser extension |
| "insufficient funds" | `solana airdrop 2` |
| "program not deployed" | `anchor deploy` in anchor/ folder |
| "RPC connection failed" | Make sure `solana-test-validator` is running |
| Webpack polyfill errors | Run the npm install step in Step 7 exactly |
| "Account does not exist" | Re-deploy program after validator restart |

---

## Tech Stack Summary

| Layer | Tech |
|-------|------|
| Blockchain | Solana (localnet) |
| Smart Contracts | Rust + Anchor Framework 0.29 |
| Frontend | React 18 (JavaScript only) |
| Web3 | @solana/web3.js + @project-serum/anchor |
| Wallet | Phantom |
| Styling | Vanilla CSS (dark theme, no framework deps) |
| Network | localhost:8899 (solana-test-validator) |

---

## Notes

- The `declare_id!` program ID must match your deployed program
- Usernames are permanent (one per wallet, stored on-chain)
- Likes are idempotent — the PDA uniqueness prevents double-likes
- `program.account.post.all()` fetches ALL posts (no pagination yet)
- For production: add pagination, IPFS media, and switch to devnet/mainnet
