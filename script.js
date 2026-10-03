
const KEY='gestor3d_v1';
let db=JSON.parse(localStorage.getItem(KEY)||'{"products":[],"sales":[],"materials":[]}');
db.materials=db.materials||[];
db.categories=db.categories||[
 {name:"Filamento",color:"#5b8def"},
 {name:"Componente",color:"#8b5cf6"},
 {name:"Embalagem",color:"#e3a008"},
 {name:"Outro",color:"#7c8b93"}
];
let editingMaterialId=null;
db.movements=db.movements||[];
db.quotes=db.quotes||[];
db.purchases=db.purchases||[];
db.materials.forEach(m=>{if(m.minStock===undefined)m.minStock=0;}); db.products.forEach(p=>{if(p.printHours===undefined)p.printHours=0; if(p.stockManaged===undefined)p.stockManaged=false;});
function categoryInfo(name){ return (db.categories||[]).find(c=>c.name===name) || {name:name||"Sem categoria",color:"#7c8b93"}; }
function categoryBadge(name){ const c=categoryInfo(name); return `<span class="category-badge" style="background:${c.color}18;color:${c.color}"><span class="category-dot" style="background:${c.color}"></span>${c.name}</span>`; }
function renderCategorySelect(){ const el=document.getElementById("mCategory"); if(!el)return; const current=el.value; el.innerHTML=(db.categories||[]).map(c=>`<option value="${c.name}">${c.name}</option>`).join(""); if(current && (db.categories||[]).some(c=>c.name===current))el.value=current; }
function renderCategories(){ const box=document.getElementById("categoriesList"); if(!box)return; box.innerHTML=(db.categories||[]).map((c,i)=>`<div class="category-item"><input class="color-input" type="color" value="${c.color}" onchange="updateCategoryColor(${i},this.value)"><div style="flex:1"><b>${c.name}</b><div class="sub">${(db.materials||[]).filter(m=>m.category===c.name).length} material(is)</div></div>${categoryBadge(c.name)}<button class="btn xs outline" onclick="renameCategory(${i})">Editar</button><button class="btn xs danger" onclick="deleteCategory(${i})">Excluir</button></div>`).join("")||'<div class="sub">Nenhuma categoria cadastrada.</div>'; }
function addCategory(){ const input=document.getElementById("newCategoryName"), color=document.getElementById("newCategoryColor"); const name=input.value.trim(); if(!name){alert("Informe o nome da categoria.");return;} if((db.categories||[]).some(c=>c.name.toLowerCase()===name.toLowerCase())){alert("Essa categoria já existe.");return;} db.categories.push({name,color:color.value||"#8b5e4a"}); save(); renderCategorySelect(); renderCategories(); input.value=""; }
function updateCategoryColor(i,color){ if(!db.categories[i])return; db.categories[i].color=color; save(); renderCategories(); }
function renameCategory(i){ const c=db.categories[i]; if(!c)return; const name=prompt("Novo nome da categoria:",c.name); if(name===null)return; const n=name.trim(); if(!n||n===c.name)return; if(db.categories.some((x,j)=>j!==i&&x.name.toLowerCase()===n.toLowerCase())){alert("Essa categoria já existe.");return;} db.materials.forEach(m=>{if(m.category===c.name)m.category=n;}); c.name=n; save(); renderCategorySelect(); renderCategories(); }
function deleteCategory(i){ const c=db.categories[i]; if(!c)return; const used=db.materials.filter(m=>m.category===c.name); if(used.length){alert(`Não é possível excluir "${c.name}" porque ela está sendo usada por ${used.length} material(is). Edite os materiais para outra categoria primeiro.`);return;} if(db.categories.length<=1){alert("Mantenha pelo menos uma categoria.");return;} if(!confirm(`Excluir a categoria "${c.name}"?`))return; db.categories.splice(i,1); save(); renderCategorySelect(); renderCategories(); }
function openMaterialNew(){ editingMaterialId=null; document.getElementById("materialFormTitle").textContent="Novo material"; document.getElementById("materialForm").classList.remove("hidden"); clearMaterialForm(); renderCategorySelect(); }
function closeMaterialForm(){ editingMaterialId=null; document.getElementById("materialForm").classList.add("hidden"); clearMaterialForm(); }
function clearMaterialForm(){ ["mName","mBrand","mType","mColor","mPurchaseQty","mPurchasePrice","mSupplier","mStock","mMinStock"].forEach(id=>{const e=document.getElementById(id);if(e)e.value="";}); if(document.getElementById("mMinStock"))document.getElementById("mMinStock").value=0; if(document.getElementById("mCategory"))document.getElementById("mCategory").selectedIndex=0; if(document.getElementById("mUnit"))document.getElementById("mUnit").selectedIndex=0; updateMaterialPreview(); }
function editMaterial(id){ const m=db.materials.find(x=>String(x.id)===String(id)); if(!m)return; editingMaterialId=m.id; document.getElementById("materialFormTitle").textContent="Editar material"; document.getElementById("materialForm").classList.remove("hidden"); renderCategorySelect(); document.getElementById("mName").value=m.name||""; document.getElementById("mCategory").value=m.category||""; document.getElementById("mBrand").value=m.brand||""; document.getElementById("mType").value=m.type||""; document.getElementById("mColor").value=m.color||""; document.getElementById("mUnit").value=m.unit||"unidades"; document.getElementById("mPurchaseQty").value=m.purchaseQty??""; document.getElementById("mPurchasePrice").value=m.purchasePrice??""; document.getElementById("mSupplier").value=m.supplier||""; document.getElementById("mStock").value=m.stock??0; document.getElementById("mMinStock").value=m.minStock??0; updateMaterialPreview(); document.getElementById("materialForm").scrollIntoView({behavior:"smooth",block:"start"}); }
function deleteMaterial(id){ const m=db.materials.find(x=>String(x.id)===String(id)); if(!m)return; const used=db.products.filter(p=>(p.materials||[]).some(r=>String(r.materialId)===String(id))); if(used.length){alert(`Não é possível excluir "${m.name}" porque ele está na receita de ${used.length} produto(s). Edite essas receitas primeiro.`);return;} if(!confirm(`Excluir o material "${m.name}" do estoque?`))return; db.materials=db.materials.filter(x=>String(x.id)!==String(id)); save(); }

function seedTagProduct(){
 const has=db.products.some(p=>p.name==="TAG em Papel Fotográfico com Brinco");
 if(has)return;
 const paper={id:Date.now()+11,name:"Papel Fotográfico",category:"Outro",brand:"",type:"Papel fotográfico",color:"",unit:"folhas",purchaseQty:50,purchasePrice:19.90,supplier:"",stock:50,minStock:5,unitCost:19.90/50};
 const earring={id:Date.now()+12,name:"Brinco",category:"Componente",brand:"",type:"Brinco",color:"",unit:"unidades",purchaseQty:1000,purchasePrice:51,supplier:"",stock:1000,minStock:50,unitCost:51/1000};
 db.materials.push(paper,earring);
 db.purchases=db.purchases||[];
 db.purchases.unshift({id:Date.now()+13,date:new Date().toLocaleDateString("pt-BR"),material:"Papel Fotográfico",qty:50,unit:"folhas",value:19.90,supplier:""});
 db.purchases.unshift({id:Date.now()+14,date:new Date().toLocaleDateString("pt-BR"),material:"Brinco",qty:1000,unit:"unidades",value:51,supplier:""});
 db.products.push({id:Date.now()+15,name:"TAG em Papel Fotográfico com Brinco",sku:"TAG-PAPEL-BRINCO",store:"F4R Studio 3D",shopeeSku:"",shopeeName:"",materials:[{materialId:paper.id,name:paper.name,qty:1/15,unit:"folhas",unitCost:paper.unitCost},{materialId:earring.id,name:earring.name,qty:2,unit:"unidades",unitCost:earring.unitCost}],components:[],filamentCost:(1/15)*paper.unitCost+2*earring.unitCost,pack:0,labor:0,other:0,fee:20,margin:30,stock:0,printHours:0,shopeeItemId:"",shopeeModelId:"0",stockManaged:false});
 localStorage.setItem(KEY,JSON.stringify(db));
}
seedTagProduct();

// Migração inicial: garante apenas UMA cópia do pedido que estava sendo cadastrado antes do erro da V28.
function seedPedidoEmAndamento(){
 const key="pedido_20261001_1036_50_7590";
 db.sales=db.sales||[];
 const matches=db.sales.filter(s=>
   String(s.dateISO||"")==="2026-10-01" && String(s.time||"")==="10:36" &&
   Number(s.qty||0)===50 && Math.abs((Number(s.grossValue??s.value)||0)-75.90)<0.001 &&
   String(s.store||"")==="F4RM 3D" && String(s.product||"").toLowerCase().includes("kit chaveiros outubro rosa")
 );
 if(matches.length){
   const keep=matches[0];
   keep.manualKey=key; keep.dateISO="2026-10-01"; keep.time="10:36"; keep.dueDate=keep.dueDate||"2026-10-06"; keep.postDays=keep.postDays||3;
   // Remove cópias criadas em versões anteriores.
   db.sales=db.sales.filter(s=>s===keep || !matches.includes(s));
   localStorage.setItem(KEY,JSON.stringify(db));
   return;
 }
 const p=db.products.find(x=>String(x.name||"").toLowerCase().includes("kit chaveiros outubro rosa"));
 const gross=75.90, net=56.22, qty=50, packaging=Number(p?.pack)||0;
 const unitCost=p ? saleProductionCost(p) : 0;
 db.sales.unshift({
   id:Date.now()+777, manualKey:key, dateISO:"2026-10-01", time:"10:36", dueDate:"2026-10-06", postDays:3,
   date:"01/10/2026", product:p?.name||"Kit Chaveiros Outubro Rosa", productId:p?.id||null, store:"F4RM 3D",
   value:gross, grossValue:gross, netValue:net, qty, status:"Em produção", cost:unitCost*qty+packaging, fee:gross-net, packaging, notes:""
 });
 localStorage.setItem(KEY,JSON.stringify(db));
}
seedPedidoEmAndamento();
let editingSaleId=null;

