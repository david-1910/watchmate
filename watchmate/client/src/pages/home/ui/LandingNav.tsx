import { Button } from '@/shared/ui'
import { NAV_SECTIONS } from '../config/content'
import { scrollToSection } from '../lib/scrollToSection'

export const LandingNav = ({ onStart }: { onStart: () => void }) => (
  <nav className="fixed top-0 left-0 right-0 z-nav glass">
    <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <img src="/logo-watchmate.png" alt="WatchMate" className="h-10 w-10 object-contain" />
        <span className="text-xl font-bold text-gradient">WatchMate</span>
      </div>
      <div className="hidden md:flex items-center gap-8">
        {NAV_SECTIONS.map((section) => (
          <button key={section.id} onClick={() => scrollToSection(section.id)} className="text-gray-300 hover:text-white transition-colors relative group">
            {section.label}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-500 transition-all group-hover:w-full" />
          </button>
        ))}
      </div>
      <Button onClick={onStart}>Начать</Button>
    </div>
  </nav>
)
