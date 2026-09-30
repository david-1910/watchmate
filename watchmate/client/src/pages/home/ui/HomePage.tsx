import { useState } from 'react'
import { RoomEntryModal, type RoomEntryTab } from '@/widgets/room-entry'
import { LandingNav } from './LandingNav'
import { HeroSection } from './HeroSection'
import { FeaturesSection } from './FeaturesSection'
import { StepsSection } from './StepsSection'
import { FaqSection } from './FaqSection'
import { AboutSection } from './AboutSection'
import { CtaSection } from './CtaSection'
import { LandingFooter } from './LandingFooter'

function HomePage() {
  // null — модалка закрыта
  const [entryTab, setEntryTab] = useState<RoomEntryTab | null>(null)
  const openCreate = () => setEntryTab('create')
  const openJoin = () => setEntryTab('join')

  return (
    <div className="min-h-screen bg-app text-white overflow-x-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-violet-500/15 rounded-full blur-3xl" />
      </div>

      <LandingNav onStart={openCreate} />
      <HeroSection onCreate={openCreate} onJoin={openJoin} />
      <FeaturesSection />
      <StepsSection />
      <FaqSection />
      <AboutSection />
      <CtaSection onCreate={openCreate} />
      <LandingFooter />

      {entryTab && (
        <RoomEntryModal tab={entryTab} onTabChange={setEntryTab} onClose={() => setEntryTab(null)} />
      )}
    </div>
  )
}

export { HomePage }