const money=n=>Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
// Compatibilidade: evita que uma referência antiga a "cost" interrompa o salvamento do pedido.
if(typeof globalThis.cost === "undefined") globalThis.cost = 0;
function save(){localStorage.setItem(KEY,JSON.stringify(db)); try{render();}catch(e){console.error("Pedido salvo, mas houve erro ao atualizar a tela:",e);}}
function show(id,btn){if(id==='sales')setTimeout(populateSaleProducts,0);document.querySelectorAll('main section').forEach(s=>s.classList.add('hidden'));document.getElementById(id).classList.remove('hidden');document.querySelectorAll('.nav button').forEach(b=>b.classList.remove('active'));if(btn)btn.classList.add('active');render();if(id==='shopee'){refreshShopeeStatus();renderShopeeStock();}}
function toggle(id){document.getElementById(id).classList.toggle('hidden')}
function materialCost(p){
 if(Array.isArray(p.materials)) return p.materials.reduce((sum,m)=>sum+(+m.qty||+m.grams||0)*(+m.unitCost||+m.costPerGram||0),0);
 return +p.filamentCost||+p.material||0;
}
function componentCost(p){return (p.components||[]).reduce((sum,c)=>sum+(+c.qty||0)*(+c.unitCost||0),0)}
function productionUnitCost(p){return materialCost(p)+componentCost(p)+(+p.labor||0)+(+p.other||0)}
function totalCost(p){return productionUnitCost(p)}
function suggested(p){let cost=productionUnitCost(p), f=(+p.fee||0)/100,m=(+p.margin||0)/100;return (1-f-m)>0?cost/(1-f-m):0}
function addMaterialRow(materialId="",qty=""){
 const wrap=document.getElementById("materialsList");
 const row=document.createElement("div"); row.className="material-row";
 const options=(db.materials||[]).map(m=>`<option value="${m.id}" ${String(m.id)===String(materialId)?"selected":""}>${m.name} — ${m.unit} (${money(m.unitCost)}/${m.unit})</option>`).join("");
 row.innerHTML=`<div><label class="sub">Material / insumo</label><select class="mat-select" onchange="syncMaterialRow(this)"><option value="">Selecione um material</option>${options}</select></div>
 <div><label class="sub">Consumo por unidade</label><input class="mat-qty" type="number" min="0" step="0.0001" placeholder="Ex.: 0,0667" value="${qty}"></div>
 <button type="button" class="remove-material" onclick="this.parentElement.remove();updateProductMaterialTotal()">Remover</button>`;
 wrap.appendChild(row);
 row.querySelector(".mat-qty").addEventListener("input",updateProductMaterialTotal);
 syncMaterialRow(row.querySelector(".mat-select"));
 updateProductBasisUI();
}
function syncMaterialRow(select){ updateProductMaterialTotal(); }
function updateProductMaterialTotal(){
 const batch=document.getElementById("pBasis")?.value==="batch";
 const qty=Math.max(1,+document.getElementById("pBatchQty")?.value||1);
 const totalEntered=[...document.querySelectorAll("#materialsList .material-row")].reduce((sum,r)=>{
   const m=(db.materials||[]).find(x=>String(x.id)===String(r.querySelector(".mat-select").value));
   return sum+(m?(+r.querySelector(".mat-qty").value||0)*(+m.unitCost||0):0);
 },0);
 const totalUnit=batch?totalEntered/qty:totalEntered;
 const el=document.getElementById("pFilamentCost"); if(el)el.value=totalUnit.toFixed(4);
}

function saveMaterial(){
 const purchaseQty=+mPurchaseQty.value||0;
 const purchasePrice=+mPurchasePrice.value||0;
 const stock=+mStock.value||0;
 const name=mName.value.trim();
 if(!name){alert("Informe o nome do material.");return}
 if(purchaseQty<=0 || purchasePrice<0){alert("Informe uma quantidade comprada válida e o preço de compra.");return}
 const unitCost=purchasePrice/purchaseQty;
 db.materials=db.materials||[];
 const payload={name,category:mCategory.value,brand:mBrand.value.trim(),type:mType.value.trim(),color:mColor.value.trim(),unit:mUnit.value,purchaseQty,purchasePrice,supplier:mSupplier.value.trim(),stock,minStock:+mMinStock.value||0,unitCost};
 if(editingMaterialId!==null){
   const m=db.materials.find(x=>String(x.id)===String(editingMaterialId));
   if(!m)return;
   Object.assign(m,payload);
   alert("Material atualizado com sucesso.");
 }else{
   const materialId=Date.now();
   db.materials.push({id:materialId,...payload});
   db.purchases=db.purchases||[];
   db.purchases.unshift({id:Date.now()+1,date:new Date().toLocaleDateString("pt-BR"),material:name,qty:purchaseQty,unit:mUnit.value,value:purchasePrice,supplier:mSupplier.value.trim()});
 }
 save();
 closeMaterialForm();
 renderCategorySelect();
}
function addMaterial(){ openMaterialNew(); }

function updateMaterialPreview(){
 const q=+mPurchaseQty.value||0, p=+mPurchasePrice.value||0;
 materialCostPreview.textContent=q>0 ? `Custo por ${mUnit.value}: ${money(p/q)}` : "Informe quantidade e preço de compra para calcular o custo unitário.";
}

function parseHoursInput(value){
 const s=String(value??"").trim().replace(",",".");
 if(!s)return 0;
 if(/^\d+(?:\.\d+)?$/.test(s))return parseFloat(s)||0;
 const m=s.match(/^(\d+)\s*[:h]\s*(\d{1,2})$/i);
 if(m)return (+m[1]||0)+((+m[2]||0)/60);
 const hm=s.match(/^(\d+)\s*h\s*(\d{1,2})?\s*(?:min)?$/i);
 if(hm)return (+hm[1]||0)+((+hm[2]||0)/60);
 return 0;
}
function updateProductBasisUI(){
 const batch=document.getElementById("pBasis")?.value==="batch";
 const qty=Math.max(1,+document.getElementById("pBatchQty")?.value||1);
 const label=document.getElementById("pPrintHoursLabel");
 const hint=document.getElementById("pBasisHint");
 if(label)label.textContent=batch?"Tempo total de impressão do lote":"Tempo de impressão por unidade";
 if(hint)hint.textContent=batch?`Lote de ${qty} unidade${qty===1?"":"s"}: informe o consumo total de cada material e o tempo total. O sistema dividirá esses dados pela quantidade; a embalagem permanece como custo de um pedido.` : "Por unidade: informe o consumo e o tempo de impressão de uma peça.";
 const ph=document.getElementById("pPackHint"), lh=document.getElementById("pLaborHint"), oh=document.getElementById("pOtherHint"); if(ph)ph.textContent="por pedido"; if(lh)lh.textContent=batch?"total do lote":"por unidade"; if(oh)oh.textContent=batch?"total do lote":"por unidade";
 const costLabel=document.getElementById("pMaterialCostLabel");
 const costHint=document.getElementById("pMaterialCostHint");
 if(costLabel)costLabel.textContent=batch?"Custo dos materiais / unidade (R$)":"Custo dos materiais / unidade (R$)";
 if(costHint)costHint.textContent=batch?`Custo unitário calculado dividindo o consumo total do lote de ${qty} unidade${qty===1?"":"s"} pela quantidade.`:"Calculado automaticamente a partir da receita por unidade.";
 document.querySelectorAll("#materialsList .material-row .sub").forEach((el)=>{ if(el.textContent.includes("Consumo")) el.textContent=batch?"Consumo total no lote":"Consumo por unidade"; });
 updateProductMaterialTotal();
}

function addProduct(){
 const batch=document.getElementById("pBasis")?.value==="batch";
 const batchQty=Math.max(1,+document.getElementById("pBatchQty")?.value||1);
 const editingId=window.editingProductId||null;
 let materials=[...document.querySelectorAll("#materialsList .material-row")].map(r=>{
   const select=r.querySelector(".mat-select");
   const m=(db.materials||[]).find(x=>String(x.id)===String(select.value));
   const entered=+r.querySelector(".mat-qty").value||0;
   const qty=batch?entered/batchQty:entered;
   return {materialId:m?.id||"", name:m?.name||"", qty, unit:m?.unit||"", unitCost:m?.unitCost||0, sourceQty:entered};
 }).filter(m=>m.name && m.qty>0);
 const enteredHours=parseHoursInput(document.getElementById("pPrintHours")?.value);
 const printHours=batch?enteredHours/batchQty:enteredHours;
 const packEntered=+pPack.value||0, laborEntered=+pLabor.value||0, otherEntered=+pOther.value||0;
 const pack=packEntered;
 const labor=batch?laborEntered/batchQty:laborEntered;
 const other=batch?otherEntered/batchQty:otherEntered;
 const old=editingId?(db.products||[]).find(x=>String(x.id)===String(editingId)):null;
 let p={...(old||{}),id:editingId||Date.now(),name:pName.value.trim(),sku:pSku.value.trim(),store:pStore.value,shopeeSku:pShopeeSku.value.trim(),shopeeName:pShopeeName.value.trim(),materials,
 filamentCost:materials.reduce((sum,m)=>sum+(+m.qty||0)*(+m.unitCost||0),0),pack,labor,other,
 fee:+pFee.value||0,margin:+pMargin.value||0,stock:+pStock.value||0,printHours,productionBatchQty:batch?batchQty:1,productionBasis:batch?"batch":"unit",productionSourceHours:enteredHours,productionSourcePack:packEntered,productionSourceLabor:laborEntered,productionSourceOther:otherEntered,productionSourceMaterials:batch?materials.map(m=>({materialId:m.materialId,sourceQty:m.sourceQty})):null,stockManaged:old?.stockManaged||false};
 if(!p.name){alert("Informe o nome do produto.");return}
 if(!materials.length){alert("Adicione pelo menos um material ou insumo.");return}
 if(editingId){
   const idx=db.products.findIndex(x=>String(x.id)===String(editingId));
   if(idx>=0)db.products[idx]=p;
 }else db.products.push(p);
 save();
 window.editingProductId=null;
 document.getElementById("productForm").classList.add("hidden");
 document.getElementById("productFormTitle").textContent="Novo produto";
 document.getElementById("productSaveBtn").textContent="Salvar produto";
 ["pName","pSku","pFilamentCost","pPrintHours","pPack","pLabor","pOther","pStock","pShopeeSku","pShopeeName","pShopeeItemId","pShopeeModelId"].forEach(x=>{const e=document.getElementById(x);if(e)e.value="";});
 const basis=document.getElementById("pBasis"); if(basis)basis.value="unit"; const bq=document.getElementById("pBatchQty"); if(bq)bq.value=1; updateProductBasisUI();
 document.getElementById("materialsList").innerHTML=""; addMaterialRow();
 render();
 alert(editingId?"Produto atualizado com sucesso.":(batch?`Produto salvo. Os dados do lote de ${batchQty} unidades foram convertidos para consumo e custos por unidade.`:"Produto salvo com sucesso."));
}

