import React from 'react'
import Slider from 'react-slick'
import { motion } from 'motion/react'
import { SEMPROG_PARTNER_PROMOS, type PartnerPromo } from './partnerPromos'
import { PromoImage } from './PromoImage'
import { openPromoLink, type OwnedMarketingSiteConfig } from './openPromoLink'

export const DISCOVER_MORE_BANNER_HEIGHT_PX = 220

export interface SemprogDiscoverMoreLabels {
  discoverMore?: string
  partnerApps?: string
}

export interface SemprogDiscoverMoreCarouselProps {
  /** Hide the current app from the carousel (e.g. `seadays` when embedding in SeaDays). */
  excludeAppId?: string
  /** When your app toggles light/dark manually (not via `dark` on `<html>`), pass it here for header chrome. */
  isDarkMode?: boolean
  className?: string
  labels?: SemprogDiscoverMoreLabels
  /** Optional owned marketing domain client param for native Browser.open */
  ownedMarketingSite?: OwnedMarketingSiteConfig
  /** Override promo list (default: full Semprog catalog from partnerPromos.ts) */
  promos?: PartnerPromo[]
}

function cn(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(' ')
}

const BackgroundEffects = ({ theme }: { theme: string }) => {
  if (theme === 'seadays') {
    return (
      <div className="absolute inset-0 bg-black overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 2 + 1 + 'px',
              height: Math.random() * 2 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              opacity: Math.random(),
              animation: `semprog-twinkle ${Math.random() * 3 + 2}s infinite ease-in-out`,
              animationDelay: Math.random() * 2 + 's',
            }}
          />
        ))}
      </div>
    )
  }

  if (theme === 'dexora') {
    return (
      <div className="absolute inset-0 overflow-hidden bg-[#07091a]">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 50% 45%, rgba(61, 114, 255, 0.12) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 18% 28%, rgba(124, 77, 255, 0.16) 0%, transparent 60%), radial-gradient(ellipse 55% 45% at 82% 32%, rgba(255, 229, 0, 0.07) 0%, transparent 55%)',
          }}
        />
        <div className="absolute -left-[15%] -top-[10%] w-[70%] h-[70%] rounded-full blur-[100px] opacity-20 bg-[#7c4dff]" />
        <div className="absolute -right-[10%] top-[5%] w-[55%] h-[55%] rounded-full blur-[100px] opacity-15 bg-[#3d72ff]" />
      </div>
    )
  }

  if (theme === 'anspry') {
    return (
      <div className="absolute inset-0 overflow-hidden bg-[#050505]">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 50% 45%, rgba(255, 184, 0, 0.14) 0%, transparent 55%), radial-gradient(ellipse 55% 45% at 20% 30%, rgba(255, 184, 0, 0.08) 0%, transparent 60%)',
          }}
        />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] rounded-full blur-[120px] opacity-25 bg-[#FFB800]" />
      </div>
    )
  }

  if (theme === 'skister') {
    return (
      <div className="absolute inset-0 overflow-hidden bg-[#070908]">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 50% 45%, rgba(34, 139, 34, 0.18) 0%, transparent 55%), radial-gradient(ellipse 55% 45% at 18% 28%, rgba(45, 237, 106, 0.08) 0%, transparent 60%)',
          }}
        />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] rounded-full blur-[120px] opacity-25 bg-[#228B22]" />
      </div>
    )
  }

  if (theme === 'between-us') {
    return (
      <div className="absolute inset-0 bg-[#0a0118] overflow-hidden">
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-purple-200"
            style={{
              width: Math.random() * 2 + 1 + 'px',
              height: Math.random() * 2 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              opacity: Math.random() * 0.8,
              animation: `semprog-twinkle ${Math.random() * 3 + 2}s infinite ease-in-out`,
              animationDelay: Math.random() * 2 + 's',
            }}
          />
        ))}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-purple-900/10 blur-[80px] rounded-full pointer-events-none" />
      </div>
    )
  }

  if (theme === 'callio') {
    return (
      <div className="absolute inset-0 overflow-hidden bg-[#0a0118]">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] rounded-full blur-[120px] opacity-30 bg-[#C084FC]" />
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-purple-300"
            style={{
              width: Math.random() * 2 + 1 + 'px',
              height: Math.random() * 2 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              opacity: Math.random() * 0.7,
              animation: `semprog-twinkle ${Math.random() * 3 + 2}s infinite ease-in-out`,
              animationDelay: Math.random() * 2 + 's',
            }}
          />
        ))}
      </div>
    )
  }

  if (theme === 'pixxy') {
    return (
      <div className="absolute inset-0 overflow-hidden bg-[#0a0118]">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] rounded-full blur-[120px] opacity-30 bg-violet-800" />
        {[...Array(18)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-violet-300"
            style={{
              width: Math.random() * 2 + 1 + 'px',
              height: Math.random() * 2 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              opacity: Math.random() * 0.6,
              animation: `semprog-twinkle ${Math.random() * 3 + 2}s infinite ease-in-out`,
              animationDelay: Math.random() * 2 + 's',
            }}
          />
        ))}
      </div>
    )
  }

  if (theme === 'allocation') {
    return (
      <div className="absolute inset-0 overflow-hidden bg-[#0a0505]">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] rounded-full blur-[120px] opacity-25 bg-amber-700" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(212, 175, 55, 0.15) 0%, transparent 60%)',
          }}
        />
      </div>
    )
  }

  if (theme === 'glamgenie') {
    return (
      <div className="absolute inset-0 overflow-hidden bg-[#0a0118]">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] rounded-full blur-[120px] opacity-30 bg-fuchsia-600" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 50% 45%, rgba(217, 70, 239, 0.12) 0%, transparent 55%), radial-gradient(ellipse 55% 45% at 80% 70%, rgba(236, 72, 153, 0.08) 0%, transparent 55%)',
          }}
        />
      </div>
    )
  }

  if (theme === 'broken') {
    return (
      <div className="absolute inset-0 overflow-hidden bg-[#0a0505]">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] rounded-full blur-[120px] opacity-35 bg-red-600" />
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full border border-blue-200/30 bg-blue-50/10 backdrop-blur-sm"
            style={{
              width: Math.random() * 12 + 6 + 'px',
              height: Math.random() * 12 + 6 + 'px',
              bottom: -20 + 'px',
              left: Math.random() * 100 + '%',
              animation: `semprog-floatUp ${Math.random() * 6 + 4}s infinite linear`,
              animationDelay: Math.random() * 5 + 's',
            }}
          />
        ))}
      </div>
    )
  }

  return null
}

