import React from "react";
import Slider from "react-slick";
import { ExternalLink } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { motion } from "motion/react";

const promos = [
  {
    id: 'between-us',
    name: 'Between Us',
    logo: 'https://qoqbdiixztolvtcjdnle.supabase.co/storage/v1/object/sign/betweenus3/betweenus.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9lMTYxZDg1My1iMGRlLTRkNjQtYTQxYS0xNTY5MmFmMGJhNWEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJiZXR3ZWVudXMzL2JldHdlZW51cy5wbmciLCJpYXQiOjE3NjQ1MzE5NjMsImV4cCI6MzM0MTMzMTk2M30.Y2YtSYTaspr-sUaFpli7ghszWt8nZjictCRJX2wkbGw',
    link: 'https://betweenus.semprog.de/',
    tagline: 'Your Safe Space for Mental Wellness',
    bait: 'Secrets are heavy. 🤫 Dump your gossip anonymously or discover what others are hiding.',
    theme: 'between-us'
  },
  {
    id: 'broken',
    name: 'Broken',
    logo: 'https://aktlnldjuvrhrragkzbz.supabase.co/storage/v1/object/sign/brokenbucket/broken-final.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85MzRlMGEwNS02Y2FkLTQ3MGEtYjQ1OC1kMGY3NmQ4NGYwMTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJicm9rZW5idWNrZXQvYnJva2VuLWZpbmFsLnBuZyIsImlhdCI6MTc2NDUzMTY2MiwiZXhwIjozMzQxMzMxNjYyfQ.yOOTzcVXBUbM2l7jZwANCeUmNPs6AELkRT-5J25RFa0',
    link: 'https://broken.semprog.de/',
    tagline: "You're Not Broken. You're Breaking Through.",
    bait: "Heartbroken? 💔 Don't text your ex. Chat with people who actually get it.",
    theme: 'broken'
  },
  {
    id: 'seadays',
    name: 'SeaDays',
    logo: 'https://soqkgrfzluewpuiguypm.supabase.co/storage/v1/object/sign/seadays_storage/seadays.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MTZlZmJjMy0xODA3LTRjNDItYjI4MC1mZTA1NmI4ZDlkZWEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJzZWFkYXlzX3N0b3JhZ2Uvc2VhZGF5cy5wbmciLCJpYXQiOjE3NjQ1MzE3ODIsImV4cCI6MzM0MTMzMTc4Mn0.EVBfh3N7AW_MYdpPizc5eVqVMkzubXPrIgUWm2aAtYc',
    link: 'https://seadays.semprog.de/',
    tagline: 'Your Ultimate Cruise Planning Companion',
    bait: "Cruise Mode: ON 🚢 The ultimate hack for stress-free planning is here.",
    theme: 'seadays'
  }
];

const BackgroundEffects = ({ theme }: { theme: string }) => {
  if (theme === 'seadays') {
    // Black BG with shimmering stars
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
              animation: `twinkle ${Math.random() * 3 + 2}s infinite ease-in-out`,
              animationDelay: Math.random() * 2 + 's'
            }}
          />
        ))}
      </div>
    );
  }

  if (theme === 'broken') {
    // White BG with floating bubbles
    return (
      <div className="absolute inset-0 bg-white overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full border border-blue-200/60 bg-blue-50/30 backdrop-blur-sm"
            style={{
              width: Math.random() * 15 + 5 + 'px',
              height: Math.random() * 15 + 5 + 'px',
              bottom: -20 + 'px',
              left: Math.random() * 100 + '%',
              animation: `floatUp ${Math.random() * 6 + 4}s infinite linear`,
              animationDelay: Math.random() * 5 + 's'
            }}
          />
        ))}
      </div>
    );
  }

  if (theme === 'between-us') {
    // #0a0118 BG with shimmering stars
    return (
      <div className="absolute inset-0 bg-[#0a0118] overflow-hidden">
        {/* Stars */}
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
              animation: `twinkle ${Math.random() * 3 + 2}s infinite ease-in-out`,
              animationDelay: Math.random() * 2 + 's'
            }}
          />
        ))}
        {/* Subtle glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-purple-900/10 blur-[80px] rounded-full pointer-events-none" />
      </div>
    );
  }

  return null;
};

export function CrossPromoCarousel() {
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
  };

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Discover More</span>
        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">Partner Apps</span>
      </div>
      
      {/* Banner container */}
      <div className="rounded-2xl overflow-hidden shadow-lg border border-border/50 dark:border-white/5 h-[220px]">
        <Slider {...settings} className="h-full">
          {promos.map((promo) => (
            <div key={promo.id} className="outline-none h-full">
              <a 
                href={promo.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block relative h-[220px] group overflow-hidden"
              >
                <BackgroundEffects theme={promo.theme} />
                
                {/* Content Overlay */}
                <div className="relative z-10 h-full flex flex-col items-center justify-center p-4 text-center">
                  {/* Logo - Bigger & Centered - No Bubble */}
                  <motion.div 
                    className="mb-4 relative z-20"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="h-24 flex items-center justify-center">
                      <ImageWithFallback 
                        src={promo.logo} 
                        alt={`${promo.name} logo`} 
                        className="w-auto h-full max-w-[80%] object-contain drop-shadow-lg"
                      />
                    </div>
                  </motion.div>
                  
                  {/* Text Content - No Name, No Link Icon */}
                  <div className={`max-w-[90%] relative z-20 ${
                    promo.theme === 'broken' ? 'text-gray-900' : 'text-white'
                  }`}>
                    <div className={`inline-block px-4 py-2 rounded-xl text-sm font-semibold backdrop-blur-md shadow-sm ${
                      promo.theme === 'broken' 
                        ? 'bg-blue-50/80 text-blue-900 border border-blue-100' 
                        : 'bg-black/40 text-white/95 border border-white/10'
                    }`}>
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
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes floatUp {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          20% { opacity: 0.6; }
          80% { opacity: 0.6; }
          100% { transform: translateY(-100px) translateX(20px); opacity: 0; }
        }

        /* REQUIRED SLICK CSS - CRITICAL FOR CAROUSEL TO WORK */
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

        /* Custom Height Override */
        .slick-slider, .slick-list, .slick-track, .slick-slide, .slick-slide > div {
          height: 100%;
        }
        
        /* Dots Customization */
        .slick-dots {
          position: absolute;
          bottom: 8px;
          display: block;
          width: 100%;
          padding: 0;
          margin: 0;
          list-style: none;
          text-align: center;
          z-index: 20;
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
          background: currentColor;
          opacity: 0.4;
          margin: 0 auto;
          transition: all 0.3s ease;
        }
        .slick-dots li.slick-active button:before {
          opacity: 1;
          transform: scale(1.4);
        }
        .slick-dots li button:before {
           background: white; 
           box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
}