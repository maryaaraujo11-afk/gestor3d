(async function(){
  const SUPABASE_URL="https://givfacbmlhjizrmgguzi.supabase.co";
  const SUPABASE_KEY="sb_publishable_-RaV-4hmFnLPyGhewGQZeg_1I_fs_wH";
  const APP_URL="https://gestor3d-z1u5.onrender.com";

  async function ensureSupabase(){
    if(window.supabase?.createClient)return;
    await new Promise((resolve,reject)=>{
      const s=document.createElement("script");
      s.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
      s.onload=resolve;
      s.onerror=()=>reject(new Error("Não foi possível carregar o serviço de autenticação."));
      document.head.appendChild(s);
    });
  }

  try{
    await ensureSupabase();
    const client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
    window.gestorSupabase=client;

    const gate=document.getElementById("authGate"),app=document.querySelector(".app"),form=document.getElementById("authForm");
    const title=document.getElementById("authTitle"),subtitle=document.getElementById("authSubtitle"),submit=document.getElementById("authSubmit");
    const toggle=document.getElementById("authToggle"),forgot=document.getElementById("authForgot"),message=document.getElementById("authMessage");
    const nameField=document.getElementById("authNameField"),nameInput=document.getElementById("authName"),emailInput=document.getElementById("authEmail"),passwordInput=document.getElementById("authPassword");
    let mode="login";

    function setMessage(text,type){
      if(!message)return;
      message.textContent=text||"";
      message.className="auth-message "+(type||"");
    }
    function setMode(next){
      mode=next;
      const signup=mode==="signup";
      if(title)title.textContent=signup?"Criar acesso":"Entrar no Gestor 3D";
      if(subtitle)subtitle.textContent=signup?"Crie sua conta para proteger seus dados.":"Entre para acessar suas vendas, produtos e orçamentos.";
      if(submit)submit.textContent=signup?"Criar minha conta":"Entrar";
      if(toggle)toggle.textContent=signup?"Já tenho uma conta":"Criar uma conta";
      if(nameField)nameField.classList.toggle("hidden",!signup);
      if(forgot)forgot.classList.toggle("hidden",signup);
      setMessage("");
    }
    async function showApp(session){
      if(!session){app?.classList.add("app-locked");gate?.classList.remove("hidden");setMode("login");return;}
      gate?.classList.add("hidden");app?.classList.remove("app-locked");
      const label=document.getElementById("authUserLabel");if(label)label.textContent=session.user?.email||"Conta conectada";
      setTimeout(()=>{try{if(typeof cloudBackup==="function"){const current=localStorage.getItem("gestor3d_v1")||"";if(current)cloudBackup(current,"backup ao entrar");}if(typeof updateCloudBackupStatus==="function")updateCloudBackupStatus();}catch(e){}},1500);
    }

    form?.addEventListener("submit",async e=>{
      e.preventDefault();
      const email=String(emailInput?.value||"").trim(),password=String(passwordInput?.value||""),name=String(nameInput?.value||"").trim();
      if(!email||!password)return setMessage("Informe seu e-mail e sua senha.","error");
      if(password.length<6)return setMessage("A senha precisa ter pelo menos 6 caracteres.","error");
      if(mode==="signup"&&!name)return setMessage("Informe seu nome.","error");
      if(submit)submit.disabled=true;
      setMessage(mode==="signup"?"Criando sua conta...":"Entrando...","loading");
      try{
        if(mode==="signup"){
          const {data,error}=await client.auth.signUp({email,password,options:{data:{name},emailRedirectTo:APP_URL}});
          if(error)throw error;
          if(data.session)setMessage("Conta criada! Entrando...","success");
          else{setMessage("Conta criada! Enviamos a confirmação para seu e-mail.","success");setMode("login");}
        }else{
          const {error}=await client.auth.signInWithPassword({email,password});
          if(error)throw error;
        }
      }catch(err){
        let msg=err?.message||"Não foi possível concluir o acesso.";
        if(/invalid login credentials/i.test(msg))msg="E-mail ou senha incorretos.";
        if(/email not confirmed/i.test(msg))msg="Seu e-mail ainda não foi confirmado. Clique em “Reenviar confirmação”.";
        setMessage(msg,"error");
      }finally{if(submit)submit.disabled=false;}
    });

    toggle?.addEventListener("click",()=>setMode(mode==="login"?"signup":"login"));

    forgot?.addEventListener("click",async()=>{
      const email=String(emailInput?.value||"").trim();
      if(!email){setMessage("Digite seu e-mail primeiro para receber o link de recuperação.","error");emailInput?.focus();return;}
      try{
        const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:APP_URL});
        if(error)throw error;
        setMessage("Enviamos um link para redefinir sua senha. Verifique seu e-mail.","success");
      }catch(err){setMessage(err?.message||"Não foi possível enviar o link de recuperação.","error");}
    });

    const resend=document.createElement("button");
    resend.type="button";resend.id="authResend";resend.className="auth-link";resend.textContent="Reenviar confirmação";
    resend.addEventListener("click",async()=>{
      const email=String(emailInput?.value||"").trim();
      if(!email){setMessage("Digite seu e-mail primeiro.","error");emailInput?.focus();return;}
      try{
        const {error}=await client.auth.resend({type:"signup",email,options:{emailRedirectTo:APP_URL}});
        if(error)throw error;
        setMessage("Nova confirmação enviada. Agora o link abrirá o Gestor 3D.","success");
      }catch(err){setMessage(err?.message||"Não foi possível reenviar a confirmação.","error");}
    });
    forgot?.parentElement?.appendChild(resend);

    window.gestorAuthLogout=async()=>{await client.auth.signOut();};
    const {data}=await client.auth.getSession();await showApp(data.session);
    client.auth.onAuthStateChange((_event,session)=>showApp(session));
  }catch(err){
    const message=document.getElementById("authMessage");
    if(message){message.textContent=err?.message||"Não foi possível carregar o login.";message.className="auth-message error";}
  }
})();