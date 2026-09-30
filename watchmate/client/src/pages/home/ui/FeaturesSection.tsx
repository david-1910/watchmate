import { FEATURES } from '../config/content'
import { SectionHeading } from './SectionHeading'

export const FeaturesSection = () => (
  <section id="features" className="py-24 px-6">
    <div className="max-w-6xl mx-auto">
      <SectionHeading eyebrow="ВОЗМОЖНОСТИ" className="mb-4">
        Всё для <span className="text-gradient">совместного просмотра</span>
      </SectionHeading>
      <div className="grid md:grid-cols-3 gap-6">
        {FEATURES.map((f) => (
          <div key={f.title} className="glass-card rounded-2xl p-6 text-center card-hover shine-effect">
            <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center mx-auto mb-4 text-purple-300"><f.icon className="w-7 h-7" /></div>
            <h3 className="text-lg font-bold mb-2">{f.title}</h3>
            <p className="text-gray-400 text-sm">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
)
