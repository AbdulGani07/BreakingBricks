# Breaking Bricks — Iframe Embedding Guide

This guide describes how any parent website can easily embed Breaking Bricks as a lightweight, hosted arcade game from our Vercel domain.

---

## 1. Quick Start: Embedding via Iframe

Place an `<iframe>` anywhere on your website pointing to `/embed`:

```html
<iframe
  src="https://your-domain.vercel.app/embed?theme=cyber&difficulty=normal&sound=true"
  width="100%"
  height="540"
  style="border: none; max-width: 620px; aspect-ratio: 3/2.7; display: block; margin: 0 auto;"
  allow="autoplay"
  loading="lazy"
></iframe>
```

---

## 2. URL Parameters

Customize the game instance directly through query parameters:

| Parameter | Type | Default | Options / Description |
| :--- | :--- | :--- | :--- |
| `theme` | string | `cyber` | `cyber`, `synthwave`, `retro`, `neon`, `matrix`, `minimal` |
| `difficulty` | string | `normal` | `easy`, `normal`, `hard`, `extreme` |
| `sound` | boolean | `true` | `true`, `false` (enables or mutes all audio effects and music) |
| `volume` | number | `0.8` | Audio volume multiplier between `0.0` and `1.0` |
| `guide` | boolean | `true` | `true`, `false` (shows or hides the desktop keyboard controls guide) |
| `autostart` | boolean | `false` | `true`, `false` (automatically starts the countdown upon load) |

### Example URL
```
https://your-domain.vercel.app/embed?theme=synthwave&difficulty=hard&sound=true
```

---

## 3. Responsive Scaling & Mobile Controls

The embedded game is fully responsive and self-contained:
- **Responsive Canvas**: The game renders on an internal high-DPI virtual coordinate system (600x400) and dynamically adjusts backing store resolution to Retina and mobile screens.
- **Mobile Touch Controls**: Players can steer the paddle by dragging their finger across the canvas. Tapping anywhere launches stuck balls or fires laser cannons.
- **Zero Scroll Interference**: The canvas uses `touch-action: none` to prevent accidental rubber-banding or page scrolling while playing on touchscreens.

---

## 4. `postMessage` Communication Protocol

Parent websites can interact with the embedded game in real time through standard browser `window.postMessage`.

### A. Commands Sent from Parent Website to Game

Send messages to the iframe's `contentWindow`:

```javascript
const gameIframe = document.getElementById('bricks-game');

function sendGameCommand(action, data = {}) {
  gameIframe.contentWindow.postMessage({ action, ...data }, '*');
}
```

#### Supported Parent Commands:
1. **`pause`** — Pauses the active game:
   ```javascript
   sendGameCommand('pause');
   ```

2. **`resume`** — Resumes a paused game:
   ```javascript
   sendGameCommand('resume');
   ```

3. **`restart`** — Restarts the round from level 1:
   ```javascript
   sendGameCommand('restart');
   ```

4. **`mute`** — Mutes or toggles audio:
   ```javascript
   sendGameCommand('mute');              // Mutes audio
   sendGameCommand('mute', { muted: false }); // Unmutes audio
   ```

5. **`changeDifficulty`** — Updates difficulty level dynamically:
   ```javascript
   sendGameCommand('changeDifficulty', { difficulty: 'hard' });
   // Options: 'easy', 'normal', 'hard', 'extreme'
   ```

---

### B. Events Dispatched by Game to Parent Website

Listen for messages from the iframe on your parent window:

```javascript
window.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.source !== 'breaking-bricks') return;

  switch (data.event) {
    case 'gameStarted':
      console.log('Game started:', data.level, data.difficulty);
      break;

    case 'scoreUpdated':
      console.log('Score updated:', data.score, 'Combo:', data.combo);
      break;

    case 'levelCompleted':
      console.log('Level cleared:', data.level, 'Perfect clear:', data.perfect);
      break;

    case 'gameOver':
      console.log('Game over. Final score:', data.score, 'High score:', data.isHighScore);
      break;
  }
});
```

#### Event Payloads:

- **`gameStarted`**
  ```json
  {
    "event": "gameStarted",
    "level": 1,
    "lives": 3,
    "difficulty": "hard",
    "timestamp": 1726650000000
  }
  ```

- **`scoreUpdated`**
  ```json
  {
    "event": "scoreUpdated",
    "score": 1250,
    "combo": 4,
    "added": 120
  }
  ```

- **`levelCompleted`**
  ```json
  {
    "event": "levelCompleted",
    "level": 2,
    "score": 4500,
    "perfect": true
  }
  ```

- **`gameOver`**
  ```json
  {
    "event": "gameOver",
    "score": 8200,
    "level": 4,
    "isHighScore": true,
    "bricksBroken": 78
  }
  ```

---

## 5. Complete Copy-Paste HTML Integration Example

Save this HTML file to test parent-to-iframe communication:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Breaking Bricks Embed Demo</title>
  <style>
    body {
      margin: 0;
      padding: 24px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #090d16;
      color: #e2e8f0;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .game-wrapper {
      width: 100%;
      max-width: 620px;
    }
    iframe {
      width: 100%;
      height: 520px;
      border: 1px solid #1e293b;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }
    .controls-bar {
      display: flex;
      gap: 10px;
      margin-top: 14px;
      flex-wrap: wrap;
      justify-content: center;
    }
    button {
      padding: 8px 16px;
      background: #1e293b;
      color: #38bdf8;
      border: 1px solid #334155;
      border-radius: 8px;
      cursor: pointer;
      font-weight: bold;
    }
    button:hover {
      background: #334155;
    }
    .score-badge {
      margin-top: 10px;
      font-size: 1.1rem;
      color: #a855f7;
    }
  </style>
</head>
<body>

  <h2>Arcade Hub — Embedded Game</h2>
  <div class="score-badge" id="live-score">Current Score: 0</div>

  <div class="game-wrapper">
    <iframe
      id="bricks-iframe"
      src="/embed?theme=cyber&difficulty=normal&sound=true"
      allow="autoplay"
    ></iframe>

    <div class="controls-bar">
      <button onclick="sendAction('pause')">Pause</button>
      <button onclick="sendAction('resume')">Resume</button>
      <button onclick="sendAction('restart')">Restart</button>
      <button onclick="sendAction('mute')">Mute Audio</button>
      <button onclick="sendDifficulty('hard')">Set Hard Mode</button>
    </div>
  </div>

  <script>
    const iframe = document.getElementById('bricks-iframe');
    const scoreDisplay = document.getElementById('live-score');

    function sendAction(action) {
      iframe.contentWindow.postMessage({ action }, '*');
    }

    function sendDifficulty(difficulty) {
      iframe.contentWindow.postMessage({ action: 'changeDifficulty', difficulty }, '*');
    }

    window.addEventListener('message', (e) => {
      if (!e.data || e.data.source !== 'breaking-bricks') return;

      if (e.data.event === 'scoreUpdated') {
        scoreDisplay.textContent = `Current Score: ${e.data.score}`;
      } else if (e.data.event === 'gameOver') {
        alert(`Game Over! Final Score: ${e.data.score}`);
      }
    });
  </script>
</body>
</html>
```

---

## 6. Vercel Deployment Notes

The project includes `vercel.json` configured with:
1. **Single-Page Application Rewrites**: Maps `/embed` directly to `index.html` so client-side routing serves the embed route cleanly.
2. **Permissive Iframe Headers**: Supplies `Content-Security-Policy: frame-ancestors *` and `X-Frame-Options: ALLOWALL` on `/embed` routes so any external website can embed the game without origin blocking.

---

## 7. Client-Side Social Sharing Features

When players complete a game run (Game Over or Victory), the embed provides:
- **Copy Score**: Copies formatted score, level, bricks smashed, and combo directly to clipboard.
- **Mobile Web Share API**: Triggers the mobile operating system's native share sheet (WhatsApp, iMessage, Twitter, Instagram).
- **Generated Share Text**: Pre-formatted arcade text highlighting performance metrics and play URL.
- **Client-Side Score Card Screenshot**: Generates a high-resolution 800x480 PNG image of the final score card rendered dynamically on HTML5 Canvas without any backend or API calls.

