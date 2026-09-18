import { GameStats } from '../types';

/**
 * Generate engaging, arcade-themed share text for social platforms
 */
export function generateShareText(
  stats: GameStats,
  isVictory: boolean,
  isHighScore: boolean,
  customUrl?: string
): string {
  const url = customUrl || (typeof window !== 'undefined' ? window.location.href : '');
  const cleanUrl = url.split('#')[0]; // Remove hash if any

  if (isVictory) {
    return [
      `🏆 BREAKING BRICKS ARCADE CHAMPION!`,
      `✨ Cleared all 10 levels with a total score of ${stats.score.toLocaleString()} pts!`,
      `💥 Bricks Smashed: ${stats.bricksBroken}`,
      `🔥 Max Combo: ${stats.maxCombo}x`,
      `Can you conquer the cyber arcade? Play now:`,
      cleanUrl,
    ].join('\n');
  }

  const badgeLine = isHighScore
    ? `🌟 NEW HIGH SCORE: ${stats.score.toLocaleString()} pts!`
    : `🎮 Final Score: ${stats.score.toLocaleString()} pts`;

  return [
    `🕹️ Breaking Bricks Arcade Run:`,
    badgeLine,
    `🛡️ Level Reached: Level ${stats.level}`,
    `💥 Bricks Smashed: ${stats.bricksBroken}`,
    `🔥 Max Combo: ${stats.maxCombo}x`,
    `Can you beat my record? Play now:`,
    cleanUrl,
  ].join('\n');
}

/**
 * Check if Web Share API is available in the current browser environment
 */
export function isWebShareSupported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

/**
 * Check if Web Share API supports sharing files (Web Share API Level 2)
 */
export function isWebShareFilesSupported(files: File[]): boolean {
  if (!isWebShareSupported()) return false;
  if (typeof navigator.canShare !== 'function') return false;
  try {
    return navigator.canShare({ files });
  } catch {
    return false;
  }
}

/**
 * Copy text to clipboard with fallback for older browser environments
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to textarea execCommand fallback
    }
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '-9999px';
    textArea.style.left = '-9999px';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}

export interface RenderScoreCardOptions {
  stats: GameStats;
  isVictory?: boolean;
  isHighScore?: boolean;
  customUrl?: string;
}

export interface GeneratedScoreCard {
  dataUrl: string;
  blob: Blob;
  file: File;
}

/**
 * Renders a crisp, high-DPI cyber arcade score card completely client-side using HTML5 Canvas
 */
