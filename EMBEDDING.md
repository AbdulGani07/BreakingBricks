# Breaking Bricks — Embeddable HTML5 Game Platform SDK

> Embed the high-octane, neon arcade brick breaker into any web application or site with a single `<script>` tag or modular ES import.

---

## 🚀 Quick Start

### Option A: Direct HTML `<script>` Tag (Zero Dependencies)

Include the self-contained `breaking-bricks.js` bundle directly in your HTML. No bundler, React, or external CSS required:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Arcade Zone</title>
</head>
<body style="background: #020617; margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh;">

  <!-- Target Mount Container -->
  <div id="arcade-container" style="width: 100%; max-width: 600px;"></div>

  <!-- Distributable SDK Bundle -->
  <script src="/breaking-bricks.js"></script>
  <script>
    // Mount the game into #arcade-container
    const game = BreakingBricks.mount('#arcade-container', {
      theme: 'cyber',
      difficulty: 'normal',
      onScoreUpdated: function(data) {
        console.log('Current Score:', data.score, 'Combo:', data.combo);
      },
      onGameOver: function(data) {
        console.log('Game Over! Final Score:', data.score);
      }
    });
  </script>
</body>
</html>
```

---

### Option B: Modern ES Module / React / Bundler

```typescript
import { BreakingBricks, LocalStorageAdapter } from './sdk';

const container = document.getElementById('game-slot');

const game = BreakingBricks.mount(container, {
  theme: 'synthwave',
  difficulty: 'hard',
  sound: {
    sfxVolume: 0.8,
    musicVolume: 0.3,
  },
  scoreAdapter: new LocalStorageAdapter({ prefix: 'my_arcade_' }),
});

// Clean up when unmounting
// game.unmount();
```

---

## 🛠️ Public SDK API

### `BreakingBricks.mount(target, config)`

Mounts an arcade instance inside the specified DOM container.

- **`target`**: A CSS selector string (e.g. `'#game-container'`) or a direct `HTMLElement`.
- **`config`**: An optional `BreakingBricksConfig` object (documented below).
- **Returns**: A `BreakingBricksInstance` object for runtime control.

```javascript
const game = BreakingBricks.mount('#game', {
  theme: 'retro',
  difficulty: 'normal'
});
```

---

## ⚙️ Configuration Reference (`BreakingBricksConfig`)

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **`width`** | `number \| string` | `"100%"` | Container width (`600`, `"100%"`, `"480px"`). |
| **`height`** | `number \| string` | `undefined` | Container height (auto scales to aspect ratio by default). |
| **`maxContainerWidth`** | `number \| string` | `"600px"` | Max constraint width for the arcade viewport. |
| **`responsive`** | `boolean` | `true` | Scales canvas responsively across mobile, tablet, and desktop. |
| **`theme`** | `GameTheme` | `'cyber'` | Theme preset: `'cyber'`, `'synthwave'`, `'retro'`, `'neon'`, `'matrix'`, `'minimal'`. |
| **`customTheme`** | `object` | `undefined` | Custom hex color overrides (`background`, `surface`, `accent`, `text`). |
| **`controls`** | `object` | `{}` | Controls customization (see Controls Reference below). |
| **`sound`** | `object` | `{}` | Sound settings (see Sound Reference below). |
| **`difficulty`** | `GameDifficulty` | `'normal'` | Difficulty preset: `'easy'`, `'normal'`, `'hard'`, `'extreme'`. |
| **`difficultySettings`** | `object` | `undefined` | Fine-grained difficulty multiplier overrides. |
| **`scoreAdapter`** | `ScoreAdapter` | `LocalStorageAdapter` | Custom adapter implementing the `ScoreAdapter` interface. |
| **`autoStart`** | `boolean` | `false` | Skips main menu and starts match countdown immediately on mount. |

---

### Controls Configuration (`controls`)

```javascript
BreakingBricks.mount('#game', {
  controls: {
    touch: true,       // Enable mobile touch drag steering (default: true)
    keyboard: true,    // Enable arrow keys & A/D controls (default: true)
    mouse: true,       // Enable mouse cursor tracking (default: true)
    showGuide: true,   // Show on-screen keyboard/touch hint pill (default: true)
    autofocus: false   // Auto-focus canvas upon mounting (default: false)
  }
});
```

---

### Sound Configuration (`sound`)

```javascript
BreakingBricks.mount('#game', {
  sound: {
    enabled: true,     // Master sound toggle (default: true)
    sfxVolume: 0.75,   // Sound effects volume between 0.0 and 1.0
    musicVolume: 0.35, // Ambient retro synthesizer volume between 0.0 and 1.0
    muted: false       // Initial muted state (default: false)
  }
});
```

---

### Difficulty Presets (`difficulty`)

| Difficulty | Starting Lives | Paddle Width | Ball Speed | Points Mult. |
| :--- | :---: | :---: | :---: | :---: |
| `'easy'` | 5 | 75px (+25%) | 0.85x (Gentle) | 0.8x |
| `'normal'` | 3 | 60px (Standard) | 1.00x (Arcade) | 1.0x |
| `'hard'` | 2 | 51px (-15%) | 1.18x (Brisk) | 1.25x |
| `'extreme'` | 1 | 45px (-25%) | 1.32x (Lightning) | 1.6x |

You can also provide custom overrides:

```javascript
BreakingBricks.mount('#game', {
  difficulty: 'hard',
  difficultySettings: {
    startingLives: 4,
    paddleWidthMultiplier: 1.1
  }
});
```

---

## 💾 Score Persistence Architecture (`ScoreAdapter`)

All score operations use the decoupled `ScoreAdapter` interface. By default, `LocalStorageAdapter` is utilized, but you can plug in any remote database, REST endpoint, Firebase, Supabase, or custom storage engine.

### `ScoreAdapter` Interface Definition

```typescript
export interface ScoreAdapter {
  /**
   * Retrieves the current saved high score.
   * Can return a number or a Promise<number>.
   */
  getHighScore(): Promise<number> | number;

