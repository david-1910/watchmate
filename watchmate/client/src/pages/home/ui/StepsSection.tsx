import { STEPS } from '../config/content'
import { SectionHeading } from './SectionHeading'

export const StepsSection = () => (
  <section className="py-24 px-6">
    <div className="max-w-4xl mx-auto">
      <SectionHeading eyebrow="КАК ЭТО РАБОТАЕТ">Три простых шага</SectionHeading>
      <div className="grid md:grid-cols-3 gap-6">
        {STEPS.map((s) => (
          <div key={s.step} className="text-center">
            <div className="w-16 h-16 rounded-full glass flex items-center justify-center mx-auto mb-4 animate-pulse-glow text-purple-300"><s.icon className="w-7 h-7" /></div>
            <div className="text-purple-400 font-bold mb-2">Шаг {s.step}</div>
            <h3 className="text-xl font-bold mb-2">{s.title}</h3>
            <p className="text-gray-400">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
)
