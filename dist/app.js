const projects=[{title:'The open water',image:'https://images.unsplash.com/photo-1541345141634-61212040fdc5?auto=format&fit=crop&w=2000&q=90',alt:'Aerial ocean waves',credit:'Ivan Bandura / Unsplash',source:'https://unsplash.com/photos/an-aerial-view-of-a-body-of-water-wQ00u_Un8Og'},{title:'After hours',image:'https://images.unsplash.com/photo-1608228070292-630a8d5bb239?auto=format&fit=crop&w=1600&q=90',alt:'A figure on a rainy city street at night',credit:'Lerone Pieters / Unsplash',source:'https://unsplash.com/photos/a-city-street-at-night-in-the-rain-CrHhvF8qotQ'},{title:'In the current',image:'https://images.unsplash.com/photo-1584034256047-741246c713e8?auto=format&fit=crop&w=2000&q=90',alt:'Abstract sea foam on dark water',credit:'Annie Spratt / Unsplash',source:'https://unsplash.com/photos/black-and-white-abstract-painting-ifwDtr-5exg'}];
const viewer=document.querySelector('#viewer');let current=0;function show(index){current=(index+projects.length)%projects.length;const p=projects[current];document.querySelector('#viewer-title').textContent=p.title;const image=document.querySelector('#viewer-image');image.src=p.image;image.alt=p.alt;const credit=document.querySelector('#image-credit');credit.textContent=p.credit;credit.href=p.source;document.querySelector('#position').textContent=`0${current+1} / 03`;}
document.querySelectorAll('[data-project]').forEach(button=>button.addEventListener('click',()=>{show(Number(button.dataset.project));viewer.showModal();document.body.style.overflow='hidden';}));
document.querySelector('#previous').onclick=()=>show(current-1);document.querySelector('#next').onclick=()=>show(current+1);viewer.addEventListener('keydown',event=>{if(event.key==='ArrowLeft')show(current-1);if(event.key==='ArrowRight')show(current+1)});document.querySelectorAll('dialog').forEach(dialog=>{dialog.querySelector('.close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>document.body.style.overflow='');dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}})});document.querySelector('#credits-open').onclick=()=>{document.querySelector('#credits').showModal();document.body.style.overflow='hidden';};

// Keep the intro optional: mouse, keyboard and navigation can dismiss it immediately.
const endIntro=()=>document.documentElement.classList.remove('intro-active');
document.querySelector('.intro-skip').addEventListener('click',endIntro);
document.addEventListener('keydown',event=>{if(event.key==='Escape'||event.key==='Tab')endIntro();});
document.addEventListener('focusin',event=>{if(!event.target.closest('.intro'))endIntro();});
const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
const revealTargets=document.querySelectorAll('.section-heading,.demo-note,.project,.about > .eyebrow,.about h2,.about p,.services,.about-symbol,.contact > .eyebrow,.contact h2,.contact-bottom,footer');
let revealObserver;
function setupReveals(){
  revealObserver?.disconnect();
  if(motionPreference.matches||!('IntersectionObserver' in window)){
    endIntro();revealTargets.forEach(element=>element.classList.remove('reveal'));return;
  }
  revealObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');revealObserver.unobserve(entry.target);}});
  },{threshold:0,rootMargin:'0px 0px -35px 0px'});
  revealTargets.forEach(element=>{
    // Never hide content already on screen, including a restored scroll position.
    if(element.getBoundingClientRect().top<innerHeight){element.classList.add('is-visible');}
    element.classList.add('reveal');revealObserver.observe(element);
  });
}
setupReveals();motionPreference.addEventListener('change',setupReveals);
