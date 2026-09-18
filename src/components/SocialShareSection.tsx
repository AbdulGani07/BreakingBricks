import React, { useState, useEffect, useMemo } from 'react';
import {
  Share2,
  Copy,
  Check,
  Camera,
  Download,
  Smartphone,
  ExternalLink,
  MessageCircle,
  Send,
  Sparkles,
  Image as ImageIcon,
  X,
  Loader2,
} from 'lucide-react';
import { GameStats } from '../types';
import {
  generateShareText,
  isWebShareSupported,
  isWebShareFilesSupported,
  copyTextToClipboard,
  generateScoreCardCanvas,
  GeneratedScoreCard,
} from '../utils/shareUtils';

interface SocialShareSectionProps {
  stats: GameStats;
  isVictory?: boolean;
}

export const SocialShareSection: React.FC<SocialShareSectionProps> = ({
  stats,
  isVictory = false,
}) => {
  const isHighScore = stats.score > 0 && stats.score >= stats.highScore;

  // Local state
  const [copiedText, setCopiedText] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [scoreCard, setScoreCard] = useState<GeneratedScoreCard | null>(null);
  const [showShareTextBox, setShowShareTextBox] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const canWebShare = useMemo(() => isWebShareSupported(), []);

  // Compute generated text
  const shareText = useMemo(() => {
    return generateShareText(stats, isVictory, isHighScore);
  }, [stats, isVictory, isHighScore]);

  // Handle Copy Score text
  const handleCopyScoreText = async () => {
    const success = await copyTextToClipboard(shareText);
    if (success) {
      setCopiedText(true);
      setShareFeedback('Score text copied to clipboard!');
      setTimeout(() => setCopiedText(false), 2200);
      setTimeout(() => setShareFeedback(null), 3000);
    }
  };

  // Handle Screenshot / Score Card capture
  const handleCaptureScoreCard = async () => {
    setIsCapturing(true);
    setShareFeedback(null);
    try {
      const generated = await generateScoreCardCanvas({
        stats,
        isVictory,
        isHighScore,
      });
      setScoreCard(generated);
      setShareFeedback('Score card generated!');
      setTimeout(() => setShareFeedback(null), 2500);
    } catch (err) {
      console.error('Failed to capture score card:', err);
      setShareFeedback('Failed to generate image');
    } finally {
      setIsCapturing(false);
    }
  };

  // Handle Download Screenshot
  const handleDownloadScreenshot = () => {
    if (!scoreCard) return;
    const a = document.createElement('a');
    a.href = scoreCard.dataUrl;
    a.download = `breaking-bricks-${stats.score}pts.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setShareFeedback('Image downloaded!');
    setTimeout(() => setShareFeedback(null), 2500);
  };

  // Handle Copy Screenshot Image to clipboard
  const handleCopyScreenshot = async () => {
    if (!scoreCard || typeof navigator === 'undefined' || !navigator.clipboard?.write) {
      handleDownloadScreenshot();
      return;
    }
    try {
      const item = new ClipboardItem({ 'image/png': scoreCard.blob });
      await navigator.clipboard.write([item]);
      setCopiedImage(true);
      setShareFeedback('Image copied to clipboard!');
      setTimeout(() => setCopiedImage(false), 2200);
      setTimeout(() => setShareFeedback(null), 3000);
    } catch {
      // Fallback to file download if clipboard.write image is rejected
      handleDownloadScreenshot();
    }
  };

  // Handle Mobile Web Share API
  const handleWebShare = async () => {
    setShareFeedback(null);
    const appUrl = typeof window !== 'undefined' ? window.location.href : '';

    if (canWebShare && navigator.share) {
      try {
        const sharePayload: ShareData = {
          title: 'Breaking Bricks Arcade Score',
          text: shareText,
          url: appUrl,
        };

        // Attach image file if supported
        if (scoreCard?.file && isWebShareFilesSupported([scoreCard.file])) {
          sharePayload.files = [scoreCard.file];
        }

        await navigator.share(sharePayload);
        setShareFeedback('Shared successfully!');
        setTimeout(() => setShareFeedback(null), 2500);
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          // Fallback to clipboard
          await handleCopyScoreText();
        }
      }
    } else {
      // Desktop fallback: copy to clipboard
      await handleCopyScoreText();
    }
  };

  // Social Share URLs
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(
    typeof window !== 'undefined' ? window.location.href : ''
  );
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
  const telegramUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;

  return (
    <div
      id="social-share-container"
      className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 my-2 text-left text-xs space-y-2.5 shadow-inner"
    >
      {/* Header Label */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-300 text-[10px] sm:text-[11px]">
          <Share2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>Share Your Score</span>
        </div>
        <button
          id="btn-toggle-share-text"
          onClick={() => setShowShareTextBox((prev) => !prev)}
          className="text-[10px] text-cyan-400 hover:text-cyan-300 underline font-medium transition-colors"
        >
          {showShareTextBox ? 'Hide Text' : 'View Text'}
        </button>
      </div>

      {/* Quick Feedback Toast */}
      {shareFeedback && (
        <div className="px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 text-[11px] font-medium flex items-center gap-1.5 animate-fadeIn">
          <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
          <span>{shareFeedback}</span>
        </div>
      )}

      {/* Main Action Buttons Grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Button 1: Copy Score Button */}
        <button
          id="btn-copy-score"
          onClick={handleCopyScoreText}
          className="min-h-[40px] px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
        >
          {copiedText ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-cyan-400" />
              <span>Copy Score</span>
            </>
          )}
        </button>

        {/* Button 2: Share via Web Share API / Mobile */}
        <button
          id="btn-web-share"
          onClick={handleWebShare}
          className="min-h-[40px] px-3 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-1.5 shadow-md shadow-cyan-600/20 active:scale-95"
        >
          {canWebShare ? (
            <>
              <Smartphone className="w-3.5 h-3.5" />
              <span>Share Score</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Score</span>
            </>
          )}
        </button>
      </div>

      {/* Optional Screenshot Capture Trigger */}
      {!scoreCard && (
        <button
          id="btn-capture-screenshot"
          onClick={handleCaptureScoreCard}
          disabled={isCapturing}
          className="w-full min-h-[36px] py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800/80 border border-slate-700/80 hover:border-amber-500/50 text-slate-300 hover:text-amber-300 transition-all flex items-center justify-center gap-1.5 text-[11px] font-semibold tracking-wide disabled:opacity-50"
        >
          {isCapturing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span>Generating Score Card...</span>
            </>
          ) : (
            <>
              <Camera className="w-3.5 h-3.5 text-amber-400" />
              <span>Capture Score Card Screenshot</span>
            </>
          )}
        </button>
      )}

      {/* Generated Screenshot Card Preview */}
      {scoreCard && (
        <div className="p-2.5 rounded-lg bg-slate-900 border border-amber-500/40 space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-300">
              <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>Score Card Ready</span>
            </div>
            <button
              onClick={() => setScoreCard(null)}
              title="Close preview"
              className="p-1 rounded text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Thumbnail preview */}
          <div className="relative rounded-md overflow-hidden border border-slate-700 shadow-md aspect-[16/10] bg-slate-950">
            <img
              src={scoreCard.dataUrl}
              alt="Final Score Card"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Screenshot Action Buttons */}
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              id="btn-download-screenshot"
              onClick={handleDownloadScreenshot}
              className="py-1.5 px-2 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-[11px] flex items-center justify-center gap-1 transition-colors"
            >
              <Download className="w-3 h-3" />
              <span>Download PNG</span>
            </button>

            <button
              id="btn-copy-image"
              onClick={handleCopyScreenshot}
              className="py-1.5 px-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-[11px] flex items-center justify-center gap-1 transition-colors"
            >
              {copiedImage ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-300">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Image</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Expandable Share Text Box */}
      {showShareTextBox && (
        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5 animate-fadeIn">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Share Preview:</span>
            <button
              onClick={handleCopyScoreText}
              className="text-cyan-400 hover:text-cyan-300 font-bold inline-flex items-center gap-1"
            >
              <Copy className="w-2.5 h-2.5" />
              <span>Copy</span>
            </button>
          </div>
          <div className="p-2 rounded bg-slate-950 text-slate-300 font-mono text-[10px] whitespace-pre-line leading-relaxed border border-slate-800/80 max-h-28 overflow-y-auto select-all">
            {shareText}
          </div>
        </div>
      )}

      {/* 1-Click Desktop Social Sharing Channels */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] text-slate-400">
        <span>Quick Share:</span>
        <div className="flex items-center gap-1.5">
          <a
            id="share-link-twitter"
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Share on X (Twitter)"
            className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <span className="font-bold text-[10px]">𝕏</span>
          </a>

          <a
            id="share-link-whatsapp"
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Share via WhatsApp"
            className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition-colors"
          >
            <MessageCircle className="w-3 h-3" />
          </a>

          <a
            id="share-link-telegram"
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Share via Telegram"
            className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-sky-400 transition-colors"
          >
            <Send className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
