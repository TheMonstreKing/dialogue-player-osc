import { app, BrowserWindow, ipcMain, KeyboardInputEvent } from 'electron';
import path from 'node:path';
import fs from 'fs-extra'
import started from 'electron-squirrel-startup'; 
import OSC from 'osc-js';

//const OSC = require('osc-js')
 require('@electron/remote/main').initialize()

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
} 
 

console.log("Starting Main");

const plugin = new OSC.DatagramPlugin()
const osc = new OSC({
  discardLateMessages: false, /* ignores messages which timetags lie in the past */
  plugin: plugin /* used plugin for network communication */ 
}); 


let settingsJsonObj = {
	host: '127.0.0.1',
	port: 34000,
  resetInactiveTimeout: 30000,
	videoEndBufferTimeout: 1000,
  videoStartRapidBufferTimeout: 200,
  videoDefaultSpeed: 1,
}
const settingsPath = path.join(app.getAppPath().replace("resources/app.asar","").replace("resources\\app.asar",""), "/dialogue-settings.json");
if (!fs.existsSync(settingsPath))
{
  console.log("cannot find "+settingsPath+", creating file");
  const settingsJsonString = JSON.stringify(settingsJsonObj,null," ");
  fs.writeFileSync(settingsPath,settingsJsonString)

}
else 
{
  const contents = fs.readFileSync(settingsPath, 'utf-8') 
  console.log(contents);
  settingsJsonObj = JSON.parse(contents);
  console.log(settingsJsonObj);
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: true,
    webPreferences: {
      nodeIntegrationInWorker: true,
      nodeIntegration: true,
      contextIsolation: false, 
      sandbox: false, 
      webSecurity: false, 
      preload: path.join(__dirname, 'preload.js'),
      devTools: false,
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`), );
  }

  
  
//console.log("window test ",window);
//// testing networking 
 

  osc.on('/nav', (message:OSC.Message) => {  


    const messageArg = message.args[0];
    console.log("WE GET SIGNAL ",message)

    let keyCode = "";

    if (typeof messageArg === "string" && messageArg.length > 0)
    {
        switch(messageArg)
        {
          case "10": keyCode = "0"; break;
          case "11": keyCode = "-"; break;
          case "12": keyCode = "="; break;
          default: keyCode = messageArg[0]; break;
        }
    }


    mainWindow.webContents.sendInputEvent({
      type:"keyDown",
      keyCode:keyCode,
    } as KeyboardInputEvent) 

})
console.log("opening UDP with settings ",settingsJsonObj)
osc.open({host:settingsJsonObj.host, port:settingsJsonObj.port}) 

// additional tester for sending osc messages through UDP
/*
  const oscSender = setInterval(()=>{
  
  const message = new OSC.Message('/test/path',String(Math.floor(Math.random()*12+1)))
  osc.send(message,{host:'127.0.0.1',port:34000});
  console.log("message sent",message);

},4000)*/


////------------------

    require("@electron/remote/main").enable(mainWindow.webContents)
  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    osc.close();
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
 