export function generateScoreCardCanvas(
  options: RenderScoreCardOptions
): Promise<GeneratedScoreCard> {
  return new Promise((resolve, reject) => {
    try {
      const { stats, isVictory, isHighScore, customUrl } = options;
      const width = 800;
      const height = 480;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas 2D context unavailable'));
        return;
      }

      // 1. Deep Space Gradient Background
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#060913');
      bgGrad.addColorStop(0.5, '#0c1322');
      bgGrad.addColorStop(1, '#05070e');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Cyberpunk perspective grid floor
      ctx.save();
      const horizonY = height * 0.58;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.lineWidth = 1;

      // Horizontal lines
      for (let i = 0; i < 7; i++) {
        const y = horizonY + Math.pow(i / 6, 1.8) * (height - horizonY);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Vertical converging perspective lines
      const vanishingX = width / 2;
      for (let x = -width * 0.4; x <= width * 1.4; x += 55) {
        ctx.beginPath();
        ctx.moveTo(vanishingX, horizonY);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      ctx.restore();

      // 3. Neon decorative border frame
      ctx.save();
      ctx.strokeStyle = isVictory
        ? 'rgba(245, 158, 11, 0.6)'
        : isHighScore
          ? 'rgba(234, 179, 8, 0.6)'
          : 'rgba(56, 189, 248, 0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(16, 16, width - 32, height - 32);

      // Corner accent brackets
      const cornerLen = 24;
      ctx.strokeStyle = isVictory ? '#fbbf24' : '#38bdf8';
      ctx.lineWidth = 4;

      // Top-left
      ctx.beginPath();
      ctx.moveTo(12, 12 + cornerLen);
      ctx.lineTo(12, 12);
      ctx.lineTo(12 + cornerLen, 12);
      ctx.stroke();

      // Top-right
      ctx.beginPath();
      ctx.moveTo(width - 12 - cornerLen, 12);
      ctx.lineTo(width - 12, 12);
      ctx.lineTo(width - 12, 12 + cornerLen);
      ctx.stroke();

      // Bottom-left
      ctx.beginPath();
      ctx.moveTo(12, height - 12 - cornerLen);
      ctx.lineTo(12, height - 12);
      ctx.lineTo(12 + cornerLen, height - 12);
      ctx.stroke();

      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(width - 12 - cornerLen, height - 12);
      ctx.lineTo(width - 12, height - 12);
      ctx.lineTo(width - 12, height - 12 - cornerLen);
      ctx.stroke();
      ctx.restore();

      // 4. Header: Brand Logo & Mode Badge
      ctx.save();
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      // Logo text
      ctx.font = '900 24px system-ui, -apple-system, sans-serif';
      const logoGrad = ctx.createLinearGradient(40, 36, 260, 36);
      logoGrad.addColorStop(0, '#ef4444');
      logoGrad.addColorStop(0.5, '#f59e0b');
      logoGrad.addColorStop(1, '#06b6d4');
      ctx.fillStyle = logoGrad;
      ctx.fillText('BREAKING BRICKS', 40, 36);

      ctx.font = '700 10px monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('RETINA ARCADE EDITION', 40, 64);
      ctx.restore();

      // Status Pill on top-right
      ctx.save();
      const badgeText = isVictory
        ? '🏆 ARCADE CHAMPION'
        : isHighScore
          ? '⭐ NEW HIGH SCORE'
          : 'ARCADE RUN COMPLETE';
      const badgeBg = isVictory
        ? 'rgba(245, 158, 11, 0.2)'
        : isHighScore
          ? 'rgba(234, 179, 8, 0.2)'
          : 'rgba(56, 189, 248, 0.15)';
      const badgeColor = isVictory ? '#fbbf24' : isHighScore ? '#fef08a' : '#38bdf8';

      ctx.font = '800 11px system-ui, sans-serif';
      const badgeWidth = ctx.measureText(badgeText).width + 24;
      const badgeX = width - 40 - badgeWidth;
      const badgeY = 38;

      ctx.fillStyle = badgeBg;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeWidth, 26, 13);
      ctx.fill();
      ctx.strokeStyle = badgeColor;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = badgeColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, badgeX + badgeWidth / 2, badgeY + 13);
      ctx.restore();

      // 5. Hero Score Display in Center
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.font = '700 13px system-ui, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('FINAL SCORE', width / 2, 112);

      // Huge Score Digits
      ctx.font = '900 64px monospace';
      const scoreGrad = ctx.createLinearGradient(
        width / 2 - 150,
        150,
        width / 2 + 150,
        150
      );
      if (isVictory) {
        scoreGrad.addColorStop(0, '#fef08a');
        scoreGrad.addColorStop(0.5, '#f59e0b');
        scoreGrad.addColorStop(1, '#ffffff');
      } else {
        scoreGrad.addColorStop(0, '#fca5a5');
        scoreGrad.addColorStop(0.5, '#fcd34d');
        scoreGrad.addColorStop(1, '#67e8f9');
      }
      ctx.shadowColor = isVictory ? 'rgba(245, 158, 11, 0.6)' : 'rgba(239, 68, 68, 0.5)';
      ctx.shadowBlur = 24;
      ctx.fillStyle = scoreGrad;
      ctx.fillText(stats.score.toLocaleString(), width / 2, 160);
      ctx.shadowBlur = 0;
      ctx.restore();

      // 6. Bento Grid Statistics Cards (4 items)
      const bentoY = 226;
      const cardHeight = 84;
      const bentoMargin = 40;
      const totalWidth = width - bentoMargin * 2;
      const cardGap = 16;
      const cardWidth = (totalWidth - cardGap * 3) / 4;

      const statItems = [
        {
          label: 'BRICKS SMASHED',
          val: `${stats.bricksBroken}`,
          accent: '#38bdf8',
          bg: 'rgba(56, 189, 248, 0.1)',
        },
        {
          label: 'MAX COMBO',
          val: `${stats.maxCombo}x`,
          accent: '#f59e0b',
          bg: 'rgba(245, 158, 11, 0.1)',
        },
        {
          label: 'LEVEL REACHED',
          val: `Level ${stats.level}`,
          accent: '#10b981',
          bg: 'rgba(16, 185, 129, 0.1)',
        },
        {
          label: 'RECORD SCORE',
          val: `${stats.highScore.toLocaleString()}`,
          accent: '#eab308',
          bg: 'rgba(234, 179, 8, 0.1)',
        },
      ];

      statItems.forEach((item, index) => {
        const x = bentoMargin + index * (cardWidth + cardGap);
        ctx.save();

        // Card bg
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(x, bentoY, cardWidth, cardHeight, 10);
        ctx.fill();

        // Accent top border
        ctx.fillStyle = item.accent;
        ctx.beginPath();
        ctx.roundRect(x, bentoY, cardWidth, 3, [10, 10, 0, 0]);
        ctx.fill();

        ctx.strokeStyle = 'rgba(51, 65, 85, 0.8)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Label
        ctx.font = '700 9px system-ui, sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(item.label, x + cardWidth / 2, bentoY + 16);

        // Value
        ctx.font = '900 18px monospace';
        ctx.fillStyle = item.accent;
        ctx.textBaseline = 'bottom';
        ctx.fillText(item.val, x + cardWidth / 2, bentoY + cardHeight - 16);

        ctx.restore();
      });

      // 7. Footer Bar: Timestamp + Website Link
      ctx.save();
      const footerY = 380;
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(40, footerY);
      ctx.lineTo(width - 40, footerY);
      ctx.stroke();

      ctx.font = '600 11px system-ui, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const now = new Date();
      const dateStr = now.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      ctx.fillText(`Date: ${dateStr}`, 40, footerY + 28);

      const urlText =
        customUrl ||
        (typeof window !== 'undefined' ? window.location.host : 'breaking-bricks.app');
      ctx.textAlign = 'right';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`Play at ${urlText}`, width - 40, footerY + 28);
      ctx.restore();

      // Convert to DataUrl & Blob
      const dataUrl = canvas.toDataURL('image/png');
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create image Blob'));
            return;
          }
          const file = new File([blob], 'breaking-bricks-score.png', {
            type: 'image/png',
          });
          resolve({
            dataUrl,
            blob,
            file,
          });
        },
        'image/png',
        0.95
      );
    } catch (err) {
      reject(err);
    }
  });
}
