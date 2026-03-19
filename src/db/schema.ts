import {
  pgTable,
  text,
  timestamp,
  real,
  integer,
  jsonb,
  boolean,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ==================== USERS ====================
export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    username: text("username").notNull(),
    passwordHash: text("password_hash").notNull(),
    displayName: text("display_name"),
    email: text("email"),
    emailVerifiedAt: timestamp("email_verified_at"),
    isProfilePublic: boolean("is_profile_public").default(true).notNull(),
    isAdmin: boolean("is_admin").default(false).notNull(),
    tier: text("tier", { enum: ["free", "premium"] }).notNull().default("free"),
    tierExpiresAt: timestamp("tier_expires_at"),
    referralCode: text("referral_code"),
    steamId: text("steam_id"),
    steamUsername: text("steam_username"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("users_username_idx").on(table.username),
    uniqueIndex("users_referral_code_idx").on(table.referralCode),
    uniqueIndex("users_steam_id_idx").on(table.steamId),
  ]
);

// ==================== TEST SESSIONS ====================
export const testSessions = pgTable(
  "test_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    status: text("status", {
      enum: ["in_progress", "completed", "abandoned"],
    })
      .notNull()
      .default("in_progress"),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
  },
  (table) => [
    index("test_sessions_user_idx").on(table.userId),
  ]
);

// ==================== GAME SCORES ====================
export const gameScores = pgTable(
  "game_scores",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => testSessions.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    gameId: text("game_id").notNull(),
    talentCategory: text("talent_category").notNull(),
    rawScore: real("raw_score").notNull(),
    normalizedScore: real("normalized_score").notNull(),
    metadata: jsonb("metadata"),
    playedAt: timestamp("played_at").defaultNow().notNull(),
    durationMs: integer("duration_ms").notNull(),
  },
  (table) => [
    index("game_scores_session_idx").on(table.sessionId),
    index("game_scores_user_idx").on(table.userId),
  ]
);

// ==================== TALENT PROFILES ====================
export const talentProfiles = pgTable(
  "talent_profiles",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => testSessions.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    reactionSpeed: real("reaction_speed"),
    handEyeCoord: real("hand_eye_coord"),
    spatialAwareness: real("spatial_awareness"),
    memory: real("memory"),
    strategyLogic: real("strategy_logic"),
    rhythmSense: real("rhythm_sense"),
    patternRecog: real("pattern_recog"),
    multitasking: real("multitasking"),
    decisionSpeed: real("decision_speed"),
    emotionalControl: real("emotional_control"),
    teamworkTendency: real("teamwork_tendency"),
    riskAssessment: real("risk_assessment"),
    resourceMgmt: real("resource_mgmt"),
    overallScore: real("overall_score"),
    overallRank: text("overall_rank"),
    archetypeId: text("archetype_id"),
    aiAnalysis: text("ai_analysis"),
    genreRecommendations: jsonb("genre_recommendations"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("talent_profiles_session_idx").on(table.sessionId),
    index("talent_profiles_user_idx").on(table.userId),
  ]
);

