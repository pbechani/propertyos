'use client';

import { useState, useCallback } from "react";
import { Share2, X, Check, Link2, Mail } from "lucide-react";

type PropertyShareButtonProps = {
  title: string;
  url?: string;
  className?: string;
};

export default function PropertyShareButton({ title, url, className }: PropertyShareButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  const handleNativeShare = useCallback(async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl });
      } catch {
        // User cancelled or share failed — open fallback menu
        setShowMenu(true);
      }
    } else {
      setShowMenu(true);
    }
  }, [title, shareUrl]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl]);

  const handleWhatsApp = useCallback(() => {
    const text = encodeURIComponent(`Check out this property: ${title}\n${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
    setShowMenu(false);
  }, [title, shareUrl]);

  const handleEmail = useCallback(() => {
    const subject = encodeURIComponent(`Property: ${title}`);
    const body = encodeURIComponent(`I thought you might be interested in this property:\n\n${title}\n${shareUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setShowMenu(false);
  }, [title, shareUrl]);

  return (
    <div className="relative">
      <button
        className={className || "p-3 bg-white rounded-lg shadow-md hover:bg-gray-50"}
        aria-label="Share property"
        title="Share property"
        onClick={() => { void handleNativeShare(); }}
      >
        <Share2 className="w-5 h-5" />
      </button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />

          {/* Share menu */}
          <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-1">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Share</span>
              <button
                onClick={() => setShowMenu(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close share menu"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={() => { void handleCopyLink(); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Link2 className="w-4 h-4 text-gray-400" />}
              {copied ? 'Copied!' : 'Copy link'}
            </button>

            <button
              onClick={handleWhatsApp}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.478a.75.75 0 00.932.932l4.444-1.495A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.344 0-4.524-.672-6.38-1.832l-.457-.282-2.64.888.888-2.64-.282-.457A9.955 9.955 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z" />
              </svg>
              WhatsApp
            </button>

            <button
              onClick={handleEmail}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Mail className="w-4 h-4 text-gray-400" />
              Email
            </button>
          </div>
        </>
      )}
    </div>
  );
}
