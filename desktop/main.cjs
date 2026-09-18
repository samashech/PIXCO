const { app, BrowserWindow, Menu, screen } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
let mainWindow;
const stateFile = () => path.join(app.getPath("userData"), "window-state.json");
function loadState() {
  try {
    return JSON.parse(fs.readFileSync(stateFile(), "utf8"));
  } catch {
    return { width: 1440, height: 1000 };
  }
}
function createWindow() {
  const saved = loadState();
  const bounds = {
    width: Math.max(800, Math.min(2560, Number(saved.width) || 1440)),
    height: Math.max(640, Math.min(1600, Number(saved.height) || 1000)),
  };
  const visible = screen
    .getAllDisplays()
    .some(
      ({ workArea: a }) =>
        Number.isFinite(saved.x) &&
        Number.isFinite(saved.y) &&
        saved.x + 100 > a.x &&
        saved.x < a.x + a.width - 100 &&
        saved.y + 100 > a.y &&
        saved.y < a.y + a.height - 100,
    );
  if (visible) {
    bounds.x = saved.x;
    bounds.y = saved.y;
  }
  mainWindow = new BrowserWindow({
    ...bounds,
    minWidth: 800,
    minHeight: 640,
    title: "PIXCO — Tiny games. Big nostalgia.",
    icon: path.join(__dirname, "../dist/icon.png"),
    backgroundColor: "#171918",
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });
  for (const event of ["minimize", "hide", "blur"])
    mainWindow.on(event, () => {
      if (!mainWindow.webContents.isDestroyed())
        mainWindow.webContents.send("pixco:pause");
    });
  mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  mainWindow.once("ready-to-show", () => {
    if (saved.maximized) mainWindow.maximize();
    mainWindow.show();
  });
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  mainWindow.webContents.on("will-navigate", (event) => event.preventDefault());
  mainWindow.webContents.session.setPermissionRequestHandler(
    (_contents, _permission, callback) => callback(false),
  );
  mainWindow.webContents.session.webRequest.onBeforeRequest(
    { urls: ["http://*/*", "https://*/*"] },
    (_details, callback) => callback({ cancel: true }),
  );
  mainWindow.on("close", () => {
    try {
      fs.writeFileSync(
        stateFile(),
        JSON.stringify({
          ...mainWindow.getNormalBounds(),
          maximized: mainWindow.isMaximized(),
        }),
      );
    } catch {
      /* Gameplay remains available if desktop state cannot be saved. */
    }
  });
  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (input.type === "keyDown" && input.key === "F11") {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
      event.preventDefault();
    }
  });
  const template = [
    ...(process.platform === "darwin"
      ? [
          {
            label: "Pixco",
            submenu: [
              { role: "about" },
              { type: "separator" },
              { role: "hide" },
              { role: "hideOthers" },
              { role: "unhide" },
              { type: "separator" },
              { role: "quit" },
            ],
          },
        ]
      : []),
    {
      label: "Game",
      submenu: [
        { role: "reload" },
        { type: "separator" },
        { role: process.platform === "darwin" ? "close" : "quit" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "togglefullscreen" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
app.setName("Pixco");
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
  app.whenReady().then(createWindow);
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