function editProduct(id){
 const p=(db.products||[]).find(x=>String(x.id)===String(id));
 if(!p)return;
 window.editingProductId=p.id;
 document.getElementById("productForm").classList.remove("hidden");
 document.getElementById("productFormTitle").textContent="Editar produto";
 document.getElementById("productSaveBtn").textContent="Salvar alterações";
 pName.value=p.name||""; pSku.value=p.sku||""; pStore.value=p.store||""; pShopeeSku.value=p.shopeeSku||""; pShopeeName.value=p.shopeeName||"";
 pFee.value=p.fee??20; pMargin.value=p.margin??30; pStock.value=p.stock??0;
 const basis=document.getElementById("pBasis"); basis.value=p.productionBasis==="batch"?"batch":"unit";
 const bq=document.getElementById("pBatchQty"); bq.value=p.productionBatchQty||1;
 document.getElementById("pPrintHours").value=p.productionBasis==="batch"?(p.productionSourceHours||0):(p.printHours||0);
 document.getElementById("pPack").value=p.productionSourcePack??(p.pack||0);
 document.getElementById("pLabor").value=p.productionBasis==="batch"?(p.productionSourceLabor??((+p.labor||0)*(+bq.value||1))):(p.labor||0);
 document.getElementById("pOther").value=p.productionBasis==="batch"?(p.productionSourceOther??((+p.other||0)*(+bq.value||1))):(p.other||0);
 document.getElementById("materialsList").innerHTML="";
 (p.materials||[]).forEach(r=>{
   const batchQty=Math.max(1,+bq.value||1);
   const displayQty=p.productionBasis==="batch" ? (r.sourceQty!==undefined ? r.sourceQty : ((+r.qty||0)*batchQty)) : (r.qty||0);
   addMaterialRow(r.materialId,displayQty);
 });
 if(!(p.materials||[]).length)addMaterialRow();
 updateProductBasisUI(); updateProductMaterialTotal();
 document.getElementById("products").scrollIntoView({behavior:"smooth",block:"start"});
}
function cancelProductEdit(){
 window.editingProductId=null;
 document.getElementById("productForm").classList.add("hidden");
 document.getElementById("productFormTitle").textContent="Novo produto";
 document.getElementById("productSaveBtn").textContent="Salvar produto";
}

function inventoryTab(tab,btn){
 document.querySelectorAll(".inventory-pane").forEach(x=>x.classList.add("hidden"));
 document.getElementById("inv-"+tab).classList.remove("hidden");
 document.querySelectorAll(".inventory-tab").forEach(x=>x.classList.remove("active"));
 if(btn)btn.classList.add("active");
}
function refreshMovementSelect(){
 const sel=document.getElementById("mvMaterial");
 if(!sel)return;
 sel.innerHTML=(db.materials||[]).map(m=>`<option value="${m.id}">${m.name} — estoque: ${m.stock} ${m.unit}</option>`).join("");
}
function addMovement(){
 const m=db.materials.find(x=>String(x.id)===String(mvMaterial.value));
 const qty=+mvQty.value||0;
 if(!m || qty<=0){alert("Selecione um material e informe uma quantidade válida.");return}
 const type=mvType.value;
 const before=+m.stock||0;
 if(type==="entrada")m.stock=before+qty;
 else if(type==="saida")m.stock=Math.max(0,before-qty);
 else m.stock=qty;
 db.movements.unshift({id:Date.now(),date:new Date().toLocaleString("pt-BR"),materialId:m.id,material:m.name,type,qty,note:mvNote.value.trim(),before,after:m.stock});
 mvQty.value="";mvNote.value="";save();
}

function todayISO(){ return new Date().toISOString().slice(0,10); }
function addBusinessDays(dateISO, days){
 const d=new Date(String(dateISO||todayISO())+'T12:00:00');
 let remaining=Math.max(0,Number(days)||0);
 while(remaining>0){
  d.setDate(d.getDate()+1);
  const day=d.getDay();
  if(day!==0 && day!==6) remaining--;
 }
 return d.toISOString().slice(0,10);
}
function updatePostDate(){
 const dateEl=document.getElementById("sDate"), daysEl=document.getElementById("sPostDays"), dueEl=document.getElementById("sDueDate");
 if(!dateEl||!daysEl||!dueEl)return;
 dueEl.value=addBusinessDays(dateEl.value||todayISO(), Number(daysEl.value)||1);
}
function formatDateISO(v){ if(!v)return "—"; const parts=String(v).split("-"); return parts.length===3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : v; }
function isLate(s){ return s.status!=="Entregue" && s.status!=="Cancelado" && s.dueDate && s.dueDate < todayISO(); }
function saleProduct(s){ return db.products.find(x=>String(x.id)===String(s.productId)); }
function materialConsumptionForSale(p,r,orderQty){
 const q=Math.max(0,Number(orderQty)||0);
 const mat=(db.materials||[]).find(x=>String(x.id)===String(r?.materialId));
 const rawName=String(r?.name||mat?.name||p?.materials?.find(x=>String(x.materialId)===String(r?.materialId))?.name||"");
 const name=rawName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
 // Saquinhos para chaveiros: 1 a cada 25 unidades, arredondando para cima.
 // 1-25 = 1; 26-50 = 2; 51-75 = 3; 76-100 = 4...
 // Importante: esta regra vale somente para o material de saquinhos de chaveiros.
 if(name.includes("saquinho") && name.includes("chaveiro")) return q>0 ? Math.ceil(q/25) : 0;
 // Argola para chaveiros: 1 argola para cada unidade de chaveiro.
 if(name.includes("argola") && name.includes("chaveiro")) return q;
 return (Number(r?.qty)||Number(r?.grams)||0)*q;
}
function saleProductionCost(p, orderQty=1){
 try{
  if(!p)return 0;
  const q=Math.max(0,Number(orderQty)||0);
  const mats=Array.isArray(p.materials)?p.materials.reduce((sum,r)=>{
    const use=materialConsumptionForSale(p,r,q);
    return sum+use*(Number(r.unitCost||r.costPerGram)||0);
  },0):Number(p.filamentCost||p.material)||0;
  const comps=Array.isArray(p.components)?p.components.reduce((sum,c)=>sum+(Number(c.qty)||0)*(Number(c.unitCost)||0)*q,0):0;
  return (mats+(Number(p.labor)||0)*q+(Number(p.other)||0)*q)||0;
 }catch(e){console.error("Erro ao calcular custo do produto",e);return 0;}
}
function adjustStockForSale(s, direction, note){
 const p=saleProduct(s); if(!p)return;
 db.movements=db.movements||[];
 const qty=Math.max(0,Number(s.qty)||0);
 if(p.stockManaged) p.stock=Math.max(0,(Number(p.stock)||0)+direction*qty);
 (p.materials||[]).forEach(r=>{
   const m=db.materials.find(x=>String(x.id)===String(r.materialId)); if(!m)return;
   const use=materialConsumptionForSale(p,r,qty); const before=Number(m.stock)||0;
   m.stock=Math.max(0,before+direction*use);
   db.movements.unshift({id:Date.now()+Math.random(),date:new Date().toLocaleString("pt-BR"),materialId:m.id,material:m.name,type:direction<0?"saída":"entrada",qty:Math.abs(use),note, before, after:m.stock});
 });
}
function updateSaleStatus(id,value){ const s=db.sales.find(x=>String(x.id)===String(id)); if(!s)return; s.status=value; if(value==="Entregue" && !s.completedDate)s.completedDate=todayISO(); save(); }
function startEditSale(id){
 const s=db.sales.find(x=>String(x.id)===String(id)); if(!s)return;
 editingSaleId=s.id;
 document.getElementById("saleFormTitle").textContent="Editar venda / pedido";
 document.getElementById("saleSubmitBtn").textContent="Salvar alterações";
 document.getElementById("saleCancelEditBtn").classList.remove("hidden");
 document.getElementById("sDate").value=s.dateISO||todayISO();
 document.getElementById("sTime").value=s.time||"00:00";
 document.getElementById("sCustomerName").value=s.customerName||"";
 document.getElementById("sState").value=s.state||"";
 document.getElementById("sPostDays").value=String(s.postDays||1);
 document.getElementById("sProduct").value=String(s.productId||"");
 document.getElementById("sStore").value=s.store||"F4R Studio 3D";
 document.getElementById("sQty").value=s.qty||1;
 document.getElementById("sGross").value=Number(s.grossValue??s.value??0).toFixed(2);
 document.getElementById("sNet").value=Number(s.netValue??0).toFixed(2);
 document.getElementById("sStatus").value=s.status||"Recebido";
 document.getElementById("sNotes").value=s.notes||"";
 updatePostDate();
 document.getElementById("saleFormTitle").scrollIntoView({behavior:"smooth",block:"start"});
}
function cancelEditSale(){
 editingSaleId=null;
 document.getElementById("saleFormTitle").textContent="Registrar venda / pedido";
 document.getElementById("saleSubmitBtn").textContent="Registrar pedido";
 document.getElementById("saleCancelEditBtn").classList.add("hidden");
 document.getElementById("sQty").value="1"; document.getElementById("sGross").value=""; document.getElementById("sNet").value=""; document.getElementById("sNotes").value="";
 document.getElementById("sDate").value=todayISO(); document.getElementById("sTime").value=new Date().toTimeString().slice(0,5); document.getElementById("sCustomerName").value=""; document.getElementById("sState").value=""; document.getElementById("sPostDays").value="1";
 document.getElementById("sStatus").value="Recebido"; updatePostDate();
}
function deleteSale(id){
 const s=db.sales.find(x=>String(x.id)===String(id)); if(!s)return;
 if(!confirm(`Excluir o pedido de ${s.product||"produto"}?\n\nO estoque consumido por este pedido será devolvido.`))return;
 if(s.status!=="Cancelado") adjustStockForSale(s,1,`Estorno da exclusão: ${s.product||"Venda"}`);
 db.sales=db.sales.filter(x=>String(x.id)!==String(id));
 if(String(editingSaleId)===String(id)) cancelEditSale();
 save();
}
function renderSalesTable(){
 const table=document.getElementById("salesTable"); if(!table)return;
 const filter=document.getElementById("salesFilter")?.value||"todos";
 let rows=(db.sales||[]).filter(s=>filter==="todos" ? true : filter==="atrasados" ? isLate(s) : s.status===filter);
 rows.sort((a,b)=>{const ad=a.dueDate||"9999-12-31",bd=b.dueDate||"9999-12-31"; if(ad!==bd)return ad.localeCompare(bd); const at=`${a.dateISO||""}T${a.time||"00:00"}`,bt=`${b.dateISO||""}T${b.time||"00:00"}`; return at.localeCompare(bt);});
 table.innerHTML=rows.map(s=>{const late=isLate(s); return `<tr><td>${formatDateISO(s.dateISO||"")}<small class="sub" style="display:block">${s.time||"—"}</small></td><td>${s.customerName||"—"}</td><td>${s.state||"—"}</td><td>${s.product}</td><td>${s.store||"—"}</td><td>${s.qty}</td><td><span class="${late?'tag warn':'tag'}">${formatDateISO(s.dueDate)}</span>${late?'<small style="display:block;color:#a33;font-weight:700">Atrasado</small>':''}</td><td>${money(Number(s.grossValue??s.value)||0)}<small class="sub" style="display:block">Líquido: ${money(Number(s.netValue??0)||0)}</small></td><td><select onchange="updateSaleStatus('${s.id}',this.value)">${["Recebido","Em produção","Pronto","Enviado","Entregue","Cancelado"].map(st=>`<option ${s.status===st?'selected':''}>${st}</option>`).join("")}</select></td><td>${s.notes||"—"}</td><td style="white-space:nowrap"><button class="btn xs outline" onclick="startEditSale('${s.id}')">Editar</button> <button class="btn xs danger" onclick="deleteSale('${s.id}')">Excluir</button></td></tr>`}).join("")||'<tr><td colspan="11">Nenhum pedido encontrado.</td></tr>';
}
function saveSaleForm(){
 try{
  const productEl=document.getElementById("sProduct"), storeEl=document.getElementById("sStore"), dateEl=document.getElementById("sDate"), timeEl=document.getElementById("sTime"), customerNameEl=document.getElementById("sCustomerName"), stateEl=document.getElementById("sState"), daysEl=document.getElementById("sPostDays"), grossEl=document.getElementById("sGross"), netEl=document.getElementById("sNet"), qtyEl=document.getElementById("sQty"), statusEl=document.getElementById("sStatus"), notesEl=document.getElementById("sNotes");
  const p=db.products.find(x=>String(x.id)===String(productEl?.value)); if(!p){alert("Selecione um produto antes de registrar o pedido.");return;}
  const q=Math.max(1,Number(qtyEl.value)||1), dateISO=dateEl.value||todayISO(), time=timeEl?.value||new Date().toTimeString().slice(0,5), postDays=Math.min(5,Math.max(1,Number(daysEl?.value)||1)), dueDate=addBusinessDays(dateISO,postDays);
  const packaging=Number(p.pack)||0, suggestedUnit=Number(suggested(p))||0, defaultGross=suggestedUnit*q+packaging;
  const grossRaw=String(grossEl.value||"").trim(), netRaw=String(netEl.value||"").trim();
  const gross=grossRaw!==""?Number(grossRaw):defaultGross; if(!Number.isFinite(gross)||gross<0){alert("Informe um valor total da venda válido.");return;}
  const feeRate=(Number(p.fee)||0)/100, defaultNet=Math.max(0,gross-(gross*feeRate)), net=netRaw!==""?Number(netRaw):defaultNet; if(!Number.isFinite(net)||net<0){alert("Informe um valor líquido recebido válido.");return;}
  const fee=Math.max(0,gross-net);
  const old=editingSaleId!=null ? db.sales.find(x=>String(x.id)===String(editingSaleId)) : null;
  if(old && old.status!=="Cancelado") adjustStockForSale(old,1,`Estorno para edição: ${old.product||"Venda"}`);
  const sale={id:old?old.id:Date.now(),manualKey:old?.manualKey,dateISO,time,customerName:customerNameEl?.value.trim()||"",state:stateEl?.value||"",dueDate,postDays,date:formatDateISO(dateISO),product:p.name,productId:p.id,store:storeEl.value,value:gross,grossValue:gross,netValue:net,qty:q,status:statusEl.value,cost:saleProductionCost(p,q)+packaging,fee,packaging,notes:notesEl?.value.trim()||""};
  if(old){ Object.assign(old,sale); } else { db.sales=db.sales||[]; db.sales.unshift(sale); }
  if(sale.status!=="Cancelado") adjustStockForSale(sale,-1,`${old?"Edição":"Venda"}: ${p.name}`);
  const wasEditing=!!old;
  editingSaleId=null;
  save(); cancelEditSale();
  alert(wasEditing?"Pedido atualizado com sucesso!":"Pedido registrado com sucesso!");
 }catch(err){console.error(err);alert("Não foi possível registrar o pedido: "+(err.message||err));}
}
function addSale(){ saveSaleForm(); }

