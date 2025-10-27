// electron.js
const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

console.log('Electron main process starting...'); // <-- ADD LOG

function createWindow() {
  console.log('Creating main window...'); // <-- ADD LOG

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      // preload: path.join(__dirname, 'preload.js')
    },
  });

  // Load the index.html of the app.
  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, 'out/index.html')}`;

  console.log(`Loading URL: ${startUrl}`); // <-- ADD LOG

  mainWindow.loadURL(startUrl)
    .then(() => {
      console.log('URL loaded successfully.'); // <-- ADD LOG
    })
    .catch(err => {
      console.error('Failed to load URL:', err); // <-- ADD ERROR LOG
    });

  // Open the DevTools automatically if in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    console.log('Main window closed.'); // <-- ADD LOG
  });
}

app.on('ready', () => { // <-- Use 'ready' event for more reliability
  console.log('App is ready.'); // <-- ADD LOG
  createWindow();
});


app.on('window-all-closed', function () {
  console.log('All windows closed.'); // <-- ADD LOG
  if (process.platform !== 'darwin') {
    console.log('Quitting app...'); // <-- ADD LOG
    app.quit();
  }
});

app.on('activate', function () {
  console.log('App activated.'); // <-- ADD LOG
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

console.log('Electron main process script loaded.'); // <-- ADD LOG