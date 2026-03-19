import { NextRequest, NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { db } from "@/db";
import { users, steamGameLibrary } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import { nanoid } from "nanoid";

const linkSchema = z.object({
  steamId: z.string().regex(/^\d{17}$/, "Steam ID must be a 17-digit number"),
});

/**
 * GET /api/integrations/steam — Get user's Steam link status + library stats
 */
export async function GET() {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await db
      .select({ steamId: users.steamId, steamUsername: users.steamUsername })
      .from(users)
      .where(eq(users.id, auth.sub))
      .limit(1);

    if (user.length === 0 || !user[0].steamId) {
      return NextResponse.json({
        success: true,
        data: { linked: false },
      });
    }

    // Library stats
    const stats = await db
      .select({
        totalGames: sql<number>`count(*)::int`,
        totalPlaytime: sql<number>`coalesce(sum(playtime_minutes), 0)::int`,
      })
      .from(steamGameLibrary)
      .where(eq(steamGameLibrary.userId, auth.sub));

    const topGames = await db
      .select({
        name: steamGameLibrary.name,
        playtimeMinutes: steamGameLibrary.playtimeMinutes,
        steamAppId: steamGameLibrary.steamAppId,
      })
      .from(steamGameLibrary)
      .where(eq(steamGameLibrary.userId, auth.sub))
      .orderBy(sql`${steamGameLibrary.playtimeMinutes} DESC`)
      .limit(10);

    return NextResponse.json({
      success: true,
      data: {
        linked: true,
        steamId: user[0].steamId,
        steamUsername: user[0].steamUsername,
        totalGames: stats[0]?.totalGames || 0,
        totalPlaytimeHours: Math.round((stats[0]?.totalPlaytime || 0) / 60),
        topGames,
      },
    });
  } catch (err) {
    console.error("steam GET error:", err);
    return NextResponse.json(
      { success: false, error: "服务器错误 / Server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/integrations/steam — Link Steam ID + import game library
 * 1. Save Steam ID to user profile
 * 2. Fetch owned games from Steam Web API
 * 3. Store in steam_game_library table
 */
export async function POST(request: NextRequest) {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = linkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { steamId } = parsed.data;
  const steamApiKey = process.env.STEAM_API_KEY;

  // Save Steam ID
  await db
    .update(users)
    .set({ steamId, updatedAt: new Date() })
    .where(eq(users.id, auth.sub));

  // Try to fetch Steam profile
  if (steamApiKey) {
    try {
      // Get player summary (username, avatar)
      const summaryUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${steamApiKey}&steamids=${steamId}`;
      const summaryRes = await fetch(summaryUrl);
      const summaryData = await summaryRes.json();
      const player = summaryData?.response?.players?.[0];
      if (player?.personaname) {
        await db
          .update(users)
          .set({ steamUsername: player.personaname })
          .where(eq(users.id, auth.sub));
      }

      // Get owned games
      const gamesUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${steamApiKey}&steamid=${steamId}&include_appinfo=true&include_played_free_games=true`;
      const gamesRes = await fetch(gamesUrl);
      const gamesData = await gamesRes.json();
      const gamesList = gamesData?.response?.games || [];

      // Upsert games into library
      for (const game of gamesList) {
        await db
          .insert(steamGameLibrary)
          .values({
            id: nanoid(),
            userId: auth.sub,
            steamAppId: game.appid,
            name: game.name || `App ${game.appid}`,
            playtimeMinutes: game.playtime_forever || 0,
            lastPlayed: game.rtime_last_played ? new Date(game.rtime_last_played * 1000) : null,
            iconUrl: game.img_icon_url
              ? `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`
              : null,
          })
          .onConflictDoUpdate({
            target: [steamGameLibrary.userId, steamGameLibrary.steamAppId],
            set: {
              name: game.name || `App ${game.appid}`,
              playtimeMinutes: game.playtime_forever || 0,
              lastPlayed: game.rtime_last_played ? new Date(game.rtime_last_played * 1000) : null,
              syncedAt: new Date(),
            },
          });
      }

      return NextResponse.json({
        success: true,
        data: {
          steamId,
          steamUsername: player?.personaname || null,
          gamesImported: gamesList.length,
        },
      });
    } catch (err) {
      console.error("Steam API error:", err);
      // Still saved the steam ID, just couldn't fetch games
      return NextResponse.json({
        success: true,
        data: {
          steamId,
          steamUsername: null,
          gamesImported: 0,
          warning: "Steam API unavailable, games not imported",
        },
      });
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      steamId,
      steamUsername: null,
      gamesImported: 0,
      warning: "STEAM_API_KEY not configured",
    },
  });
}

/**
 * DELETE /api/integrations/steam — Unlink Steam account
 */
export async function DELETE() {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Remove Steam data
    await db
      .delete(steamGameLibrary)
      .where(eq(steamGameLibrary.userId, auth.sub));

    await db
      .update(users)
      .set({ steamId: null, steamUsername: null, updatedAt: new Date() })
      .where(eq(users.id, auth.sub));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("steam DELETE error:", err);
    return NextResponse.json(
      { success: false, error: "服务器错误 / Server error" },
      { status: 500 }
    );
  }
}
