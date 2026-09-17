import { _electron as electron } from "@playwright/test";
import assert from "node:assert/strict";
import path from "node:path";
const launch = () =>
  electron.launch({
    ...(process.argv.includes("--packaged")
      ? { executablePath: path.resolve("release/linux-unpacked/brickbox") }
      : {}),
    args: [
      "--no-sandbox",
      "--user-data-dir=/tmp/brickbox-native-check",
      ...(process.argv.includes("--packaged") ? [] : [path.resolve(".")]),
    ],
    timeout: 30000,
  });
let app;
try {
  app = await launch();
  const page = await app.firstWindow();
  await page.locator(".lcd-screen.powered").waitFor();
  assert.match(await page.title(), /BRICKBOX/);
  await page.evaluate(() => localStorage.removeItem("brickbox.v1"));
  await page.reload();
  await page.locator(".lcd-screen.powered").waitFor();
  await page.keyboard.press("Enter");
  await page.keyboard.press("KeyX");
  await page.waitForTimeout(250);
  assert.ok(Number(await page.getByTestId("lcd-score").textContent()) > 0);
  await page.keyboard.press("KeyP");
  await page
    .getByRole("button", { name: "Favorite Falling Blocks", exact: true })
    .first()
    .click();
  const before = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("brickbox.v1")),
  );
  assert.ok(before.stats["001"].highScore > 0);
  await app.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0].setSize(1100, 850),
  );
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await page.locator(".game-canvas").focus();
  await page.keyboard.press("Enter");
  await app.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0].hide(),
  );
  await page.waitForTimeout(250);
  await app.evaluate(({ BrowserWindow }) => {
    const w = BrowserWindow.getAllWindows()[0];
    w.show();
    w.focus();
  });
  await page.waitForTimeout(250);
  assert.match(await page.locator(".lcd-overlay").textContent(), /PAUSED/);
  await page.screenshot({ path: "/tmp/brickbox-native.png" });
  await page.evaluate(() => {
    window.dispatchEvent(new Event("pagehide"));
  });
  const savedBounds = await app.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0].getSize(),
  );
  const statePath = await app.evaluate(({ app }) => app.getPath("userData"));
  await app.close();
  app = await launch();
  const restored = await app.firstWindow();
  await restored.locator(".lcd-screen.powered").waitFor();
  const after = await restored.evaluate(() =>
    JSON.parse(localStorage.getItem("brickbox.v1")),
  );
  assert.ok(after.favorites.includes("001"));
  assert.ok(after.stats["001"].highScore >= before.stats["001"].highScore);
  const bounds = await app.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0].getSize(),
  );
  assert.equal(bounds[0], savedBounds[0]);
  assert.equal(bounds[1], savedBounds[1]);
  console.log(
    `PASS: Electron startup, local gameplay, score/favorite persistence, hide auto-pause, and window-size restoration. Test data: ${statePath}`,
  );
} finally {
  await app?.close();
}
