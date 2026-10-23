import test from 'node:test';import assert from 'node:assert/strict';import {scryptSync} from 'node:crypto';import handler from '../netlify/functions/admin.mjs';import {validateContent,videoSource} from '../dist/media.js';
const origin='https://portfolio.example';process.env.ADMIN_PASSWORD_SALT='test-salt';process.env.ADMIN_PASSWORD_HASH=scryptSync('test-only-password','test-salt',64).toString('hex');process.env.SESSION_SECRET='test-only-session-secret';process.env.GITHUB_REPOSITORY='test/portfolio';process.env.GITHUB_TOKEN='test-only-token';
const item={id:'one',type:'photo',title:'One',src:'https://example.com/a.jpg'};
const request=(method,payload,cookie='',action='')=>new Request(origin+'/.netlify/functions/admin'+(action?'?action='+action:''),{method,headers:{origin,'Content-Type':'application/json',cookie},body:payload?JSON.stringify(payload):undefined});
test('media validation and supported providers',()=>{assert.throws(()=>validateContent({version:1,items:[{...item,src:'javascript:alert(1)'}]}));assert.throws(()=>videoSource('https://youtube.com.evil.test/watch?v=abcdefghijk'));assert.equal(videoSource('https://youtu.be/abcdefghijk').src,'https://www.youtube-nocookie.com/embed/abcdefghijk');assert.equal(videoSource('https://vimeo.com/123456/abc123').src,'https://player.vimeo.com/video/123456?h=abc123');assert.equal(videoSource('https://cdn.example.com/film.mp4?token=a').type,'video');assert.throws(()=>validateContent({version:1,items:[{...item,type:'video',src:'https://youtu.be/abcdefghijk'}]}));});
test('authentication, origin protection, persistence and conflicts',async()=>{
 assert.equal((await handler(request('GET'))).status,401);assert.equal((await handler(request('PUT',{content:{version:1,items:[]},sha:'a'.repeat(40)}))).status,401);
 assert.equal((await handler(request('POST',{password:'wrong'},'','login'))).status,401);
 assert.equal((await handler(request('POST',{username:'wrong',password:'test-only-password'},'','login'))).status,401);
 const signed=await handler(request('POST',{username:'Bilson',password:'test-only-password'},'','login'));assert.equal(signed.status,200);const full=signed.headers.get('set-cookie');assert.match(full,/HttpOnly/);assert.match(full,/Secure/);assert.match(full,/SameSite=Strict/);const cookie=full.split(';')[0];assert.equal((await handler(request('GET',null,cookie+'bad'))).status,401);
 const cross=request('PUT',{},cookie);cross.headers.set('origin','https://attacker.example');assert.equal((await handler(cross)).status,403);
 const original=globalThis.fetch;try{let put;globalThis.fetch=async(url,options)=>{if(options.method==='PUT'){put=JSON.parse(options.body);return Response.json({content:{sha:'b'.repeat(40)}});}return Response.json({sha:'a'.repeat(40),content:Buffer.from(JSON.stringify({version:1,items:[item]})).toString('base64')});};
 assert.equal((await handler(request('POST',{data:Buffer.from('not an image').toString('base64')},cookie,'upload'))).status,400);
 const upload=await handler(request('POST',{data:Buffer.from([255,216,255,0]).toString('base64')},cookie,'upload'));assert.equal(upload.status,200);assert.match((await upload.json()).src,/^\/assets\/uploads\/[a-f0-9]{32}\.jpg$/);
 const read=await handler(request('GET',null,cookie));assert.equal(read.status,200);assert.equal((await read.json()).content.items[0].title,'One');const save=await handler(request('PUT',{sha:'a'.repeat(40),content:{version:1,items:[item]}},cookie));assert.equal(save.status,200);assert.equal(put.sha,'a'.repeat(40));assert.equal(JSON.parse(Buffer.from(put.content,'base64')).items[0].src,item.src);
 globalThis.fetch=async()=>Response.json({},{status:409});assert.equal((await handler(request('PUT',{sha:'a'.repeat(40),content:{version:1,items:[item]}},cookie))).status,409);
 }finally{globalThis.fetch=original;}
 const logout=await handler(request('POST',{},cookie,'logout'));assert.match(logout.headers.get('set-cookie'),/Max-Age=0/);
});

test('configuration errors identify missing names without exposing secrets',async()=>{
 const saved=process.env.SESSION_SECRET;
 try{delete process.env.SESSION_SECRET;const response=await handler(request('GET'));assert.equal(response.status,503);const data=await response.json();assert.deepEqual(data.missing,['SESSION_SECRET']);assert.ok(!JSON.stringify(data).includes(process.env.ADMIN_PASSWORD_HASH));}
 finally{process.env.SESSION_SECRET=saved;}
});