function PromoLogo({ promo }: { promo: PartnerPromo }) {
  if (promo.logoText) {
    return (
      <span
        className="font-light tracking-[0.35em] text-center text-lg md:text-xl drop-shadow-lg"
        style={{
          fontFamily: 'Georgia, Times New Roman, serif',
          background: 'linear-gradient(135deg, #D4AF37 0%, #F5E198 40%, #C8971F 70%, #E8CC6A 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {promo.logoText}
      </span>
    )
  }

  if (promo.nameLogo && promo.logo) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 h-full">
        <PromoImage src={promo.logo} alt={`${promo.name} mascot`} className="max-h-16 md:max-h-20 w-auto object-contain drop-shadow-lg" />
        <PromoImage src={promo.nameLogo} alt={`${promo.name} logo`} className="max-h-8 w-auto object-contain opacity-90 drop-shadow-md" />
      </div>
    )
  }

  if (promo.logo) {
    return (
      <PromoImage
        src={promo.logo}
        alt={`${promo.name} logo`}
        className="w-auto h-full max-w-[80%] object-contain drop-shadow-lg"
      />
    )
  }

  return null
}

/**
 * Semprog "Discover More" partner carousel — profile placement, 220px banners, autoplay slick slider.
 * Source of truth for catalog: https://semprog.de/
 */
