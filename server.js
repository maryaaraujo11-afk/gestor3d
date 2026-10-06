
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
const PARTNER_ID = String(process.env.SHOPEE_PARTNER_ID || "").trim();
const PARTNER_KEY = String(process.env.SHOPEE_PARTNER_KEY || "").trim();
const SHOPEE_ENV = String(process.env.SHOPEE_ENV || "production").trim().toLowerCase();
// No Sandbox v2, a autorização/token usa o host OpenPlatform; as APIs de loja usam o host Partner.
const BASE = SHOPEE_ENV === "sandbox" ? "https://openplatform.sandbox.test-stable.shopee.sg" : "https://partner.shopeemobile.com";
const API_BASE = BASE;
const SUPABASE_URL = String(process.env.SUPABASE_URL || "https://givfacbmlhjizrmgguzi.supabase.co").replace(/\/$/, "");
const SUPABASE_PUBLISHABLE_KEY = String(process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_-RaV-4hmFnLPyGhewGQZeg_1I_fs_wH");
const SUPABASE_SERVICE_ROLE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "");
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "shopee.json");

fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({shops:{}, processedOrders:[]}, null, 2));

function db(){ return JSON.parse(fs.readFileSync(DB_FILE,"utf8")); }
function saveDb(x){ fs.writeFileSync(DB_FILE, JSON.stringify(x,null,2)); }

