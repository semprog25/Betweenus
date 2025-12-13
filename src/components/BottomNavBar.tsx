import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

type Tab = 'share' | 'listen' | 'checkin' | 'community' | 'profile';

interface TabItem {
  id: Tab;
  icon: LucideIcon;
  label: string;
}

interface BottomNavBarProps {
  tabs: TabItem[];
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

export function BottomNavBar({ tabs, activeTab, setActiveTab }: BottomNavBarProps) {
  return (
    <nav className="sticky bottom-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 shadow-lg">
      <div className="max-w-md mx-auto px-2 py-2">
        <div className="flex items-center justify-around gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                aria-label={tab.label}
                className={`
                  relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl
                  transition-all duration-300 flex-1 min-w-0
                  ${isActive 
                    ? 'text-purple-600 dark:text-purple-400' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }
                `}
                whileTap={{ scale: 0.95 }}
              >
                {/* Active indicator background */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-purple-100 dark:bg-purple-900/30 rounded-2xl"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30
                    }}
                  />
                )}
                
                {/* Icon */}
                <div className="relative z-10">
                  <Icon 
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isActive ? 'scale-110' : ''
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>
                
                {/* Label */}
                <span 
                  aria-hidden="true"
                  className={`
                    relative z-10 text-[10px] sm:text-xs transition-all duration-200 truncate max-w-full
                    ${isActive ? 'font-semibold' : 'font-medium'}
                  `}
                >
                  {tab.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}