export function SemprogDiscoverMoreCarousel({
  excludeAppId,
  isDarkMode,
  className,
  labels,
  ownedMarketingSite,
  promos = SEMPROG_PARTNER_PROMOS,
}: SemprogDiscoverMoreCarouselProps) {
  const visiblePromos = excludeAppId ? promos.filter((p) => p.id !== excludeAppId) : promos
  const discoverMoreLabel = labels?.discoverMore ?? 'Discover More'
  const partnerAppsLabel = labels?.partnerApps ?? 'Partner Apps'

  const settings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    arrows: false,
    pauseOnHover: true,
  }

  if (visiblePromos.length === 0) return null

  return (
    <div className={cn('w-full py-4', className)}>
      <div className="flex items-center justify-between mb-3 px-1">
        <span
          className={cn(
            'text-xs font-semibold uppercase tracking-wider',
            isDarkMode ? 'text-gray-400' : 'text-muted-foreground'
          )}
        >
          {discoverMoreLabel}
        </span>
        <span
          className={cn(
            'text-[10px] px-2 py-0.5 rounded-full',
            isDarkMode ? 'bg-white/10 text-white/80' : 'bg-primary/10 text-primary'
          )}
        >
          {partnerAppsLabel}
        </span>
      </div>

      <div
        className={cn(
          'rounded-2xl overflow-hidden shadow-lg h-[220px] isolate',
          isDarkMode ? 'border border-white/5' : 'border border-border/50'
        )}
      >
        <Slider {...settings} className="h-full">
          {visiblePromos.map((promo) => (
            <div key={promo.id} className="outline-none h-full">
              <a
                href={promo.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block relative h-[220px] group overflow-hidden"
                onClick={(e) => {
                  e.preventDefault()
                  void openPromoLink(promo.link, ownedMarketingSite)
                }}
              >
                <BackgroundEffects theme={promo.theme} />

                <div className="relative z-10 h-full flex flex-col items-center justify-center p-4 text-center">
                  <motion.div
                    className="mb-3 relative z-20 h-20 flex items-center justify-center"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <PromoLogo promo={promo} />
                  </motion.div>

                  <div className={cn('max-w-[90%] relative z-20', promo.lightText ? 'text-white' : 'text-gray-900')}>
                    <div className="inline-block px-4 py-2 rounded-xl text-sm font-semibold backdrop-blur-md shadow-sm bg-black/40 text-white/95 border border-white/10">
                      {promo.bait}
                    </div>
                  </div>
                </div>
              </a>
            </div>
          ))}
        </Slider>
      </div>

      <style>{`
        @keyframes semprog-twinkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes semprog-floatUp {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          20% { opacity: 0.6; }
          80% { opacity: 0.6; }
          100% { transform: translateY(-100px) translateX(20px); opacity: 0; }
        }

        .slick-slider {
          position: relative;
          display: block;
          box-sizing: border-box;
          user-select: none;
          touch-action: pan-y;
          -webkit-tap-highlight-color: transparent;
        }
        .slick-list {
          position: relative;
          display: block;
          overflow: hidden;
          margin: 0;
          padding: 0;
        }
        .slick-list:focus { outline: none; }
        .slick-list.dragging { cursor: pointer; }

        .slick-slider .slick-track,
        .slick-slider .slick-list {
          transform: translate3d(0, 0, 0);
        }

        .slick-track {
          position: relative;
          top: 0;
          left: 0;
          display: block;
          margin-left: auto;
          margin-right: auto;
        }
        .slick-track:before,
        .slick-track:after {
          display: table;
          content: '';
        }
        .slick-track:after { clear: both; }

        .slick-slide {
          display: none;
          float: left;
          height: 100%;
          min-height: 1px;
        }
        .slick-initialized .slick-slide { display: block; }
        .slick-arrow.slick-hidden { display: none; }

        .slick-slider, .slick-list, .slick-track, .slick-slide, .slick-slide > div {
          height: 100%;
        }

        .slick-dots {
          position: absolute;
          bottom: 8px;
          display: block;
          width: 100%;
          padding: 0;
          margin: 0;
          list-style: none;
          text-align: center;
          z-index: 2;
          pointer-events: none;
        }
        .slick-dots li {
          position: relative;
          display: inline-block;
          width: 16px;
          height: 16px;
          margin: 0 2px;
          padding: 0;
          cursor: pointer;
          pointer-events: auto;
        }
        .slick-dots li button {
          font-size: 0;
          line-height: 0;
          display: block;
          width: 16px;
          height: 16px;
          padding: 5px;
          cursor: pointer;
          color: transparent;
          border: 0;
          outline: none;
          background: transparent;
        }
        .slick-dots li button:before {
          content: '';
          display: block;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: white;
          opacity: 0.4;
          margin: 0 auto;
          transition: all 0.3s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }
        .slick-dots li.slick-active button:before {
          opacity: 1;
          transform: scale(1.4);
        }
      `}</style>
    </div>
  )
}

export default SemprogDiscoverMoreCarousel
