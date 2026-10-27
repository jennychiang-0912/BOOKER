/* 我的書櫃 — 主要程式：書架、拖曳、搜尋、打卡、每日任務、星等與筆記、ISBN 加書、封面自動查詢、備份 */
const KEY='my-bookshelf-v1';
let lastSaved=null;const undoStack=[];
const COVER_RETRY_DAYS=7;
const STATUS={reading:'在讀',want:'想讀',wish:'願望',done:'讀完'};
const SHELVES=[
 {k:'reading',title:'正在讀',hint:'翻到一半的書'},
 {k:'want',title:'即將閱讀',hint:'排隊中的想讀清單'},
 {k:'wish',title:'願望書單',hint:'還沒入手'},
 {k:'done',title:'讀完的書',hint:'讀過的，都算數'}
];
const CAP=16;
const PALETTES=[
 ['#78977D','#FFFFFF','#C9DDCE'],['#C9DDCE','#263D32','#78977D'],['#F3EBDD','#263D32','#C9A86A'],
 ['#263D32','#EDF3EA','#9CC0A2'],['#E7D3C2','#4A3424','#B0806A'],['#B9CCD6','#22323D','#F7F8F2'],
 ['#5E7F6C','#F7F8F2','#E8DCC6'],['#F7F8F2','#263D32','#78977D'],['#D9C6A5','#3B2E1E','#F3EBDD'],
 ['#8BA7B3','#FFFFFF','#DCE9DC'],['#E5B9A6','#4A2A20','#F7F0E6'],['#3F5468','#F1EEE6','#C9DDCE']
];
const MOTIFS=['','m-sun','m-band','m-frame','m-hill','m-leaf'];
const CN=['日','一','二','三','四','五','六'];
const dstr=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const today=()=>dstr(new Date());
const uid=()=>Math.random().toString(36).slice(2,9);
function hash(s){let h=2166136261;for(const ch of s){h^=ch.codePointAt(0);h=Math.imul(h,16777619)}return h>>>0}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