// ==================== CAPTCHA SESSIONS ====================
export const captchaSessions = pgTable("captcha_sessions", {
  id: text("id").primaryKey(),
  answer: text("answer").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

// ==================== GAMES CATALOG ====================
export const games = pgTable(
  "games",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    nameEn: text("name_en"),
    slug: text("slug").notNull(),
    description: text("description"),
    descriptionEn: text("description_en"),
    coverUrl: text("cover_url"),
    developer: text("developer"),
    publisher: text("publisher"),
    rating: real("rating"),
    popularity: integer("popularity").default(0),
    releaseDate: text("release_date"), // "2024-03-15" or "2024" (flexible text)
    platforms: jsonb("platforms").$type<string[]>().default([]),
    genres: jsonb("genres").$type<string[]>().default([]),
    tags: jsonb("tags").$type<string[]>().default([]),  // free-form tags (e.g. "open world", "co-op")
    priceInfo: text("price_info"),
    sourceType: text("source_type", {
      enum: ["seed", "steam", "taptap", "boardgame", "manual"],
    })
      .notNull()
      .default("seed"),
    status: text("status", {
      enum: ["active", "hidden", "pending"],
    })
      .notNull()
      .default("active"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("games_slug_idx").on(table.slug),
    index("games_status_popularity_idx").on(table.status, table.popularity),
    index("games_source_type_idx").on(table.sourceType),
  ]
);


// ==================== PARTNERS (Agent System) ====================
export const partners = pgTable(
  "partners",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    slot: integer("slot").notNull(), // 0=Weda built-in, 1-3=custom
    name: text("name").notNull(),
    avatar: text("avatar").notNull(), // Lucide icon name
    modelId: text("model_id"), // null = use global default model
    definition: text("definition").notNull(), // Markdown personality definition
    memory: text("memory").notNull().default(""), // Markdown accumulated observations
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("partners_user_slot_idx").on(table.userId, table.slot),
    index("partners_user_idx").on(table.userId),
  ]
);



// ==================== USER KNOWLEDGE GRAPH ====================
export const userKnowledge = pgTable(
  "user_knowledge",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    category: text("category", {
      enum: ["preference", "skill", "behavior", "context"],
    }).notNull(),
    key: text("key").notNull(), // e.g. "favorite_genre", "recent_game", "play_style"
    value: text("value").notNull(), // e.g. "fps", "Elden Ring", "competitive"
    source: text("source").notNull(), // partner_id, "system", "reaction", "test"
    confidence: real("confidence").default(0.8).notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("user_knowledge_user_category_idx").on(table.userId, table.category),
    index("user_knowledge_user_key_idx").on(table.userId, table.key),
  ]
);

// ==================== MICRO CHALLENGES ====================
export const microChallenges = pgTable(
  "micro_challenges",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    gameId: text("game_id").notNull(), // maps to games registry game ID
    talentCategory: text("talent_category").notNull(),
    score: real("score").notNull(), // normalized 0-100
    completedAt: timestamp("completed_at").defaultNow().notNull(),
  },
  (table) => [
    index("micro_challenges_user_completed_idx").on(
      table.userId,
      table.completedAt
    ),
  ]
);

