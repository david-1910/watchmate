import { ABOUT_TAGS } from '../config/content'
import { SectionHeading } from './SectionHeading'

export const AboutSection = () => (
  <section id="about" className="py-24 px-6">
    <div className="max-w-3xl mx-auto text-center">
      <SectionHeading eyebrow="О ПРОЕКТЕ">
        Для <span className="text-gradient">друзей</span>
      </SectionHeading>
      <div className="glass-card rounded-3xl p-8 card-hover">
        <p className="text-lg text-gray-300 leading-relaxed mb-6">WatchMate создан, чтобы люди могли смотреть видео вместе, даже находясь далеко друг от друга.</p>
        <div className="flex justify-center gap-3 flex-wrap">
          {ABOUT_TAGS.map((tag) => (
            <span key={tag.label} className="px-4 py-2 glass rounded-full text-sm inline-flex items-center gap-2"><tag.icon className="w-4 h-4 text-purple-300" />{tag.label}</span>
          ))}
        </div>
      </div>
    </div>
  </section>
)
