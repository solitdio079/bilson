import {scryptSync,createHmac,timingSafeEqual,randomBytes} from 'node:crypto';
import {validateContent} from '../../dist/media.js';
const cookieName='bilson_admin';
const result=(data,status=200,headers={})=>Response.json(data,{status,headers:{'Cache-Control':'no-store',...headers}});
const equal=(a,b)=>{const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);};
function signed(value){return createHmac('sha256',process.env.SESSION_SECRET).update(value).digest('hex');}
function session(request){const token=request.headers.get('cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName+'='))?.slice(cookieName.length+1);if(!token)return false;const [expires,nonce,signature]=token.split('.');return /^\d+$/.test(expires)&&Number(expires)>Date.now()&&Number(expires)<Date.now()+9*3600000&&nonce&&signature&&equal(signed(`${expires}.${nonce}`),signature);}
function cookie(value,age,request){return `${cookieName}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${new URL(request.url).protocol==='https:'?'; Secure':''}`;}
async function body(request){const raw=await request.text();if(raw.length>4300000)throw Error('Request too large.');return JSON.parse(raw);}
function repository(path){const {GITHUB_REPOSITORY,GITHUB_TOKEN,GITHUB_BRANCH='main',GITHUB_CONTENT_PATH='dist/content.json'}=process.env;
 if(!/^[\w.-]+\/[\w.-]+$/.test(GITHUB_REPOSITORY||'')||!GITHUB_TOKEN)throw Error('GitHub is not configured. Set GITHUB_REPOSITORY and GITHUB_TOKEN in Netlify.');
 if(GITHUB_CONTENT_PATH.includes('..')||GITHUB_CONTENT_PATH.startsWith('/'))throw Error('Invalid content path.');
 return {url:`https://api.github.com/repos/${GITHUB_REPOSITORY}/contents/${(path||GITHUB_CONTENT_PATH).split('/').map(encodeURIComponent).join('/')}`,branch:GITHUB_BRANCH,headers:{Authorization:`Bearer ${GITHUB_TOKEN}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'}};
}
async function github(config,method='GET',payload){return fetch(config.url+(method==='GET'?'?ref='+encodeURIComponent(config.branch):''),{method,headers:config.headers,body:payload?JSON.stringify(payload):undefined,signal:AbortSignal.timeout(15000)});}
export default async function handler(request){
 const action=new URL(request.url).searchParams.get('action');
 if(!process.env.SESSION_SECRET||!process.env.ADMIN_PASSWORD_HASH||!process.env.ADMIN_PASSWORD_SALT)return result({error:'Admin authentication is not configured. Add the server environment variables first.'},503);
 if(!['GET','POST','PUT'].includes(request.method))return result({error:'Method not allowed.'},405);
 if(request.method!=='GET'&&request.headers.get('origin')!==new URL(request.url).origin)return result({error:'Request origin not allowed.'},403);
 try{
 if(request.method==='POST'&&action==='login'){
 const {username,password}=await body(request);if(typeof username!=='string'||!equal(username,process.env.ADMIN_USERNAME||'Bilson'))return result({error:'Incorrect username or password.'},401);if(typeof password!=='string'||password.length>256)return result({error:'Incorrect username or password.'},401);
 const hash=scryptSync(password,process.env.ADMIN_PASSWORD_SALT,64).toString('hex');if(!equal(hash,process.env.ADMIN_PASSWORD_HASH))return result({error:'Incorrect username or password.'},401);
 const payload=`${Date.now()+8*3600000}.${randomBytes(16).toString('hex')}`;
 return result({ok:true},200,{'Set-Cookie':cookie(`${payload}.${signed(payload)}`,28800,request)});
 }
 if(request.method==='POST'&&action==='logout')return result({ok:true},200,{'Set-Cookie':cookie('',0,request)});
 if(!session(request))return result({error:'Please sign in again.'},401);
 if(request.method==='POST'&&action==='upload'){
 const input=await body(request);
 if(typeof input.data!=='string'||input.data.length>4194304||!input.data.length||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(input.data))return result({error:'Choose an image up to 3 MB.'},400);
 const bytes=Buffer.from(input.data,'base64');
 let extension;
 if(bytes.subarray(0,3).equals(Buffer.from([255,216,255])))extension='jpg';
 else if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))extension='png';
 else if(['GIF87a','GIF89a'].includes(bytes.subarray(0,6).toString()))extension='gif';
 else if(bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP')extension='webp';
 else return result({error:'Choose a JPEG, PNG, WebP or GIF image.'},400);
 const src=`/assets/uploads/${randomBytes(16).toString('hex')}.${extension}`;
 const contentPath=process.env.GITHUB_CONTENT_PATH||'dist/content.json';
 const config=repository(contentPath.slice(0,contentPath.lastIndexOf('/')+1)+src.slice(1));
 const response=await github(config,'PUT',{message:'Upload Bilson portfolio photograph',content:input.data,branch:config.branch});
 if(!response.ok)return result({error:'Photo upload failed. Check repository write access and try again.'},502);
 return result({src,message:'Photo uploaded. Save your portfolio to publish it.'});
 }
 const config=repository();
 if(request.method==='GET'){
 const response=await github(config);if(!response.ok)return result({error:'Could not read the content file. Check the repository, branch, file path and token permissions.'},502);
 const file=await response.json();return result({content:validateContent(JSON.parse(Buffer.from(file.content,'base64').toString('utf8'))),sha:file.sha});
 }
 if(request.method==='PUT'){
 const input=await body(request);if(typeof input.sha!=='string'||!/^[a-f0-9]{40}$/.test(input.sha))return result({error:'Reload the latest content before saving.'},400);
 const content=validateContent(input.content);const response=await github(config,'PUT',{message:'Update Bilson portfolio content',content:Buffer.from(JSON.stringify(content,null,2)+'\n').toString('base64'),sha:input.sha,branch:config.branch});
 if(response.status===409||response.status===422)return result({error:'The file changed or the branch rejected this update. Download your draft, then reload the latest content before retrying.'},409);
 if(!response.ok)return result({error:'GitHub could not save. Check token write access and branch protection.'},502);
 const saved=await response.json();return result({ok:true,sha:saved.content.sha,message:'Saved to GitHub. The public site updates after Netlify finishes deploying.'});
 }
 return result({error:'Unknown action.'},400);
 }catch(error){if(error.name==='SyntaxError')return result({error:'Invalid JSON content.'},400);if(error.name==='TimeoutError')return result({error:'GitHub timed out. Reload the latest content to check whether the save completed.'},504);return result({error:error.message||'Unable to complete the request.'},400);}
}
export const config={rateLimit:{windowLimit:20,windowSize:60,aggregateBy:['ip','domain']}};