  /**
   * Saves a newly achieved high score.
   * Can return void or a Promise<void>.
   */
  saveHighScore(score: number): Promise<void> | void;

  /**
   * Optional: Retrieves leaderboard rankings.
   */
  getLeaderboard?(): Promise<LeaderboardEntry[]> | LeaderboardEntry[];

  /**
   * Optional: Submits a new match record.
   */
  saveScore?(entry: LeaderboardEntry): Promise<void> | void;
}
```

### Custom Remote Backend Adapter Example

```javascript
class RemoteApiScoreAdapter {
  constructor(apiEndpoint, userToken) {
    this.apiEndpoint = apiEndpoint;
    this.userToken = userToken;
  }

  async getHighScore() {
    try {
      const res = await fetch(`${this.apiEndpoint}/high-score`, {
        headers: { Authorization: `Bearer ${this.userToken}` }
      });
      const data = await res.json();
      return data.highScore || 0;
    } catch (err) {
      console.error('Failed to fetch remote high score:', err);
      return 0;
    }
  }

  async saveHighScore(score) {
    try {
      await fetch(`${this.apiEndpoint}/high-score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.userToken}`
        },
        body: JSON.stringify({ score })
      });
    } catch (err) {
      console.error('Failed to post high score:', err);
    }
  }
}

// Pass custom adapter to the SDK
BreakingBricks.mount('#game', {
  scoreAdapter: new RemoteApiScoreAdapter('https://api.mygamehub.com/v1', 'user_jwt_token_123')
});
```

---

## 📡 Event API

Subscribe to game lifecycle events either via configuration callbacks or using `game.on(event, handler)`:

```javascript
const game = BreakingBricks.mount('#game');

// 1. gameStarted: Triggered when countdown completes and ball launches
game.on('gameStarted', (payload) => {
  console.log(`Match started at Level ${payload.level} with ${payload.lives} lives on [${payload.difficulty}] difficulty`);
});

// 2. scoreUpdated: Triggered whenever points are earned
game.on('scoreUpdated', (payload) => {
  console.log(`+${payload.added} pts! Score: ${payload.score} (Combo: ${payload.combo}x)`);
});

// 3. brickDestroyed: Triggered when a brick is shattered
game.on('brickDestroyed', (payload) => {
  console.log(`Brick [${payload.brickType}] destroyed at (${payload.position.x}, ${payload.position.y})`);
});

// 4. levelCompleted: Triggered when all destructible bricks are cleared
game.on('levelCompleted', (payload) => {
  console.log(`Level ${payload.level} cleared with score ${payload.score}!`);
});

// 5. gameOver: Triggered on final life loss or victory
game.on('gameOver', (payload) => {
  console.log(`Game Over! Final Score: ${payload.score}, Reached Level: ${payload.level}, High Score: ${payload.isHighScore}`);
});

