export const CtaSection = ({ onCreate }: { onCreate: () => void }) => (
  <section className="py-24 px-6">
    <div className="max-w-3xl mx-auto">
      <div className="glass-card rounded-3xl p-10 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl" />
        <h2 className="text-3xl font-bold mb-4 relative z-10">Готовы смотреть вместе?</h2>
        <p className="text-gray-400 mb-8 relative z-10">Бесплатно и без регистрации!</p>
        <button onClick={onCreate} className="relative z-10 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl font-semibold text-lg hover:scale-105 transition-transform">
          Создать комнату →
        </button>
      </div>
    </div>
  </section>
)