function updateSalePreview(){
 const pEl=document.getElementById("sProduct"), qEl=document.getElementById("sQty"), grossEl=document.getElementById("sGross"), netEl=document.getElementById("sNet");
 if(!pEl||!qEl||!grossEl||!netEl)return;
 const p=db.products.find(x=>String(x.id)===String(pEl.value));
 if(!p){ if(!grossEl.dataset.manual) grossEl.value=""; if(!netEl.dataset.manual) netEl.value=""; return; }
 const q=Math.max(1,Number(qEl.value)||1);
 const gross=(Number(suggested(p))||0)*q+(Number(p.pack)||0);
 const feeRate=(Number(p.fee)||0)/100;
 const net=Math.max(0,gross-(gross*feeRate));
 if(!grossEl.dataset.manual || grossEl.value==="") grossEl.value=gross.toFixed(2);
 if(!netEl.dataset.manual || netEl.value==="") netEl.value=net.toFixed(2);
}
function calcMode(mode,btn){
 document.getElementById("quoteMode").classList.toggle("hidden",mode!=="quote");
 document.getElementById("productionMode").classList.toggle("hidden",mode!=="production");
 document.querySelectorAll(".calc-tab").forEach(x=>x.classList.remove("active")); if(btn)btn.classList.add("active");
}
function addCalcMaterial(id="",qty=""){
 const wrap=document.getElementById("calcMaterials"), row=document.createElement("div");
 row.className="material-row";
 const opts=(db.materials||[]).map(m=>`<option value="${m.id}" ${String(m.id)===String(id)?"selected":""}>${m.name}${m.color?" — "+m.color:""} (${money(m.unitCost)}/${m.unit})</option>`).join("");
 row.innerHTML=`<div><label class="sub">Material / insumo</label><select class="calc-mat" onchange="runCalc()"><option value="">Selecione</option>${opts}</select></div>
 <div><label class="sub calc-qty-label">Quantidade por unidade</label><input class="calc-g" type="number" min="0" step=".0001" value="${qty}" oninput="runCalc()"></div>
 <button type="button" class="remove-material" onclick="this.parentElement.remove();runCalc()">Remover</button>`;
 wrap.appendChild(row);
 updateCalcBasisUI();
}

function updateCalcBasisUI(){
 const basis=document.getElementById("calcBasis")?.value||"unit";
 const qty=Math.max(1,+document.getElementById("calcQty")?.value||1);
 const notice=document.getElementById("calcBasisNotice");
 const batch=basis==="batch";
 if(notice) notice.textContent=batch
   ? `Total do lote: informe o consumo total usado para produzir ${qty} unidade${qty===1?"":"s"} e o tempo total da impressão. O sistema divide tudo pela quantidade e calcula o custo de 1 unidade.`
   : "Por unidade: informe o consumo e o tempo de impressão de uma peça.";
 document.querySelectorAll("#calcMaterials .calc-qty-label").forEach(el=>el.textContent=batch?"Quantidade total no lote":"Quantidade por unidade");
 const hoursLabel=document.querySelector('#calcHours')?.closest('.field')?.querySelector('label');
 if(hoursLabel) hoursLabel.textContent=batch?"Tempo total de impressão do lote (horas)":"Tempo de impressão por unidade (horas)";
 const labLabel=document.querySelector("#calcLabor")?.closest(".field")?.querySelector("label"); const packLabel=document.querySelector("#calcPack")?.closest(".field")?.querySelector("label"); const otherLabel=document.querySelector("#calcOther")?.closest(".field")?.querySelector("label"); if(labLabel)labLabel.textContent=batch?"Mão de obra total do lote (R$)":"Mão de obra por unidade (R$)"; if(packLabel)packLabel.textContent="Embalagem do pedido (R$)"; if(otherLabel)otherLabel.textContent=batch?"Outros / risco total do lote (R$)":"Outros / risco por unidade (R$)";
}

function populateCalcProductSelect(){
 const sel=document.getElementById("calcProductSelect");
 if(!sel)return;
 const current=sel.value;
 sel.innerHTML='<option value="">Selecione um produto para carregar a ficha técnica</option>'+
   (db.products||[]).map(p=>`<option value="${p.id}">${p.name}${p.sku?" — "+p.sku:""}</option>`).join("");
 if(current)sel.value=current;
}

function loadProductToCalc(){
 const id=document.getElementById("calcProductSelect")?.value;
 if(!id)return;
 const p=(db.products||[]).find(x=>String(x.id)===String(id));
 if(!p)return;
 document.getElementById("calcProjectName").value=p.name||"";
 document.getElementById("calcHours").value=p.printHours||0;
 document.getElementById("calcLabor").value=p.labor||0;
 document.getElementById("calcPack").value=p.pack||0;
 document.getElementById("calcOther").value=p.other||0;
 document.getElementById("calcFee").value=p.fee??20;
 document.getElementById("calcMargin").value=p.margin??30;
 const basis=document.getElementById("calcBasis");
 if(basis) basis.value="unit";
 updateCalcBasisUI();
 const wrap=document.getElementById("calcMaterials");
 wrap.innerHTML="";
 (p.materials||[]).forEach(r=>addCalcMaterial(r.materialId,r.qty));
 if(!(p.materials||[]).length)addCalcMaterial();
 runCalc();
}

function openTechModal(id){
 const p=(db.products||[]).find(x=>String(x.id)===String(id));
 if(!p)return;
 document.getElementById("techTitle").textContent=p.name;
 document.getElementById("techSub").textContent=[p.sku,p.shopeeSku].filter(Boolean).join(" • ")||"Sem SKU";
 const matRows=(p.materials||[]).map(r=>`<div class="tech-row"><span>${r.name||"Material"} <small class="sub">${r.grams||0} g</small></span><b>${money((+r.grams||0)*(+r.costPerGram||0))}</b></div>`).join("");
 const compRows=(p.components||[]).map(r=>`<div class="tech-row"><span>${r.name||"Componente"} <small class="sub">${r.qty||0} un.</small></span><b>${money((+r.qty||0)*(+r.unitCost||0))}</b></div>`).join("");
 const total=totalCost(p), price=suggested(p);
 document.getElementById("techBody").innerHTML=`
   <div class="tech-grid">
     <div class="tech-box"><span>Loja</span><b>${p.store||"—"}</b></div>
     <div class="tech-box"><span>Tempo de impressão</span><b>${p.printHours||0} h</b></div>
     <div class="tech-box"><span>Estoque</span><b>${p.stock||0} un.</b></div>
     <div class="tech-box"><span>Custo total</span><b>${money(total)}</b></div>
     <div class="tech-box"><span>Preço sugerido</span><b>${money(price)}</b></div>
     <div class="tech-box"><span>Margem / taxa</span><b>${p.margin||0}% / ${p.fee||0}%</b></div>
   </div>
   <h3>Filamentos</h3>
   <div class="tech-list">${matRows||'<div class="sub" style="padding:10px 0">Nenhum filamento cadastrado.</div>'}</div>
   <h3 style="margin-top:18px">Componentes / insumos</h3>
   <div class="tech-list">${compRows||'<div class="sub" style="padding:10px 0">Nenhum componente cadastrado.</div>'}</div>
   <h3 style="margin-top:18px">Custos adicionais</h3>
   <div class="tech-list">
     <div class="tech-row"><span>Embalagem do pedido</span><b>${money(p.pack||0)}</b></div>
     <div class="tech-row"><span>Mão de obra</span><b>${money(p.labor||0)}</b></div>
     <div class="tech-row"><span>Outros custos</span><b>${money(p.other||0)}</b></div>
     <div class="tech-row"><span><b>Custo final</b></span><b>${money(total)}</b></div>
   </div>
   <div class="quote-actions" style="margin-top:18px">
     <button class="btn" onclick="closeTechModal();document.getElementById('calcProductSelect').value='${p.id}';loadProductToCalc();show('pricing')">Usar na calculadora</button>
   </div>`;
 document.getElementById("techModal").classList.add("show");
}

function closeTechModal(){document.getElementById("techModal").classList.remove("show")}

