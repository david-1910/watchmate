export type YTPlayer = {
  playVideo(): void
  pauseVideo(): void
  seekTo(seconds: number, allowSeekAhead: boolean): void
  getCurrentTime(): number
  getPlayerState(): number
  destroy(): void
}

export const YT_STATE = { ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3 } as const

declare global {
  interface Window {
    YT: { Player: new (el: HTMLElement, opts: object) => YTPlayer }
    onYouTubeIframeAPIReady: () => void
  }
}

let ytApiReady = false
const ytReadyQueue: Array<() => void> = []

export const ensureYTApi = (cb: () => void): void => {
  if (ytApiReady) { cb(); return }
  ytReadyQueue.push(cb)
  if (document.querySelector('script[src*="youtube.com/iframe_api"]')) return
  const script = document.createElement('script')
  script.src = 'https://www.youtube.com/iframe_api'
  document.head.appendChild(script)
  window.onYouTubeIframeAPIReady = () => {
    ytApiReady = true
    ytReadyQueue.splice(0).forEach((f) => f())
  }
}
