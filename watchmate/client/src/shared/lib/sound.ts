const beep = (freq: number, duration: number, volume = 0.3) => {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = freq
    gain.gain.setValueAtTime(volume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
  } catch {}
}

export const playNotificationSound = () => beep(880, 0.35)

export const playChatSound = () => beep(600, 0.2, 0.2)

export const playRequestSound = () => {
  beep(700, 0.15, 0.35)
  setTimeout(() => beep(900, 0.2, 0.35), 180)
}
