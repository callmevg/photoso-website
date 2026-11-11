import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, access, mkdtemp, rm, rmdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Script, runInNewContext } from "node:vm";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = new URL("./", import.meta.url);
const html = await readFile(new URL("index.html", root), "utf8");
const css = await readFile(new URL("styles.css", root), "utf8");
const js = await readFile(new URL("site.js", root), "utf8");

test("inline JavaScript parses", () => {
  for (const [, script] of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
    assert.doesNotThrow(() => new Script(script));
  }
  assert.doesNotThrow(() => new Script(js));
});

test("every local image exists", async () => {
  const paths = new Set([
    ...[...html.matchAll(/(?:src|href|data-phone|data-duo|data-ipad)="(assets\/[^"]+)"/g)].map(([, path]) => path),
    ...[...js.matchAll(/src: "(assets\/[^"]+)"/g)].map(([, path]) => path),
    "assets/social.jpg",
  ]);
  assert.equal(paths.size, 15);
  for (const path of paths) await access(fileURLToPath(new URL(path, root)));
});

test("theme override wins over the device theme and invalid values are ignored", () => {
  const [, script] = html.match(/<script>([\s\S]*?)<\/script>/);
  for (const [search, deviceDark, expected] of [
    ["?clawpilotTheme=light", true, "light"],
    ["?clawpilotTheme=dark", false, "dark"],
    ["", false, "light"],
    ["", true, "dark"],
    ["?clawpilotTheme=invalid", false, "light"],
  ]) {
    let actual;
    runInNewContext(script, {
      URLSearchParams,
      window: { location: { search }, matchMedia: () => ({ matches: deviceDark }) },
      document: { documentElement: { setAttribute: (_, value) => { actual = value; } } },
    });
    assert.equal(actual, expected);
  }
});
test("IDs are unique and local anchors resolve", () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(([, id]) => id);
  assert.equal(new Set(ids).size, ids.length);
  for (const [, id] of html.matchAll(/href="#([^"]+)"/g)) {
    assert.ok(ids.includes(id), `Missing anchor: ${id}`);
  }
});

test("all download CTAs use the verified app ID", () => {
  const urls = [...html.matchAll(/href="(https:\/\/apps\.apple\.com\/[^"]+)"/g)];
  assert.equal(urls.length, 4);
  for (const [, url] of urls) assert.ok(url.endsWith("/id6763928712"));
});

test("tabs have associated panels and one initial selection", () => {
  const tabs = [...html.matchAll(/<button[^>]+role="tab"[^>]+>/g)].map(([tag]) => tag);
  assert.equal(tabs.length, 4);
  assert.equal(tabs.filter(tag => tag.includes('aria-selected="true"')).length, 1);
  for (const tab of tabs) {
    const [, panel] = tab.match(/aria-controls="([^"]+)"/);
    const [, id] = tab.match(/id="([^"]+)"/);
    assert.ok(html.includes(`id="${panel}" role="tabpanel" aria-labelledby="${id}"`));
  }
});

test("safety and purchase disclosures remain present", () => {
  for (const disclosure of [
    "100 free swipes a day", "review and confirm", "Recently Deleted",
    "up to 30 days", "your other devices", "24 hours", "one-time Lifetime",
    "Free with in-app purchases",
  ]) assert.ok(html.includes(disclosure), `Missing disclosure: ${disclosure}`);
  assert.ok(css.includes("prefers-reduced-motion"));
});

test("component styles use theme tokens rather than literal colors", () => {
  const components = css.slice(css.indexOf("*, *::before"));
  assert.doesNotMatch(components, /#[\da-f]{3,8}\b|rgba?\(|hsla?\(/i);
});

test("each feature has all three real device screenshots", () => {
  for (const feature of ["library", "swipe", "pockets", "map"]) {
    for (const [device, prefix] of [["phone", "screen"], ["duo", "duo"], ["ipad", "ipad"]]) {
      const capture = feature === "pockets" && device !== "phone" ? "library" : feature;
      assert.ok(html.includes(`data-${device}="assets/${prefix}-${capture}.jpg"`));
    }
  }
  assert.equal((html.match(/data-device="[^"]+" aria-pressed="/g) || []).length, 3);
});

test("mobile conversion and motion controls are present", () => {
  assert.ok(html.includes('class="download-dock"'));
  assert.ok(html.includes('id="motion-toggle"'));
  assert.ok(html.includes('id="ascii-field" aria-hidden="true"'));
  assert.ok(html.includes('name="apple-itunes-app" content="app-id=6763928712"'));
  assert.ok(css.includes("safe-area-inset-bottom"));
  assert.ok(css.includes("horizontal-viewport-segments: 2"));
  assert.ok(js.includes("visibilitychange"));
  assert.ok(js.includes("IntersectionObserver"));
  assert.ok(js.includes("cancelAnimationFrame"));
});