function sample(){const t=today();return {checkins:[],picks:[],pages:{},books:[
 ['百年孤寂','馬奎斯','reading'],['海邊的卡夫卡','村上春樹','reading'],
 ['被討厭的勇氣','岸見一郎、古賀史健','done'],['小王子','聖修伯里','done'],['大亨小傳','費茲傑羅','done'],
 ['挪威的森林','村上春樹','want'],['人類大歷史','哈拉瑞','want'],['獻給阿爾吉儂的花束','丹尼爾．凱斯','want'],['The Midnight Library','Matt Haig','want'],['人間失格','太宰治','want'],
 ['我是貓','夏目漱石','wish'],['華氏451度','雷．布萊伯利','wish']
].map(([title,author,status])=>({id:uid(),title,author,status,added:t,finished:status==='done'?t:null,ex:true}))}}
let S;
try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){}
if(!S||!Array.isArray(S.books))S=sample();
S.checkins=S.checkins||[];S.pages=S.pages||{};
if(!S.seeded){ // 第一次開啟：放入 Notion 書單
 if(S.books.every(b=>b.ex))S.books=[];
 const have=new Set(S.books.map(b=>b.title.toLowerCase()));const t=today();
 for(const [title,done,ci] of SEED){if(have.has(title.toLowerCase()))continue;
  S.books.push({id:uid(),title,author:'',isbn:'',cat:CATS[ci],status:done?'done':'wish',added:t,finished:null})}
 S.seeded=1;save();
}
if(!S.catsAdded){const cm=new Map(SEED.map(x=>[x[0].toLowerCase(),CATS[x[2]]]));for(const b of S.books){if(!b.cat)b.cat=cm.get(b.title.toLowerCase())||''}S.catsAdded=1;save()}
if(!S.catFix1){for(const b of S.books){if(b.cat==='其他'&&CAT_FIX[b.title])b.cat=CAT_FIX[b.title]}S.catFix1=1;save()}
if(!S.catFix2){for(const b of S.books){const f=CAT_FIX2[b.title];if(!f)continue;b.title=f[0];if(!b.cat||b.cat==='其他')b.cat=f[1];delete b.cover;delete b.coverMiss}S.catFix2=1;save()}
if(!S.catFix3){for(const b of S.books){if(CAT_FIX3[b.title]&&(!b.cat||b.cat==='其他'))b.cat=CAT_FIX3[b.title]}S.catFix3=1;save()}
if(!S.catFix4){for(const b of S.books){if(ANIME.includes(b.title)&&['藝術設計','漫畫輕小說','其他',''].includes(b.cat||''))b.cat='動漫'}S.catFix4=1;save()}
if(!S.catFix5){for(const b of S.books){if(ANIME2.includes(b.title)&&['文學小說','漫畫輕小說','其他',''].includes(b.cat||''))b.cat='動漫'}S.catFix5=1;save()}
if(!S.catFix6){for(const b of S.books){if(FILMS.includes(b.title)&&['藝術設計','文學小說','動漫','其他',''].includes(b.cat||'')){b.cat='影音';continue}if(b.cat==='動漫')b.cat=ANIME2.includes(b.title)?'漫畫輕小說':'影音'}S.catFix6=1;save()}
if(!S.films1){const have=new Set(S.books.map(b=>b.title.toLowerCase()));const t=today();for(const title of FILM_LIST){if(have.has(title.toLowerCase()))continue;S.books.push({id:uid(),title,author:'',isbn:'',cat:FILM_BOOKS.includes(title)?'文學小說':'影音',status:'wish',added:t,finished:null})}S.films1=1;save()}
if(!S.fix7){const imported=new Set([...SEED.map(x=>x[0]),...FILM_LIST]);for(const b of S.books){if(b.status==='want'&&imported.has(b.title))b.status='wish';if(FILM_BOOKS.includes(b.title)&&b.cat==='影音')b.cat='文學小說'}S.fix7=1;save()}
if(!S.fix8){for(const b of S.books){if(!NO_LOOKUP.includes(b.title))continue;b.noLookup=1;if(!b.coverManual){delete b.cover;delete b.coverMiss}if(b.isbnAuto){delete b.isbn;delete b.isbnAuto}}S.fix8=1;save(1)}
function mergeDiary(list){let added=0,noted=0;const nk=t=>String(t).toLowerCase().replace(/[\s《》<>「」『』（）()\-—–_.,，、:：;；!！?？·．'"“”~～]/g,'');
 const idx=new Map();for(const b of S.books)if(!idx.has(nk(b.title)))idx.set(nk(b.title),b);
 for(const e of list){if(!Array.isArray(e))continue;const [d,t,n,st,cat,ex,wip]=e;if(!t)continue;let b=idx.get(nk(ex||t))||idx.get(nk(t));
  if(!b){b={id:uid(),title:t,author:'',isbn:'',cat:cat||'文學小說',status:wip?'reading':'done',added:d,finished:wip?null:d};S.books.push(b);idx.set(nk(t),b);added++}
  if(ex==='房思淇的初戀樂園')b.title='房思琪的初戀樂園';
  if(n&&!(b.note||'').includes(n)){b.note=b.note?b.note+'\n\n'+n:n;b.noteDate=b.noteDate||d;noted++}
  if(wip){if(b.status!=='done')b.status='reading'}else{if(b.status!=='done'||!b.finished)b.finished=d;b.status='done'}
  if(st&&!b.stars)b.stars=st}
 return {added,noted}}
// 套用自己拍的封面：書名比對（忽略空白標點），自己貼的封面不覆蓋
function applyMyCovers(){if(typeof MY_COVERS==='undefined')return 0;const nk=t=>String(t).toLowerCase().replace(/[\s《》<>「」『』（）()\-—–_.,，、:：;；!！?？·．'"“”~～]/g,'');
 const ents=Object.entries(MY_COVERS).map(([t,u])=>[nk(t),u]);let n=0;
 for(const b of S.books){if(b.coverManual)continue;const k=nk(b.title);if(!k)continue;
  let hit=ents.find(e=>e[0]===k);if(!hit){const c=ents.filter(e=>e[0].length>=3&&(k.includes(e[0])||e[0].includes(k)&&k.length>=3));if(c.length===1)hit=c[0]}
  if(hit&&b.cover!==hit[1]){b.cover=hit[1];b.coverMine=1;n++}}
 return n}
if(!S.myCovers1){for(const b of S.books)if(!b.coverManual){delete b.cover;delete b.coverMiss}S.myCovers1=1;save(1)} // 清掉以前自動找到的封面
if(applyMyCovers())save(1);
if(!S.coverReset1){for(const b of S.books)delete b.coverMiss;S.coverReset1=1;save(1)} // 舊版或匯入的備份可能把書標成「找不到」，更新後全部重找一次
function save(quiet){const cur=JSON.stringify(S);if(!quiet&&lastSaved!==null&&lastSaved!==cur){undoStack.push(lastSaved);if(undoStack.length>30)undoStack.shift()}if(lastSaved!==null)lastSaved=cur;try{localStorage.setItem(KEY,cur)}catch(e){}}
function undo(){if(!undoStack.length){toast('沒有可以復原的動作',true);return}const prev=undoStack.pop();S=JSON.parse(prev);lastSaved=prev;try{localStorage.setItem(KEY,prev)}catch(e){}
 render();if(!$('bookSheet').hidden){if(S.books.some(b=>b.id===detailId))openDetail(detailId);else $('bookSheet').hidden=true}toast('已復原上一個動作',true)}

const $=id=>document.getElementById(id);
let query='',openShelf={},detailId=null;
function toast(m,noUndo){const t=$('toast');t.innerHTML='';const sp=document.createElement('span');sp.textContent=m;t.appendChild(sp);
 if(!noUndo&&undoStack.length){const b=document.createElement('button');b.className='toast-undo';b.textContent='復原';b.onclick=undo;t.appendChild(b)}
 t.hidden=false;clearTimeout(toast.h);toast.h=setTimeout(()=>t.hidden=true,noUndo?1800:5000)}
function streak(){const set=new Set(S.checkins);let n=0;const d=new Date();if(!set.has(dstr(d)))d.setDate(d.getDate()-1);while(set.has(dstr(d))){n++;d.setDate(d.getDate()-1)}return n}

function cleanIsbn(s){return String(s||'').replace(/[^0-9Xx]/g,'').toUpperCase()}
function cover(b){
 if(b.cover)return `<div class="cover real"><img src="${esc(b.cover)}" alt="" loading="lazy" referrerpolicy="no-referrer" data-id="${b.id}"></div>`;
 return `<div class="cover blank">${pending.has(b.id)?'<span class="loading-dot"></span>':''}</div>`;
}

/* ---------- 自動找封面 ---------- */
// 加速重點：同時查多本、一本書的多個來源同時發出、書名先去掉（英）（漫畫）等標記；中文書不查 Open Library（幾乎沒有中文封面）。
const pending=new Set();const queue=[];let active=0,pausedUntil=0,backoff=5000,coverFound=0,coverErr=0,keyBad=false;
const AUTO_COVER=false; // 統一用自己的封面，不再自動上網找
function needsCover(b){
 if(!AUTO_COVER)return false;
 if(b.cover||b.coverManual||b.noLookup||b.cat==='影音')return false;
 if(b.coverMiss&&(Date.now()-b.coverMiss)<COVER_RETRY_DAYS*864e5)return false;
 return true;
}
// 先找畫面上看得到的書：正在讀 → 即將閱讀 → 各層前幾本 → 其他
const PRI={reading:0,want:1,wish:2,done:3};
function enqueueCovers(){
 const seen={};const add=[];
 for(const b of S.books){const k=b.status;seen[k]=(seen[k]||0)+1;
  if(needsCover(b)&&!pending.has(b.id)){pending.add(b.id);add.push([seen[k]<=CAP?PRI[k]??4:5+(PRI[k]??4),b.id])}}
 add.sort((a,b)=>a[0]-b[0]);for(const x of add)queue.push(x[1]);
 coverStatus();pump();
}
// 打開「看全部」時，把這一頁的書插到隊伍最前面
function prioritize(ids){const want=new Set(ids.filter(id=>pending.has(id)));if(!want.size)return;
 const front=queue.filter(id=>want.has(id));const rest=queue.filter(id=>!want.has(id));queue.length=0;queue.push(...front,...rest)}
// 找到一本就只更新那一本的封面，不重畫整個書架（書多時整頁重畫會很卡）
let saveT=0;function saveSoon(){clearTimeout(saveT);saveT=setTimeout(()=>save(1),800)}
window.addEventListener('pagehide',()=>{if(saveT){clearTimeout(saveT);save(1)}});
function patchBook(id){const b=S.books.find(x=>x.id===id);if(!b)return;
 document.querySelectorAll(`.book[data-id="${id}"]`).forEach(el=>{const c=el.querySelector('.cover');if(c)c.outerHTML=cover(b);
  const cap=el.querySelector('.cap');if(cap)cap.innerHTML=`<b>${esc(b.title)}</b>${b.author?`<span class="au">${esc(b.author)}</span>`:''}`});
 if(detailId===id&&!$('bookSheet').hidden){$('dCover').innerHTML=cover(b);$('dAuthor').textContent=b.author||'作者未記'}}
function maxActive(){return gKey()&&!keyBad?6:3}
function pump(){
 const wait=pausedUntil-Date.now();if(wait>0){setTimeout(pump,wait+50);coverStatus();return}
 while(active<maxActive()&&queue.length){const id=queue.shift();active++;
  resolveCover(id).then(r=>{if(r==='limit'){queue.push(id);pausedUntil=Date.now()+backoff;backoff=Math.min(backoff*2,60000)}else{pending.delete(id);patchBook(id);if(r==='ok'){coverFound++;backoff=5000}if(r==='error'){coverErr++;if(coverErr>=8&&!coverFound){const q=[...queue];for(const x of q)pending.delete(x);queue.length=0;q.forEach(patchBook)}}}})
   .catch(()=>{pending.delete(id);patchBook(id)}).finally(()=>{active--;coverStatus();setTimeout(pump,50)})}
}
function coverStatus(){const el=document.getElementById('coverStatus');if(!el)return;const n=queue.length+active;
 const note=keyBad?'（Google 金鑰無效，已改用免金鑰模式，請檢查金鑰）':pausedUntil>Date.now()?(gKey()?'（查詢太頻繁，稍等一下自動繼續）':'（查詢太頻繁，稍等一下自動繼續；加上 Google 金鑰會快很多）'):'';
 el.textContent=n?`正在找封面，還有 ${n} 本${note}`:(coverFound?`這次找到 ${coverFound} 本封面${keyBad?'（Google 金鑰無效，請檢查）':''}`:coverErr?'連不到封面資料庫（Google Books／Open Library），請確認網路，或改用 GitHub 上的網址打開':keyBad?'Google 金鑰無效，請檢查金鑰':'')}
// Google Books 金鑰只存在這個瀏覽器（localStorage），不會寫進程式或上傳到 GitHub
const GKEY='my-bookshelf-gkey';
function gKey(){try{return localStorage.getItem(GKEY)||''}catch(e){return ''}}
function gKeyParam(){const k=gKey();return k&&!keyBad?'&key='+encodeURIComponent(k):''}
function gKeyLabel(){if(!$('gkeyBtn'))return;$('gkeyBtn').textContent=gKey()?(keyBad?'Google 金鑰 ✗':'Google 金鑰 ✓'):'加 Google 金鑰'}
function setGKey(){const v=prompt('貼上 Google Books API 金鑰（只存在這個瀏覽器）。\n清空後按確定可以刪除金鑰。',gKey());if(v===null)return;
 try{v.trim()?localStorage.setItem(GKEY,v.trim()):localStorage.removeItem(GKEY)}catch(e){}
 pausedUntil=0;backoff=5000;coverErr=0;keyBad=false;gKeyLabel();
 for(const b of S.books)delete b.coverMiss;save(1);enqueueCovers();toast(v.trim()?'已存下金鑰，重新找封面':'已刪除金鑰')}
function httpsify(u){return u?u.replace(/^http:/,'https:'):u}
const CJK=/[぀-ヿ㐀-鿿]/;
// 搜尋用書名：去掉（英）（中）（漫畫）、括號、多餘空白
function searchTitle(t){return String(t).replace(/[（(【\[][^）)】\]]*[）)】\]]/g,' ').replace(/\s+/g,' ').trim()||String(t)}
const normT=s=>String(s||'').toLowerCase().replace(/[\s\p{P}\p{S}]/gu,'');
class LimitError extends Error{}
// 連線卡住超過 8 秒就放棄，不要佔著名額
function tfetch(u,ms=8000){const c=new AbortController();const t=setTimeout(()=>c.abort(),ms);return fetch(u,{signal:c.signal}).finally(()=>clearTimeout(t))}
const GFIELDS='&fields=items(volumeInfo(title,subtitle,authors,imageLinks,industryIdentifiers))';
async function googleLookup(q,want){
 const r=await tfetch('https://www.googleapis.com/books/v1/volumes?maxResults=10&printType=books&q='+encodeURIComponent(q)+GFIELDS+gKeyParam());
 if(r.status===400||r.status===403){
  let msg='';try{msg=JSON.stringify(await r.json())}catch(e){}
  if(gKey()&&!keyBad&&/key|referer|blocked|disabled|has not been used/i.test(msg)){keyBad=true;gKeyLabel();return googleLookup(q,want)} // 金鑰設定有問題：改用免金鑰再查
  throw new LimitError('google '+r.status)}
 if(r.status===429)throw new LimitError('google 429');
 if(!r.ok)throw new Error('google '+r.status);
 const j=await r.json();const w=normT(want);
 const items=(j.items||[]).map(it=>it.volumeInfo||{}).filter(v=>v.imageLinks&&(v.imageLinks.thumbnail||v.imageLinks.smallThumbnail));
 // 優先選書名對得上的那一本，避免抓到別本書的封面
 const v=(w&&items.find(v=>{const t=normT(v.title);return t&&(t.includes(w)||w.includes(t))}))||(want?null:items[0]);
 if(!v)return null;
 const ids=v.industryIdentifiers||[];const id=ids.find(x=>x.type==='ISBN_13')||ids.find(x=>x.type==='ISBN_10');
 return {url:httpsify(v.imageLinks.thumbnail||v.imageLinks.smallThumbnail).replace('&edge=curl',''),authors:v.authors,isbn:id?id.identifier:''};
}
async function olLookup(title,author){
 const r=await tfetch('https://openlibrary.org/search.json?limit=5&fields=cover_i,author_name,title&title='+encodeURIComponent(title)+(author?'&author='+encodeURIComponent(author):''));
 if(!r.ok)throw new Error('openlibrary '+r.status);
 const j=await r.json();const d=(j.docs||[]).find(x=>x.cover_i);
 return d?{url:`https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg`,authors:d.author_name}:null;
}
function probe(url,ms=6000){return new Promise(res=>{const i=new Image();const t=setTimeout(()=>{i.src='';res(false)},ms);i.referrerPolicy='no-referrer';i.onload=()=>{clearTimeout(t);res(i.naturalWidth>10)};i.onerror=()=>{clearTimeout(t);res(false)};i.src=url})}
// 同時發出多個查詢，誰先找到就用誰；全部沒找到才回 null
function firstFound(tasks){return new Promise(res=>{let left=tasks.length;if(!left)return res(null);
 for(const p of tasks)p.then(v=>{if(v)res(v);else if(--left===0)res(null)},()=>{if(--left===0)res(null)})})}
async function resolveCover(id){
 const b=S.books.find(x=>x.id===id);if(!b)return 'gone';
 const isbn=cleanIsbn(b.isbn);const au=b.author?b.author.split(/[、,，]/)[0]:'';const title=searchTitle(b.title);
 let limited=false,netErr=0,tries=0;
 const wrap=p=>{tries++;return p.catch(e=>{if(e instanceof LimitError)limited=true;else netErr++;return null})};
 const g=(q,want)=>wrap(googleLookup(q,want));
 let found=null;
 if(isbn)found=await firstFound([g('isbn:'+isbn),probe(`https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false`).then(ok=>ok?{url:`https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false`}:null)]);
 if(!found){
  const tasks=[g(title+(au?' '+au:''),title)];
  const keyed=gKey()&&!keyBad;
  if(au&&keyed)tasks.push(g(title,title)); // 有金鑰才同時多查，免金鑰時省額度
  if(!CJK.test(title))tasks.push(wrap(olLookup(title,au)));
  found=await firstFound(tasks);
  if(!found&&au&&!keyed&&!limited)found=await g(title,title);
 }
 const cur=S.books.find(x=>x.id===id);if(!cur)return 'gone';
 if(found){cur.cover=found.url;delete cur.coverMiss;if(!cur.author&&found.authors)cur.author=[].concat(found.authors).slice(0,2).join('、');if(!cur.isbn&&found.isbn){cur.isbn=found.isbn;cur.isbnAuto=1}saveSoon();return 'ok'}
 if(limited)return 'limit';      // Google 額度用完又沒找到：之後再排一次，不記成「找不到」
 if(netErr&&netErr>=tries)return 'error'; // 網路問題：下次開啟再試
 cur.coverMiss=Date.now();saveSoon();return 'miss';
}
document.addEventListener('error',e=>{const im=e.target;if(im.tagName!=='IMG'||!im.dataset.id)return;
 const b=S.books.find(x=>x.id===im.dataset.id);if(b&&b.cover){if(!b.coverManual){delete b.cover;b.coverMiss=Date.now();saveSoon()}const c=im.closest('.cover');c.classList.remove('real');c.classList.add('blank');im.remove()}},true);
function bookEl(b){return `<button class="book" data-id="${b.id}">${cover(b)}<span class="cap"><b>${esc(b.title)}</b>${b.author?`<span class="au">${esc(b.author)}</span>`:''}</span></button>`}
function shelfHTML(sh){
 const q=query.toLowerCase();
 let list=S.books.filter(b=>b.status===sh.k&&(!catF[sh.k]||b.cat===catF[sh.k]));
 if(q)list=list.filter(b=>(b.title+(b.author||'')+cleanIsbn(b.isbn)).toLowerCase().includes(q));
 if(q&&!list.length)return '';
 const full=false;const shown=full?list:list.slice(0,CAP);
 const more=list.length>CAP?`<button class="more" data-more="${sh.k}">${full?'收起':'看全部 '+list.length+' 本 ›'}</button>`:'';
 const plus='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
 const items=(!shown.length&&!q)?`<button class="empty-row" data-addto="${sh.k}">${plus}還沒有書，拖一本過來或點這裡添一本</button>`:shown.map(bookEl).join('')+(!q&&!full?`<button class="empty-card" data-addto="${sh.k}">${plus}${list.length?'再添一本':'這一層還空著<br>添一本'}</button>`:'');
 return `<section id="shelf-${sh.k}"><div class="sec-h"><h2>${sh.title}<small class="num">${list.length} 本</small></h2>${more}</div>${sh.k==='wish'?isbnFormHTML():''}${CAT_SHELVES.includes(sh.k)?`<div class="catbar" style="margin-bottom:14px">${catBarHTML(sh.k)}</div>`:''}<div class="row${full?' grid':''}">${items}</div></section>`;
}

(function head(){const d=new Date();$('date').textContent=`${d.getFullYear()} 年 ${d.getMonth()+1} 月 ${d.getDate()} 日・週${CN[d.getDay()]}`})();

function render(){
 $('sOwned').textContent=S.books.filter(b=>b.status!=='wish').length;
 $('sReading').textContent=S.books.filter(b=>b.status==='reading').length;
 $('sDone').textContent=S.books.filter(b=>b.status==='done').length;
 const st=streak();$('sStreak').textContent=st;
 const pdone=(S.pages[today()]||0)>=5;
 $('daily').classList.toggle('done',pdone);$('daily').setAttribute('aria-pressed',pdone);
 $('dailySub').textContent=pdone?'今天完成了，明天見':'讀完就打勾，再按一次可以取消';
 const cdone=S.checkins.includes(today());
 $('checkin').classList.toggle('done',cdone);$('checkin').setAttribute('aria-pressed',cdone);
 $('checkTitle').textContent=cdone?'今天已打卡':'還沒打卡';
 $('checkSub').innerHTML=`連續 <strong class="num">${st}</strong> 天`;
 const emptyOf=k=>!S.books.some(b=>b.status===k);
 const pairEmpty=!query&&emptyOf('reading')&&emptyOf('want');
 $('shelfTop').innerHTML=pairEmpty?`<div class="pair">${shelfHTML(SHELVES[0])}${shelfHTML(SHELVES[1])}</div>`:shelfHTML(SHELVES[0]);
 const rest=(pairEmpty?SHELVES.slice(2):SHELVES.slice(1)).map(shelfHTML).join('');
 const any=$('shelfTop').innerHTML||rest;
 $('shelfRest').innerHTML=rest||(!any&&query?'<p class="nores">找不到符合的書</p>':'');
 $('exampleNote').hidden=!S.books.some(b=>b.ex);
 document.querySelectorAll('.home').forEach(el=>el.hidden=!!view);
 $('listView').hidden=!view;
 if(view)renderList();
}
let view=null,listSort='added';const catF={};const CAT_SHELVES=['wish','done'];
function catBarHTML(k){const base=S.books.filter(b=>b.status===k);const cf=catF[k]||'';const cnt={};for(const b of base){const c=b.cat||'其他';cnt[c]=(cnt[c]||0)+1}
 return `<button data-shelf="${k}" data-cat="" aria-pressed="${!cf}">全部<span class="num">${base.length}</span></button>`+CATS.filter(c=>cnt[c]).map(c=>`<button data-shelf="${k}" data-cat="${c}" aria-pressed="${cf===c}">${c}<span class="num">${cnt[c]}</span></button>`).join('')}
function renderList(){
 const sh=SHELVES.find(s=>s.k===view);if(!sh){view=null;render();return}
 const q=query.toLowerCase();
 let list=S.books.filter(b=>b.status===view&&(!catF[view]||b.cat===catF[view]));
 if(q)list=list.filter(b=>(b.title+(b.author||'')+(b.isbn||'')).toLowerCase().includes(q));
 if(listSort==='title')list=[...list].sort((a,b)=>a.title.localeCompare(b.title,'zh-Hant'));
 if(listSort==='newest')list=[...list].reverse();
 if(listSort==='stars')list=[...list].sort((a,b)=>(b.stars||0)-(a.stars||0));
 const tabs=SHELVES.map(s=>`<button data-tab="${s.k}" aria-pressed="${s.k===view}">${s.title} <span class="num">${S.books.filter(b=>b.status===s.k).length}</span></button>`).join('');
 $('listView').innerHTML=`<div class="lv-top"><button class="back" data-back><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>回首頁</button><div class="lv-tabs">${tabs}</div></div>
 ${view==='wish'?isbnFormHTML():''}<div class="catbar" style="margin-bottom:18px">${catBarHTML(view)}</div>
 <div class="sec-h"><h2>${sh.title}<small class="num">${list.length} 本${q?'（搜尋結果）':''}</small></h2>
 <select class="lv-sort" id="lvSort" aria-label="排序"><option value="added"${listSort==='added'?' selected':''}>書單順序</option><option value="newest"${listSort==='newest'?' selected':''}>最近加入</option><option value="title"${listSort==='title'?' selected':''}>依書名</option><option value="stars"${listSort==='stars'?' selected':''}>依星等</option></select></div>
 <div class="row grid">${(prioritize(list.map(b=>b.id)),list.map(bookEl).join(''))}${!q?`<button class="empty-card" data-addto="${sh.k}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>添一本</button>`:''}</div>${q&&!list.length?'<p class="nores">這一層找不到符合的書</p>':''}`;
}
function route(){
 const h=location.hash.slice(1);const was=view;
 if(h.startsWith('list-')){view=h.slice(5);render();if(was!==view)window.scrollTo(0,0);return}
 view=null;render();
 if(was&&h){const el=document.getElementById(h);if(el)el.scrollIntoView()}else if(was)window.scrollTo(0,0);
}
window.addEventListener('hashchange',route);

function openDetail(id){const b=S.books.find(x=>x.id===id);if(!b)return;detailId=id;
 $('dCover').innerHTML=cover(b);$('dTitle').textContent=b.title;$('dAuthor').textContent=b.author||'作者未記';
 $('dCat').textContent=b.cat||'其他';
 renderStars($('dStars'),b.stars||0);$('dStarsWrap').hidden=b.status!=='done';
 $('dNote').value=b.note||'';$('dNoteDate').textContent=b.status==='done'&&b.finished?'讀完於 '+b.finished.replace(/-/g,'.'):'';
 $('dNoteWrap').hidden=!(b.status==='done'||b.note);
 $('dIsbn').textContent=b.isbn?'ISBN '+b.isbn:'';
 $('dDelete').textContent='從書架移除';delete $('dDelete').dataset.armed;
 $('bookSheet').hidden=false;fitNote($('dNote'));}
function openAdd(st){if(st)$('fStatus').value=st;$('addSheet').hidden=false;$('fTitle').focus();closeMenu()}
function closeMenu(){$('nav').classList.remove('open');$('burger').setAttribute('aria-expanded','false')}

$('daily').onclick=()=>{const t=today();const was=(S.pages[t]||0)>=5;S.pages[t]=was?0:5;save();render();toast(was?'已取消每日任務':'今天的 5 頁讀完了')};
$('checkin').onclick=()=>{const t=today();if(S.checkins.includes(t)){S.checkins=S.checkins.filter(x=>x!==t);save();render();toast('已取消今天的打卡');return}S.checkins.push(t);save();render();toast(`打卡完成，連續 ${streak()} 天`)};
$('search').oninput=e=>{query=e.target.value.trim();render()};
function shelfClick(e){
 if(catClick(e))return;
 const mo=e.target.closest('[data-more]');if(mo){location.hash='list-'+mo.dataset.more;return}
 const ad=e.target.closest('[data-addto]');if(ad){openAdd(ad.dataset.addto);return}
 const bk=e.target.closest('.book');if(bk)openDetail(bk.dataset.id)}
$('shelfTop').onclick=shelfClick;
function catClick(e){const c=e.target.closest('[data-cat]');if(!c)return false;catF[c.dataset.shelf]=c.dataset.cat;render();return true}
$('listView').onclick=e=>{if(catClick(e))return;if(e.target.closest('[data-back]')){location.hash='top';return}const tb=e.target.closest('[data-tab]');if(tb){location.hash='list-'+tb.dataset.tab;return}shelfClick(e)};
$('listView').onchange=e=>{if(e.target.id==='lvSort'){listSort=e.target.value;renderList()}};$('shelfRest').onclick=shelfClick;
$('dDelete').onclick=()=>{const btn=$('dDelete');const b=S.books.find(x=>x.id===detailId);if(!b)return;
 if(btn.dataset.armed){S.books=S.books.filter(x=>x.id!==detailId);save();$('bookSheet').hidden=true;render();toast(`已移除《${b.title}》`)}
 else{btn.dataset.armed='1';btn.textContent='確定移除？再按一次'}};
$('dClose').onclick=()=>$('bookSheet').hidden=true;
// 手動換封面：貼圖片網址；留空則清掉（有自己拍的封面就換回那張）
$('dCoverBtn').onclick=async()=>{const b=S.books.find(x=>x.id===detailId);if(!b)return;
 const v=prompt('貼上封面圖片網址（可在博客來等網站的封面上按右鍵「複製圖片網址」）。\n留空按確定：清掉目前封面。',b.coverManual?b.cover:'');if(v===null)return;const t=v.trim();
 if(/^https?:\/\//i.test(t)){const u=httpsify(t);if(!(await probe(u))){toast('這個網址打不開圖片，請換一個',true);return}
  b.cover=u;b.coverManual=1;delete b.coverMine;save();render();openDetail(b.id);toast('封面已更新');return}
 if(t){toast('請貼圖片網址（https:// 開頭）',true);return}
 delete b.cover;delete b.coverManual;delete b.coverMine;applyMyCovers();save();render();openDetail(b.id);toast(b.cover?'已換回自己拍的封面':'已清掉封面')};
$('bookSheet').onclick=e=>{if(e.target===$('bookSheet'))$('bookSheet').hidden=true};
$('clearExamples').onclick=()=>{S.books=S.books.filter(b=>!b.ex);save();render();toast('已清除範例書')};
$('openAdd').onclick=()=>openAdd();
$('cancelAdd').onclick=()=>$('addSheet').hidden=true;
$('addSheet').onclick=e=>{if(e.target===$('addSheet'))$('addSheet').hidden=true};
$('addForm').onsubmit=e=>{e.preventDefault();const title=$('fTitle').value.trim();if(!title)return;const status=$('fStatus').value;
 S.books.unshift({id:uid(),title,author:$('fAuthor').value.trim(),isbn:cleanIsbn($('fIsbn').value),status,cat:$('fCat').value,added:today(),finished:status==='done'?today():null});
 const nb=S.books[0];applyMyCovers();save();e.target.reset();$('addSheet').hidden=true;render();if(status==='done')openRate(nb.id);enqueueCovers();toast(`《${title}》已放上書架`)};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('addSheet').hidden=true;$('bookSheet').hidden=true;closeMenu()}});
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&!e.shiftKey&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)){e.preventDefault();undo()}});
$('burger').onclick=()=>{const o=$('nav').classList.toggle('open');$('burger').setAttribute('aria-expanded',o)};
$('links').onclick=e=>{const a=e.target.closest('a');if(!a)return;document.querySelectorAll('#links a').forEach(x=>x.classList.toggle('on',x===a));closeMenu()};
$('exportBtn').onclick=()=>{const blob=new Blob([JSON.stringify(S,null,1)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`我的書櫃備份-${today()}.json`;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);toast('已匯出備份')};
$('importBtn').onclick=()=>$('importFile').click();
$('importFile').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const d=JSON.parse(await f.text());
 if(Array.isArray(d.diary)){const r=mergeDiary(d.diary);applyMyCovers();save();render();enqueueCovers();toast(`已匯入 ${r.noted} 則讀書筆記${r.added?`，新增 ${r.added} 本書`:''}`);e.target.value='';return}
 if(!Array.isArray(d.books))throw 0;
 d.checkins=d.checkins||[];d.pages=d.pages||{};S=d;applyMyCovers();save();render();enqueueCovers();toast(`已匯入 ${d.books.length} 本書`)}catch(err){toast('這個檔案不是書櫃備份，請選匯出的 .json 檔')}e.target.value=''};
{const o=CATS.map(c=>`<option value="${c}">${c}</option>`).join('');$('fCat').innerHTML=o;$('fCat').value='文學小說'}