// 6. achievementUnlocked: Triggered when player earns an achievement
game.on('achievementUnlocked', (payload) => {
  console.log(`🏆 Achievement Unlocked: "${payload.title}" — ${payload.description}`);
});
```

---

## 🎮 Runtime Instance API (`BreakingBricksInstance`)

The instance returned by `BreakingBricks.mount()` provides programmatic controls:

```javascript
const game = BreakingBricks.mount('#game');

// Pause and Resume
game.pause();
game.resume();

// Restart Match from Level 1
game.restart();

// Read active score
const currentScore = game.getScore();

// Read persisted high score
const highScore = await game.getHighScore();

// Dynamically change difficulty
game.setDifficulty('hard');

// Sound control
game.setSoundVolume('sfx', 0.5);
game.setSoundVolume('music', 0.2);
game.setMuted(true);

// Cleanup & Destroy
game.unmount(); // Removes React tree, halts game loop, stops audio
```

---

## 🎨 Themes Showcase

Choose an arcade aesthetic to match your site:

- **`'cyber'`** *(Default)*: Slate-950 canvas with glowing cyan & amber accents.
- **`'synthwave'`**: Deep midnight purple canvas with neon rose & magenta accents.
- **`'retro'`**: 80s arcade CRT charcoal black canvas with phosphor emerald green.
- **`'neon'`**: Obsidian canvas with electric violet and cyan.
- **`'matrix'`**: Cyber-terminal deep green with digital matrix phosphor glow.
- **`'minimal'`**: Sophisticated dark graphite with high-contrast ice blue.

```javascript
BreakingBricks.mount('#game', {
  theme: 'synthwave'
});
```

---

## 📦 File Distribution

- **Standalone Script Bundle**: `/breaking-bricks.js` (Self-contained, includes React 18, icons, canvas engine, and styles)
- **TypeScript Definitions**: `/src/sdk/types.ts`
- **Source Files**: `/src/sdk/`

---

## 🔒 Cryptographic Score Validation (Anti-Tampering)

To protect your leaderboards from manipulated scores or memory editing, Breaking Bricks includes a deterministic session verification pipeline:

```typescript
import { BreakingBricks, validateScoreSession } from 'breaking-bricks';

// In your game client:
game.on('gameOver', (payload) => {
  // payload.validationToken contains the HMAC signature
  fetch('/api/leaderboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
});

// On your Node.js or server backend:
app.post('/api/leaderboard', (req, res) => {
  const isValid = validateScoreSession(req.body);
  if (!isValid) {
    return res.status(400).json({ error: 'Tampered score signature' });
  }
  // Safe to record score!
});
```

---

## 📊 Analytics & Telemetry Adapter

Track player sessions, drop-offs, and power-up usage via `AnalyticsAdapter`:

```typescript
import { BreakingBricks, CustomEndpointAnalyticsAdapter } from 'breaking-bricks';

const analytics = new CustomEndpointAnalyticsAdapter({
  endpointUrl: 'https://my-telemetry-server.com/api/v1/game-events',
  batchSize: 10,
  flushIntervalMs: 5000,
});

BreakingBricks.mount('#game', {
  analyticsAdapter: analytics,
});
```

---

## ⚡ iframe Embedding & postMessage Protocol

Embed via iframe into Webflow, WordPress, or external domains:

```html
<iframe
  id="bb-arcade"
  src="https://your-domain.com/embed?theme=cyber&difficulty=normal&sound=true"
  width="100%"
  height="600"
  style="border: none; border-radius: 12px;"
  allow="autoplay"
></iframe>

<script>
  const iframe = document.getElementById('bb-arcade');

  // Inbound telemetry events
  window.addEventListener('message', (e) => {
    if (e.data?.source === 'breaking-bricks') {
      console.log('Event:', e.data.event, e.data.payload);
    }
  });

  // Outbound control actions
  function pause() {
    iframe.contentWindow.postMessage({ target: 'breaking-bricks', action: 'pause' }, '*');
  }
</script>
```

---

## 🧪 Developer Playground & Portal

Explore the live testing sandbox and full documentation directly in the app:
- **Playground**: `#/playground` (live preview, visual config controls, real-time event inspector)
- **Developer Docs**: `#/docs` (full API documentation & code examples)
- **Standalone Arcade**: `#/game` (immersive classic arcade experience)
- **Isolated Embed**: `#/embed` or `/embed` (clean responsive iframe container)

