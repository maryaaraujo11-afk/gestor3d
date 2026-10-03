
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");

// Carrega .env sem dependências externas.
const ENV_FILE = path.join(__dirname, ".env");
if (fs.existsSync(ENV_FILE)) {
  for (const line of fs.readFileSync(ENV_FILE, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
}

const PORT = Number(process.env.PORT || 3000);
const PARTNER_ID = String(process.env.SHOPEE_PARTNER_ID || "");
const PARTNER_KEY = String(process.env.SHOPEE_PARTNER_KEY || "");
const BASE = "https://partner.shopeemobile.com";
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "shopee.json");

fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({shops:{}, processedOrders:[]}, null, 2));

function db(){ return JSON.parse(fs.readFileSync(DB_FILE,"utf8")); }
function saveDb(x){ fs.writeFileSync(DB_FILE, JSON.stringify(x,null,2)); }

function json(res, code, body){
  const out=JSON.stringify(body);
  res.writeHead(code, {"Content-Type":"application/json; charset=utf-8","Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type","Access-Control-Allow-Methods":"GET,POST,OPTIONS"});
  res.end(out);
}
function readBody(req){
  return new Promise((resolve,reject)=>{
    let s=""; req.on("data",c=>s+=c); req.on("end",()=>{try{resolve(s?JSON.parse(s):{})}catch(e){reject(e)}}); req.on("error",reject);
  });
}
function sign(pathname, timestamp, accessToken="", shopId=""){
  const base = `${PARTNER_ID}${pathname}${timestamp}${accessToken}${shopId}`;
  return crypto.createHmac("sha256", PARTNER_KEY).update(base).digest("hex");
}
function authSign(pathname,timestamp){
  return crypto.createHmac("sha256", PARTNER_KEY).update(`${PARTNER_ID}${pathname}${timestamp}`).digest("hex");
}
function requireCreds(res){
  if(!PARTNER_ID || !PARTNER_KEY){
    json(res,500,{ok:false,error:"Configure SHOPEE_PARTNER_ID e SHOPEE_PARTNER_KEY no .env antes de conectar."});
    return false;
  }
  return true;
}
function shop(id){
  return db().shops[String(id)] || null;
}
function authUrl(store){
  const pathname="/api/v2/shop/auth_partner";
  const ts=Math.floor(Date.now()/1000);
  const redirect=`${process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`}/api/shopee/callback/${store}`;
  const u=new URL(BASE+pathname);
  u.searchParams.set("partner_id",PARTNER_ID);
  u.searchParams.set("timestamp",String(ts));
  u.searchParams.set("sign",authSign(pathname,ts));
  u.searchParams.set("redirect",redirect);
  return u.toString();
}
async function shopee(pathname, method, s, query={}, body=null){
  if(!PARTNER_ID||!PARTNER_KEY) throw new Error("Credenciais Shopee ausentes.");
  const timestamp=Math.floor(Date.now()/1000);
  const sid=String(s.shop_id);
  const sg=sign(pathname,timestamp,s.access_token,sid);
  const u=new URL(BASE+pathname);
  u.searchParams.set("partner_id",PARTNER_ID);
  u.searchParams.set("timestamp",String(timestamp));
  u.searchParams.set("access_token",s.access_token);
  u.searchParams.set("shop_id",sid);
  u.searchParams.set("sign",sg);
  Object.entries(query||{}).forEach(([k,v])=>{ if(v!==undefined&&v!==null) u.searchParams.set(k,String(v)); });
  const r=await fetch(u,{method,headers:{"Content-Type":"application/json"},body:body?JSON.stringify(body):undefined});
  const t=await r.text(); let data; try{data=JSON.parse(t)}catch{data={raw:t}};
  if(!r.ok || data.error) {
    const e=new Error(data.message || data.error || `Shopee HTTP ${r.status}`); e.data=data; throw e;
  }
  return data;
}
async function exchangeCode(code, shopId){
  const u=BASE+"/api/v2/auth/token/get";
  const r=await fetch(u,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code,shop_id:Number(shopId),partner_id:Number(PARTNER_ID)})});
  const data=await r.json();
  if(!r.ok || data.error) throw new Error(data.message||data.error||"Falha ao trocar code por token.");
  return data;
}
async function refresh(storeId){
  const d=db(), s=d.shops[String(storeId)];
  if(!s?.refresh_token) throw new Error("Loja não possui refresh_token.");
  const r=await fetch(BASE+"/api/v2/auth/access_token/get",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({refresh_token:s.refresh_token,shop_id:Number(s.shop_id),partner_id:Number(PARTNER_ID)})
  });
  const data=await r.json();
  if(!r.ok || data.error) throw new Error(data.message||data.error||"Falha ao renovar token.");
  s.access_token=data.access_token; s.refresh_token=data.refresh_token; s.access_expire_at=Date.now()+Number(data.expire_in||14400)*1000;
  d.shops[String(storeId)]=s; saveDb(d); return s;
}
async function withRefresh(storeId, fn){
  let s=shop(storeId);
  if(!s) throw new Error("Loja não conectada.");
  if(!s.access_token || (s.access_expire_at && Date.now()>s.access_expire_at-60000)) s=await refresh(storeId);
  try{return await fn(s)}catch(e){
    if(String(e.message).toLowerCase().includes("token") || String(e.message).toLowerCase().includes("access")){
      s=await refresh(storeId); return await fn(s);
    }
    throw e;
  }
}

function serveStatic(req,res){
  let requestPath = (req.url || "/").split("?")[0];

  if (requestPath === "/" || requestPath === "") {
    requestPath = "/index.html";
  }

  const relativePath = decodeURIComponent(requestPath).replace(/^\/+/, "");
  const publicDir = path.resolve(__dirname, "public");
  const file = path.resolve(publicDir, relativePath);

  if (file !== publicDir && !file.startsWith(publicDir + path.sep)) {
    return json(res,403,{error:"forbidden"});
  }

  if (!fs.existsSync(file)) {
    console.log("Arquivo não encontrado:", file);
    console.log("Diretório atual:", __dirname);
    console.log("public existe:", fs.existsSync(publicDir));

    return json(res,404,{
      ok:false,
      error:"not found",
      requested:requestPath,
      file:file
    });
  }

  const ext=path.extname(file).toLowerCase();

  const types={
    ".html":"text/html; charset=utf-8",
    ".js":"text/javascript; charset=utf-8",
    ".css":"text/css; charset=utf-8",
    ".webmanifest":"application/manifest+json; charset=utf-8",
    ".json":"application/json; charset=utf-8",
    ".png":"image/png",
    ".jpg":"image/jpeg",
    ".jpeg":"image/jpeg",
    ".webp":"image/webp",
    ".svg":"image/svg+xml",
    ".ico":"image/x-icon"
  };

  res.writeHead(200,{
    "Content-Type":types[ext]||"application/octet-stream",
    "Cache-Control":"no-cache"
  });

  fs.createReadStream(file).pipe(res);
}

const server=http.createServer(async(req,res)=>{
  if(req.method==="OPTIONS"){res.writeHead(204,{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type","Access-Control-Allow-Methods":"GET,POST,OPTIONS"});return res.end();}
  const u=new URL(req.url,`http://${req.headers.host}`);
  try{
    if(u.pathname==="/api/shopee/authorize/1" || u.pathname==="/api/shopee/authorize/2"){
      if(!requireCreds(res))return;
      return json(res,200,{ok:true,store:u.pathname.endsWith("/1")?1:2,url:authUrl(u.pathname.endsWith("/1")?1:2)});
    }
    const cb=u.pathname.match(/^\/api\/shopee\/callback\/([12])$/);
    if(cb){
      const storeId=cb[1], code=u.searchParams.get("code"), shopId=u.searchParams.get("shop_id");
      if(!code||!shopId)return json(res,400,{ok:false,error:"Shopee não retornou code/shop_id."});
      if(!requireCreds(res))return;
      const tok=await exchangeCode(code,shopId); const d=db();
      d.shops[storeId]={store:storeId,shop_id:String(shopId),access_token:tok.access_token,refresh_token:tok.refresh_token,access_expire_at:Date.now()+Number(tok.expire_in||14400)*1000,connected_at:new Date().toISOString()};
      saveDb(d);
      res.writeHead(302,{Location:`/?shopee_connected=${storeId}`}); return res.end();
    }
    if(u.pathname==="/api/shopee/status"){
      const d=db(); const out={};
      for(const k of ["1","2"]){const s=d.shops[k];out[k]=s?{connected:true,shop_id:s.shop_id,connected_at:s.connected_at,access_expire_at:s.access_expire_at}:{connected:false};}
      return json(res,200,{ok:true,stores:out});
    }
    const sync=u.pathname.match(/^\/api\/shopee\/sync\/([12])$/);
    if(sync && req.method==="POST"){
      const store=sync[1];
      const orders=await withRefresh(store,s=>shopee("/api/v2/order/get_order_list","GET",s,{
        time_range_field:"update_time",time_from:Math.floor(Date.now()/1000)-7*86400,time_to:Math.floor(Date.now()/1000),
        page_size:100,response_optional_fields:"order_status","cursor":""
      }));
      const list=orders.response?.order_list||orders.order_list||[];
      const details=[];
      for(const o of list.slice(0,50)){
        try{
          const d=await withRefresh(store,s=>shopee("/api/v2/order/get_order_detail","GET",s,{
            order_sn_list:o.order_sn,response_optional_fields:"order_status,total_amount,item_list"
          }));
          details.push(d);
        }catch(e){ details.push({order_sn:o.order_sn,error:e.message}); }
      }
      return json(res,200,{ok:true,store,orders:list,details});
    }
    const products=u.pathname.match(/^\/api\/shopee\/products\/([12])$/);
    if(products && req.method==="GET"){
      const store=products[1];
      const data=await withRefresh(store,s=>shopee("/api/v2/product/get_item_list","GET",s,{offset:0,page_size:100,need_total_count:true,})); 
      return json(res,200,{ok:true,data});
    }
    const stock=u.pathname.match(/^\/api\/shopee\/stock\/([12])$/);
    if(stock && req.method==="POST"){
      const store=stock[1], body=await readBody(req);
      const result=await withRefresh(store,s=>shopee("/api/v2/product/update_stock","POST",s,{},body));
      return json(res,200,{ok:true,result});
    }
    if(u.pathname==="/api/shopee/refresh/1" || u.pathname==="/api/shopee/refresh/2"){
      const store=u.pathname.endsWith("/1")?1:2; await refresh(store); return json(res,200,{ok:true});
    }
    if(req.url.startsWith("/api/")) return json(res,404,{ok:false,error:"Endpoint não encontrado."});
    return serveStatic(req,res);
  }catch(e){
    console.error(e);
    return json(res,500,{ok:false,error:e.message,data:e.data||null});
  }
});
server.listen(PORT,"0.0.0.0",()=>console.log(`Gestor 3D + Shopee em http://0.0.0.0:${PORT}`));