/* ---------- 星等與筆記 ---------- */
const STAR_WORDS=['','不太推','普普','還不錯','很喜歡','超級推！'];
function renderStars(el,v){el.innerHTML=[1,2,3,4,5].map(i=>`<button type="button" class="star${i<=v?' on':''}" data-v="${i}" aria-label="${i} 顆星">★</button>`).join('')}
function fitNote(t){t.style.height='auto';t.style.height=Math.max(92,Math.min(t.scrollHeight+2,innerHeight*.46))+'px'}
$('dStars').onclick=e=>{const st=e.target.closest('.star');if(!st)return;const b=S.books.find(x=>x.id===detailId);if(!b)return;
 const v=+st.dataset.v;b.stars=b.stars===v?0:v;save();renderStars($('dStars'),b.stars);render();toast(b.stars?`評為 ${b.stars} 顆星・${STAR_WORDS[b.stars]}`:'已清除評分')};
$('dNote').oninput=e=>{fitNote(e.target);const b=S.books.find(x=>x.id===detailId);if(!b)return;b.note=e.target.value;save(1)};
$('dNote').onchange=()=>save();
let rateId=null,rateV=0;
function openRate(id){const b=S.books.find(x=>x.id===id);if(!b)return;rateId=id;rateV=b.stars||0;
 $('rTitle').textContent=`《${b.title}》`;renderStars($('rStars'),rateV);$('rHint').textContent=rateV?STAR_WORDS[rateV]:'這本書你給幾顆星？';
 $('rNote').value='';$('rateSheet').hidden=false}
