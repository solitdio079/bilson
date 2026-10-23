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