function runCalc(){
 const qty=Math.max(1,+document.getElementById("calcQty")?.value||1);
 const basis=document.getElementById("calcBasis")?.value||"unit";
 const batch=basis==="batch";
 let materialsUnit=0;
 document.querySelectorAll("#calcMaterials .material-row").forEach(r=>{
   const m=(db.materials||[]).find(x=>String(x.id)===String(r.querySelector(".calc-mat").value));
   if(m){
     const entered=+r.querySelector(".calc-g").value||0;
     const qtyUnit=batch?entered/qty:entered;
     materialsUnit+=qtyUnit*(+m.unitCost||0);
   }
 });
 const enteredHours=+calcHours.value||0;
 const hoursUnit=batch?enteredHours/qty:enteredHours;
 const watts=+calcWatts.value||0, kwh=+calcKwh.value||0;
 const energyUnit=hoursUnit*(watts/1000)*kwh;
 const printer=+calcPrinterValue.value||0, life=Math.max(1,+calcPrinterLife.value||1);
 const depreciationUnit=hoursUnit*(printer/life);
 const wearUnit=hoursUnit*(+calcWear.value||0);
 const laborEntered=+calcLabor.value||0,packEntered=+calcPack.value||0,otherEntered=+calcOther.value||0;
 const laborUnit=batch?laborEntered/qty:laborEntered, packUnit=0, otherUnit=batch?otherEntered/qty:otherEntered;
 const unitBase=materialsUnit+energyUnit+depreciationUnit+wearUnit+laborUnit+otherUnit;
 const orderPackaging=packEntered;
 const totalBase=unitBase*qty+orderPackaging;
 const markup=(+calcMarkup.value||0)/100, margin=(+calcMargin.value||0)/100, fee=(+calcFee.value||0)/100;
 let unitPriceByMarkup=(unitBase*(1+markup)) + (qty>0?orderPackaging/qty:0);
 let unitPriceByMargin=(1-margin-fee)>0?((unitBase*qty+orderPackaging)/(qty*(1-margin-fee))):0;
 const unitPrice=Math.max(unitPriceByMarkup,unitPriceByMargin);
 const totalPrice=unitPrice*qty;
 const marketplace=totalPrice*fee, profit=totalPrice-totalBase-marketplace, actualMargin=totalPrice>0?profit/totalPrice:0;
 calcPrice.textContent=money(unitPrice);
 calcTopPrice.textContent=money(unitPrice);
 resMarkup.textContent=unitBase>0?Math.round((unitPrice/unitBase-1)*100)+"%":"0%";
 resProfit.textContent=money(profit);
 resMargin.textContent=Math.round(actualMargin*100)+"%";
 calcSummary.textContent=`${qty} unidade${qty===1?"":"s"} • custo total ${money(totalBase)} • venda total ${money(totalPrice)} • lucro ${money(profit)}`;
 const parts=[["Material (insumos)",materialsUnit], ["Energia elétrica",energyUnit],["Depreciação",depreciationUnit],["Desgaste",wearUnit],["Mão de obra",laborUnit],["Outros / risco",otherUnit]];
 const total=parts.reduce((a,x)=>a+x[1],0)||1;
 costLegend.innerHTML=parts.filter(x=>x[1]>0).map((x,i)=>`<div class="legend-item"><span class="legend-dot" style="background:hsl(${190+i*38},55%,55%)"></span>${x[0]} <b>${money(x[1])}</b> por unidade (${Math.round(x[1]/total*100)}%)</div>`).join("");
 let acc=0, colors=["#4b9fc2","#e5a33e","#8b6d9c","#d46e54","#75a67c","#b98a58","#aaa"];
 costDonut.style.background=`conic-gradient(${parts.map((x,i)=>{let a=acc/total*100,b=(acc+x[1])/total*100;acc+=x[1];return `${colors[i]} ${a}% ${b}%`}).join(",")})`;
 costAnalysis.innerHTML=parts.filter(x=>x[1]>0).map(x=>`<div class="analysis-row"><span>${x[0]} / unidade</span><b>${money(x[1])}</b></div>`).join("")+`<div class="analysis-row"><span>Embalagem do pedido</span><b>${money(orderPackaging)}</b></div><div class="analysis-row"><span>Custo por unidade (produção)</span><b>${money(unitBase)}</b></div><div class="analysis-row"><span>Custo total (${qty} un.) + embalagem</span><b>${money(totalBase)}</b></div><div class="analysis-row"><span>Preço por unidade</span><b>${money(unitPrice)}</b></div><div class="analysis-row"><span>Venda total</span><b>${money(totalPrice)}</b></div><div class="analysis-row"><span>Taxa marketplace</span><b>${money(marketplace)}</b></div><div class="analysis-row"><span>Lucro total</span><b class="good">${money(profit)}</b></div>`;
}


function saveQuote(status){
 const name=(document.getElementById("calcProjectName").value||"Projeto sem nome").trim();
 const qty=+document.getElementById("calcQty").value||1;
 const price=parseFloat((document.getElementById("calcPrice").textContent||"0").replace(/[^\d,-]/g,"").replace(/\./g,"").replace(",", "."))||0;
 const quote={id:Date.now(),date:new Date().toLocaleDateString("pt-BR"),name,qty,price,colors:document.getElementById("calcColors").value.trim(),details:document.getElementById("calcDetails").value.trim(),status};
 db.quotes.unshift(quote);
 if(status==="produção") alert("Orçamento salvo e marcado para produção.");
 else alert("Orçamento salvo com sucesso.");
 save();
}

function channelTab(id,btn){
 ["shopeeConnect","shopeeOrders","shopeeProducts","shopeeStock"].forEach(x=>document.getElementById(x)?.classList.add("hidden"));
 document.getElementById(id)?.classList.remove("hidden");
 document.querySelectorAll(".channel-tab").forEach(x=>x.classList.remove("active"));
 if(btn)btn.classList.add("active");
}
function simulateShopeeConnect(){
 const name=document.getElementById("shopName").value.trim();
 if(!name){alert("Informe o nome da loja.");return}
 alert("A preparação está pronta. A conexão real precisa de um aplicativo aprovado/configurado na Shopee Open Platform e de um backend seguro para OAuth/API.");
}
function showShopeeHelp(){
 alert("A autorização acontece na Shopee. Depois da autorização, o sistema recebe o código e troca por tokens de acesso. A senha da Shopee não deve ser armazenada no Gestor 3D.");
}


let shopeeCache={orders:{},products:{},status:{}};

async function api(url,opts={}){
 const r=await fetch(url,{headers:{"Content-Type":"application/json"},...opts});
 const d=await r.json().catch(()=>({error:"Resposta inválida"}));
 if(!r.ok||d.ok===false) throw new Error(d.error||"Erro na API");
 return d;
}
async function connectShopee(store){
 try{
   const d=await api(`/api/shopee/authorize/${store}`);
   window.location.href=d.url;
 }catch(e){alert("Não foi possível iniciar a autorização: "+e.message+"\n\nConfira o backend e as credenciais Shopee.");}
}
async function refreshShopee(store){
 try{await api(`/api/shopee/refresh/${store}`);alert("Token da Loja "+store+" renovado.");refreshShopeeStatus();}
 catch(e){alert("Não foi possível renovar: "+e.message);}
}
async function refreshShopeeStatus(){
 try{
  const d=await api("/api/shopee/status"); shopeeCache.status=d.stores||{};
  [1,2].forEach(n=>{
    const s=shopeeCache.status[n]||shopeeCache.status[String(n)]||{};
    const el=document.getElementById("shopStatus"+n), id=document.getElementById("shopId"+n);
    if(s.connected){el.innerHTML='<span class="status-ok">● Conectada</span>';id.value=s.shop_id||"";}
    else {el.innerHTML='<span class="status-off">● Não conectada</span>';id.value="";}
  });
 }catch(e){[1,2].forEach(n=>{const el=document.getElementById("shopStatus"+n);if(el)el.innerHTML='<span class="status-off">● Backend não disponível</span>';});}
}
function showShopeeMessage(msg){
 const el=document.getElementById("shopeeOrderMsg"); if(el){el.textContent=msg;el.classList.remove("hidden");}
}
function flattenOrderDetails(details){
 const out=[];
 (details||[]).forEach(d=>{
  const x=d.response||d; const order=x.order_list?.[0]||x;
  const items=x.item_list||order.item_list||[];
  items.forEach(i=>out.push({...i,order_sn:order.order_sn,status:order.order_status,total_amount:order.total_amount}));
 });
 return out;
}
async function syncShopeeOrders(){
 const store=+document.getElementById("orderStore").value;
 try{
  showShopeeMessage("Sincronizando pedidos...");
  const d=await api(`/api/shopee/sync/${store}`,{method:"POST"});
  shopeeCache.orders[store]=d;
  const items=flattenOrderDetails(d.details);
  document.getElementById("shopeeOrdersTable").innerHTML=items.length?items.map(i=>`<tr>
   <td><b>${i.order_sn||"—"}</b></td><td>Loja ${store}</td><td>${i.item_name||i.model_name||i.item_id||"—"}<div class="sub">${i.item_sku||""}</div></td>
   <td>${i.model_quantity_purchased||i.quantity||1}</td><td>${i.status||"—"}</td><td>${money(i.total_amount||0)}</td>
   <td><button class="btn secondary" onclick="importShopeeOrder('${String(i.order_sn||"").replace(/'/g,"")}','${store}')">Registrar</button></td></tr>`).join(""):'<tr><td colspan="7" class="sub">Nenhum pedido encontrado.</td></tr>';
  showShopeeMessage(`${d.orders?.length||0} pedido(s) encontrados. Os pedidos só devem ser registrados uma vez.`);
 }catch(e){showShopeeMessage("Erro: "+e.message);}
}
function findProductForShopee(item){
 const iid=String(item.item_id||"");
 const sku=String(item.item_sku||"").trim();
 return (db.products||[]).find(p=>
   (p.shopeeItemId&&String(p.shopeeItemId)===iid) ||
   (sku && p.shopeeSku && String(p.shopeeSku).trim()===sku)
 );
}
function registerSaleFromShopee(item,store){
 const qty=+(item.model_quantity_purchased||item.quantity||1);
 const p=findProductForShopee(item);
 if(!p){alert(`Não encontrei produto vinculado ao Item ID ${item.item_id||"—"} / SKU ${item.item_sku||"—"}.\n\nVá em Produtos, preencha o Item ID Shopee e tente novamente.`);return;}
 if(db.sales?.some(s=>s.orderSn===item.order_sn)){alert("Este pedido já foi registrado.");return;}
 const unit=+suggested(p)||0, revenue=unit*qty;
 p.stock=Math.max(0,(+p.stock||0)-qty);
 (p.materials||[]).forEach(r=>{
   const m=db.materials.find(x=>String(x.id)===String(r.materialId));
   if(m){m.stock=Math.max(0,(+m.stock||0)-((+r.grams||0)*qty));}
 });
 (p.components||[]).forEach(r=>{
   const m=db.materials.find(x=>String(x.id)===String(r.materialId));
   if(m){m.stock=Math.max(0,(+m.stock||0)-((+r.qty||0)*qty));}
 });
 db.sales=db.sales||[];
 db.sales.push({id:Date.now(),date:new Date().toISOString(),productId:p.id,product:p.name,qty,unitPrice:unit,total:revenue,fee:+p.fee||0,store:`Shopee Loja ${store}`,orderSn:item.order_sn,source:"Shopee"});
 save();
 alert(`Pedido ${item.order_sn} registrado.\nEstoque do produto e materiais da ficha técnica foram baixados.`);
}
function importShopeeOrder(orderSn,store){
 const data=shopeeCache.orders[store]; if(!data)return;
 const items=flattenOrderDetails(data.details).filter(x=>x.order_sn===orderSn);
 if(!items.length){alert("Detalhes do pedido não encontrados.");return;}
 if(items.length>1){
   items.forEach(i=>registerSaleFromShopee(i,store));
 }else registerSaleFromShopee(items[0],store);
}
async function syncShopeeProducts(){
 const store=+document.getElementById("productStore").value;
 try{
  const d=await api(`/api/shopee/products/${store}`); shopeeCache.products[store]=d;
  const raw=d.data?.response?.item||d.data?.item||d.data?.response?.item_list||d.data?.item_list||[];
  const rows=Array.isArray(raw)?raw:[];
  document.getElementById("shopeeProductsTable").innerHTML=rows.map(x=>{
    const iid=x.item_id||x.itemid||"";
    const p=(db.products||[]).find(z=>String(z.shopeeItemId||"")===String(iid));
    return `<tr><td><b>${iid}</b></td><td>${x.item_sku||x.item_sku_list?.[0]||"—"}</td><td>${x.item_name||"—"}</td><td>${x.stock_info_v2?.[0]?.current_stock??x.stock??"—"}</td><td>${p?`✓ ${p.name}`:`<button class="btn secondary" onclick="linkShopeeItem('${iid}','${String(x.item_name||"").replace(/'/g,"")}','${String(x.item_sku||"").replace(/'/g,"")}')">Vincular</button>`}</td></tr>`;
  }).join("")||'<tr><td colspan="5" class="sub">Nenhum anúncio retornado.</td></tr>';
 }catch(e){alert("Erro ao importar produtos: "+e.message);}
}
function linkShopeeItem(itemId,name,sku){
 const choices=(db.products||[]).map(p=>`${p.id} — ${p.name}`).join("\n");
 const selected=prompt(`Digite o ID do produto interno para vincular ao Item ID ${itemId}.\n\n${choices}`);
 const p=(db.products||[]).find(x=>String(x.id)===String(selected).split(" ")[0]);
 if(!p)return;
 p.shopeeItemId=String(itemId); if(!p.shopeeName)p.shopeeName=name||""; if(!p.shopeeSku)p.shopeeSku=sku||"";
 save(); alert("Vínculo salvo.");
 syncShopeeProducts();
}
function renderShopeeStock(){
 const t=document.getElementById("shopeeStockTable"); if(!t)return;
 t.innerHTML=(db.products||[]).map(p=>`<tr><td>${p.name}</td><td>${p.sku||p.shopeeSku||"—"}</td><td>${p.shopeeItemId||"—"}</td><td>${p.stock||0}</td><td>${p.shopeeItemId?'<span class="status-ok">Vinculado</span>':'<span class="sub">Sem vínculo</span>'}</td></tr>`).join("")||'<tr><td colspan="5">Nenhum produto.</td></tr>';
}
async function pushAllShopeeStock(){
 const store=+document.getElementById("stockStore").value;
 const linked=(db.products||[]).filter(p=>p.shopeeItemId);
 if(!linked.length){alert("Nenhum produto possui Item ID Shopee vinculado.");return;}
 let ok=0,fail=0;
 for(const p of linked){
  try{
   await api(`/api/shopee/stock/${store}`,{method:"POST",body:JSON.stringify({item_id:Number(p.shopeeItemId),stock_list:[{model_id:Number(p.shopeeModelId||0),seller_stock:[Math.max(0,Math.floor(+p.stock||0))]}]})});
   ok++;
  }catch(e){fail++;console.warn(p.name,e.message);}
 }
 alert(`Estoque enviado.\nSucesso: ${ok}\nFalhas: ${fail}`);
 renderShopeeStock();
}