$('rStars').onclick=e=>{const st=e.target.closest('.star');if(!st)return;rateV=+st.dataset.v;renderStars($('rStars'),rateV);$('rHint').textContent=STAR_WORDS[rateV]};
$('rStars').onmouseover=e=>{const st=e.target.closest('.star');if(!st)return;const v=+st.dataset.v;$('rStars').querySelectorAll('.star').forEach((x,i)=>x.classList.toggle('on',i<v))};
$('rStars').onmouseleave=()=>renderStars($('rStars'),rateV);
function closeRate(){$('rateSheet').hidden=true;rateId=null}
$('rSkip').onclick=closeRate;
$('rateSheet').onclick=e=>{if(e.target===$('rateSheet'))closeRate()};
$('rOk').onclick=()=>{const b=S.books.find(x=>x.id===rateId);const n=$('rNote').value.trim();
 if(b&&(rateV||n)){if(rateV)b.stars=rateV;if(n)b.note=b.note?b.note+'\n\n'+n:n;save();render();toast(rateV?`《${b.title}》評為 ${rateV} 顆星`:'已存下筆記')}closeRate()};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('rateSheet').hidden)closeRate()});

/* ---------- 拖曳換層 ---------- */
let drag=null,suppressClick=false;
function dropTargetAt(x,y){const el=document.elementFromPoint(x,y);if(!el)return null;
 const z=el.closest('[data-drop]');if(z)return {k:z.dataset.drop,el:z};
 const sec=el.closest('section[id^="shelf-"]');if(sec)return {k:sec.id.slice(6),el:sec};return null}
