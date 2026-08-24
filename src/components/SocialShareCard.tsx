import { useRef, useState, useEffect } from 'react';
import { X, Download, Share2 } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';
import { toast } from 'sonner@2.0.3';
import { useTheme } from './ThemeProvider';
import { useLanguage } from './LanguageContext';
import logoImage from '../assets/betweenus-logo.png';

interface SocialShareCardProps {
  isOpen: boolean;
  onClose: () => void;
  postContent: string;
  bestComment: {
    text: string;
    upvotes: number;
  };
}

export function SocialShareCard({ isOpen, onClose, postContent, bestComment }: SocialShareCardProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { theme } = useTheme();
  const { t } = useLanguage();

  const generateImage = async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      const isDark = theme === 'dark';
      const width = 1080;
      const height = 1920;
      canvas.width = width;
      canvas.height = height;

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      if (isDark) {
        gradient.addColorStop(0, '#111827');
        gradient.addColorStop(0.5, '#1f2937');
        gradient.addColorStop(1, '#111827');
      } else {
        gradient.addColorStop(0, '#9333ea');
        gradient.addColorStop(0.5, '#ec4899');
        gradient.addColorStop(1, '#2563eb');
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw background orbs
      ctx.globalAlpha = 0.2;
      const orbGradient1 = ctx.createRadialGradient(100, 100, 0, 100, 100, 120);
      orbGradient1.addColorStop(0, isDark ? '#a855f7' : '#ffffff');
      orbGradient1.addColorStop(1, 'transparent');
      ctx.fillStyle = orbGradient1;
      ctx.filter = 'blur(40px)';
      ctx.fillRect(0, 0, 240, 240);

      const orbGradient2 = ctx.createRadialGradient(width - 100, height - 200, 0, width - 100, height - 200, 150);
      orbGradient2.addColorStop(0, isDark ? '#3b82f6' : '#67e8f9');
      orbGradient2.addColorStop(1, 'transparent');
      ctx.fillStyle = orbGradient2;
      ctx.fillRect(width - 250, height - 350, 300, 300);

      const orbGradient3 = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, 180);
      orbGradient3.addColorStop(0, isDark ? '#ec4899' : '#f9a8d4');
      orbGradient3.addColorStop(1, 'transparent');
      ctx.fillStyle = orbGradient3;
      ctx.fillRect(width / 2 - 180, height / 2 - 180, 360, 360);

      ctx.filter = 'none';
      ctx.globalAlpha = 1;

      // Load and draw logo
      const logo = new Image();
      logo.crossOrigin = 'anonymous';
      logo.onload = () => {
        // Logo section
        const logoBoxY = 80;
        const logoBoxHeight = 200;
        const logoBoxWidth = 800; // Wider frame
        
        // Draw logo background
        ctx.fillStyle = isDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)';
        roundRect(ctx, width / 2 - logoBoxWidth / 2, logoBoxY, logoBoxWidth, logoBoxHeight, 28);
        ctx.fill();

        // Draw logo border
        ctx.strokeStyle = isDark ? 'rgba(168, 85, 247, 0.5)' : 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw logo image
        const logoHeight = 80;
        const logoWidth = (logo.width / logo.height) * logoHeight;
        ctx.drawImage(logo, width / 2 - logoWidth / 2, logoBoxY + 40, logoWidth, logoHeight);

        // Draw tagline
        ctx.fillStyle = isDark ? '#e9d5ff' : '#6b21a8';
        ctx.font = '600 32px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(t('canvas.tagline'), width / 2, logoBoxY + 160);

        // Post content section - Calculate dynamic height
        const postY = logoBoxY + logoBoxHeight + 60;
        const postPadding = 80; // Top and bottom padding combined
        const postHeaderHeight = 100; // Space for header
        
        // Measure post text height
        ctx.font = 'italic 40px system-ui';
        const postLineHeight = 58;
        const postTextHeight = measureTextHeight(ctx, `"${postContent}"`, width - 200, postLineHeight);
        const postBoxHeight = postHeaderHeight + postTextHeight + postPadding;
        
        ctx.fillStyle = isDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)';
        roundRect(ctx, 60, postY, width - 120, postBoxHeight, 28);
        ctx.fill();

        if (isDark) {
          ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Post header
        ctx.fillStyle = isDark ? '#c084fc' : '#a855f7';
        ctx.beginPath();
        ctx.arc(100, postY + 60, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isDark ? '#c084fc' : '#9333ea';
        ctx.font = '600 36px system-ui';
        ctx.textAlign = 'left';
        ctx.fillText(t('canvas.anonShare'), 130, postY + 70);

        // Post text
        ctx.fillStyle = isDark ? '#e5e7eb' : '#1f2937';
        ctx.font = 'italic 40px system-ui';
        wrapText(ctx, `"${postContent}"`, 100, postY + 140, width - 200, postLineHeight);

        // Best comment section - Calculate dynamic height
        const commentY = postY + postBoxHeight + 60;
        const commentPadding = 100; // Top and bottom padding combined
        const commentHeaderHeight = 120; // Space for header
        const commentFooterHeight = 80; // Space for upvotes
        
        // Measure comment text height
        ctx.font = '38px system-ui';
        const commentLineHeight = 56;
        const commentTextHeight = measureTextHeight(ctx, bestComment.text, width - 200, commentLineHeight);
        const commentBoxHeight = commentHeaderHeight + commentTextHeight + commentFooterHeight + commentPadding;
        
        const commentGradient = ctx.createLinearGradient(60, commentY, width - 60, commentY + commentBoxHeight);
        if (isDark) {
          commentGradient.addColorStop(0, 'rgba(76, 29, 149, 0.95)');
          commentGradient.addColorStop(0.5, 'rgba(30, 58, 138, 0.95)');
          commentGradient.addColorStop(1, 'rgba(131, 24, 67, 0.95)');
        } else {
          commentGradient.addColorStop(0, 'rgba(250, 204, 21, 0.95)');
          commentGradient.addColorStop(0.5, 'rgba(251, 146, 60, 0.95)');
          commentGradient.addColorStop(1, 'rgba(244, 114, 182, 0.95)');
        }
        ctx.fillStyle = commentGradient;
        roundRect(ctx, 60, commentY, width - 120, commentBoxHeight, 28);
        ctx.fill();

        ctx.strokeStyle = isDark ? 'rgba(168, 85, 247, 0.5)' : 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Comment header
        ctx.font = '46px system-ui';
        ctx.fillText('⭐', 100, commentY + 75);

        ctx.fillStyle = '#ffffff';
        ctx.font = '700 38px system-ui';
        ctx.fillText(t('canvas.topResponse'), 165, commentY + 78);

        // Comment text
        ctx.font = '38px system-ui';
        wrapText(ctx, bestComment.text, 100, commentY + 160, width - 200, commentLineHeight);

        // Upvotes
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.font = '600 34px system-ui';
        ctx.fillText(`♥ ${bestComment.upvotes.toLocaleString()} ${t('canvas.upvotes')}`, 100, commentY + commentBoxHeight - 65);

        // Footer
        const footerY = height - 220;
        const footerBoxWidth = 850; // Wider frame
        
        ctx.fillStyle = isDark ? 'rgba(168, 85, 247, 0.3)' : 'rgba(255, 255, 255, 0.2)';
        roundRect(ctx, width / 2 - footerBoxWidth / 2, footerY, footerBoxWidth, 140, 70);
        ctx.fill();

        ctx.strokeStyle = isDark ? 'rgba(192, 132, 252, 0.5)' : 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '600 36px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(t('canvas.join'), width / 2, footerY + 58);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.font = '30px system-ui';
        ctx.fillText(t('canvas.downloadApp'), width / 2, footerY + 100);

        // Convert to blob
        canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
      };
      
      logo.onerror = () => {
        console.error('Failed to load logo');
        resolve(null);
      };
      
      logo.src = logoImage;
    });
  };

  // Helper to draw rounded rectangles
  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  // Helper to wrap text
  function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    let lineCount = 0;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && i > 0) {
        ctx.fillText(line, x, currentY);
        line = words[i] + ' ';
        currentY += lineHeight;
        lineCount++;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
    lineCount++;
    
    return { height: lineCount * lineHeight, lineCount };
  }

  // Helper to calculate text height without drawing
  function measureTextHeight(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, lineHeight: number): number {
    const words = text.split(' ');
    let line = '';
    let lineCount = 0;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && i > 0) {
        line = words[i] + ' ';
        lineCount++;
      } else {
        line = testLine;
      }
    }
    lineCount++;
    
    return lineCount * lineHeight;
  }

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const blob = await generateImage();
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `between-us-${Date.now()}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        toast.success(t('community.downloadSuccess'));
      } else {
        toast.error(t('community.generateError'));
      }
    } catch (error) {
      console.error('Failed to generate image:', error);
      toast.error(t('community.generateError'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    setIsGenerating(true);
    try {
      const blob = await generateImage();
      if (blob) {
        const file = new File([blob], `between-us-${Date.now()}.png`, { type: 'image/png' });
        
        if (navigator.share && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: t('canvas.appTitle') + ' - ' + t('canvas.tagline'),
              text: 'Check out this supportive community response',
            });
            toast.success(t('community.shareSuccess'));
          } catch (err) {
            if ((err as Error).name !== 'AbortError') {
              console.error('Share failed:', err);
              toast.error(t('community.shareError'));
            }
          }
        } else {
          // Fallback to download
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `between-us-${Date.now()}.png`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
          toast.success(t('community.manualShare'));
        }
      } else {
        toast.error(t('community.generateError'));
      }
    } catch (error) {
      console.error('Failed to share:', error);
      toast.error(t('community.shareError'));
    } finally {
      setIsGenerating(false);
    }
  };

  const isDark = theme === 'dark';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-[95vw] max-h-[95vh] overflow-hidden p-4 flex flex-col bg-white dark:bg-gray-900">
        <DialogTitle className="sr-only">{t('community.shareCardTitle')}</DialogTitle>
        <DialogDescription className="sr-only">
          {t('community.shareSupport')}
        </DialogDescription>
        
        {/* Header */}
        <div className="flex items-center gap-2 mb-3 flex-shrink-0">
          <Share2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('community.shareCardTitle')}
          </h3>
        </div>

        {/* Preview Card */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide mb-3">
          <div className="flex items-center justify-center min-h-full py-2">
            <div 
              ref={previewRef}
              className="rounded-2xl overflow-hidden relative"
              style={{
                width: '100%',
                maxWidth: '340px',
                aspectRatio: '9/16',
                background: isDark 
                  ? 'linear-gradient(to bottom right, #111827, #1f2937, #111827)'
                  : 'linear-gradient(to bottom right, #9333ea, #ec4899, #2563eb)',
              }}
            >
              {/* Animated Background Elements */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-4 left-4 w-16 h-16 rounded-full blur-2xl"
                  style={{ background: isDark ? '#a855f7' : '#ffffff' }}
                />
                <div className="absolute bottom-12 right-4 w-20 h-20 rounded-full blur-2xl"
                  style={{ background: isDark ? '#3b82f6' : '#67e8f9' }}
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full blur-2xl"
                  style={{ background: isDark ? '#ec4899' : '#f9a8d4' }}
                />
              </div>

              {/* Content */}
              <div className="relative z-10 p-5 flex flex-col gap-5 h-full">
                {/* Logo section */}
                <div className="text-center">
                  <div className="inline-flex flex-col items-center gap-2 px-6 py-4 rounded-2xl"
                    style={{
                      background: isDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(12px)',
                      border: isDark ? '2px solid rgba(168, 85, 247, 0.5)' : '2px solid rgba(255, 255, 255, 0.5)',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    }}
                  >
                    <img src={logoImage} alt="Between Us" className="h-7 w-auto" />
                    <p className="text-xs font-semibold" style={{ color: isDark ? '#e9d5ff' : '#6b21a8' }}>
                      {t('canvas.tagline')}
                    </p>
                  </div>
                </div>

                {/* Post */}
                <div className="rounded-2xl p-5"
                  style={{
                    background: isDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(8px)',
                    border: isDark ? '1px solid rgba(168, 85, 247, 0.3)' : 'none',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: isDark ? '#c084fc' : '#a855f7' }} />
                    <span className="text-xs font-semibold" style={{ color: isDark ? '#c084fc' : '#9333ea' }}>
                      {t('canvas.anonShare')}
                    </span>
                  </div>
                  <p className="text-sm italic" style={{ color: isDark ? '#e5e7eb' : '#1f2937', lineHeight: 1.5 }}>
                    "{postContent.length > 150 ? postContent.slice(0, 147) + '...' : postContent}"
                  </p>
                </div>

                {/* Best Comment */}
                <div className="rounded-2xl p-5 flex-1"
                  style={{
                    background: isDark
                      ? 'linear-gradient(to bottom right, rgba(76, 29, 149, 0.95), rgba(30, 58, 138, 0.95), rgba(131, 24, 67, 0.95))'
                      : 'linear-gradient(to bottom right, rgba(250, 204, 21, 0.95), rgba(251, 146, 60, 0.95), rgba(244, 114, 182, 0.95))',
                    backdropFilter: 'blur(8px)',
                    border: isDark ? '2px solid rgba(168, 85, 247, 0.5)' : '2px solid rgba(255, 255, 255, 0.5)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">⭐</span>
                    <span className="text-white font-bold text-xs">{t('canvas.topResponse')}</span>
                  </div>
                  <p className="text-white text-sm mb-2" style={{ lineHeight: 1.5 }}>
                    {bestComment.text.length > 120 ? bestComment.text.slice(0, 117) + '...' : bestComment.text}
                  </p>
                  <div className="flex items-center gap-2 text-white/95">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    <span className="text-xs font-semibold">{bestComment.upvotes.toLocaleString()} {t('canvas.upvotes')}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center">
                  <div className="inline-block px-6 py-3 rounded-full"
                    style={{
                      background: isDark ? 'rgba(168, 85, 247, 0.3)' : 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(12px)',
                      border: isDark ? '1px solid rgba(192, 132, 252, 0.5)' : '1px solid rgba(255, 255, 255, 0.3)',
                    }}
                  >
                    <p className="text-white text-xs font-semibold m-0">
                      {t('canvas.join')}
                    </p>
                    <p className="text-white/85 text-[10px] mt-1 m-0">
                      {t('canvas.downloadApp')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex-shrink-0 flex gap-2">
          <Button
            onClick={handleDownload}
            disabled={isGenerating}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white h-11"
          >
            <Download className="w-4 h-4 mr-2" />
            {isGenerating ? t('community.generating') : t('community.download')}
          </Button>
          <Button
            onClick={handleShare}
            disabled={isGenerating}
            variant="outline"
            className="flex-1 h-11"
          >
            <Share2 className="w-4 h-4 mr-2" />
            {t('community.share')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}