function migrateStoreNames(){
  (db.products||[]).forEach(p=>{ if(p.store==="Loja 1"||p.store==="Loja 2") p.store=""; });
  (db.sales||[]).forEach(s=>{ if(s.store==="Loja 1") s.store="F4R Studio 3D"; else if(s.store==="Loja 2") s.store="F4RM 3D"; });
}
migrateStoreNames();
function populateSaleProducts(){
 const el=document.getElementById("sProduct");
 if(!el) return;
 const current=String(el.value||"");
 const products=Array.isArray(db.products)?db.products:[];
 el.innerHTML="<option value=\"\">Selecione um produto</option>"+products.map(p=>`<option value="${String(p.id)}">${String(p.name||"Produto sem nome")}${p.sku?" — "+String(p.sku):""}</option>`).join("");
 if(products.some(p=>String(p.id)===current)) el.value=current;
}

function repairKnownBatchData(){
 const p=(db.products||[]).find(x=>String(x.name||"").toLowerCase().includes("kit chaveiros outubro rosa"));
 if(!p || p.productionBasis!=="batch") return;
 const mats=p.materials||[];
 const pink=mats.find(r=>String(r.name||"").toLowerCase().includes("rosa"));
 const white=mats.find(r=>String(r.name||"").toLowerCase().includes("branco"));
 const ring=mats.find(r=>String(r.name||"").toLowerCase().includes("argola"));
 const bag=mats.find(r=>String(r.name||"").toLowerCase().includes("saquinho"));
 let changed=false;
 if(pink && Math.abs((+pink.sourceQty||0)-59.66)>0.001){pink.sourceQty=59.66; pink.qty=59.66/35; changed=true;}
 if(white && Math.abs((+white.sourceQty||0)-7.74)>0.001){white.sourceQty=7.74; white.qty=7.74/35; changed=true;}
 if(ring && Math.abs((+ring.sourceQty||0)-1)>0.001){ring.sourceQty=1; ring.qty=1/35; changed=true;}
 if(bag && Math.abs((+bag.sourceQty||0)-1)>0.00001){bag.sourceQty=1; bag.qty=1/35; changed=true;}
 if(p.productionBatchQty!==35){p.productionBatchQty=35; changed=true;}
 if(Math.abs((+p.productionSourceHours||0)-4.55)>0.001){p.productionSourceHours=4.55; p.printHours=4.55/35; changed=true;}
 if(Math.abs((+p.productionSourcePack||0)-1.5)>0.001){p.productionSourcePack=1.5; p.pack=1.5; changed=true;}
 if(changed) save();
}
repairKnownBatchData();