function clearOver(){document.querySelectorAll('.over,.drop-over').forEach(n=>n.classList.remove('over','drop-over'))}
function startDrag(x,y){const b=S.books.find(v=>v.id===drag.id);if(!b){drag=null;return}
 drag.active=true;clearTimeout(drag.timer);drag.from=b.status;
 const g=document.createElement('div');g.className='drag-ghost';g.innerHTML=cover(b);document.body.appendChild(g);drag.ghost=g;
 drag.el.classList.add('drag-src');document.body.classList.add('dragging');
 try{navigator.vibrate&&navigator.vibrate(12)}catch(e){}
 drag.scroller=setInterval(()=>{if(!drag||!drag.active)return;const y=drag.cy,h=innerHeight;if(y<110)scrollBy(0,-16);else if(y>h-80)scrollBy(0,16)},16);
 moveDrag(x,y)}
function moveDrag(x,y){drag.cx=x;drag.cy=y;drag.ghost.style.transform=`translate(${x-46}px,${y-70}px) rotate(4deg)`;
 clearOver();const t=dropTargetAt(x,y);drag.target=t&&t.k!==drag.from?t.k:null;if(drag.target)t.el.classList.add(t.el.matches('section')?'drop-over':'over')}
function endDrag(){if(!drag)return;clearTimeout(drag.timer);
 if(drag.active){clearInterval(drag.scroller);drag.ghost.remove();drag.el.classList.remove('drag-src');document.body.classList.remove('dragging');clearOver();
  suppressClick=true;setTimeout(()=>suppressClick=false,80);
  const b=S.books.find(v=>v.id===drag.id);
  if(b&&drag.target){b.status=drag.target;b.finished=b.status==='done'?today():null;save();render();
   toast(`《${b.title}》移到「${SHELVES.find(s=>s.k===b.status).title}」`);if(b.status==='done')openRate(b.id)}}
 drag=null}
