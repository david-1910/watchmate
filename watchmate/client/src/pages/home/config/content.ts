import { Clapperboard, MessageCircle, PartyPopper, Crown, CircleCheck, Link2, Plus, Share2, Play, Heart, Globe } from 'lucide-react'
export const NAV_SECTIONS = [
  { id: 'features', label: 'Возможности' },
  { id: 'faq', label: 'FAQ' },
  { id: 'about', label: 'О нас' },
] as const

export const HERO_STATS = [
  { val: '100%', label: 'Бесплатно' },
  { val: '0', label: 'Регистрация' },
  { val: '∞', label: 'Возможностей' },
]

export const FEATURES = [
  { icon: Clapperboard, title: 'Синхронизация', desc: 'Видео синхронизируется у всех участников' },
  { icon: MessageCircle, title: 'Чат', desc: 'Общайтесь во время просмотра' },
  { icon: PartyPopper, title: 'Реакции', desc: 'Эмодзи-реакции в реальном времени' },
  { icon: Crown, title: 'Хост', desc: 'Создатель управляет воспроизведением' },
  { icon: CircleCheck, title: 'Готовность', desc: 'Старт когда все готовы' },
  { icon: Link2, title: 'Доступ', desc: 'Поделись ссылкой — и готово' },
]

export const STEPS = [
  { step: '1', icon: Plus, title: 'Создай', desc: 'Создай комнату и получи код' },
  { step: '2', icon: Share2, title: 'Пригласи', desc: 'Поделись ссылкой с друзьями' },
  { step: '3', icon: Play, title: 'Смотри', desc: 'Наслаждайся вместе!' },
]

export const FAQ_ITEMS = [
  { q: 'Это бесплатно?', a: 'Да, полностью бесплатно и без ограничений.' },
  { q: 'Какие видео поддерживаются?', a: 'Ссылки на YouTube.' },
  { q: 'Нужна регистрация?', a: 'Нет, просто введите имя и начинайте.' },
  { q: 'Сколько человек в комнате?', a: 'Рекомендуем до 10-15 для лучшего опыта.' },
]

export const ABOUT_TAGS = [
  { icon: Clapperboard, label: 'Видео' },
  { icon: Heart, label: 'Дружба' },
  { icon: Globe, label: 'Без границ' },
]