// Corrige históricos antigos que foram registrados com consumo fracionado para
// saquinhos/argolas de chaveiros. A correção é feita uma única vez e somente
// nas movimentações geradas por vendas/edições.
function repairKeychainConsumptionHistory(){
 const versionKey="gestor3d_keychain_consumption_v5";
 if(localStorage.getItem(versionKey)==="1") return;
 const materials=db.materials||[], sales=db.sales||[], movements=db.movements||[];
 let changed=false;
 const normalizeName=v=>String(v||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
 const movementTimestamp=m=>{
   const raw=String(m?.date||"");
   const match=raw.match(/(\d{2})\/(\d{2})\/(\d{4})[, ]+([0-9]{2}):([0-9]{2})(?::([0-9]{2}))?/);
   if(match) return new Date(`${match[3]}-${match[2]}-${match[1]}T${match[4]}:${match[5]}:${match[6]||"00"}`).getTime();
   return 0;
 };
 const saleTimestamp=s=>{
   if(!s?.dateISO)return 0;
   return new Date(`${s.dateISO}T${s.time||"00:00"}:00`).getTime();
 };
 const rules=[
   {test:n=>n.includes("saquinho")&&n.includes("chaveiro"),calc:q=>q>0?Math.ceil(q/25):0},
   {test:n=>n.includes("argola")&&n.includes("chaveiro"),calc:q=>q}
 ];
 rules.forEach(rule=>{
   materials.filter(mat=>rule.test(normalizeName(mat.name))).forEach(mat=>{
     const related=movements.filter(m=>String(m.materialId)===String(mat.id)
       && String(m.type||"").toLowerCase().includes("saída")
       && /^(Venda|Edição):\s*/i.test(String(m.note||"")));
     const available=sales.filter(s=>s.status!=="Cancelado" && s.product && related.some(m=>{
       const note=String(m.note||"").replace(/^(Venda|Edição):\s*/i,"");
       return note===String(s.product);
     }));
     const usedSales=new Set();
     related.sort((a,b)=>movementTimestamp(a)-movementTimestamp(b));
     related.forEach(mv=>{
       const note=String(mv.note||"").replace(/^(Venda|Edição):\s*/i,"");
       const candidates=available.filter(s=>!usedSales.has(String(s.id)) && String(s.product)===note);
       if(!candidates.length)return;
       candidates.sort((a,b)=>Math.abs(saleTimestamp(a)-movementTimestamp(mv))-Math.abs(saleTimestamp(b)-movementTimestamp(mv)));
       const sale=candidates[0];
       usedSales.add(String(sale.id));
       const expected=rule.calc(Math.max(0,Number(sale.qty)||0));
       const oldQty=Number(mv.qty)||0;
       if(Math.abs(oldQty-expected)>0.000001){
         mat.stock=Number(mat.stock||0)+(oldQty-expected);
         mv.qty=expected;
         changed=true;
       }
     });
     // Rebuild before/after for this material so the history reflects the corrected quantities.
     const all=movements.filter(m=>String(m.materialId)===String(mat.id));
     const totalDelta=all.reduce((sum,m)=>{
       const q=Math.abs(Number(m.qty)||0);
       return sum + (String(m.type||"").toLowerCase().includes("entrada") ? q : -q);
     },0);
     let running=Number(mat.stock||0)-totalDelta;
     all.sort((a,b)=>movementTimestamp(a)-movementTimestamp(b));
     all.forEach(m=>{
       const before=running;
       const q=Math.abs(Number(m.qty)||0);
       const isEntry=String(m.type||"").toLowerCase().includes("entrada");
       running=isEntry?running+q:running-q;
       if(Math.abs(Number(m.before)-before)>0.000001 || Math.abs(Number(m.after)-running)>0.000001){
         m.before=before; m.after=running; changed=true;
       }
     });
   });
 });
 if(changed) save();
 localStorage.setItem(versionKey,"1");
}
repairKeychainConsumptionHistory();

const STATE_ORDER=["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const STATE_NAMES={AC:"Acre",AL:"Alagoas",AP:"Amapá",AM:"Amazonas",BA:"Bahia",CE:"Ceará",DF:"Distrito Federal",ES:"Espírito Santo",GO:"Goiás",MA:"Maranhão",MT:"Mato Grosso",MS:"Mato Grosso do Sul",MG:"Minas Gerais",PA:"Pará",PB:"Paraíba",PR:"Paraná",PE:"Pernambuco",PI:"Piauí",RJ:"Rio de Janeiro",RN:"Rio Grande do Norte",RS:"Rio Grande do Sul",RO:"Rondônia",RR:"Roraima",SC:"Santa Catarina",SP:"São Paulo",SE:"Sergipe",TO:"Tocantins"};
// Positions are percentages inside the cleaned map image (990 x 788).
const STATE_POS={AC:[6.5,35],AL:[95.0,38.5],AP:[57.4,7],AM:[19.9,21],BA:[79.3,45],CE:[84.2,22],DF:[64.6,51.8],ES:[81.7,63.7],GO:[62.3,58.4],MA:[72.2,21],MT:[44.4,48],MS:[45.8,70],MG:[69.4,63.5],PA:[52.4,21],PB:[94.0,29.8],PR:[51.4,86],PE:[94.0,34],PI:[67.6,29.2],RJ:[79.7,79],RN:[94.0,24],RS:[52.4,96],RO:[25.6,43],RR:[32.3,4],SC:[54.3,91],SP:[58.4,78],SE:[94.0,40],TO:[62.3,38]};
function saleStateCode(s){const raw=String(s?.state||s?.uf||"").trim();if(!raw)return"";const m=raw.match(/\(([A-Z]{2})\)/i);if(m)return m[1].toUpperCase();const upper=raw.toUpperCase();for(const uf of STATE_ORDER){if(upper===uf||upper.includes(STATE_NAMES[uf].toUpperCase()))return uf;}return"";}
function monthKeyFromSale(s){if(s?.dateISO&&/^\d{4}-\d{2}/.test(s.dateISO))return s.dateISO.slice(0,7);const d=String(s?.date||"").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);return d?`${d[3]}-${d[2]}`:"";}
function formatMonthLabel(k){if(!k)return"Total geral";const[y,m]=k.split("-");return new Date(Number(y),Number(m)-1,1).toLocaleDateString("pt-BR",{month:"long",year:"numeric"}).replace(/^./,c=>c.toUpperCase());}
function availableDashboardPeriods(){return[...new Set((db.sales||[]).map(monthKeyFromSale).filter(Boolean))].sort().reverse();}
function populateDashboardPeriods(selected){const months=availableDashboardPeriods();const value=selected||document.getElementById("dashboardPeriod")?.value||"total";["dashboardPeriod","stateMapPeriod"].forEach(id=>{const el=document.getElementById(id);if(!el)return;el.innerHTML='<option value="total">Total geral</option>'+months.map(k=>`<option value="${k}">${formatMonthLabel(k)}</option>`).join("");el.value=(value==="total"||months.includes(value))?value:"total";});return document.getElementById("dashboardPeriod")?.value||"total";}
function setDashboardPeriod(value){const period=populateDashboardPeriods(value||"total");const a=document.getElementById("dashboardPeriod"),b=document.getElementById("stateMapPeriod");if(a)a.value=period;if(b)b.value=period;renderDashboardSummary(period);renderStateMap(period);}
function renderDashboardSummary(period){const p=period||document.getElementById("dashboardPeriod")?.value||"total";const sales=(db.sales||[]).filter(s=>s.status!=="Cancelado"&&(p==="total"||monthKeyFromSale(s)===p));const revenue=sales.reduce((a,s)=>a+(Number(s.grossValue??s.value)||0),0);const net=sales.reduce((a,s)=>{const gross=Number(s.grossValue??s.value)||0;const fee=Number(s.fee)||0;const nv=Number(s.netValue);return a+(Number.isFinite(nv)&&nv>0?nv:Math.max(0,gross-fee));},0);const costs=sales.reduce((a,s)=>a+(Number(s.cost)||0),0);const fees=sales.reduce((a,s)=>a+(Number(s.fee)||0),0);const label=p==="total"?"Todos os períodos":formatMonthLabel(p);const dr=document.getElementById("dashRevenue"),dn=document.getElementById("dashNetRevenue"),dp=document.getElementById("dashProfit"),do_=document.getElementById("dashOrders");if(dr)dr.textContent=money(revenue);if(dn)dn.textContent=money(net);if(dp)dp.textContent=money(revenue-costs-fees);if(do_)do_.textContent=sales.length;["dashRevenueFoot","dashNetFoot","dashProfitFoot","dashOrdersFoot"].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=id==="dashRevenueFoot"?label:(id==="dashOrdersFoot"?`${label}`:"Após custos e taxas");});}
function renderStateMap(period){const box=document.getElementById("stateMapCounts");if(!box)return;const p=period||document.getElementById("stateMapPeriod")?.value||"total";const sales=(db.sales||[]).filter(s=>s.status!=="Cancelado"&&(p==="total"||monthKeyFromSale(s)===p));const counts=Object.fromEntries(STATE_ORDER.map(uf=>[uf,0]));sales.forEach(s=>{const uf=saleStateCode(s);if(uf)counts[uf]++;});box.innerHTML=STATE_ORDER.map(uf=>{const pos=STATE_POS[uf]||[50,50],count=counts[uf];return `<div class="map-count ${count===0?'zero':''}" title="${STATE_NAMES[uf]}: ${count} ${count===1?'pedido':'pedidos'}" style="left:${pos[0]}%;top:${pos[1]}%">${count}</div>`;}).join("");const total=sales.length,withSales=STATE_ORDER.filter(uf=>counts[uf]>0).length;const totalEl=document.getElementById("stateMapTotal");if(totalEl)totalEl.textContent=`${total} ${total===1?'pedido':'pedidos'} no período • ${withSales} estado${withSales===1?'':'s'} com vendas`;const totalOrders=document.getElementById("stateMapTotalOrders"),stateCount=document.getElementById("stateMapStatesWithSales");if(totalOrders)totalOrders.textContent=total;if(stateCount)stateCount.textContent=withSales;const ranking=document.getElementById("stateRanking");if(ranking){const ranked=STATE_ORDER.map(uf=>({uf,count:counts[uf]})).filter(x=>x.count>0).sort((a,b)=>b.count-a.count||a.uf.localeCompare(b.uf));if(!ranked.length){ranking.innerHTML='<div class="ranking-empty">Nenhuma venda encontrada neste período.</div>';}else{const max=ranked[0].count;ranking.innerHTML=ranked.slice(0,10).map((x,i)=>`<div class="ranking-row"><span class="ranking-rank">${i+1}</span><span class="ranking-uf">${x.uf}</span><div class="ranking-bar"><i style="width:${Math.max(6,Math.round(x.count/max*100))}%"></i></div><span class="ranking-value">${x.count}</span></div>`).join("");}}}

