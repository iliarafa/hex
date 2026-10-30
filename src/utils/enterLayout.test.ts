import assert from "node:assert/strict";
import { test } from "node:test";
import { railWidthFor } from "./rail";
import {
  COLUMN_MAX,
  COLUMN_MIN,
  COLUMN_RATIO,
  applyDesktopStage,
  desktopStage,
  enterChrome,
  enterColumnWidth,
  enterFluid,
  enterPaneWidth,
  shouldLockStage,
  STAGE_MIN_HEIGHT,
  STAGE_MIN_WIDTH,
  WIDE_LAYOUT_MIN_WIDTH,
} from "./enterLayout";

test("desktopStage is the window at or above the floor", () => {
  assert.deepEqual(desktopStage(1440, 900), { scale: 1, width: 1440, height: 900 });
  assert.deepEqual(desktopStage(STAGE_MIN_WIDTH, STAGE_MIN_HEIGHT), {
    scale: 1,
    width: 900,
    height: 720,
  });
});

test("desktopStage below the floor scales down and keeps the window shape", () => {
  const stage = desktopStage(600, 500);
  assert.ok(Math.abs(stage.scale - 600 / STAGE_MIN_WIDTH) < 1e-9);
  assert.ok(Math.abs(stage.width - STAGE_MIN_WIDTH) < 1e-9);
  assert.ok(stage.height >= STAGE_MIN_HEIGHT);
  assert.ok(Math.abs(stage.width / stage.height - 600 / 500) < 1e-9);

  const square = desktopStage(450, 360);
  assert.equal(square.scale, 0.5);
  assert.equal(square.width, 900);
  assert.equal(square.height, 720);
});

test("desktopStage with no window size leaves it unscaled", () => {
  assert.deepEqual(desktopStage(0, 0), { scale: 1, width: 0, height: 0 });
});

test("enter chrome matches the review sizes", () => {
  assert.equal(enterChrome("ios", 390, 844), "phone");
  assert.equal(enterChrome("web", 390, 844), "phone");
  assert.equal(enterChrome("web", 844, 390), "phone");
  assert.equal(enterChrome("web", 600, 500), "stack");
  assert.equal(enterChrome("web", 768, 1024), "stack");
  assert.equal(enterChrome("web", 1024, 815), "wide");
  assert.equal(enterChrome("web", 1440, 900), "wide");
});

test("stage lock is web ENTER only, and not the phone layout", () => {
  assert.equal(shouldLockStage("web", "enterHex", 768, 1024), true);
  assert.equal(shouldLockStage("web", "enterHex", 390, 844), false);
  assert.equal(shouldLockStage("web", "picker", 768, 1024), false);
  assert.equal(shouldLockStage("ios", "enterHex", 1024, 768), false);
});

test("input column stays inside 35-40% until the max clamp", () => {
  for (const pane of [804, 1000, 1220, 1400]) {
    const column = enterColumnWidth(pane);
    const ratio = column / pane;
    assert.ok(ratio >= 0.35 && ratio <= 0.4, `${pane} -> ${column} (${ratio})`);
    assert.ok(column >= COLUMN_MIN && column <= COLUMN_MAX);
  }
  const wide = enterColumnWidth(2000);
  assert.equal(wide, COLUMN_MAX);
  assert.ok(wide / 2000 < COLUMN_RATIO);
});

test("wide panes leave a real swatch after the rail", () => {
  for (const width of [1024, 1440, 1920]) {
    const pane = enterPaneWidth(width, true);
    const column = enterColumnWidth(pane);
    assert.ok(pane - column > pane * 0.5, `${width} pane ${pane} column ${column}`);
    assert.equal(pane, width - railWidthFor(width));
  }
});

test("fluid type is monotonic in layout width and the hex fits the column", () => {
  let prev = 0;
  for (let width = 900; width <= 1920; width += 1) {
    const { digit } = enterFluid(width);
    assert.ok(digit >= prev, `${width} digit ${digit} < ${prev}`);
    prev = digit;
    if (width < WIDE_LAYOUT_MIN_WIDTH) continue;
    const pane = enterPaneWidth(width, true);
    const column = enterColumnWidth(pane);
    const inner = column - enterFluid(width).pad * 2;
    assert.ok(digit * 7 <= inner, `${width} digit ${digit} inner ${inner}`);
  }
});

function fakeStyled() {
  const props = new Map<string, string>();
  return {
    props,
    style: {
      setProperty: (name: string, value: string) => {
        props.set(name, value);
      },
      removeProperty: (name: string) => {
        const value = props.get(name) ?? "";
        props.delete(name);
        return value;
      },
    },
  };
}

test("applyDesktopStage zooms #root only below the floor and clears when released", () => {
  const html = fakeStyled();
  const root = fakeStyled();
  applyDesktopStage(desktopStage(1440, 900), html, root);
  assert.equal(html.props.get("--stage-w"), "1440px");
  assert.equal(html.props.get("--stage-h"), "900px");
  assert.equal(root.props.has("zoom"), false);

  applyDesktopStage(desktopStage(450, 360), html, root);
  assert.equal(html.props.get("--stage-w"), "900px");
  assert.equal(html.props.get("--stage-h"), "720px");
  assert.equal(root.props.get("zoom"), "0.5");
  assert.equal(root.props.get("width"), "900px");
  assert.equal(root.props.get("height"), "720px");

  assert.equal(applyDesktopStage(null, html, root), null);
  assert.equal(html.props.size, 0);
  assert.equal(root.props.size, 0);
});
