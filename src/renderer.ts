/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.ts` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */
 
//import videoSRC from "./P2.mp4"; 
import './style.css'; 

console.log("Browser console log");


const { ipcRenderer } = require('electron')
const remote = require('@electron/remote');    
const path = remote.require('node:path')
const fs = require('fs-extra');
const app = require('@electron/remote').app
//console.log(app.getAppPath());
 
window.addEventListener("cat",(event:any)=>{
  const message = event as MessageEvent;
  console.log("We receive an cat",message.data)
})

//
 

//console.log(app);

let basepath = "";
//var basepath = app.getAppPath();

const appDiv = document.getElementById("app") as HTMLDivElement;
const video = document.createElement("video"); 
const debugDiv = document.createElement("div");


const clipNumberArray:Array<number> = [];
const questionNumberArray:Array<number> = []; 

let maxClipId = 0;
let maxQuestionId = 0;


let debugStr = "";
let displayQuestions = false;
let previousKey = -1;
let currentKey = "1";
let currentQuestion = 0;
let currentClip = 0;
let videoExtension = ".mp4";
let changeVideoTimeout = false;
let videoStartRapidTimeout = false;
let videoStartPlaybackRate = 1;

let timeoutInterval:null |NodeJS.Timeout  = null;
let videoEndBufferTimeout:null |NodeJS.Timeout  = null; 
let videoStartBufferTimeout:null |NodeJS.Timeout = null;

let settingsJsonObj = { 
  resetInactiveTimeout: 30000,
	videoEndBufferTimeout: 1000,
  videoStartRapidBufferTimeout: 200,
  videoDefaultSpeed: 1,
}

const checkKey = (event:KeyboardEvent) => { 

  if (event.key === "Escape")
  {
    window.close();
  }

  const numberKey = Number(event.key)
  
  if (event.key === "z" || event.key === "Z")
  {
    displayQuestions = !displayQuestions;
    if (displayQuestions)
    {
      debugDiv.innerHTML = debugStr; 
    }
    else 
    {
      debugDiv.innerHTML = "";
    }
  }
  else if (videoEnded && !changeVideoTimeout)
  {
    if (!isNaN(numberKey))
    { 
      currentKey = event.key;

      if (numberKey === 0 && json.questions[currentQuestion].choices.length >= 10)
      {
        const currentClipId = json.questions[currentQuestion].choices[9].answer; 
        currentClip = clipNumberArray[currentClipId];
        playCurrentClip();

      }
      else if (numberKey-1 < json.questions[currentQuestion].choices.length)
      { 

        const currentClipId = json.questions[currentQuestion].choices[numberKey-1].answer; 
        currentClip = clipNumberArray[currentClipId];
        playCurrentClip();

      } 
    }
    else if (event.key === "-" && json.questions[currentQuestion].choices.length >= 11)
    {
      currentKey = event.key;
         const currentClipId = json.questions[currentQuestion].choices[10].answer; 
        currentClip = clipNumberArray[currentClipId];
        playCurrentClip();


    }
    else if ((event.key === "=" || event.key === "+" ) && json.questions[currentQuestion].choices.length >= 12)
    {
      currentKey = event.key;
              const currentClipId = json.questions[currentQuestion].choices[11].answer; 
        currentClip = clipNumberArray[currentClipId];
        playCurrentClip();


    }
  }
  else if (currentKey === event.key && !videoStartRapidTimeout)
  {
    video.playbackRate += 1;
  }
  
}
document.addEventListener("keydown",checkKey)


 //console.log("get app path 2",app.getAppPath().replace("resources\\app.asar","")); 
const videoPath =  path.join(app.getAppPath().replace("resources/app.asar","").replace("resources\\app.asar",""),"video/");

const jsonPath = videoPath +"dialog.json";
//console.log(jsonPath);
if (!fs.existsSync(jsonPath))
{
  console.log("cannot find "+jsonPath);
}
const contents = fs.readFileSync(jsonPath)
const json = JSON.parse(contents);
//console.log(json);

for (let i =0; i < json.clips.length; i++)
{
    const currentId = json.clips[i].id
  if (currentId > maxClipId)
  {maxClipId = currentId;}
    clipNumberArray[currentId] = i;
}
for (let i=0; i< json.questions.length;i++)
{
  const currentId = json.questions[i].id
    if (currentId > maxQuestionId)
    {maxQuestionId = currentId;}
    questionNumberArray[currentId] = i;
} 


const settingsPath = path.join(app.getAppPath().replace("resources/app.asar","").replace("resources\\app.asar",""), "/dialogue-settings.json");
if (!fs.existsSync(settingsPath))
{
  console.log("cannot find "+settingsPath);
}
else 
{
  const contents = fs.readFileSync(settingsPath, 'utf-8') 
  console.log(contents);
  settingsJsonObj = JSON.parse(contents);
  console.log(settingsJsonObj);
}


let smallestClipID = -1;
let smallestClipIndex = -1;
 

 
for (let i =0; i < json.clips.length; i++)
{
  const currentClip = json.clips[i];
  if (smallestClipID === -1 || currentClip.id < smallestClipID)
  {
    smallestClipID = currentClip.id;
    smallestClipIndex = i;
  }
}
currentClip = smallestClipIndex;
let currentVideoPath = videoPath + json.clips[smallestClipIndex].video.src+videoExtension;
if (!fs.existsSync(currentVideoPath))
{
  videoExtension = ".mov";
  currentVideoPath = videoPath + json.clips[smallestClipIndex].video.src+videoExtension;
  if (!fs.existsSync(currentVideoPath))
  {
      videoExtension = ".webm";
      currentVideoPath = videoPath + json.clips[smallestClipIndex].video.src+videoExtension;
    if (!fs.existsSync(currentVideoPath))
    {
      console.log("ERROR");
      console.log("Cannot find file "+videoPath + json.clips[smallestClipIndex].video.src+".mp4/ .mov/ .webm");
    }
  }
}
let videoEnded = false;
let next = "";
let nextType = 0;
let nextNumber = 0;
//console.log("dirname ",basepath);




const playCurrentClip = () => {
      
      videoStartRapidTimeout = true;

      videoStartBufferTimeout = setTimeout(()=>{
        videoStartRapidTimeout = false;
      },settingsJsonObj.videoStartRapidBufferTimeout)
      
      if (timeoutInterval != null)
      {
         clearTimeout(timeoutInterval); 
      }
      debugDiv.innerHTML = "";

      if (! (currentClip in json.clips))
      {

        console.log("Error: Next is undefined",currentClip);
        return false;
      }

      next = json.clips[currentClip].next;
      if (next === undefined)
      {
        console.log("Error: Next is undefined",currentClip);
        return false;
      } 
        //console.log("next is ", next)
        currentVideoPath = videoPath + json.clips[currentClip].video.src+videoExtension;
        
        if (!fs.existsSync(currentVideoPath))
        { 
            console.log("Error: File not found:",currentVideoPath,currentClip);
            debugStr += "<br/> NOT FOUND: "+currentVideoPath;
            return false;
        }
        video.setAttribute("src",currentVideoPath);
        video.playbackRate = settingsJsonObj.videoDefaultSpeed; 
        video.play();
        videoEnded = false;

        
        if (next.indexOf("question:") != -1)
        {
          nextType = 0;
          nextNumber = Number(next.replace("question:",""));
        }
        else if (next.indexOf("clip:") != -1)
        {
          nextType = 1;
          nextNumber = Number(next.replace("clip:",""));
        } 
 
}

playCurrentClip();


const videoEndEvent = (event:Event) => {
  if (nextType === 0)
  {
    videoEnded = true;
    changeVideoTimeout = true;
    videoEndBufferTimeout = setTimeout(()=>{
      changeVideoTimeout = false;
    },settingsJsonObj.videoEndBufferTimeout)
    currentQuestion = questionNumberArray[nextNumber];

    debugStr = "Question "+String(nextNumber) +"<br/>";

    const questionObj = json.questions[currentQuestion];

    for (let i=0; i < questionObj.choices.length; i++)
    {
      const choice = questionObj.choices[i];
      //console.log("a choice ",choice.strings)
      let displayString = "Choice 1 "+String(i+1);
      if (choice.strings["*"] != undefined)
      {displayString = choice.strings["*"];}
      else if (choice.strings.fr != undefined && choice.strings.fr.length > 0) 
      {
        displayString = choice.strings.fr;
      }
      else if (choice.strings.en != undefined && choice.strings.en.length > 0)
      {
        displayString = choice.strings.en;
      }
      else (choice.strings.fr != undefined && choice.strings.de.length > 0)
      {
        displayString = choice.strings.de;
      }
      debugStr += String(i+1)+". "+ displayString + " "+"("+ String(choice.answer) + ")<br/>";
    }

    if (displayQuestions)
    {
      debugDiv.innerHTML = debugStr; 
    }
    else 
    {
      debugDiv.innerHTML = "";
    }
      timeoutInterval = setTimeout(()=>{
       console.log("timeout")
      currentClip = smallestClipIndex;
      playCurrentClip();
    }
    ,settingsJsonObj.resetInactiveTimeout);

  }
  else if (nextType === 1)
  {
    currentClip = clipNumberArray[nextNumber];
    playCurrentClip();
  }
  //console.log("video ended waw");
}
 
video.addEventListener("ended",videoEndEvent);

//console.log(appDiv);
appDiv.style.width = "100vw";
appDiv.style.height = "100vh";
appDiv.style.display = "flex";
appDiv.style.justifyContent = "space-around";



appDiv.appendChild(video);



video.setAttribute("autoplay","true");
video.setAttribute("src",currentVideoPath);
video.setAttribute("type","video/mp4");
video.playbackRate = settingsJsonObj.videoDefaultSpeed; 
video.style.maxWidth = "100vw";
video.style.maxHeight = "100vh";




debugDiv.style.position = "absolute";

appDiv.appendChild(debugDiv);
debugDiv.style.width = "90vw"
debugDiv.style.margin = "3vw"
debugDiv.style.color = "#FFFFFF"; 
debugDiv.style.fontSize = "24px";



console.log(
  '👋 This message is being logged by "renderer.ts", included via Vite',
);
