import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
const production = process.argv.includes("--production");
const url =
  process.env.PIXCO_URL ||
  (production ? "http://127.0.0.1:4173" : "http://127.0.0.1:5173");
const executable =
  process.env.PIXCO_BROWSER ||
  (existsSync("/usr/bin/brave") ? "/usr/bin/brave" : undefined);
const browser = await chromium.launch({
  executablePath: executable,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
  }),
  page = await context.newPage();
page.setDefaultTimeout(15000);
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
try {
  if (!existsSync("public/icon.png")) {
    const iconPage = await context.newPage();
    await iconPage.setViewportSize({ width: 512, height: 512 });
    await iconPage.goto(`${url}/icon.svg`);
    await iconPage.screenshot({
      path: "public/icon.png",
      omitBackground: true,
    });
    await iconPage.close();
  }
  await page.goto(url);
  if (production) {
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.reload();
    await context.setOffline(true);
    await page.reload();
    await page.locator(".lcd-screen.powered").waitFor();
    console.log("Production app reloaded offline successfully.");
  }
  await page.locator(".lcd-screen.powered").waitFor();
  await page.waitForTimeout(350);
  await page.screenshot({ path: "/tmp/pixco-desktop.png", fullPage: true });
  assert.equal(await page.locator(".game-card").count(), 10);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(150);
  assert.equal(await page.locator(".lcd-overlay").count(), 0);
  await page.keyboard.press("KeyX");
  await page.waitForTimeout(150);
  assert.ok(Number(await page.getByTestId("lcd-score").textContent()) > 0);
  await page.keyboard.press("KeyP");
  await page.waitForTimeout(150);
  assert.match(await page.locator(".lcd-overlay").textContent(), /PAUSED/);
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("pixco.v1")),
  );
  assert.ok(saved.stats["001"].highScore > 0);
  await page.keyboard.press("KeyR");
  await page.waitForTimeout(150);
  assert.equal(Number(await page.getByTestId("lcd-score").textContent()), 0);
  await page
    .getByRole("button", { name: "Favorite Falling Blocks", exact: true })
    .first()
    .click();
  await page.reload();
  await page.locator(".lcd-screen.powered").waitFor();
  assert.ok(
    (await page
      .getByRole("button", { name: "Unfavorite Falling Blocks", exact: true })
      .count()) > 0,
  );
  await page
    .getByRole("button", { name: "All games", exact: false })
    .first()
    .click();
  await page.getByRole("textbox", { name: "Search games" }).fill("race");
  assert.equal(await page.locator(".game-card").count(), 1);
  assert.match(
    await page.locator(".card-title").textContent(),
    /Highway Racer/,
  );
  await page.getByRole("textbox", { name: "Search games" }).fill("002");
  assert.equal(await page.locator(".game-card").count(), 1);
  await page.getByRole("textbox", { name: "Search games" }).fill("");
  await page
    .locator(".category-tabs")
    .getByRole("button", { name: "Puzzle", exact: true })
    .click();
  assert.equal(await page.locator(".game-card").count(), 3);
  await page
    .locator(".category-tabs")
    .getByRole("button", { name: "All games", exact: true })
    .click();
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
  for (const title of titles) {
    console.log(`Checking ${title}`);
    await page
      .getByRole("button", { name: `Play ${title}`, exact: true })
      .first()
      .click();
    await page.locator(".lcd-screen.powered").waitFor();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(120);
    assert.equal(
      await page.locator(".lcd-overlay").count(),
      0,
      `${title} started`,
    );
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("KeyZ");
    await page.waitForTimeout(200);
    await page.keyboard.press("KeyP");
    await page.waitForTimeout(100);
    assert.match(
      await page.locator(".lcd-overlay").textContent(),
      /PAUSED/,
      `${title} paused`,
    );
    await page.keyboard.press("Escape");
    await page.locator(".game-card").first().waitFor();
  }
  await page
    .getByRole("button", { name: "Favorites", exact: false })
    .first()
    .click();
  assert.equal(await page.locator(".game-card").count(), 1);
  await page
    .getByRole("button", { name: "Recently played", exact: true })
    .click();
  assert.equal(await page.locator(".game-card").count(), 10);
  await page.getByRole("button", { name: "Statistics", exact: true }).click();
  assert.equal(await page.locator("tbody tr").count(), 10);
  assert.ok((await page.locator(".history-list>div").count()) >= 10);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: /Amber/ }).click();
  assert.equal(
    await page
      .locator(".settings-preview .game-preview")
      .getAttribute("data-theme"),
    "amber",
  );
  await page.getByRole("checkbox", { name: /Mute sound/ }).check();
  assert.equal(
    (await page.evaluate(() => JSON.parse(localStorage.getItem("pixco.v1"))))
      .settings.muted,
    true,
  );
  await page.getByRole("button", { name: "Remap a", exact: true }).click();
  await page.keyboard.press("KeyQ");
  assert.equal(
    (await page.evaluate(() => JSON.parse(localStorage.getItem("pixco.v1"))))
      .settings.mappings.a,
    "KeyQ",
  );
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Export settings" }).click(),
  ]);
  assert.equal(download.suggestedFilename(), "pixco-settings.json");
  await page.locator("input[type=file]").setInputFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":1,"settings":{"master":999}}'),
  });
  await page.getByRole("status").filter({ hasText: "out of range" }).waitFor();
  await page
    .getByRole("button", { name: "Restore all default settings" })
    .click();
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await page.locator(".lcd-screen.powered").waitFor();
  await page.getByRole("textbox", { name: "Search games" }).fill("snake");
  await page.keyboard.press("KeyZ");
  assert.equal(await page.locator(".lcd-overlay.ready").count(), 1);
  await page.getByRole("textbox", { name: "Search games" }).fill("");
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.screenshot({ path: "/tmp/pixco-tablet.png", fullPage: true });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "tablet no horizontal overflow",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "/tmp/pixco-mobile.png", fullPage: true });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "mobile no horizontal overflow",
  );
  await page
    .getByRole("button", { name: "Start / pause", exact: false })
    .first()
    .count();
  await page.screenshot({ path: "/tmp/pixco-mobile-viewport.png" });
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.screenshot({
    path: "/tmp/pixco-settings-mobile.png",
    fullPage: true,
  });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "settings no horizontal overflow",
  );
  assert.deepEqual(errors, []);
  await context.setOffline(false);
  const fallbackContext = await browser.newContext();
  await fallbackContext.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("Unavailable");
      },
    });
    Object.defineProperty(navigator, "getGamepads", {
      value() {
        throw new Error("Unavailable");
      },
    });
    Object.defineProperty(window, "AudioContext", {
      value: class {
        constructor() {
          throw new Error("Unavailable");
        }
      },
    });
  });
  const fallback = await fallbackContext.newPage();
  await fallback.goto(url);
  await fallback.locator(".lcd-screen.powered").waitFor();
  await fallback.keyboard.press("Enter");
  await fallback.keyboard.press("KeyX");
  await fallback.waitForTimeout(200);
  assert.ok(Number(await fallback.getByTestId("lcd-score").textContent()) > 0);
  assert.match(
    await fallback.locator(".storage-notice").textContent(),
    /unavailable/,
  );
  await fallbackContext.close();
  console.log(
    "Optional API failures: gameplay works without storage, audio, or gamepad.",
  );
  console.log(
    "PASS: 10 game launches + keyboard play/pause/menu; scoring; persisted favorites and records; search/category filters; recent/history; settings/remapping/export/import; desktop/tablet/mobile layouts. No browser errors.",
  );
} finally {
  await browser.close();
}
