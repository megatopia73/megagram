use anchor_lang::prelude::*;

declare_id!("6YrK9zX5BdiYFpYRm16AA6vaUmFgaUKaEs3Ut7dWzSPX");

#[program]
pub mod megagram {
    use super::*;

    // ─── Set a unique username for a wallet ───────────────────────────────────
    pub fn set_username(ctx: Context<SetUsername>, username: String) -> Result<()> {
        require!(username.len() >= 2, MegaError::UsernameTooShort);
        require!(username.len() <= 32, MegaError::UsernameTooLong);
        require!(
            username.chars().all(|c| c.is_alphanumeric() || c == '_'),
            MegaError::UsernameInvalidChars
        );

        let profile = &mut ctx.accounts.user_profile;
        profile.owner = ctx.accounts.user.key();
        profile.username = username;
        profile.post_count = 0;
        profile.created_at = Clock::get()?.unix_timestamp;
        Ok(())
    }

    // ─── Create a text post (max 280 chars) ──────────────────────────────────
    pub fn create_post(ctx: Context<CreatePost>, content: String) -> Result<()> {
        require!(!content.trim().is_empty(), MegaError::PostEmpty);
        require!(content.len() <= 280, MegaError::PostTooLong);

        let profile = &mut ctx.accounts.user_profile;
        let post = &mut ctx.accounts.post;

        post.author = ctx.accounts.author.key();
        post.username = profile.username.clone();
        post.content = content;
        post.like_count = 0;
        post.comment_count = 0;
        post.created_at = Clock::get()?.unix_timestamp;
        post.bump = ctx.bumps.post;

        profile.post_count = profile.post_count.saturating_add(1);
        Ok(())
    }

    // ─── Like a post (each wallet can like once per post) ────────────────────
    pub fn like_post(ctx: Context<LikePost>) -> Result<()> {
        let like = &mut ctx.accounts.like;
        let post = &mut ctx.accounts.post;

        like.liker = ctx.accounts.liker.key();
        like.post = post.key();
        like.created_at = Clock::get()?.unix_timestamp;

        post.like_count = post.like_count.saturating_add(1);
        Ok(())
    }

    // ─── Add a comment to a post (max 280 chars) ─────────────────────────────
    pub fn add_comment(ctx: Context<AddComment>, content: String) -> Result<()> {
        require!(!content.trim().is_empty(), MegaError::CommentEmpty);
        require!(content.len() <= 280, MegaError::CommentTooLong);

        let profile = &mut ctx.accounts.user_profile;
        let comment = &mut ctx.accounts.comment;
        let post = &mut ctx.accounts.post;

        comment.author = ctx.accounts.author.key();
        comment.username = profile.username.clone();
        comment.post = post.key();
        comment.content = content;
        comment.created_at = Clock::get()?.unix_timestamp;

        post.comment_count = post.comment_count.saturating_add(1);
        Ok(())
    }
}

// ─── Accounts ────────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct SetUsername<'info> {
    #[account(
        init,
        payer = user,
        space = UserProfile::SIZE,
        seeds = [b"profile", user.key().as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserProfile>,

    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreatePost<'info> {
    #[account(
        init,
        payer = author,
        space = Post::SIZE,
        seeds = [
            b"post",
            author.key().as_ref(),
            &user_profile.post_count.to_le_bytes()
        ],
        bump
    )]
    pub post: Account<'info, Post>,

    #[account(
        mut,
        seeds = [b"profile", author.key().as_ref()],
        bump,
        constraint = user_profile.owner == author.key() @ MegaError::NotOwner
    )]
    pub user_profile: Account<'info, UserProfile>,

    #[account(mut)]
    pub author: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct LikePost<'info> {
    #[account(
        init,
        payer = liker,
        space = Like::SIZE,
        seeds = [b"like", liker.key().as_ref(), post.key().as_ref()],
        bump
    )]
    pub like: Account<'info, Like>,

    #[account(mut)]
    pub post: Account<'info, Post>,

    #[account(mut)]
    pub liker: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddComment<'info> {
    #[account(
        init,
        payer = author,
        space = Comment::SIZE,
        seeds = [
            b"comment",
            author.key().as_ref(),
            post.key().as_ref(),
            &post.comment_count.to_le_bytes()
        ],
        bump
    )]
    pub comment: Account<'info, Comment>,

    #[account(mut)]
    pub post: Account<'info, Post>,

    #[account(
        seeds = [b"profile", author.key().as_ref()],
        bump,
        constraint = user_profile.owner == author.key() @ MegaError::NotOwner
    )]
    pub user_profile: Account<'info, UserProfile>,

    #[account(mut)]
    pub author: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// ─── Data Accounts ────────────────────────────────────────────────────────────

#[account]
pub struct UserProfile {
    pub owner: Pubkey,        // 32
    pub username: String,     // 4 + 32
    pub post_count: u64,      // 8
    pub created_at: i64,      // 8
}

impl UserProfile {
    pub const SIZE: usize = 8 + 32 + (4 + 32) + 8 + 8;
}

#[account]
pub struct Post {
    pub author: Pubkey,       // 32
    pub username: String,     // 4 + 32
    pub content: String,      // 4 + 280
    pub like_count: u64,      // 8
    pub comment_count: u64,   // 8
    pub created_at: i64,      // 8
    pub bump: u8,             // 1
}

impl Post {
    pub const SIZE: usize = 8 + 32 + (4 + 32) + (4 + 280) + 8 + 8 + 8 + 1;
}

#[account]
pub struct Like {
    pub liker: Pubkey,        // 32
    pub post: Pubkey,         // 32
    pub created_at: i64,      // 8
}

impl Like {
    pub const SIZE: usize = 8 + 32 + 32 + 8;
}

#[account]
pub struct Comment {
    pub author: Pubkey,       // 32
    pub username: String,     // 4 + 32
    pub post: Pubkey,         // 32
    pub content: String,      // 4 + 280
    pub created_at: i64,      // 8
}

impl Comment {
    pub const SIZE: usize = 8 + 32 + (4 + 32) + 32 + (4 + 280) + 8;
}

// ─── Errors ──────────────────────────────────────────────────────────────────

#[error_code]
pub enum MegaError {
    #[msg("Username must be at least 2 characters")]
    UsernameTooShort,
    #[msg("Username must be at most 32 characters")]
    UsernameTooLong,
    #[msg("Username can only contain letters, numbers, and underscores")]
    UsernameInvalidChars,
    #[msg("Post cannot be empty")]
    PostEmpty,
    #[msg("Post cannot exceed 280 characters")]
    PostTooLong,
    #[msg("Comment cannot be empty")]
    CommentEmpty,
    #[msg("Comment cannot exceed 280 characters")]
    CommentTooLong,
    #[msg("You are not the owner of this profile")]
    NotOwner,
}
