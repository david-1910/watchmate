import { FAQ_ITEMS } from '../config/content'
import { SectionHeading } from './SectionHeading'

export const FaqSection = () => (
  <section id="faq" className="py-24 px-6">
    <div className="max-w-3xl mx-auto">
      <SectionHeading eyebrow="FAQ">
        Частые <span className="text-gradient">вопросы</span>
      </SectionHeading>
      <div className="space-y-4">
        {FAQ_ITEMS.map((item) => (
          <div key={item.q} className="glass-card rounded-2xl p-5 card-hover">
            <h3 className="font-bold mb-1">{item.q}</h3>
            <p className="text-gray-400 text-sm">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
)