// ==================== PK CHALLENGES (Social 1v1) ====================
export const pkChallenges = pgTable(
  "pk_challenges",
  {
    id: text("id").primaryKey(),
    gameId: text("game_id").notNull(), // maps to game registry ID
    creatorId: text("creator_id").references(() => users.id), // null = anonymous
    creatorName: text("creator_name").notNull(), // display name (works without login)
    creatorScore: real("creator_score").notNull(), // normalized 0-100
    challengerId: text("challenger_id").references(() => users.id),
    challengerName: text("challenger_name"),
    challengerScore: real("challenger_score"),
    status: text("status", {
      enum: ["pending", "completed"],
    })
      .notNull()
      .default("pending"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
  },
  (table) => [
    index("pk_challenges_creator_idx").on(table.creatorId),
    index("pk_challenges_status_idx").on(table.status, table.createdAt),
  ]
);

// ==================== GAME RECOMMENDATIONS ====================
export const gameRecommendations = pgTable(
  "game_recommendations",
  {
    id: text("id").primaryKey(),
    profileId: text("profile_id")
      .notNull()
      .references(() => talentProfiles.id, { onDelete: "cascade" }),
    gameId: text("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    fitScore: real("fit_score").notNull(),
    rank: integer("rank").notNull(),
    reason: text("reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("game_recs_profile_idx").on(table.profileId, table.rank),
  ]
);

// ==================== REFERRALS ====================
export const referrals = pgTable(
  "referrals",
  {
    id: text("id").primaryKey(),
    referrerId: text("referrer_id")
      .notNull()
      .references(() => users.id),
    referredUserId: text("referred_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("referrals_referred_user_idx").on(table.referredUserId),
    index("referrals_referrer_idx").on(table.referrerId),
  ]
);

// ==================== COMMUNITY POSTS ====================
export const communityPosts = pgTable(
  "community_posts",
  {
    id: text("id").primaryKey(),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id),
    archetypeId: text("archetype_id").notNull(),
    content: text("content").notNull(),
    likeCount: integer("like_count").default(0).notNull(),
    replyCount: integer("reply_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("community_posts_archetype_idx").on(table.archetypeId, table.createdAt),
    index("community_posts_author_idx").on(table.authorId),
  ]
);

export const communityReplies = pgTable(
  "community_replies",
  {
    id: text("id").primaryKey(),
    postId: text("post_id")
      .notNull()
      .references(() => communityPosts.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("community_replies_post_idx").on(table.postId, table.createdAt),
  ]
);

export const communityPostLikes = pgTable(
  "community_post_likes",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    postId: text("post_id")
      .notNull()
      .references(() => communityPosts.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("community_post_likes_unique_idx").on(table.userId, table.postId),
    index("community_post_likes_user_idx").on(table.userId),
  ]
);

// ==================== NOTIFICATIONS ====================
export const notifications = pgTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["post_liked", "post_replied"] }).notNull(),
    postId: text("post_id").references(() => communityPosts.id, {
      onDelete: "cascade",
    }),
    senderId: text("sender_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("notifications_user_idx").on(table.userId, table.createdAt),
    index("notifications_unread_idx").on(table.userId, table.read),
  ]
);

// ==================== STEAM GAME LIBRARY ====================
export const steamGameLibrary = pgTable(
  "steam_game_library",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    steamAppId: integer("steam_app_id").notNull(),
    name: text("name").notNull(),
    playtimeMinutes: integer("playtime_minutes").default(0).notNull(),
    lastPlayed: timestamp("last_played"),
    iconUrl: text("icon_url"),
    syncedAt: timestamp("synced_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("steam_lib_user_app_idx").on(table.userId, table.steamAppId),
    index("steam_lib_user_idx").on(table.userId),
  ]
);

// ==================== FEEDBACK (data flywheel) ====================
export const recommendationFeedback = pgTable(
  "recommendation_feedback",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    gameId: text("game_id")
      .notNull()
      .references(() => games.id),
    signal: text("signal", { enum: ["like", "dislike", "played", "wishlisted"] }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("rec_feedback_user_game_idx").on(table.userId, table.gameId),
    index("rec_feedback_game_idx").on(table.gameId),
  ]
);

export const chatFeedback = pgTable(
  "chat_feedback",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    partnerId: text("partner_id")
      .notNull()
      .references(() => partners.id),
    rating: integer("rating").notNull(), // 1-5 stars
    modelId: text("model_id"), // resolved AI model used (e.g. "anthropic/claude-sonnet-4")
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("chat_feedback_user_idx").on(table.userId),
    index("chat_feedback_partner_idx").on(table.partnerId),
    index("chat_feedback_model_idx").on(table.modelId),
  ]
);

// ==================== SHARED PARTNER DEFINITIONS (marketplace) ====================
export const sharedPartners = pgTable(
  "shared_partners",
  {
    id: text("id").primaryKey(),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id),
    name: text("name").notNull(),
    avatar: text("avatar").notNull(),
    description: text("description").notNull(), // Short pitch (max 200 chars)
    definition: text("definition").notNull(),
    tags: jsonb("tags").$type<string[]>().default([]),
    usageCount: integer("usage_count").default(0).notNull(),
    likeCount: integer("like_count").default(0).notNull(),
    status: text("status", { enum: ["active", "hidden", "reported"] }).notNull().default("active"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("shared_partners_author_idx").on(table.authorId),
    index("shared_partners_popular_idx").on(table.likeCount),
  ]
);

export const sharedPartnerLikes = pgTable(
  "shared_partner_likes",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    sharedPartnerId: text("shared_partner_id")
      .notNull()
      .references(() => sharedPartners.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("shared_partner_likes_unique_idx").on(table.userId, table.sharedPartnerId),
    index("shared_partner_likes_user_idx").on(table.userId),
  ]
);

// ==================== SITE SETTINGS (key-value config) ====================
export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ==================== ACTIVATION CODES ====================
export const activationCodes = pgTable(
  "activation_codes",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    tier: text("tier", { enum: ["premium"] }).notNull().default("premium"),
    durationDays: integer("duration_days").notNull().default(30),
    usedBy: text("used_by").references(() => users.id),
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at"), // code itself can expire
  },
  (table) => [
    uniqueIndex("activation_codes_code_idx").on(table.code),
  ]
);
