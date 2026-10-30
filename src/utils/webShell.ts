import { THEME } from "../constants/theme";
import { unlockWebAudio } from "./sounds";

let installed = false;

/** Page CSS, viewport lock, and the one-time audio unlock for browsers. */
export function installWebShell() {
  if (installed || typeof document === "undefined") return;
  installed = true;

  const style = document.createElement("style");
  style.setAttribute("data-hex", "shell");
  style.textContent = `
    :root {
      /* Stage size. applyDesktopStage sets both in px while web ENTER is open. */
      --stage-w: 100vw;
      --stage-h: 100dvh;
    }
    html, body, #root {
      height: 100%;
      margin: 0;
      padding: 0;
      background: ${THEME.bg};
      overflow: hidden;
      overscroll-behavior: none;
    }
    html, body {
      position: fixed;
      inset: 0;
      width: 100%;
      touch-action: manipulation;
    }
    #root {
      display: flex;
      flex-direction: column;
      min-height: 0;
    }
    body, #root {
      user-select: none;
      -webkit-user-select: none;
    }
    input, textarea {
      user-select: text;
      -webkit-user-select: text;
      touch-action: manipulation;
    }
    /* Web ENTER only. Phone inputs are outside this form, so their focus ring stays. */
    [data-testid="enter-form"] input,
    [data-testid="enter-form"] input:focus,
    [data-testid="enter-form"] input:focus-visible {
      outline: none !important;
      outline-style: none !important;
      outline-offset: 0 !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      -webkit-appearance: none;
      appearance: none;
    }
  `;
  document.head.appendChild(style);

  const viewport =
    document.querySelector('meta[name="viewport"]') ??
    document.createElement("meta");
  viewport.setAttribute("name", "viewport");
  viewport.setAttribute(
    "content",
    "width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
  );
  if (!viewport.parentElement) document.head.appendChild(viewport);

  const boot = document.createElement("div");
  boot.id = "hex-boot";
  boot.textContent = "LOADING...";
  boot.style.cssText = [
    "position:fixed",
    "inset:0",
    "display:flex",
    "align-items:center",
    "justify-content:center",
    `background:${THEME.bg}`,
    `color:${THEME.textBright}`,
    "font-family:monospace",
    "letter-spacing:0.2em",
    "z-index:1",
  ].join(";");
  document.body.appendChild(boot);

  const unlock = () => unlockWebAudio();
  window.addEventListener("pointerdown", unlock, { capture: true });
  window.addEventListener("keydown", unlock, { capture: true });

  const blockPinch = (event: Event) => event.preventDefault();
  document.addEventListener("gesturestart", blockPinch, { passive: false });
  document.addEventListener("gesturechange", blockPinch, { passive: false });
  document.addEventListener("gestureend", blockPinch, { passive: false });
}

export function dismissWebBoot() {
  if (typeof document === "undefined") return;
  document.getElementById("hex-boot")?.remove();
}
