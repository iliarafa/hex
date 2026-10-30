import { railWidthFor } from "./rail";

/**
 * Desktop stage floor, same mechanism and thresholds as Math Racer
 * (`iliarafa/math_racers` `desktopStage` / `applyDesktopStage`):
 * the layout never lays out smaller than 900×720. A smaller window keeps
 * that floor (preserving the window's shape) and zooms `#root` down to fit,
 * so the UI shrinks like a picture instead of reflowing into an overlap.
 */
export const STAGE_MIN_WIDTH = 900;
export const STAGE_MIN_HEIGHT = 720;

/** Below this window width the phone ENTER screen is left as-is. */
export const ENTER_PHONE_MAX_WIDTH = 600;

/**
 * A short viewport that is not yet the desktop workstation is a landscape
 * phone, not a window we should restack.
 */
export const ENTER_PHONE_MAX_HEIGHT = 500;

/** Side-by-side ENTER. Matches the workstation rail (`DESKTOP_MIN_WIDTH`). */
export const WIDE_LAYOUT_MIN_WIDTH = 1024;

/** Input column share of the pane beside the swatch, then clamped. */
export const COLUMN_RATIO = 0.38;
export const COLUMN_MIN = 320;
export const COLUMN_MAX = 640;

const FLUID_MIN_W = STAGE_MIN_WIDTH;
const FLUID_MAX_W = 1760;

export interface DesktopStage {
  /** Zoom applied to #root: 1 at or above the floor, smaller below it. */
  scale: number;
  /** Layout size in CSS px before the zoom; at least the floor in both directions. */
  width: number;
  height: number;
}

/**
 * Size of the desktop stage for a window. Above the floor the stage is the
 * window. Below it the stage grows to the floor along the tighter side and
 * keeps the window's shape, so once scaled by `scale` it fills the window
 * exactly, with no scroll and no letterbox.
 */
export function desktopStage(innerWidth: number, innerHeight: number): DesktopStage {
  const scale = Math.min(1, innerWidth / STAGE_MIN_WIDTH, innerHeight / STAGE_MIN_HEIGHT);
  if (!(scale > 0)) return { scale: 1, width: innerWidth, height: innerHeight };
  return { scale, width: innerWidth / scale, height: innerHeight / scale };
}

export type EnterChrome = "phone" | "stack" | "wide";

/**
 * Phone (native, or a phone-sized browser) keeps the existing screen.
 * Tablet and narrow windows stack the input over a swatch that fills the rest.
 * Wide windows put the input column beside a full-height swatch.
 * The choice uses the stage size, so below the floor the mode stops reflowing
 * and only the zoom changes.
 */
export function enterChrome(
  platform: string,
  windowWidth: number,
  windowHeight: number,
): EnterChrome {
  if (platform !== "web") return "phone";
  if (windowWidth < ENTER_PHONE_MAX_WIDTH) return "phone";
  if (windowHeight < ENTER_PHONE_MAX_HEIGHT && windowWidth < WIDE_LAYOUT_MIN_WIDTH) return "phone";
  const stage = desktopStage(windowWidth, windowHeight);
  return stage.width >= WIDE_LAYOUT_MIN_WIDTH ? "wide" : "stack";
}

/** Lock the stage only while the web ENTER layout is on screen. */
export function shouldLockStage(
  platform: string,
  screen: string,
  windowWidth: number,
  windowHeight: number,
): boolean {
  return (
    platform === "web" &&
    screen === "enterHex" &&
    enterChrome(platform, windowWidth, windowHeight) !== "phone"
  );
}

export function enterPaneWidth(layoutWidth: number, showRail: boolean): number {
  const rail = showRail ? railWidthFor(layoutWidth) : 0;
  return Math.max(0, layoutWidth - rail);
}

/** ~38% of the pane, clamped so the column can grow but not swallow the swatch. */
export function enterColumnWidth(paneWidth: number): number {
  const target = paneWidth * COLUMN_RATIO;
  const clamped = Math.min(COLUMN_MAX, Math.max(COLUMN_MIN, target));
  const swatchFloor = Math.round(paneWidth * 0.55);
  return Math.round(Math.min(clamped, Math.max(0, paneWidth - swatchFloor)));
}

export function lerpClamp(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  if (!(inMax > inMin)) return outMin;
  const t = Math.min(1, Math.max(0, (value - inMin) / (inMax - inMin)));
  return outMin + (outMax - outMin) * t;
}

export interface EnterFluid {
  digit: number;
  name: number;
  control: number;
  buttonPadV: number;
  pad: number;
  gap: number;
  readout: number;
  meta: number;
  kicker: number;
  standby: number;
}

/** Sizes follow layout width continuously. Rounding is per pixel, not per breakpoint. */
export function enterFluid(layoutWidth: number): EnterFluid {
  const w = layoutWidth;
  const round = (n: number) => Math.round(n);
  return {
    digit: round(lerpClamp(w, FLUID_MIN_W, FLUID_MAX_W, 32, 56)),
    name: round(lerpClamp(w, FLUID_MIN_W, FLUID_MAX_W, 16, 26)),
    control: round(lerpClamp(w, FLUID_MIN_W, FLUID_MAX_W, 12, 20)),
    buttonPadV: round(lerpClamp(w, FLUID_MIN_W, FLUID_MAX_W, 14, 24)),
    pad: round(lerpClamp(w, FLUID_MIN_W, FLUID_MAX_W, 20, 40)),
    gap: round(lerpClamp(w, FLUID_MIN_W, FLUID_MAX_W, 18, 32)),
    readout: round(lerpClamp(w, FLUID_MIN_W, FLUID_MAX_W, 16, 28)),
    meta: round(lerpClamp(w, FLUID_MIN_W, FLUID_MAX_W, 10, 14)),
    kicker: round(lerpClamp(w, FLUID_MIN_W, FLUID_MAX_W, 10, 14)),
    standby: round(lerpClamp(w, FLUID_MIN_W, FLUID_MAX_W, 12, 18)),
  };
}

type StyleTarget = {
  style: {
    setProperty(name: string, value: string): void;
    removeProperty(name: string): string;
  };
};

/**
 * `--stage-w` / `--stage-h` on <html> and `zoom` on #root. Zoom goes on #root,
 * not <html>, matching Math Racer so anything portaled to <body> keeps its size.
 * Below the floor, #root is also sized to the stage so flex layout happens in
 * stage pixels and the zoom brings it back to the window. Pass null to clear
 * (phone and every screen other than web ENTER).
 */
export function applyDesktopStage(
  stage: DesktopStage | null,
  html: StyleTarget | undefined = globalThis.document?.documentElement,
  root: StyleTarget | null | undefined = globalThis.document?.getElementById("root"),
): DesktopStage | null {
  if (!html) return null;
  if (!stage) {
    html.style.removeProperty("--stage-w");
    html.style.removeProperty("--stage-h");
    root?.style.removeProperty("zoom");
    root?.style.removeProperty("width");
    root?.style.removeProperty("height");
    return null;
  }
  html.style.setProperty("--stage-w", `${stage.width}px`);
  html.style.setProperty("--stage-h", `${stage.height}px`);
  if (stage.scale < 1) {
    root?.style.setProperty("width", `${stage.width}px`);
    root?.style.setProperty("height", `${stage.height}px`);
    root?.style.setProperty("zoom", String(stage.scale));
  } else {
    root?.style.removeProperty("zoom");
    root?.style.removeProperty("width");
    root?.style.removeProperty("height");
  }
  return stage;
}
