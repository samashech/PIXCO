import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { existsSync, writeFileSync } from "node:fs";
const url = process.env.PIXCO_URL || "http://127.0.0.1:5173";
const browser = await chromium.launch({
  executablePath:
    process.env.PIXCO_BROWSER ||
    (existsSync("/usr/bin/brave") ? "/usr/bin/brave" : undefined),
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  }),
  page = await context.newPage();
page.setDefaultTimeout(12000);
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const titles = [
  "Falling Blocks",
  "Snake",
  "Brick Breaker",
  "Highway Racer",
  "Space Shooter",
  "Maze Runner",
  "Pocket Pong",
  "Pixel Dodger",
  "Shifting Bricks",
  "Memory Loop",
];
const sleep = (ms) => page.waitForTimeout(ms);
const read = () =>
  page.evaluate(() => JSON.parse(localStorage.getItem("pixco.v1")));
const score = async () =>
  Number(await page.getByTestId("lcd-score").textContent());
async function fullScreenCheck() {
  const info = await page.locator(".game-canvas").evaluate((canvas) => {
    const rect = canvas.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      ratio: canvas.width / canvas.height,
      style: getComputedStyle(canvas).imageRendering,
      x: rect.x,
      y: rect.y,
      screenWidth: innerWidth,
      screenHeight: innerHeight,
    };
  });
  assert.ok(
    Math.abs(info.width / info.height - info.ratio) < 0.005,
    "preserved aspect ratio",
  );
  assert.equal(info.style, "pixelated");
  assert.ok(info.width > 120 && info.height > 190, "game becomes larger");
  assert.ok(
    info.x >= 0 &&
      info.y >= 0 &&
      info.x + info.width <= info.screenWidth + 0.5 &&
      info.y + info.height <= info.screenHeight + 0.5,
    `game stays in viewport: ${JSON.stringify(info)}`,
  );
  assert.equal(
    await page
      .locator(".device-heading")
      .evaluate((el) => getComputedStyle(el).visibility),
    "hidden",
  );
  assert.equal(
    await page
      .locator(".main-controls")
      .evaluate((el) => getComputedStyle(el).visibility),
    "hidden",
  );
  assert.equal(
    await page
      .locator(".lcd-screen")
      .evaluate((el) => getComputedStyle(el).visibility),
    "visible",
  );
  return info;
}
try {
  await page.goto(url);
  await page.locator(".lcd-screen.powered").waitFor();
  await page.getByLabel("Difficulty", { exact: true }).selectOption("hard");
  await sleep(100);
  assert.match(
    await page.locator(".lcd-difficulty-label").textContent(),
    /HARD/,
  );
  await page.locator(".game-canvas").focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("KeyX");
  await page.keyboard.press("KeyP");
  await sleep(100);
  const hardScore = await score();
  assert.ok(hardScore > 0);
  assert.equal((await read()).records["001"].hard.highScore, hardScore);
  await page.getByLabel("Difficulty", { exact: true }).selectOption("easy");
  await sleep(100);
  assert.equal(await score(), 0);
  assert.equal(await page.locator(".lcd-overlay.ready").count(), 1);
  await page.locator(".game-canvas").focus();
  await page.keyboard.press("Enter");
  for (let i = 0; i < 3; i++) await page.keyboard.press("KeyX");
  await page.keyboard.press("KeyP");
  await sleep(100);
  assert.equal((await read()).records["001"].hard.highScore, hardScore);
  assert.ok((await read()).records["001"].easy.highScore > hardScore);
  const before = await score();
  const played = (await read()).stats["001"].played;
  await page.keyboard.press("KeyF");
  await page.locator(".lcd-stage.immersive").waitFor();
  await sleep(200);
  assert.equal(
    await page.evaluate(() =>
      document.fullscreenElement?.classList.contains("lcd-stage"),
    ),
    true,
  );
  await fullScreenCheck();
  assert.equal(await score(), before);
  assert.equal((await read()).stats["001"].played, played);
  await page.screenshot({ path: "/tmp/pixco-lcd-fullscreen.png" });
  await page.keyboard.press("Escape");
  await page.locator(".lcd-stage:not(.immersive)").waitFor();
  assert.match(await page.locator(".lcd-overlay").textContent(), /PAUSED/);
  assert.equal(await score(), before);
  assert.equal(
    await page
      .locator(".device-heading")
      .evaluate((el) => getComputedStyle(el).visibility),
    "visible",
  );
  // One keydown must render synchronously; no OS repeats are supplied during the hold.
  await page.keyboard.press("KeyR");
  const latency = await page.evaluate(() => {
    const canvas = document.querySelector(".game-canvas"),
      ctx = canvas.getContext("2d");
    let paintedAt = 0;
    const original = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function (...args) {
      if (this.canvas === canvas) paintedAt = performance.now();
      return original.apply(this, args);
    };
    const before = canvas.toDataURL(),
      start = performance.now();
    canvas.dispatchEvent(
      new KeyboardEvent("keydown", { code: "ArrowLeft", bubbles: true }),
    );
    const changed = before !== canvas.toDataURL();
    CanvasRenderingContext2D.prototype.drawImage = original;
    return { changed, latencyMs: paintedAt - start };
  });
  assert.ok(latency.changed, "input changes pixels within its event");
  assert.ok(
    latency.latencyMs >= 0 && latency.latencyMs < 50,
    "bounded event-to-paint latency",
  );
  const first = await page
    .locator(".game-canvas")
    .evaluate((c) => c.toDataURL());
  await sleep(210);
  const held = await page
    .locator(".game-canvas")
    .evaluate((c) => c.toDataURL());
  assert.notEqual(first, held, "held input repeats without OS repeat");
  await page.keyboard.up("ArrowLeft");
  await page.keyboard.press("KeyR");
  const cadence = await page.evaluate(async () => {
    const times = [];
    let last = 0;
    await new Promise((resolve) => {
      const tick = (now) => {
        if (last) times.push(now - last);
        last = now;
        if (times.length < 120) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
    times.sort((a, b) => a - b);
    return { median: times[60], p95: times[114], max: times.at(-1) };
  });
  const statuses = [];
  for (let i = 0; i < titles.length; i++) {
    await page
      .getByRole("button", { name: "All games", exact: true })
      .first()
      .click();
    await page
      .getByRole("button", { name: `Play ${titles[i]}`, exact: true })
      .click();
    await page.locator(".lcd-screen.powered").waitFor();
    for (const difficulty of ["easy", "normal", "hard"]) {
      await page
        .getByLabel("Difficulty", { exact: true })
        .selectOption(difficulty);
      await sleep(50);
      assert.equal(await score(), 0);
      await page.locator(".game-canvas").focus();
      await page.keyboard.press("Enter");
      await page.keyboard.press("ArrowLeft");
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("KeyZ");
      await sleep(80);
      assert.equal(
        await page.locator(".lcd-overlay").count(),
        0,
        `${titles[i]} ${difficulty} plays`,
      );
      await page.keyboard.press("KeyP");
      assert.match(await page.locator(".lcd-overlay").textContent(), /PAUSED/);
      await page.keyboard.press("KeyR");
      assert.equal(await score(), 0);
      await page.keyboard.press("KeyP");
    }
    await page.keyboard.press("KeyF");
    await page.locator(".lcd-stage.immersive").waitFor();
    await sleep(120);
    const dims = await fullScreenCheck();
    await page.setViewportSize({ width: 1000, height: 700 });
    await sleep(100);
    await fullScreenCheck();
    await page.keyboard.press("Escape");
    await page.locator(".lcd-stage:not(.immersive)").waitFor();
    assert.match(await page.locator(".lcd-overlay").textContent(), /PAUSED/);
    await page.setViewportSize({ width: 1440, height: 1000 });
    statuses.push({
      game: titles[i],
      fullscreenBoard: [dims.width, dims.height],
    });
    console.log(
      `PASS ${titles[i]}: all difficulties, pause/restart, fullscreen and resize`,
    );
  }
  // Simulate denied fullscreen: the same LCD takes the viewport without native support.
  await page.evaluate(() => {
    Element.prototype.requestFullscreen = async () => {
      throw new Error("Fullscreen denied");
    };
  });
  await page.keyboard.press("KeyF");
  await page.locator(".lcd-stage.immersive").waitFor();
  await sleep(150);
  assert.equal(await page.evaluate(() => document.fullscreenElement), null);
  await fullScreenCheck();
  await page.screenshot({ path: "/tmp/pixco-lcd-fallback.png" });
  await page.keyboard.press("Escape");
  await page.locator(".lcd-stage:not(.immersive)").waitFor();
  const themeNames = [
    "Classic LCD",
    "90s Electronic",
    "Toy Store",
    "Industrial",
    "Paper / Manual",
    "Terminal",
  ];
  const themeIds = [
    "classic",
    "electronic",
    "toy-store",
    "industrial",
    "paper",
    "terminal",
  ];
  const signatures = [];
  for (let i = 0; i < themeNames.length; i++) {
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page
      .locator(".appearance-picker")
      .getByRole("button", {
        name: new RegExp(themeNames[i].replace("/", "\\/")),
      })
      .click();
    assert.equal(
      await page.locator("html").getAttribute("data-appearance"),
      themeIds[i],
    );
    await page.getByRole("button", { name: "Home", exact: true }).click();
    await page.locator(".lcd-screen.powered").waitFor();
    await page.screenshot({ path: `/tmp/pixco-theme-${themeIds[i]}.png` });
    signatures.push(
      await page.evaluate(() => {
        const device = getComputedStyle(document.querySelector(".device"));
        return [
          device.backgroundColor,
          device.borderRadius,
          getComputedStyle(document.querySelector("h2")).fontFamily,
        ].join("|");
      }),
    );
  }
  assert.equal(new Set(signatures).size, 6);
  await page.reload();
  await page.locator(".lcd-screen.powered").waitFor();
  assert.equal(
    await page.locator("html").getAttribute("data-appearance"),
    "terminal",
  );
  assert.equal(
    await page.getByLabel("Difficulty", { exact: true }).inputValue(),
    "hard",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "/tmp/pixco-updated-mobile.png",
    fullPage: true,
  });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.keyboard.press("KeyF");
  await page.locator(".lcd-stage.immersive").waitFor();
  await sleep(120);
  await fullScreenCheck();
  await page.screenshot({ path: "/tmp/pixco-lcd-mobile.png" });
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 844, height: 390 });
  await page.keyboard.press("KeyF");
  await page.locator(".lcd-stage.immersive").waitFor();
  await sleep(120);
  await fullScreenCheck();
  await page.screenshot({ path: "/tmp/pixco-lcd-landscape.png" });
  await page.keyboard.press("Escape");
  assert.deepEqual(errors, []);
  writeFileSync(
    "/tmp/pixco-upgrade-metrics.json",
    JSON.stringify(
      { latency, cadence, games: statuses, themes: themeIds },
      null,
      2,
    ),
  );
  console.log(
    "PASS fullscreen native/fallback/escape; state preserved; 30 difficulty runs; isolated records; six themes; mobile/landscape.",
  );
  console.log(JSON.stringify({ latency, cadence }));
} finally {
  await browser.close();
}
