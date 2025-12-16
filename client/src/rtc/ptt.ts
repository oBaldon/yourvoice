// client/src/rtc/ptt.ts
export type PttHandlers = {
  enable: () => void;
  disable: () => void;
};

export function setupPtt(onDown: () => void, onUp: () => void): PttHandlers {
  const key = "v";

  const down = (e: KeyboardEvent) => {
    if (e.key.toLowerCase() === key && !e.repeat) onDown();
  };
  const up = (e: KeyboardEvent) => {
    if (e.key.toLowerCase() === key) onUp();
  };

  return {
    enable() {
      window.addEventListener("keydown", down);
      window.addEventListener("keyup", up);
    },
    disable() {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    }
  };
}