test("the header is removed while the demo retains its motion control", () => {
  assert.doesNotMatch(html, /<header\b|class="site-header"|class="nav-download"/);
  assert.match(html, /class="demo-tools"[\s\S]*?id="motion-toggle"/);
});

test("download dock appears only after scrolling and handles restored scroll positions", () => {
  assert.ok(html.includes('class="download-dock" aria-label="Download Photoso" hidden'));
  const [setup] = js.match(/  const downloadDock = [\s\S]*?  updateDownloadDock\(\);/);
  const dock = {};
  const listeners = {};
  const window = {
    scrollY: 0,
    addEventListener: (event, callback, options) => {
      listeners[event] = callback;
      if (event === "scroll") assert.equal(options.passive, true);
    },
  };
  runInNewContext(setup, { document: { querySelector: () => dock }, window });
  assert.equal(dock.hidden, true);
  for (const [position, hidden] of [[1, false], [200, false], [0, true], [-20, true]]) {
    window.scrollY = position;
    listeners.scroll();
    assert.equal(dock.hidden, hidden);
  }
  window.scrollY = 150;
  listeners.pageshow();
  assert.equal(dock.hidden, false);
});

test("gallery-first positioning avoids an unverified download-size claim", () => {
  assert.ok(html.includes("Your next<br><em>favorite gallery."));
  assert.ok(html.includes("Free to download. Private by design."));
  assert.doesNotMatch(html, /(?:under|less than|&lt;|<)\s*10\s*MB/i);
});

test("swipe allowance is disclosed once, inside pricing rather than promotion", () => {
  const [pricing] = html.match(/<details id="pricing-details">[\s\S]*?<\/details>/);
  assert.ok(pricing.includes("100 free swipes a day"));
  assert.equal((html.match(/100 free swipes/g) || []).length, 1);
});

test("redundant decorative groups and unsupported AI-free claims are absent", () => {
  for (const removed of ["hero-coordinate", "orbit-photo", "orbit-spark", "demo-sticker", "quick-story", "peace-section", "closing-star", "tab-index", 'id="theme-toggle"']) {
    assert.ok(!html.includes(removed), `Removed presentation returned: ${removed}`);
  }
  assert.doesNotMatch(html, /\bAI-free\b|\bno AI\b/i);
  assert.ok(html.includes("Apple's on-device Vision"));
  assert.ok(html.includes("cloud AI service"));
});

test("script element references resolve after presentation cleanup", () => {
  for (const [, id] of js.matchAll(/getElementById\("([^"]+)"\)/g)) {
    assert.ok(html.includes(`id="${id}"`), `Missing script element: ${id}`);
  }
});

test("candid sample images have recorded licenses and a combined 400 KB budget", async () => {
  const credits = await readFile(new URL("ASSETS.md", root), "utf8");
  let bytes = 0;
  for (const name of ["camera-concert.jpg", "camera-pizza.jpg", "camera-dog.jpg"]) {
    assert.ok(credits.includes(name));
    bytes += (await stat(new URL(`assets/${name}`, root))).size;
  }
  assert.ok(credits.includes("https://unsplash.com/license"));
  assert.ok(credits.includes("https://www.pexels.com/license/"));
  assert.ok(bytes < 400_000, `Sample photos total ${bytes} bytes`);
});

test("Place Reveal is clearly illustrative, user-initiated, and accessible", () => {
  assert.ok(html.includes('id="place-reveal"'));
  assert.ok(html.includes("not an app recording"));
  assert.ok(html.includes('id="place-play" aria-pressed="false" disabled'));
  assert.ok(html.includes('id="place-status" role="status" aria-live="polite"'));
  assert.ok(html.includes("Save the reveal as a vertical video"));
  assert.doesNotMatch(html, /<video[^>]*autoplay/);
  for (const stage of ["country", "city", "pin", "photos"]) {
    assert.ok(js.includes(`key: "${stage}"`));
  }
});
test("standalone export embeds CSS, JavaScript, and all device image variants", async () => {
  const directory = await mkdtemp(join(tmpdir(), "photoso-site-test-"));
  const output = join(directory, "preview.html");
  try {
    await promisify(execFile)(process.execPath, [fileURLToPath(new URL("bundle.mjs", root)), output]);
    const bundle = await readFile(output, "utf8");
    assert.doesNotMatch(bundle, /href="styles\.css"|src="site\.js"|["']assets\//);
    for (const device of ["phone", "duo", "ipad"]) {
      assert.ok(bundle.includes(`data-${device}="data:image/jpeg;base64,`));
    }
    assert.ok(bundle.includes("Copyright (c) 2026 8B"));
    assert.ok(bundle.includes("Anthony DELANOIX"));
    assert.ok(bundle.includes("https://www.pexels.com/license/"));
    for (const [, script] of bundle.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
      assert.doesNotThrow(() => new Script(script));
    }
  } finally {
    await rm(output, { force: true });
    await rmdir(directory);
  }
});
