export function mediaURL(value) {
  if(/^\/assets\/uploads\/[a-f0-9]{32}\.(jpg|png|gif|webp)$/.test(value))return {href:value};
  const url=new URL(value);
  if(url.protocol!=='https:'||url.username||url.password)throw new Error('Use a public HTTPS media link.');
  return url;
}
export function videoSource(value) {
  const url=mediaURL(value);const host=url.hostname.toLowerCase();let id;
  if(['youtube.com','www.youtube.com','m.youtube.com','youtu.be'].includes(host)) {
    id=host==='youtu.be'?url.pathname.slice(1):url.searchParams.get('v')||url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1];
    if(!/^[\w-]{11}$/.test(id||''))throw new Error('Use a valid YouTube video link.');
    return {type:'embed',src:`https://www.youtube-nocookie.com/embed/${id}`};
  }
  if(['vimeo.com','www.vimeo.com','player.vimeo.com'].includes(host)) {
    const parts=url.pathname.split('/').filter(Boolean);id=parts.find(p=>/^\d+$/.test(p));
    if(!id)throw new Error('Use a valid Vimeo video link.');
    const hash=url.searchParams.get('h')||parts[parts.indexOf(id)+1];
    return {type:'embed',src:`https://player.vimeo.com/video/${id}${hash&&/^[a-zA-Z0-9]+$/.test(hash)?'?h='+hash:''}`};
  }
  if(/\.(mp4|webm|ogv)$/i.test(url.pathname))return {type:'video',src:url.href};
  throw new Error('Use a YouTube, Vimeo, or direct MP4/WebM/OGV link.');
}
export function validateContent(input) {
  if(!input||input.version!==1||!Array.isArray(input.items)||input.items.length>100)throw new Error('Content must contain up to 100 items.');
  const text=(v,max=300)=>{if(typeof v!=='string'||v.length>max)throw new Error('Invalid or too-long text field.');return v.trim();};
  const optionalURL=v=>v?mediaURL(text(v,2000)).href:'';
  const ids=new Set();
  return {version:1,items:input.items.map(item=>{
    const id=text(item.id,80);if(!/^[\w-]+$/.test(id)||ids.has(id))throw new Error('Each item needs a unique ID.');ids.add(id);
    if(!['photo','video'].includes(item.type))throw new Error('Choose photo or video.');
    const title=text(item.title,120);if(!title)throw new Error('Every item needs a title.');
    const src=mediaURL(text(item.src,2000)).href;if(item.type==='video')videoSource(src);
    const poster=optionalURL(item.poster);if(item.type==='video'&&!poster)throw new Error('Add a thumbnail image URL for each video.');
    return {id,type:item.type,title,src,poster,caption:text(item.caption||'',500),alt:text(item.alt||'',300),credit:text(item.credit||'',200),creditUrl:optionalURL(item.creditUrl),sample:item.sample===true};
  })};
}