document.addEventListener('pointerdown',e=>{const el=e.target.closest('.book');if(!el||e.button>0||drag)return;
 drag={id:el.dataset.id,el,x:e.clientX,y:e.clientY,type:e.pointerType,active:false};
 if(e.pointerType!=='mouse')drag.timer=setTimeout(()=>{if(drag&&!drag.active)startDrag(drag.x,drag.y)},380)});
document.addEventListener('pointermove',e=>{if(!drag)return;
 if(!drag.active){const d=Math.hypot(e.clientX-drag.x,e.clientY-drag.y);
  if(drag.type==='mouse'){if(d>6)startDrag(e.clientX,e.clientY)}else if(d>10){clearTimeout(drag.timer);drag=null}return}
 moveDrag(e.clientX,e.clientY)});
document.addEventListener('touchmove',e=>{if(drag&&drag.active)e.preventDefault()},{passive:false});
document.addEventListener('pointerup',endDrag);
document.addEventListener('pointercancel',()=>{if(drag&&!drag.active){clearTimeout(drag.timer);drag=null}});
document.addEventListener('contextmenu',e=>{if(e.target.closest('.book'))e.preventDefault()});
document.addEventListener('dragstart',e=>{if(e.target.closest&&e.target.closest('.book'))e.preventDefault()});
document.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopPropagation();suppressClick=false}},true);

