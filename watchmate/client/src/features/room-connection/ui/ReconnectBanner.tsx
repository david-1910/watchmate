import { Portal } from '@/shared/ui'

export const ReconnectBanner = () => (
  <Portal>
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-toast surface-floating px-4 py-2 rounded-xl flex items-center gap-2 text-sm text-yellow-200 border border-yellow-500/40">
      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      Переподключение…
    </div>
  </Portal>
)
