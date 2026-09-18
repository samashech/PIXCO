import {chromium} from '@playwright/test';
import {existsSync} from 'node:fs';
const browser=await chromium.launch({executablePath:existsSync('/usr/bin/brave')?'/usr/bin/brave':undefined,headless:true,args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:1440,height:1000}});try{
 await page.goto('http://127.0.0.1:5173');await page.locator('.lcd-screen.powered').waitFor();
 await page.evaluate(()=>{Element.prototype.requestFullscreen=async()=>{throw new Error('Denied');};});await page.keyboard.press('Enter');await page.keyboard.press('KeyF');await page.waitForTimeout(250);
 console.log(await page.evaluate(()=>({immersive:document.querySelector('.lcd-stage').className,root:document.documentElement.dataset.lcdImmersive,rect:document.querySelector('.game-canvas').getBoundingClientRect().toJSON(),active:document.activeElement?.className})));
 await page.screenshot({path:'/tmp/pixco-fallback-inspect.png'});await page.keyboard.press('Escape');
 const themes=['Classic LCD','90s Electronic','Toy Store','Industrial','Paper / Manual','Terminal'];
 for(let i=0;i<themes.length;i++){
  await page.getByRole('button',{name:'Settings',exact:true}).click();await page.locator('.appearance-picker').getByRole('button',{name:new RegExp(themes[i])}).click();await page.getByRole('button',{name:'Home',exact:true}).click();await page.locator('.lcd-screen.powered').waitFor();await page.screenshot({path:`/tmp/pixco-material-${i}.png`});
 }
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/pixco-material-mobile.png'});await page.keyboard.press('KeyF');await page.waitForTimeout(300);await page.screenshot({path:'/tmp/pixco-material-mobile-full.png'});
}finally{await browser.close();}
