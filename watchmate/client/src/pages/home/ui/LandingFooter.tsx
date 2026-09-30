import { Heart } from 'lucide-react'
export const LandingFooter = () => (
  <footer className="glass py-6 px-6">
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <img src="/logo-watchmate.png" alt="WatchMate" className="h-8 w-8 object-contain" />
        <span className="font-bold text-gradient">WatchMate</span>
      </div>
      <p className="text-gray-400 text-sm">© 2025 WatchMate. Сделано с <Heart className="inline w-4 h-4 text-purple-400 fill-current -mt-0.5" /></p>
    </div>
  </footer>
)