/* ---------- 用 ISBN 加書 ---------- */
function isbnFormHTML(){return '<form class="isbn-add" data-isbnform autocomplete="off"><input name="isbn" inputmode="numeric" maxlength="20" placeholder="輸入 ISBN，加入願望書單" aria-label="ISBN"><button class="btn" type="submit">加入</button></form>'}
function validIsbn(i){return /^(\d{9}[\dX]|\d{13})$/.test(i)}
function mapCat(list){const t=(list||[]).join(' ').toLowerCase();if(!t)return '';
 const rules=[[/comic|graphic novel|manga/,'漫畫輕小說'],[/juvenile/,'親子童書'],[/fiction|poetry|literary|drama/,'文學小說'],[/business|economics/,'財經商管'],[/self-help|religion|body, mind/,'宗教心靈'],[/medical|health|fitness/,'醫藥養生'],[/computer/,'電腦資訊'],[/language|foreign language/,'語言學習'],[/art|music|design|photography|architecture|performing/,'藝術設計'],[/cooking|travel|pets|games|crafts|gardening|house|sports/,'休閒生活'],[/study aids|test/,'考試證照'],[/science|nature|mathematics|technology|psychology/,'科學科普'],[/history|philosophy|social|political|biography|education|law|true crime/,'人文社會']];
 for(const [re,c] of rules)if(re.test(t))return c;return ''}
