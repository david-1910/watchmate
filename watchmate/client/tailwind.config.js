/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Шкала слоёв страницы — только имена, не числа. Внутри карточки видео z-index не нужен:
      // её слои идут в нужном порядке в DOM, а карточка изолирована (isolate)
      zIndex: {
        nav: '40', // фиксированная шапка лендинга
        drawer: '50', // мобильный сайдбар
        modal: '60', // модальные окна (через Portal)
        toast: '70', // уведомления и «Переподключение…» (через Portal)
      },
    },
  },
  plugins: [],
  future: {
    hoverOnlyWhenSupported: true,
  },
}
