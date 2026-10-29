import { useEffect, useRef } from "react";
import { Platform } from "react-native";

type Entry = { priority: number; fn: () => void };

const stack: Entry[] = [];
let attached = false;

function onKeyDown(event: KeyboardEvent) {
  if (event.key !== "Escape" || stack.length === 0) return;
  event.preventDefault();
  let top = stack[0];
  for (const entry of stack) {
    if (entry.priority >= top.priority) top = entry;
  }
  top.fn();
}

/**
 * Web-only Escape handling. Higher priority wins, so an open modal (priority 10)
 * closes before the screen behind it (priority 0) navigates back.
 */
export function useBackHandler(
  priority: number,
  enabled: boolean,
  handler: () => void
) {
  const ref = useRef(handler);
  ref.current = handler;

  useEffect(() => {
    if (Platform.OS !== "web" || !enabled) return;
    const entry: Entry = { priority, fn: () => ref.current() };
    stack.push(entry);
    if (!attached) {
      window.addEventListener("keydown", onKeyDown);
      attached = true;
    }
    return () => {
      const index = stack.indexOf(entry);
      if (index >= 0) stack.splice(index, 1);
    };
  }, [priority, enabled]);
}
