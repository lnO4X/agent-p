# Design Philosophy & Key Decisions

> Extracted from CLAUDE.md. Rarely changes. Agent reads when making product/design decisions.

---

## Design Philosophy

**Core insight** (16personalities.com, Wordle, Character.AI):
> Tests can be boring, but results must create identity. 200M users share "I'm INFJ" — because results define "who I am".

**5 Rules**:
1. **10-second hook** — First screen makes you want to try immediately
2. **Result = Identity** — Share "I'm a Duelist" not "78 points"
3. **Zero friction** — No registration, 3 minutes to complete
4. **Natural virality** — Results are social currency
5. **Radical simplicity** — One core loop, done perfectly

**Growth Flywheel**: Quiz (free) -> Archetype reveal -> Share -> Friend tests -> Register -> AI characters

---

## Key Decisions Log

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | 4-tab over 6-tab | Reduce cognitive load. Play merges explore/test/challenge |
| 2 | All-in AI companions | Highest asset value. Talent data = unique differentiation vs Character.AI |
| 3 | Archetype over raw scores | 16personalities model. Identity drives sharing, not numbers |
| 4 | 3-game public quiz | Zero-friction entry. Client-side scoring. URL-encoded stateless sharing |
| 5 | Character presets > blank creation | Users don't create well from scratch. Gallery enables one-click |
| 6 | Partner restrictions removed | Characters can have flaws, attitudes, tempers — diverse personalities |
| 7 | Identity-driven dashboard | Archetype card > game catalog. Emotion > utility |
| 8 | Activation codes > Stripe | Phase simplicity. Stripe deferred to future phase |
| 9 | OG cards via next/og | Server-side ImageResponse, zero external dependency |
| 10 | Brand: GameTan | Unified globally (layout, i18n, manifest, OG cards, prompts, auth forms) |
| 11 | Captcha one-time use | Deleted after ANY verification attempt. Auto-refresh on failure |
| 12 | Local GPU over Docker for voice | RTX 5060 Ti direct access, avoids Docker CUDA complexity |
| 13 | China mirror sources | Architecture requirement: all downloads (pip/npm/HuggingFace) must use mirrors |
