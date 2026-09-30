import { Clapperboard, Popcorn, MessageCircle, PartyPopper, Sparkles, Link2 } from 'lucide-react'
import { HERO_STATS } from '../config/content'
import { scrollToSection } from '../lib/scrollToSection'

type Props = {
  onCreate: () => void
  onJoin: () => void
}

export const HeroSection = ({ onCreate, onJoin }: Props) => (
  <section className="min-h-screen flex items-center justify-center px-6 pt-20 relative">
    <Clapperboard className="absolute top-32 left-10 w-16 h-16 opacity-20 hidden md:block" strokeWidth={1.5} />
    <Popcorn className="absolute top-40 right-20 w-12 h-12 opacity-20 hidden md:block" strokeWidth={1.5} />
    <MessageCircle className="absolute bottom-32 left-20 w-12 h-12 opacity-20 hidden md:block" strokeWidth={1.5} />
    <PartyPopper className="absolute bottom-40 right-10 w-16 h-16 opacity-20 hidden md:block" strokeWidth={1.5} />

    <div className="max-w-4xl text-center relative z-10">
      <div className="relative inline-block mb-8">
        <img src="/logo-watchmate.png" alt="WatchMate" className="h-32 w-32 md:h-40 md:w-40 object-contain mx-auto animate-pulse-glow rounded-3xl" />
        <div className="absolute inset-0 border-2 border-purple-500/30 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
      </div>

      <h1 className="text-5xl md:text-7xl font-bold mb-6">
        <span className="text-gradient">Watch</span><span className="text-white">Mate</span>
      </h1>
      <p className="text-xl md:text-2xl text-gray-300 mb-4 leading-relaxed">Смотри видео вместе с друзьями в реальном времени</p>
      <p className="text-lg text-gray-400 mb-10">Неважно, где вы находитесь — будьте вместе! <Sparkles className="inline w-5 h-5 text-yellow-300 -mt-1" /></p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button onClick={onCreate} className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl font-semibold text-lg overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(139,92,246,0.4)]">
          <span className="relative z-10 inline-flex items-center gap-2"><Clapperboard className="w-5 h-5" />Создать комнату</span>
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
        <button onClick={onJoin} className="px-8 py-4 glass-button-secondary rounded-xl font-semibold text-lg hover:scale-105 transition-all">
          <span className="inline-flex items-center gap-2"><Link2 className="w-5 h-5" />Присоединиться</span>
        </button>
      </div>

      <div className="flex justify-center gap-8 md:gap-12 mt-16">
        {HERO_STATS.map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-gradient">{s.val}</div>
            <div className="text-gray-400 text-sm">{s.label}</div>
          </div>
        ))}
      </div>
    </div>

    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
      <button onClick={() => scrollToSection('features')} className="text-gray-400 hover:text-white">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>
    </div>
  </section>
)
