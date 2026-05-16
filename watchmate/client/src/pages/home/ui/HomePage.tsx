import { Button, Input } from '../../../shared/ui'
import { useRoomModal } from '../../../features/room-auth'

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

const FEATURES = [
  { icon: '🎬', title: 'Синхронизация', desc: 'Видео синхронизируется у всех участников' },
  { icon: '💬', title: 'Чат', desc: 'Общайтесь во время просмотра' },
  { icon: '🎉', title: 'Реакции', desc: 'Эмодзи-реакции в реальном времени' },
  { icon: '👑', title: 'Хост', desc: 'Создатель управляет воспроизведением' },
  { icon: '✅', title: 'Готовность', desc: 'Старт когда все готовы' },
  { icon: '🔗', title: 'Доступ', desc: 'Поделись ссылкой — и готово' },
]

const STEPS = [
  { step: '1', icon: '➕', title: 'Создай', desc: 'Создай комнату и получи код' },
  { step: '2', icon: '📤', title: 'Пригласи', desc: 'Поделись ссылкой с друзьями' },
  { step: '3', icon: '▶️', title: 'Смотри', desc: 'Наслаждайся вместе!' },
]

const FAQ_ITEMS = [
  { q: 'Это бесплатно?', a: 'Да, полностью бесплатно и без ограничений.' },
  { q: 'Какие видео поддерживаются?', a: 'YouTube ссылки и локальные видеофайлы.' },
  { q: 'Нужна регистрация?', a: 'Нет, просто введите имя и начинайте.' },
  { q: 'Сколько человек в комнате?', a: 'Рекомендуем до 10-15 для лучшего опыта.' },
]

