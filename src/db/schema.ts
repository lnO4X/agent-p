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
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("users_username_idx").on(table.username),
    uniqueIndex("users_referral_code_idx").on(table.referralCode),
  ]
);

// ==================== TEST SESSIONS ====================
export const testSessions = pgTable("test_sessions", {
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
});

// ==================== GAME SCORES ====================
export const gameScores = pgTable("game_scores", {
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
});

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
  (table) => [uniqueIndex("talent_profiles_session_idx").on(table.sessionId)]
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