async function lookupIsbn(isbn){
 try{const r=await fetch('https://www.googleapis.com/books/v1/volumes?q=isbn:'+isbn+gKeyParam());if(r.ok){const j=await r.json();const v=j.items&&j.items[0]&&j.items[0].volumeInfo;
  if(v&&v.title){const img=v.imageLinks&&(v.imageLinks.thumbnail||v.imageLinks.smallThumbnail);
   return {title:v.title+(v.subtitle&&/[\u4e00-\u9fff]/.test(v.title)?'：'+v.subtitle:''),author:(v.authors||[]).join('、'),cat:mapCat(v.categories),cover:img?img.replace(/^http:/,'https:').replace('&edge=curl',''):''}}}}catch(e){}
 try{const r=await fetch('https://openlibrary.org/isbn/'+isbn+'.json');if(r.ok){const j=await r.json();if(j.title){const ol=`https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;
  const ok=await new Promise(res=>{const i=new Image();i.onload=()=>res(i.naturalWidth>10);i.onerror=()=>res(false);i.src=ol});return {title:j.title,author:'',cat:mapCat(j.subjects),cover:ok?ol:''}}}}catch(e){}
 return null}
document.addEventListener('submit',async e=>{const f=e.target.closest('[data-isbnform]');if(!f)return;e.preventDefault();
 const inp=f.querySelector('input');const isbn=String(inp.value||'').replace(/[^0-9Xx]/g,'').toUpperCase();
 if(!validIsbn(isbn)){toast('ISBN 要是 10 碼或 13 碼數字，請再確認一次',true);inp.focus();return}
 const dup=S.books.find(b=>(b.isbn||'')===isbn);if(dup){toast(`《${dup.title}》已經在書櫃裡了`,true);return}
 const btn=f.querySelector('button');btn.disabled=true;btn.textContent='查詢中…';
 const info=await lookupIsbn(isbn);
 btn.disabled=false;btn.textContent='加入';
 const b={id:uid(),title:info?info.title:'ISBN '+isbn,author:info?info.author:'',isbn,cat:(info&&info.cat)||'其他',status:'wish',added:today(),finished:null};
 S.books.unshift(b);save();render();if(typeof enqueueCovers==='function')enqueueCovers();
 toast(info?`《${b.title}》已加入願望書單`:`查不到這個 ISBN 的書名，先用 ISBN 加入願望書單`);
 const again=document.querySelector('[data-isbnform] input');if(again)again.focus()});
lastSaved=JSON.stringify(S);

route();enqueueCovers();