function render(){
 db.materials=db.materials||[]; db.movements=db.movements||[]; db.quotes=db.quotes||[]; db.purchases=db.purchases||[]; db.sales=db.sales||[]; db.products=db.products||[];
 const dashboardPeriod=populateDashboardPeriods();
 renderDashboardSummary(dashboardPeriod);
 renderStateMap(dashboardPeriod);
 db.materials.forEach(m=>{if(m.minStock===undefined)m.minStock=0;});
db.products.forEach(p=>{
 if(p.printHours===undefined)p.printHours=0;
 if(p.productionBasis==="batch"){
   const bq=Math.max(1,+p.productionBatchQty||1);
   (p.materials||[]).forEach(r=>{ if(r.sourceQty===undefined) r.sourceQty=(+r.qty||0)*bq; });
   if(p.productionSourceMaterials===undefined) p.productionSourceMaterials=(p.materials||[]).map(r=>({materialId:r.materialId,sourceQty:r.sourceQty}));
 }
});

 const materialsTable=document.getElementById("materialsTable");
 if(materialsTable) materialsTable.innerHTML=db.materials.map(m=>`<tr><td><b>${m.name}</b>${m.color?`<div class="sub">${m.color}</div>`:""}</td><td>${categoryBadge(m.category)}</td><td>${[m.brand,m.type].filter(Boolean).join(" • ")||"—"}</td><td>${m.unit}</td><td>${money(m.unitCost)}</td><td>${m.stock}</td><td>${m.stock<=0?'<span class="tag warn">Sem estoque</span>':m.stock<=m.minStock?'<span class="tag warn">Baixo</span>':'<span class="tag good">Normal</span>'}</td><td><div class="row-actions"><button class="btn xs outline" onclick="editMaterial('${m.id}')">Editar</button><button class="btn xs danger" onclick="deleteMaterial('${m.id}')">Excluir</button></div></td></tr>`).join('')||'<tr><td colspan="8">Nenhum material cadastrado.</td></tr>';
 const smt=document.getElementById("stockMaterialsTable"); if(smt) smt.innerHTML=db.materials.map(m=>`<tr><td><b>${m.name}</b><div class="sub">${m.color||""}</div></td><td>${categoryBadge(m.category)}</td><td>${[m.brand,m.type].filter(Boolean).join(" • ")||"—"}</td><td>${money(m.unitCost)}</td><td>${m.stock} ${m.unit}</td><td>${m.minStock||0}</td><td>${m.stock<=0?'<span class="tag warn">Sem estoque</span>':m.stock<=m.minStock?'<span class="tag warn">Baixo</span>':'<span class="tag good">Normal</span>'}</td><td><div class="row-actions"><button class="btn xs outline" onclick="editMaterial('${m.id}')">Editar</button><button class="btn xs danger" onclick="deleteMaterial('${m.id}')">Excluir</button></div></td></tr>`).join('')||'<tr><td colspan="8">Nenhum material cadastrado.</td></tr>';
 const ft=document.getElementById("finishedTable"); if(ft) ft.innerHTML=db.products.map(p=>`<tr><td><b>${p.name}</b></td><td>${p.sku||"—"}</td><td>${p.store||"—"}</td><td>${p.stock}</td><td>${money(suggested(p))}</td><td>${money(totalCost(p))}</td></tr>`).join('')||'<tr><td colspan="6">Nenhum produto cadastrado.</td></tr>';
 const pt=document.getElementById("projectsTable"); if(pt) pt.innerHTML=(db.quotes||[]).map(q=>`<tr><td>${q.date}</td><td>${q.name}</td><td>${q.qty}</td><td>${money(q.price)}</td><td><span class="tag">${q.status}</span></td></tr>`).join('')||'<tr><td colspan="5">Nenhum orçamento salvo.</td></tr>';
 const pct=document.getElementById("purchasesTable"); if(pct) pct.innerHTML=(db.purchases||[]).map(p=>`<tr><td>${p.date}</td><td>${p.material}</td><td>${p.qty} ${p.unit}</td><td>${money(p.value)}</td><td>${p.supplier||"—"}</td></tr>`).join('')||'<tr><td colspan="5">Nenhuma compra registrada.</td></tr>';
 const spt=document.getElementById("shopeeProductsTable"); if(spt) spt.innerHTML=db.products.map(p=>`<tr><td>${p.name}</td><td>${p.sku||"—"}</td><td>${p.shopeeName||"Ainda não importado"}</td><td>${p.sku?'<span class="tag good">Pronto</span>':'<span class="tag warn">Sem SKU</span>'}</td></tr>`).join('')||'<tr><td colspan="4">Nenhum produto interno.</td></tr>';
 const sst=document.getElementById("shopeeStockTable"); if(sst) sst.innerHTML=db.products.map(p=>`<tr><td>${p.name}</td><td>${p.sku||"—"}</td><td>${p.stock||0}</td><td>—</td><td><span class="tag">Aguardando conexão</span></td></tr>`).join('')||'<tr><td colspan="5">Nenhum produto.</td></tr>';

 refreshMovementSelect();
 const movementsTable=document.getElementById("movementsTable"); if(movementsTable) movementsTable.innerHTML=(db.movements||[]).slice(0,100).map(m=>`<tr><td>${m.date}</td><td>${m.material}</td><td><span class="tag">${m.type}</span></td><td>${m.qty}</td><td>${m.note||"—"}</td></tr>`).join('')||'<tr><td colspan="5">Nenhuma movimentação.</td></tr>';
 // Consumo de materiais: soma somente saídas e mostra o estoque atual do cadastro.
 const consumptionRows=(db.materials||[]).map(mat=>{
   const outs=(db.movements||[]).filter(m=>String(m.materialId)===String(mat.id) && String(m.type).toLowerCase().includes("saída"));
   const used=outs.reduce((sum,m)=>sum+(Number(m.qty)||0),0);
   return {mat,used};
 }).sort((a,b)=>b.used-a.used || String(a.mat.name||"").localeCompare(String(b.mat.name||""),"pt-BR"));
 const consumptionTable=document.getElementById("consumptionTable");
 if(consumptionTable) consumptionTable.innerHTML=consumptionRows.map(({mat,used})=>`<tr><td><b>${mat.name}</b>${mat.color?`<div class="sub">${mat.color}</div>`:""}</td><td>${categoryBadge(mat.category)}</td><td><b>${Number(used).toLocaleString("pt-BR",{maximumFractionDigits:4})}</b></td><td><b>${Number(mat.stock||0).toLocaleString("pt-BR",{maximumFractionDigits:4})}</b></td><td>${mat.unit||"—"}</td><td>${(+mat.stock||0)<=0?'<span class="tag warn">Sem estoque</span>':(+mat.stock||0)<=(+mat.minStock||0)?'<span class="tag warn">Baixo</span>':'<span class="tag good">Normal</span>'}</td></tr>`).join("")||'<tr><td colspan="6">Nenhum material cadastrado.</td></tr>';
 const consumptionHistory=(db.movements||[]).filter(m=>String(m.type).toLowerCase().includes("saída")).slice(0,100);
 const consumptionHistoryTable=document.getElementById("consumptionHistoryTable");
 if(consumptionHistoryTable) consumptionHistoryTable.innerHTML=consumptionHistory.map(m=>{const mat=(db.materials||[]).find(x=>String(x.id)===String(m.materialId));const unit=mat?.unit||"";return `<tr><td>${m.date||"—"}</td><td>${m.material||mat?.name||"—"}</td><td><b>${Number(m.qty||0).toLocaleString("pt-BR",{maximumFractionDigits:4})} ${unit}</b></td><td>${m.before===undefined?"—":Number(m.before).toLocaleString("pt-BR",{maximumFractionDigits:4})+" "+unit}</td><td>${m.after===undefined?"—":Number(m.after).toLocaleString("pt-BR",{maximumFractionDigits:4})+" "+unit}</td><td>${m.note||"—"}</td></tr>`}).join("")||'<tr><td colspan="6">Nenhum consumo registrado.</td></tr>';
 const cmc=document.getElementById("consumptionMaterialsCount"), cuc=document.getElementById("consumptionUsedCount"), clc=document.getElementById("consumptionLowCount");
 if(cmc)cmc.textContent=consumptionRows.length; if(cuc)cuc.textContent=consumptionRows.filter(x=>x.used>0).length; if(clc)clc.textContent=consumptionRows.filter(x=>(+x.mat.stock||0)<=(+x.mat.minStock||0)).length;
 const sf=document.getElementById("storefrontGrid"); if(sf) sf.innerHTML=db.products.slice(0,12).map(p=>`<div class="store-item"><b>${p.name}</b><small>${p.sku||"Sem SKU"} • ${p.store||"Sem loja"}</small><div style="margin-top:10px;font-weight:800">${money(suggested(p))}</div></div>`).join('')||'<div class="sub">Cadastre produtos para montar sua vitrine.</div>';
 const activeSales=db.sales.filter(s=>s.status!=="Cancelado");
 let revenue=activeSales.reduce((a,s)=>a+(Number(s.grossValue??s.value)||0),0), netRevenue=activeSales.reduce((a,s)=>{const gross=Number(s.grossValue??s.value)||0; const fee=Number(s.fee); const net=Number(s.netValue); return a+(Number.isFinite(net)&&net>0?net:Math.max(0,gross-(Number.isFinite(fee)?fee:0)));},0), totalProductCosts=activeSales.reduce((a,s)=>a+(Number(s.cost)||0),0), fees=activeSales.reduce((a,s)=>a+(Number(s.fee)||0),0);
 const ds=document.getElementById("dashStock"); if(ds)ds.textContent=db.products.reduce((a,p)=>a+(+p.stock||0),0)+(db.materials||[]).length; renderDashboardSummary(dashboardPeriod); renderStateMap(dashboardPeriod);
 const productsTable=document.getElementById("productsTable"); if(productsTable) productsTable.innerHTML=db.products.map(p=>`<tr><td><b>${p.name}</b></td><td>${p.sku||"-"}</td><td>${p.store||"—"}</td><td>${(p.materials||[]).map(m=>`${m.name} (${Number(m.qty||m.grams||0).toLocaleString("pt-BR",{maximumFractionDigits:4})} ${m.unit||"un."})`).join(", ")||"—"}</td><td>${money(totalCost(p))}</td><td>${money(suggested(p))}</td><td>${p.stock||0}</td><td><button class="btn secondary" onclick="openTechModal('${p.id}')">Ver ficha</button></td><td><button class="btn secondary" onclick="editProduct('${p.id}')">✏️ Editar</button></td></tr>`).join('')||'<tr><td colspan="9">Nenhum produto cadastrado.</td></tr>';
 const stockTable=document.getElementById("stockTable"); if(stockTable) stockTable.innerHTML=[...(db.materials||[]).map(m=>`<tr><td>${m.name}</td><td>${m.category}</td><td>${m.stock} ${m.unit}</td><td>${m.stock<=m.minStock?'<span class="tag warn">Baixo</span>':'<span class="tag good">Normal</span>'}</td></tr>`),...db.products.map(p=>`<tr><td>${p.name}</td><td>Produto acabado</td><td>${p.stock||0} un.</td><td>${(p.stock||0)<=2?'<span class="tag warn">Baixo</span>':'<span class="tag good">Normal</span>'}</td></tr>`)].join('')||'<tr><td colspan="4">Nenhum item.</td></tr>';
 const lowStock=document.getElementById("lowStock"); if(lowStock){const lp=db.products.filter(p=>(+p.stock||0)<=2).map(p=>`<div style="padding:9px 0;border-bottom:1px solid #eee">${p.name} <span class="tag warn">${p.stock||0} un.</span></div>`);const lm=db.materials.filter(m=>(+m.stock||0)<=m.minStock).map(m=>`<div style="padding:9px 0;border-bottom:1px solid #eee">${m.name} <span class="tag warn">${m.stock} ${m.unit}</span></div>`);lowStock.innerHTML=[...lp,...lm].join('')||'<div class="sub">Nenhum estoque crítico.</div>'; }
 const dashSales=document.getElementById("dashSales"); if(dashSales)dashSales.innerHTML=db.sales.slice(0,6).map(s=>`<div style="padding:9px 0;border-bottom:1px solid #eee;display:flex;justify-content:space-between"><span>${s.customerName?s.customerName+" • ":""}${s.product}<small class="sub">${s.date||formatDateISO(s.dateISO)} ${s.time||""} • ${s.store||"—"}</small></span><b>${money(Number(s.grossValue??s.value)||0)}</b></div>`).join('')||'<div class="sub">Nenhuma venda registrada.</div>';
 renderSalesTable(); populateSaleProducts();
 const sd=document.getElementById("sDate"), st=document.getElementById("sTime"), days=document.getElementById("sPostDays"), due=document.getElementById("sDueDate"); if(sd&&!sd.value)sd.value=todayISO(); if(st&&!st.value)st.value=new Date().toTimeString().slice(0,5); if(days&&!days.value)days.value="1"; updatePostDate();
 const allSales=db.sales||[]; const totalOrders=allSales.length, prodCount=allSales.filter(s=>s.status==="Em produção").length, readyCount=allSales.filter(s=>s.status==="Pronto").length, lateCount=allSales.filter(isLate).length, deliveredCount=allSales.filter(s=>s.status==="Entregue").length; ["salesTotal","salesInProduction","salesReady","salesLate","salesDelivered"].forEach((id,i)=>{const el=document.getElementById(id);if(el)el.textContent=[totalOrders,prodCount,readyCount,lateCount,deliveredCount][i];});
 const saleDateEl=document.getElementById("sDate"); if(saleDateEl)saleDateEl.onchange=updatePostDate; const saleDaysEl=document.getElementById("sPostDays"); if(saleDaysEl)saleDaysEl.onchange=updatePostDate; const saleProductEl=document.getElementById("sProduct"); if(saleProductEl)saleProductEl.onchange=updateSalePreview; const saleQtyEl=document.getElementById("sQty"); if(saleQtyEl)saleQtyEl.oninput=updateSalePreview;
 const saleGrossEl=document.getElementById("sGross"); if(saleGrossEl)saleGrossEl.oninput=()=>{saleGrossEl.dataset.manual="1";}; const saleNetEl=document.getElementById("sNet"); if(saleNetEl)saleNetEl.oninput=()=>{saleNetEl.dataset.manual="1";};
 populateCalcProductSelect(); updateSalePreview();
 const finRevenue=document.getElementById("finRevenue"),finCost=document.getElementById("finCost"),finFees=document.getElementById("finFees"),finProfit=document.getElementById("finProfit"); if(finRevenue)finRevenue.textContent=money(revenue);if(finCost)finCost.textContent=money(totalProductCosts);if(finFees)finFees.textContent=money(fees);if(finProfit)finProfit.textContent=money(revenue-totalProductCosts-fees); calc();
}function calc(){let c=+cCost.value||0,f=(+cFee.value||0)/100,m=(+cMargin.value||0)/100;let min=f<1?c/(1-f):0, sug=(1-f-m)>0?c/(1-f-m):0;minPrice.textContent=money(min);suggested.textContent=money(sug);calcProfit.textContent=money(sug-c-sug*f)}
addMaterialRow();
addCalcMaterial();
renderCategorySelect();
["mPurchaseQty","mPurchasePrice","mUnit"].forEach(id=>document.getElementById(id).addEventListener("input",updateMaterialPreview));
runCalc();
render();

try{const q=new URLSearchParams(location.search);if(q.get("shopee_connected")){history.replaceState({},document.title,"/");setTimeout(()=>{show("shopee");refreshShopeeStatus();alert("Loja Shopee autorizada com sucesso!");},200);}}catch(e){}
updateCalcBasisUI();
