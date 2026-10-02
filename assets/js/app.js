const DATA_URL="/data/shortcuts.json";
const FAV_KEY="sp-favs";
const THEME_KEY="sp-theme";

const ICONS={
music:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 18V6l12-2v12"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
image:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.4"/><path d="M21 16l-5.5-5.5L7 19"/></svg>',
note:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 3h8l5 5v13H7z"/><path d="M15 3v5h5M9 13h6M9 17h4"/></svg>',
calendar:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
bell:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>',
scan:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 8V5h3M20 8V5h-3M4 16v3h3M20 16v3h-3"/><path d="M7 12h10"/></svg>',
spark:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l1.6 5.2L19 10l-5.4 1.8L12 17l-1.6-5.2L5 10l5.4-1.8z"/></svg>'
};

const CATEGORY_ICON={
featured:"spark",
productivity:"calendar",
utilities:"scan",
wellness:"bell",
uncategorized:"spark"
};

let catalog={};
let sectionOrder=[];
let query="";
let pickerValue="all";

const $=function(sel){
return document.querySelector(sel);
};

function favs(){
try{
return JSON.parse(localStorage.getItem(FAV_KEY)||"[]");
}catch(e){
return[];
}
}

function isFav(id){
return favs().includes(id);
}

function toggleFav(id){
const current=favs();
const next=isFav(id)?current.filter(function(x){return x!==id;}):current.concat([id]);
localStorage.setItem(FAV_KEY,JSON.stringify(next));
render();
}

function slug(value){
return String(value||"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")||"uncategorized";
}

function sectionId(name){
return"section-"+slug(name);
}

function pretty(name){
const value=String(name||"").replace(/[-_]+/g," ").trim();
if(value.toLowerCase()==="uncategorized")return"Uncategorized";
return value.replace(/\b\w/g,function(c){return c.toUpperCase();});
}

function normalizeData(data){
const result={};
const order=[];

function add(section,item){
let key=section||"Uncategorized";
if(String(key).toLowerCase()==="uncategorized")key="uncategorized";
if(!result[key]){
result[key]=[];
order.push(key);
}
result[key].push({
...item,
category:key
});
}

if(Array.isArray(data)){
data.forEach(function(item){
if(item&&typeof item==="object")add(item.category,item);
});
}else if(data&&typeof data==="object"){
Object.entries(data).forEach(function(entry){
const section=entry[0];
const items=entry[1];
if(Array.isArray(items)){
items.forEach(function(item){
if(item&&typeof item==="object")add(item.category||section,item);
});
}
});
}

if(result.uncategorized){
const index=order.indexOf("uncategorized");
if(index!==-1){
order.splice(index,1);
order.push("uncategorized");
}
}

return{
catalog:result,
order:order
};
}

function flatten(){
const out=[];
sectionOrder.forEach(function(section){
(catalog[section]||[]).forEach(function(item,index){
out.push({
...item,
category:section,
id:`${slug(section)}:${slug(item.title)}-${index}`
});
});
});
return out;
}

function filtered(){
const q=query.trim().toLowerCase();
return flatten().filter(function(item){
const hay=`${item.title||""} ${item.desc||""} ${item.badge||""} ${item.category||""}`.toLowerCase();
return!q||hay.includes(q);
});
}

function iconFor(item){
return ICONS[item.icon]||ICONS[CATEGORY_ICON[item.category]]||ICONS.spark;
}

