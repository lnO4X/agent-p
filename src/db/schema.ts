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
    passwordHash: text("password_hash"), // nullable: OAuth users don't have passwords
    displayName: text("display_name"),
    email: text("email"),
    emailVerifiedAt: timestamp("email_verified_at"),
    googleId: text("google_id"),
    avatarUrl: text("avatar_url"),
    failedLoginAttempts: integer("failed_login_attempts").default(0).notNull(),
    lockedUntil: timestamp("locked_until"),
    isAdmin: boolean("is_admin").default(false).notNull(),
    tier: text("tier", { enum: ["free", "premium"] }).notNull().default("free"),
    tierExpiresAt: timestamp("tier_expires_at"),
    personalityType: text("personality_type"), // "INTJ", "ENFP", etc. nullable — Jungian personality type
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("users_username_idx").on(table.username),
    uniqueIndex("users_google_id_idx").on(table.googleId),
    uniqueIndex("users_email_idx").on(table.email),
  ]
);

// ==================== VERIFICATION TOKENS ====================
export const verificationTokens = pgTable(
  "verification_tokens",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["password_reset", "email_verify"] }).notNull(),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("verification_tokens_token_idx").on(table.token),
    index("verification_tokens_user_idx").on(table.userId),
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
    slot: integer("slot").notNull(), // 0=Talent Coach built-in, 1-3=custom
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


// ==================== CHAT MESSAGES (Conversation History) ====================
export const chatMessages = pgTable(
  "chat_messages",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    partnerId: text("partner_id")
      .notNull()
      .references(() => partners.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["user", "assistant"] }).notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("chat_messages_user_partner_idx").on(
      table.userId,
      table.partnerId,
      table.createdAt
    ),
  ]
);

// ==================== SITE SETTINGS (key-value config) ====================
export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});


// ==================== ANALYTICS EVENTS ====================
export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: text("id").primaryKey(),
    event: text("event").notNull(), // quiz_start, quiz_complete, share_click, register, chat_start, archetype_view, personality_combo_view
    props: jsonb("props"), // { mode: "quick", archetype: "berserker", ... }
    userId: text("user_id"), // nullable — anonymous users tracked too
    sessionId: text("session_id"), // browser session fingerprint
    page: text("page"), // URL path
    referrer: text("referrer"), // document.referrer
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("analytics_events_event_idx").on(table.event),
    index("analytics_events_created_idx").on(table.createdAt),
  ]
);

