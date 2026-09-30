// CONTRACT.md, раздел 3: playback-sync не чаще 4 раз в секунду
export const PLAYBACK_SYNC_INTERVAL_MS = 250

// Расхождение позиции, после которого зритель перематывается к хосту
export const SEEK_TOLERANCE_SEC = 1.5

// Через сколько после команды «играть» проверяем, не заблокировал ли браузер автовоспроизведение
export const AUTOPLAY_CHECK_MS = 1500
