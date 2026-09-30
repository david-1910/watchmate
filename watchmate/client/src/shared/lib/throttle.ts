export type Throttled<A extends unknown[]> = ((...args: A) => void) & {
  cancel: () => void
}

// Не чаще одного вызова за intervalMs. Последний вызов из серии не теряется:
// он выполнится в конце интервала с самыми свежими аргументами
export const throttle = <A extends unknown[]>(
  fn: (...args: A) => void,
  intervalMs: number
): Throttled<A> => {
  let lastCall = 0
  let timer: ReturnType<typeof setTimeout> | null = null
  let pendingArgs: A | null = null

  const run = (args: A) => {
    lastCall = Date.now()
    fn(...args)
  }

  const throttled = (...args: A) => {
    const wait = intervalMs - (Date.now() - lastCall)
    if (wait <= 0 && !timer) {
      run(args)
      return
    }
    pendingArgs = args
    if (!timer) {
      timer = setTimeout(() => {
        timer = null
        if (pendingArgs) run(pendingArgs)
        pendingArgs = null
      }, Math.max(wait, 0))
    }
  }

  throttled.cancel = () => {
    if (timer) clearTimeout(timer)
    timer = null
    pendingArgs = null
  }

  return throttled
}
