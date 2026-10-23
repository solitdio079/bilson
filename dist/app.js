import {validateContent,videoSource} from './media.js';
let items=[],current=0,active=[];const viewer=document.querySelector('#viewer');
const el=(tag,text,className)=>{const node=document.createElement(tag);if(text)node.textContent=text;if(className)node.className=className;return node;};
function show(index){
 current=(index+active.length)%active.length;const item=active[current];const container=document.querySelector('#viewer-media');container.replaceChildren();
 if(item.type==='photo'){const image=el('img');image.src=item.src;image.alt=item.alt||item.title;container.append(image);}
 else{const source=videoSource(item.src);const media=el(source.type==='embed'?'iframe':'video');media.src=source.src;
 if(source.type==='embed'){media.src+=(media.src.includes('?')?'&':'?')+(new URL(media.src).hostname==='www.youtube-nocookie.com'?'mute=1':'muted=1');media.title=item.title;media.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';media.referrerPolicy='strict-origin-when-cross-origin';media.allowFullscreen=true;}
 else{media.muted=true;media.controls=true;media.playsInline=true;media.preload='metadata';media.poster=item.poster;}container.append(media);}
 document.querySelector('#viewer-title').textContent=item.title;document.querySelector('#viewer-kind').textContent=`${item.type==='photo'?'PHOTOGRAPHY':'FILM'}${item.sample?' / SAMPLE IMAGE':''}`;
 document.querySelector('#viewer-description').textContent=item.caption;const credit=document.querySelector('#image-credit');credit.textContent=item.credit;credit.hidden=!item.credit;if(item.creditUrl)credit.href=item.creditUrl;else credit.removeAttribute('href');
 document.querySelector('#position').textContent=`${current+1} / ${active.length}`;
}
function render(){
 for(const type of ['photo','video']){const subset=items.filter(i=>i.type===type);const track=document.querySelector(type==='photo'?'#photos':'#videos');track.replaceChildren();
 if(!subset.length){track.append(el('p',type==='photo'?'Photographs coming soon.':'Films coming soon.','empty-gallery'));}
 subset.forEach((item,index)=>{const button=el('button',null,'project carousel-card');button.setAttribute('aria-label',`View ${item.title}`);const wrap=el('div',null,'image-wrap');const img=el('img');img.src=item.type==='photo'?item.src:item.poster;img.alt=item.alt||item.title;img.loading='lazy';img.addEventListener('error',()=>{img.hidden=true;wrap.append(el('span','Media preview unavailable','media-error'));},{once:true});wrap.append(img,el('span',item.type==='photo'?'VIEW FRAME ↗':'PLAY FILM ▷','view'),el('span',String(index+1).padStart(2,'0'),'image-num'));
 const caption=el('div',null,'project-caption');caption.append(el('h3',item.title),el('span',item.sample?'SAMPLE IMAGE':type.toUpperCase()));button.append(wrap,caption);button.onclick=()=>{active=subset;show(index);viewer.showModal();document.body.style.overflow='hidden';};track.append(button);});
 document.querySelectorAll(`[data-move^="${track.id}:"]`).forEach(b=>b.disabled=subset.length<2);
 }
 document.querySelector('#work-count').textContent=String(items.length).padStart(2,'0');document.querySelector('.demo-note').hidden=!items.some(i=>i.sample);
 const heroMedia=document.querySelector('.hero-image');
 if(heroMedia.tagName!=='VIDEO'){
 const hero=items.find(i=>i.type==='photo');if(hero){heroMedia.src=hero.src;heroMedia.alt=hero.alt||hero.title;document.querySelector('.frame-label').textContent='FRAME 001 — '+hero.title.toUpperCase();}else{heroMedia.hidden=true;document.querySelector('.frame-label').textContent='BILSON — STILLS / MOTION';}
 }

 const list=document.querySelector('#credits ul');list.replaceChildren();items.filter(i=>i.credit).forEach(i=>{const li=el('li');const credit=el(i.creditUrl?'a':'span',`${i.credit} — ${i.title}`);if(i.creditUrl){credit.href=i.creditUrl;credit.target='_blank';credit.rel='noopener noreferrer';}li.append(credit);list.append(li);});
 document.querySelector('#credits p').textContent=items.some(i=>i.sample)?'Images marked as samples illustrate the design and are not work created by Bilson.':'Credits for the photographs and films in this portfolio.';
 document.querySelector('#credits p:last-child').textContent='';
}
async function load(){try{const response=await fetch('/content.json',{cache:'no-cache'});if(!response.ok)throw Error();items=validateContent(await response.json()).items;render();}catch{document.querySelector('#gallery-status').textContent='The portfolio could not load. Please refresh to try again.';}}
document.querySelectorAll('[data-move]').forEach(button=>button.onclick=()=>{const [id,direction]=button.dataset.move.split(':');const track=document.getElementById(id);track.scrollBy({left:Number(direction)*track.clientWidth*.85,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});
document.querySelector('#previous').onclick=()=>show(current-1);document.querySelector('#next').onclick=()=>show(current+1);viewer.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')show(current-1);if(e.key==='ArrowRight')show(current+1);});
viewer.addEventListener('close',()=>document.querySelector('#viewer-media').replaceChildren());
document.querySelectorAll('dialog').forEach(dialog=>{dialog.querySelector('.close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>document.body.style.overflow='');dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))dialog.close();});});
document.querySelector('#credits-open').onclick=()=>{document.querySelector('#credits').showModal();document.body.style.overflow='hidden';};load();

const heroVideo=document.querySelector('.hero-video');
const heroToggle=document.querySelector('.hero-video-toggle');
const soundToggle=document.querySelector('.hero-sound-toggle');
if(heroVideo&&heroToggle&&soundToggle){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const sync=()=>{
  heroToggle.textContent=heroVideo.paused?'PLAY VIDEO ▷':'PAUSE VIDEO Ⅱ';
  heroToggle.setAttribute('aria-label',heroVideo.paused?'Play background video':'Pause background video');
  const audible=!heroVideo.muted&&heroVideo.volume>0;
  soundToggle.textContent=audible?'SOUND ON ♫':'ENABLE SOUND ♫';
  soundToggle.setAttribute('aria-label',audible?'Mute background video':'Enable background video sound');
  soundToggle.setAttribute('aria-pressed',String(audible));
 };
 const start=async()=>{
  try{await heroVideo.play();}catch{
   // Browsers can block autoplay with audio until a user gesture.
   heroVideo.muted=true;
   try{await heroVideo.play();}catch{/* The play button remains available. */}
  }sync();
 };
 heroVideo.muted=false;heroVideo.volume=1;
 heroVideo.addEventListener('play',sync);heroVideo.addEventListener('pause',sync);heroVideo.addEventListener('volumechange',sync);
 heroToggle.addEventListener('click',()=>{if(heroVideo.paused)start();else heroVideo.pause();});
 soundToggle.addEventListener('click',()=>{
  heroVideo.muted=!(heroVideo.muted||heroVideo.volume===0);
  if(!heroVideo.muted){heroVideo.volume=1;start();}sync();
 });
 const preference=()=>{if(reduced.matches){heroVideo.autoplay=false;heroVideo.pause();}else{heroVideo.autoplay=true;start();}sync();};
 reduced.addEventListener('change',preference);preference();
}