function escapeHtml(value){
return String(value||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
}

function escapeAttr(value){
return escapeHtml(value).replaceAll("'","&#39;");
}

function cardHTML(item){
const saved=isFav(item.id);
return`<article class="card">
<div class="card-top">
<div class="icon-bubble">${iconFor(item)}</div>
<button class="fav ${saved?"on":""}" data-fav="${escapeAttr(item.id)}" aria-label="${saved?"Remove from saved":"Save shortcut"}">${saved?"★":"☆"}</button>
</div>
<div class="badge">${item.badge?escapeHtml(item.badge):escapeHtml(pretty(item.category))}</div>
<h3>${escapeHtml(item.title||"Untitled")}</h3>
<p>${escapeHtml(item.desc||"")}</p>
<div class="btns">
<a class="btn primary" href="${escapeAttr(item.link||"#")}" target="_blank" rel="noopener">Get Shortcut</a>
<button class="btn ghost" data-copy="${escapeAttr(item.link||"")}">Copy Link</button>
</div>
</article>`;
}

function renderPicker(){
const menu=$("#section-picker-menu");
if(!menu)return;

let html='<button class="section-option active" type="button" role="option" data-section="all">All Sections</button>';

sectionOrder.forEach(function(section){
html+=`<button class="section-option" type="button" role="option" data-section="${escapeAttr(sectionId(section))}">${escapeHtml(pretty(section))}</button>`;
});

html+='<button class="section-option" type="button" role="option" data-section="saved">Saved</button>';
menu.innerHTML=html;
}

function setPickerLabel(text){
const label=$("#section-picker-label");
if(label)label.textContent=text;
}

function closePicker(){
const picker=$("#section-picker");
const button=$("#section-picker-button");
if(picker)picker.classList.remove("open");
if(button)button.setAttribute("aria-expanded","false");
}

function openPicker(){
const picker=$("#section-picker");
const button=$("#section-picker-button");
if(picker)picker.classList.add("open");
if(button)button.setAttribute("aria-expanded","true");
}

function updatePickerActive(value){
document.querySelectorAll(".section-option").forEach(function(option){
option.classList.toggle("active",option.dataset.section===value);
});
}

function showSaved(){
const savedItems=flatten().filter(function(item){
return isFav(item.id);
});

const app=$("#app");
if(!app)return;

if(!savedItems.length){
app.innerHTML='<div class="empty">You have no saved shortcuts yet.</div>';
}else{
app.innerHTML=`<section class="shortcut-section" id="section-saved">
<div class="section-head">
<h2>Saved</h2>
<div class="meta">${savedItems.length}</div>
</div>
<div class="grid">${savedItems.map(cardHTML).join("")}</div>
</section>`;
}

app.scrollIntoView({
behavior:"smooth",
block:"start"
});
}

function selectSection(value,label){
pickerValue=value;
setPickerLabel(label);
updatePickerActive(value);
closePicker();

if(value==="saved"){
showSaved();
return;
}

render();

if(value==="all"){
window.scrollTo({
top:0,
behavior:"smooth"
});
return;
}

const target=document.getElementById(value);
if(target){
target.scrollIntoView({
behavior:"smooth",
block:"start"
});
}
}

function render(){
const items=filtered();
const count=$("#count");
const app=$("#app");

if(count){
count.textContent=`${items.length} shortcut${items.length===1?"":"s"}`;
}

if(!app)return;

if(!items.length){
app.innerHTML='<div class="empty">No shortcuts match that search. Try another word.</div>';
return;
}

app.innerHTML=sectionOrder.map(function(section){
const list=items.filter(function(item){
return item.category===section;
});

if(!list.length)return"";

return`<section class="shortcut-section" id="${escapeAttr(sectionId(section))}">
<div class="section-head">
<h2>${escapeHtml(pretty(section))}</h2>
<div class="meta">${list.length}</div>
</div>
<div class="grid">${list.map(cardHTML).join("")}</div>
</section>`;
}).join("");
}

function toast(msg){
const el=$("#toast");
if(!el)return;
el.textContent=msg;
el.classList.add("show");
clearTimeout(toast.timer);
toast.timer=setTimeout(function(){
el.classList.remove("show");
},1800);
}

function copyText(text){
if(!navigator.clipboard){
toast("Copy is not available");
return;
}

navigator.clipboard.writeText(text).then(function(){
toast("Link copied");
}).catch(function(){
toast("Could not copy");
});
}

function sun(){
return'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
}

function moon(){
return'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z"/></svg>';
}

function applyTheme(mode){
document.body.classList.toggle("light",mode==="light");
localStorage.setItem(THEME_KEY,mode);

const button=$("#theme-btn");
if(button)button.innerHTML=mode==="light"?moon():sun();
}

async function loadData(){
const response=await fetch(DATA_URL,{cache:"no-store"});
if(!response.ok)throw new Error(`HTTP ${response.status}`);

const data=await response.json();

if(!data||typeof data!=="object"){
throw new Error("Invalid shortcut JSON");
}

return data;
}

function bind(){
const search=$("#search");

if(search){
search.addEventListener("input",function(e){
query=e.target.value;
render();
});
}

document.addEventListener("keydown",function(e){
if(e.key==="/"&&document.activeElement&&document.activeElement.tagName!=="INPUT"){
e.preventDefault();
if(search)search.focus();
}
});

const pickerButton=$("#section-picker-button");

if(pickerButton){
pickerButton.addEventListener("click",function(e){
e.stopPropagation();

const picker=$("#section-picker");

if(picker&&picker.classList.contains("open")){
closePicker();
}else{
openPicker();
}
});
}

const pickerMenu=$("#section-picker-menu");

if(pickerMenu){
pickerMenu.addEventListener("click",function(e){
const option=e.target.closest(".section-option");
if(!option)return;

selectSection(
option.dataset.section,
option.textContent
);
});
}

document.addEventListener("click",function(e){
if(!e.target.closest("#section-picker")){
closePicker();
}
});

const app=$("#app");

if(app){
app.addEventListener("click",function(e){
const fav=e.target.closest("[data-fav]");
if(fav)toggleFav(fav.dataset.fav);

const copy=e.target.closest("[data-copy]");
if(copy)copyText(copy.dataset.copy);
});
}

const themeButton=$("#theme-btn");

if(themeButton){
themeButton.addEventListener("click",function(){
applyTheme(
document.body.classList.contains("light")?"dark":"light"
);
});
}

const menuButton=$("#menu-btn");

if(menuButton){
menuButton.addEventListener("click",function(){
const nav=$("#nav-links");
if(!nav)return;

const open=nav.classList.toggle("open");
menuButton.setAttribute("aria-expanded",open?"true":"false");
});
}
}

async function init(){
applyTheme(localStorage.getItem(THEME_KEY)||"dark");
bind();

try{
const raw=await loadData();
const normalized=normalizeData(raw);

catalog=normalized.catalog;
sectionOrder=normalized.order;

renderPicker();
render();
}catch(error){
console.error("Shortcut data failed to load:",error);

const app=$("#app");
const count=$("#count");

if(app){
app.innerHTML='<div class="empty">Could not load the shortcut library. Please refresh the page.</div>';
}

if(count){
count.textContent="0 shortcuts";
}
}
}

init();