function json(res, code, body, extraHeaders={}){
  const out=JSON.stringify(body);
  res.writeHead(code, {"Content-Type":"application/json; charset=utf-8","Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type, Authorization","Access-Control-Allow-Methods":"GET,POST,OPTIONS",...extraHeaders});
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
function getBearer(req){
  const h=String(req.headers.authorization||"");
  return h.startsWith("Bearer ")?h.slice(7).trim():"";
}
async function getAuthUser(req){
  const token=getBearer(req);
  if(!token) return null;
  const r=await fetch(SUPABASE_URL+"/auth/v1/user",{
    headers:{apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:"Bearer "+token}
  });
  if(!r.ok) return null;
  return await r.json();
}
function requireSupabase(res){
  if(!SUPABASE_SERVICE_ROLE_KEY){
    json(res,500,{ok:false,error:"SUPABASE_SERVICE_ROLE_KEY ainda não foi configurada no Render."});
    return false;
  }
  return true;
}
async function supabaseAdmin(pathname,method="GET",body=null,query=""){
  if(!SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada.");
  const r=await fetch(SUPABASE_URL+"/rest/v1/"+pathname+query,{
    method,
    headers:{
      apikey:SUPABASE_SERVICE_ROLE_KEY,
      Authorization:"Bearer "+SUPABASE_SERVICE_ROLE_KEY,
      "Content-Type":"application/json",
      Prefer:"resolution=merge-duplicates,return=representation"
    },
    body:body===null?undefined:JSON.stringify(body)
  });
  const t=await r.text(); let data;
  try{data=t?JSON.parse(t):null}catch{data={raw:t}}
  if(!r.ok) throw new Error(data?.message||data?.hint||data?.details||"Erro no Supabase.");
  return data;
}
async function getStore(userId,storeId){
  const rows=await supabaseAdmin(
    "gestor3d_shopee_stores",
    "GET",
    null,
    "?user_id=eq."+encodeURIComponent(userId)+"&store_slot=eq."+encodeURIComponent(storeId)+"&limit=1"
  );
  return Array.isArray(rows)&&rows[0]?rows[0]:null;
}
async function saveStore(userId,storeId,shopId,tok){
  const rows=await supabaseAdmin(
    "gestor3d_shopee_stores?on_conflict=user_id,store_slot",
    "POST",
    {
      user_id:userId,
      store_slot:Number(storeId),
      shop_id:String(shopId),
      access_token:tok.access_token,
      refresh_token:tok.refresh_token,
      access_expire_at:new Date(Date.now()+Number(tok.expire_in||14400)*1000).toISOString(),
      connected_at:new Date().toISOString(),
      updated_at:new Date().toISOString()
    }
  );
  return Array.isArray(rows)&&rows[0]?rows[0]:null;
}
async function updateStoreTokens(row,tok){
  const rows=await supabaseAdmin(
    "gestor3d_shopee_stores",
    "PATCH",
    {
      access_token:tok.access_token,
      refresh_token:tok.refresh_token,
      access_expire_at:new Date(Date.now()+Number(tok.expire_in||14400)*1000).toISOString(),
      updated_at:new Date().toISOString()
    },
    "?user_id=eq."+encodeURIComponent(row.user_id)+"&store_slot=eq."+encodeURIComponent(row.store_slot)
  );
  return Array.isArray(rows)&&rows[0]?rows[0]:{...row,...tok};
}
function setOAuthCookie(res,store,accessToken){
  const value=encodeURIComponent(accessToken);
  res.setHeader("Set-Cookie",`gestor3d_shopee_oauth_${store}=${value}; HttpOnly; Secure; SameSite=Lax; Max-Age=600; Path=/api/shopee/callback/${store}`);
}
function getCookie(req,name){
  const raw=String(req.headers.cookie||"");
  for(const part of raw.split(";")){
    const [k,...rest]=part.trim().split("=");
    if(k===name)return decodeURIComponent(rest.join("="));
  }
  return "";
}
function clearOAuthCookie(res,store){
  res.setHeader("Set-Cookie",`gestor3d_shopee_oauth_${store}=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/api/shopee/callback/${store}`);
}

function authUrl(store){
  // Fluxo de autorização atual da Shopee Open Platform.
  // O Console valida o domínio do redirect_uri; a URL nova usa /auth.
  const basePublic=process.env.PUBLIC_BASE_URL || ("http://localhost:"+PORT);
  const redirect=basePublic+"/api/shopee/callback/"+store;
  const u=new URL(SHOPEE_ENV === "sandbox" ? "https://open.sandbox.test-stable.shopee.com/auth" : "https://open.shopee.com/auth");
  u.searchParams.set("partner_id",PARTNER_ID);
  u.searchParams.set("auth_type","seller");
  u.searchParams.set("redirect_uri",redirect);
  u.searchParams.set("response_type","code");
  return u.toString();
}
async function shopee(pathname, method, s, query={}, body=null){
  if(!PARTNER_ID||!PARTNER_KEY) throw new Error("Credenciais Shopee ausentes.");
  const buildSignature=(timestamp,token,shopId,mode,key)=>{
    const base=
      mode==="partner_path_ts" ? String(PARTNER_ID)+pathname+String(timestamp) :
      mode==="partner_path_ts_token" ? String(PARTNER_ID)+pathname+String(timestamp)+String(token) :
      String(PARTNER_ID)+pathname+String(timestamp)+String(token)+String(shopId);
    return crypto.createHmac("sha256",key).update(base).digest("hex");
  };
  const attempt=async(mode,key)=>{
    const timestamp=Math.floor(Date.now()/1000);
    const u=new URL(API_BASE+pathname);
    u.searchParams.set("partner_id",PARTNER_ID);
    u.searchParams.set("timestamp",String(timestamp));
    u.searchParams.set("access_token",String(s.access_token));
    u.searchParams.set("shop_id",String(s.shop_id));
    u.searchParams.set("sign",buildSignature(timestamp,s.access_token,s.shop_id,mode,key));
    Object.entries(query||{}).forEach(([k,v])=>{
      if(v===undefined||v===null)return;
      if(Array.isArray(v))v=v.join(",");
      u.searchParams.set(k,String(v));
    });
    const r=await fetch(u,{method,headers:{"Content-Type":"application/json"},body:body?JSON.stringify(body):undefined});
    const t=await r.text();
    let data; try{data=JSON.parse(t)}catch{data={raw:t}};
    return {r,data,mode};
  };

  // Shop APIs usam a assinatura padrão com partner_id + path + timestamp + access_token + shop_id
  // e a Partner Key exatamente como fornecida pelo Console.
  const key=String(PARTNER_KEY);
  const out=await attempt("partner_path_ts_token_shop",key);
  const last=out;
  if(out.r.ok && !out.data?.error)return out.data;

  const data=last?.data||{};
  const e=new Error(
    (data.message||data.error||`Shopee HTTP ${last?.r?.status||0}`) +
    ` | request_id=${data.request_id||"—"} | env=${SHOPEE_ENV} | partner_id=${PARTNER_ID} | host=${new URL(API_BASE).host} | path=${pathname} | signature_mode=${last?.mode||"—"}`
  );
  e.data=data;
  throw e;
}
async function exchangeCode(code, shopId){
  const pathname="/api/v2/auth/token/get";
  const timestamp=Math.floor(Date.now()/1000);
  // Regra oficial da Public API: partner_id + api_path + timestamp.
  const base=String(PARTNER_ID)+pathname+String(timestamp);
  const signValue=crypto.createHmac("sha256",PARTNER_KEY).update(base).digest("hex");
  const u=new URL(BASE+pathname);
  u.searchParams.set("partner_id",String(PARTNER_ID));
  u.searchParams.set("timestamp",String(timestamp));
  u.searchParams.set("sign",signValue);
  const body={code:String(code),partner_id:Number(PARTNER_ID)};
  if(shopId)body.shop_id=Number(shopId);
  const r=await fetch(u,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  const data=await r.json().catch(()=>({}));
  if(!r.ok || data.error){
    const key=String(PARTNER_KEY);
    const details=[
      data?.message||data?.error||("Falha HTTP "+r.status+" ao trocar code por token."),
      data?.request_id?("request_id="+data.request_id):"",
      "env="+SHOPEE_ENV,
      "partner_id="+PARTNER_ID,
      "host="+new URL(BASE).host,
      "path="+pathname,
      "key_length="+key.length,
      "key_prefix="+key.slice(0,4),
      "key_suffix="+key.slice(-4)
    ].filter(Boolean).join(" | ");
    throw new Error(details);
  }
  if(!data.access_token || !data.refresh_token) throw new Error("A Shopee não retornou access_token/refresh_token após a autorização.");
  return data;
}
async function refresh(userId,storeId){
  const s=await getStore(userId,storeId);
  if(!s?.refresh_token) throw new Error("Loja não conectada ou sem refresh_token.");
  const pathname="/api/v2/auth/access_token/get";
  const timestamp=Math.floor(Date.now()/1000);
  const u=new URL(BASE+pathname);
  u.searchParams.set("partner_id",PARTNER_ID);
  u.searchParams.set("timestamp",String(timestamp));
  u.searchParams.set("sign",authSign(pathname,timestamp));
  const r=await fetch(u,{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({refresh_token:s.refresh_token,shop_id:Number(s.shop_id),partner_id:Number(PARTNER_ID)})
  });
  const data=await r.json();
  if(!r.ok || data.error) throw new Error(data.message||data.error||"Falha ao renovar token.");
  return await updateStoreTokens(s,data);
}
async function withRefresh(userId,storeId, fn){
  let s=await getStore(userId,storeId);
  if(!s) throw new Error("Loja não conectada.");
  if(!s.access_token || (s.access_expire_at && Date.now()>new Date(s.access_expire_at).getTime()-60000)) s=await refresh(userId,storeId);
  try{return await fn(s)}catch(e){
    if(String(e.message).toLowerCase().includes("token") || String(e.message).toLowerCase().includes("access")){
      s=await refresh(userId,storeId); return await fn(s);
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
  if(req.method==="OPTIONS"){res.writeHead(204,{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type, Authorization","Access-Control-Allow-Methods":"GET,POST,OPTIONS"});return res.end();}
  const u=new URL(req.url,`http://${req.headers.host}`);
  try{
    if(u.pathname==="/api/shopee/authorize/1" || u.pathname==="/api/shopee/authorize/2"){
      if(!requireCreds(res) || !requireSupabase(res))return;
      const storeId=u.pathname.endsWith("/1")?1:2;
      const user=await getAuthUser(req);
      if(!user)return json(res,401,{ok:false,error:"Sessão do Gestor 3D não autenticada."});
      const token=getBearer(req);
      setOAuthCookie(res,storeId,token);
      return json(res,200,{ok:true,store:storeId,url:authUrl(storeId)});
    }
    const cb=u.pathname.match(/^\/api\/shopee\/callback\/([12])$/);
    if(cb){
      const storeId=cb[1], code=u.searchParams.get("code"), shopId=u.searchParams.get("shop_id");
      const sessionToken=getCookie(req,`gestor3d_shopee_oauth_${storeId}`);
      clearOAuthCookie(res,storeId);
      if(!code||!shopId)return json(res,400,{ok:false,error:"Shopee não retornou code/shop_id."});
      if(!sessionToken)return json(res,401,{ok:false,error:"A autorização expirou. Volte ao Gestor 3D e conecte a loja novamente."});
      if(!requireCreds(res) || !requireSupabase(res))return;
      const userReq={headers:{authorization:"Bearer "+sessionToken}};
      const user=await getAuthUser(userReq);
      if(!user)return json(res,401,{ok:false,error:"A sessão do Gestor 3D expirou. Faça login novamente."});
      const tok=await exchangeCode(code,shopId);
      await saveStore(user.id,storeId,shopId,tok);
      res.writeHead(302,{Location:`/?shopee_connected=${storeId}`}); return res.end();
    }
    if(u.pathname==="/api/shopee/status"){
      if(!requireSupabase(res))return;
      const user=await getAuthUser(req);
      if(!user)return json(res,401,{ok:false,error:"Sessão do Gestor 3D não autenticada."});
      const rows=await supabaseAdmin("gestor3d_shopee_stores","GET",null,"?user_id=eq."+encodeURIComponent(user.id)+"&order=store_slot.asc");
      const out={};
      for(const k of [1,2]){
        const s=(Array.isArray(rows)?rows:[]).find(x=>Number(x.store_slot)===k);
        out[k]=s?{connected:true,shop_id:s.shop_id,connected_at:s.connected_at,access_expire_at:s.access_expire_at}:{connected:false};
      }
      return json(res,200,{ok:true,stores:out});
    }
    const sync=u.pathname.match(/^\/api\/shopee\/sync\/([12])$/);
    if(sync && req.method==="POST"){
      const store=sync[1];
      if(!requireSupabase(res))return;
      const user=await getAuthUser(req);
      if(!user)return json(res,401,{ok:false,error:"Sessão do Gestor 3D não autenticada."});
      const orders=await withRefresh(user.id,store,s=>shopee("/api/v2/order/get_order_list","GET",s,{
        time_range_field:"update_time",time_from:Math.floor(Date.now()/1000)-7*86400,time_to:Math.floor(Date.now()/1000),
        page_size:100,response_optional_fields:"order_status","cursor":""
      }));
      const list=orders.response?.order_list||orders.order_list||[];
      const details=[];
      for(const o of list.slice(0,50)){
        try{
          const d=await withRefresh(user.id,store,s=>shopee("/api/v2/order/get_order_detail","GET",s,{
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
      if(!requireSupabase(res))return;
      const user=await getAuthUser(req);
      if(!user)return json(res,401,{ok:false,error:"Sessão do Gestor 3D não autenticada."});
      const data=await withRefresh(user.id,store,s=>shopee("/api/v2/product/get_item_list","GET",s,{offset:0,page_size:100,need_total_count:true,item_status:"NORMAL"})); 
      return json(res,200,{ok:true,data});
    }
    const stock=u.pathname.match(/^\/api\/shopee\/stock\/([12])$/);
    if(stock && req.method==="POST"){
      const store=stock[1];
      if(!requireSupabase(res))return;
      const user=await getAuthUser(req);
      if(!user)return json(res,401,{ok:false,error:"Sessão do Gestor 3D não autenticada."});
      const body=await readBody(req);
      const result=await withRefresh(user.id,store,s=>shopee("/api/v2/product/update_stock","POST",s,{},body));
      return json(res,200,{ok:true,result});
    }
    if(u.pathname==="/api/shopee/refresh/1" || u.pathname==="/api/shopee/refresh/2"){
      if(!requireSupabase(res))return;
      const user=await getAuthUser(req);
      if(!user)return json(res,401,{ok:false,error:"Sessão do Gestor 3D não autenticada."});
      const store=u.pathname.endsWith("/1")?1:2; await refresh(user.id,store); return json(res,200,{ok:true});
    }
    if(req.url.startsWith("/api/")) return json(res,404,{ok:false,error:"Endpoint não encontrado."});
    return serveStatic(req,res);
  }catch(e){
    console.error(e);
    return json(res,500,{ok:false,error:e.message,data:e.data||null});
  }
});
server.listen(PORT,"0.0.0.0",()=>console.log(`Gestor 3D + Shopee em http://0.0.0.0:${PORT}`));