function HomePage() {
  const {
    showModal, setShowModal, modalTab, setTab, openModal,
    userName, setUserName, roomCode, setRoomCode,
    error, loading, isPrivate, setIsPrivate, roomPassword, setRoomPassword,
    joinRoomIsPrivate, joinPassword, setJoinPassword,
    handleCreateRoom, handleJoinRoom,
  } = useRoomModal()

  const onSubmit = () => (modalTab === 'create' ? handleCreateRoom() : handleJoinRoom())

  return (
    <div className="min-h-screen bg-animated-gradient text-white overflow-x-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-violet-500/15 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      <nav className="fixed top-0 left-0 right-0 z-40 glass">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-watchmate.png" alt="WatchMate" className="h-10 w-10 object-contain" />
            <span className="text-xl font-bold text-gradient">WatchMate</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {(['features', 'faq', 'about'] as const).map((section) => (
              <button key={section} onClick={() => scrollTo(section)} className="text-gray-300 hover:text-white transition-colors relative group">
                {section === 'features' ? 'Возможности' : section === 'faq' ? 'FAQ' : 'О нас'}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-500 transition-all group-hover:w-full" />
              </button>
            ))}
          </div>
          <Button onClick={() => openModal('create')}>Начать</Button>
        </div>
      </nav>

      <section className="min-h-screen flex items-center justify-center px-6 pt-20 relative">
        <div className="absolute top-32 left-10 text-6xl opacity-20 animate-float hidden md:block">🎬</div>
        <div className="absolute top-40 right-20 text-5xl opacity-20 animate-float-slow hidden md:block">🍿</div>
        <div className="absolute bottom-32 left-20 text-5xl opacity-20 animate-float-slower hidden md:block">💬</div>
        <div className="absolute bottom-40 right-10 text-6xl opacity-20 animate-float hidden md:block">🎉</div>

        <div className="max-w-4xl text-center relative z-10">
          <div className="relative inline-block mb-8">
            <img src="/logo-watchmate.png" alt="WatchMate" className="h-32 w-32 md:h-40 md:w-40 object-contain mx-auto animate-float animate-pulse-glow rounded-3xl" />
            <div className="absolute inset-0 border-2 border-purple-500/30 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="text-gradient">Watch</span><span className="text-white">Mate</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-4 leading-relaxed">Смотри видео вместе с друзьями в реальном времени</p>
          <p className="text-lg text-gray-400 mb-10">Неважно, где вы находитесь — будьте вместе! ✨</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => openModal('create')} className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl font-semibold text-lg overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(139,92,246,0.4)]">
              <span className="relative z-10">🎬 Создать комнату</span>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <button onClick={() => openModal('join')} className="px-8 py-4 glass-button-secondary rounded-xl font-semibold text-lg hover:scale-105 transition-all">
              🔗 Присоединиться
            </button>
          </div>

          <div className="flex justify-center gap-8 md:gap-12 mt-16">
            {[{ val: '100%', label: 'Бесплатно' }, { val: '0', label: 'Регистрация' }, { val: '∞', label: 'Возможностей' }].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-gradient">{s.val}</div>
                <div className="text-gray-400 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <button onClick={() => scrollTo('features')} className="text-gray-400 hover:text-white">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>
      </section>

      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-purple-400 font-semibold mb-4 block">ВОЗМОЖНОСТИ</span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Всё для <span className="text-gradient">совместного просмотра</span></h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="glass-card rounded-2xl p-6 text-center card-hover shine-effect">
                <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center text-3xl mx-auto mb-4">{f.icon}</div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-purple-400 font-semibold mb-4 block">КАК ЭТО РАБОТАЕТ</span>
            <h2 className="text-4xl md:text-5xl font-bold">Три простых шага</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-16 h-16 rounded-full glass flex items-center justify-center text-3xl mx-auto mb-4 animate-pulse-glow">{s.icon}</div>
                <div className="text-purple-400 font-bold mb-2">Шаг {s.step}</div>
                <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                <p className="text-gray-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-purple-400 font-semibold mb-4 block">FAQ</span>
            <h2 className="text-4xl md:text-5xl font-bold">Частые <span className="text-gradient">вопросы</span></h2>
          </div>
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

      <section id="about" className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-center mb-16">
            <span className="text-purple-400 font-semibold mb-4 block">О ПРОЕКТЕ</span>
            <h2 className="text-4xl md:text-5xl font-bold">Для <span className="text-gradient">друзей</span></h2>
          </div>
          <div className="glass-card rounded-3xl p-8 card-hover">
            <p className="text-lg text-gray-300 leading-relaxed mb-6">WatchMate создан, чтобы люди могли смотреть видео вместе, даже находясь далеко друг от друга.</p>
            <div className="flex justify-center gap-3 flex-wrap">
              {['🎬 Видео', '💜 Дружба', '🌍 Без границ'].map((tag) => (
                <span key={tag} className="px-4 py-2 glass rounded-full text-sm">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="glass-card rounded-3xl p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl" />
            <h2 className="text-3xl font-bold mb-4 relative z-10">Готовы смотреть вместе?</h2>
            <p className="text-gray-400 mb-8 relative z-10">Бесплатно и без регистрации!</p>
            <button onClick={() => openModal('create')} className="relative z-10 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl font-semibold text-lg hover:scale-105 transition-transform">
              Создать комнату →
            </button>
          </div>
        </div>
      </section>

      <footer className="glass py-6 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo-watchmate.png" alt="WatchMate" className="h-8 w-8 object-contain" />
            <span className="font-bold text-gradient">WatchMate</span>
          </div>
          <p className="text-gray-400 text-sm">© 2025 WatchMate. Сделано с 💜</p>
        </div>
      </footer>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowModal(false)} />
          <div className="glass-card rounded-3xl p-8 w-full max-w-md z-10 relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full glass flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all">×</button>

            <div className="text-center mb-6">
              <img src="/logo-watchmate.png" alt="WatchMate" className="h-16 w-16 object-contain mx-auto mb-3" />
              <h2 className="text-2xl font-bold"><span className="text-gradient">Watch</span>Mate</h2>
            </div>

            <div className="flex gap-2 mb-6">
              {(['create', 'join'] as const).map((tab) => (
                <button key={tab} onClick={() => setTab(tab)} className={`flex-1 py-3 rounded-xl font-semibold transition-all ${modalTab === tab ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : 'glass hover:bg-white/10'}`}>
                  {tab === 'create' ? 'Создать' : 'Войти'}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Ваше имя</label>
                <Input placeholder="Как вас зовут?" value={userName} onChange={setUserName} onKeyDown={(e) => e.key === 'Enter' && onSubmit()} />
              </div>

              {modalTab === 'create' && (
                <>
                  <div className="flex items-center justify-between p-3 glass rounded-xl">
                    <div>
                      <p className="font-medium">Приватная комната</p>
                      <p className="text-xs text-gray-400">Потребуется пароль для входа</p>
                    </div>
                    <button onClick={() => setIsPrivate(!isPrivate)} className={`w-12 h-6 rounded-full transition-colors ${isPrivate ? 'bg-purple-500' : 'bg-gray-600'}`}>
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${isPrivate ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  {isPrivate && (
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">Пароль комнаты</label>
                      <Input placeholder="Придумайте пароль" value={roomPassword} onChange={setRoomPassword} />
                    </div>
                  )}
                </>
              )}

              {modalTab === 'join' && (
                <>
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Код комнаты</label>
                    <Input placeholder="Например: ABC123" value={roomCode}
                      onChange={(v) => { setRoomCode(v.toUpperCase()) }}
                      onKeyDown={(e) => e.key === 'Enter' && onSubmit()} />
                  </div>
                  {joinRoomIsPrivate && (
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">Пароль комнаты</label>
                      <Input placeholder="Введите пароль" value={joinPassword} onChange={setJoinPassword} onKeyDown={(e) => e.key === 'Enter' && onSubmit()} />
                    </div>
                  )}
                </>
              )}

              {error && <div className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded-lg">{error}</div>}

              <button onClick={onSubmit} disabled={loading} className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl font-semibold hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Загрузка...
                  </span>
                ) : modalTab === 'create' ? '🎬 Создать комнату' : '🚀 Присоединиться'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export { HomePage }
