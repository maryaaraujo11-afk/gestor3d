(function(){
  const SUPABASE_URL = "https://givfacbmlhjizrmgguzi.supabase.co";
  const SUPABASE_KEY = "sb_publishable_-RaV-4hmFnLPyGhewGQZeg_1I_fs_wH";
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  window.gestorSupabase = client;

  const gate = document.getElementById("authGate");
  const app = document.querySelector(".app");
  const form = document.getElementById("authForm");
  const title = document.getElementById("authTitle");
  const subtitle = document.getElementById("authSubtitle");
  const submit = document.getElementById("authSubmit");
  const toggle = document.getElementById("authToggle");
  const forgot = document.getElementById("authForgot");
  const message = document.getElementById("authMessage");
  const nameField = document.getElementById("authNameField");
  const nameInput = document.getElementById("authName");
  const emailInput = document.getElementById("authEmail");
  const passwordInput = document.getElementById("authPassword");
  let mode = "login";

  function setMessage(text, type){
    if(!message)return;
    message.textContent = text || "";
    message.className = "auth-message " + (type || "");
  }

  function setMode(next){
    mode = next;
    const signup = mode === "signup";
    if(title) title.textContent = signup ? "Criar acesso" : "Entrar no Gestor 3D";
    if(subtitle) subtitle.textContent = signup ? "Crie sua conta para proteger seus dados." : "Entre para acessar suas vendas, produtos e orçamentos.";
    if(submit) submit.textContent = signup ? "Criar minha conta" : "Entrar";
    if(toggle) toggle.textContent = signup ? "Já tenho uma conta" : "Criar uma conta";
    if(nameField) nameField.classList.toggle("hidden", !signup);
    if(forgot) forgot.classList.toggle("hidden", signup);
    setMessage("");
  }

  async function showApp(session){
    if(!session){
      if(app) app.classList.add("app-locked");
      if(gate) gate.classList.remove("hidden");
      setMode("login");
      return;
    }
    if(gate) gate.classList.add("hidden");
    if(app) app.classList.remove("app-locked");
    const user = session.user;
    const label = document.getElementById("authUserLabel");
    if(label) label.textContent = user.email || "Conta conectada";
  }

  async function init(){
    const {data} = await client.auth.getSession();
    await showApp(data.session);
    client.auth.onAuthStateChange((_event, session) => { showApp(session); });
  }

  form?.addEventListener("submit", async function(e){
    e.preventDefault();
    const email = String(emailInput?.value || "").trim();
    const password = String(passwordInput?.value || "");
    const name = String(nameInput?.value || "").trim();
    if(!email || !password){
      setMessage("Informe seu e-mail e sua senha.", "error");
      return;
    }
    if(password.length < 6){
      setMessage("A senha precisa ter pelo menos 6 caracteres.", "error");
      return;
    }
    if(mode === "signup" && !name){
      setMessage("Informe seu nome.", "error");
      return;
    }
    if(submit) submit.disabled = true;
    setMessage(mode === "signup" ? "Criando sua conta..." : "Entrando...", "loading");
    try{
      if(mode === "signup"){
        const {data,error} = await client.auth.signUp({
          email,
          password,
          options:{data:{name}}
        });
        if(error) throw error;
        if(data.session){
          setMessage("Conta criada! Entrando...", "success");
        }else{
          setMessage("Conta criada! Confira seu e-mail para confirmar o acesso e depois entre no sistema.", "success");
          setMode("login");
        }
      }else{
        const {error} = await client.auth.signInWithPassword({email,password});
        if(error) throw error;
      }
    }catch(err){
      let msg = err?.message || "Não foi possível concluir o acesso.";
      if(/invalid login credentials/i.test(msg)) msg = "E-mail ou senha incorretos.";
      if(/email not confirmed/i.test(msg)) msg = "Confirme seu e-mail antes de entrar.";
      setMessage(msg, "error");
    }finally{
      if(submit) submit.disabled = false;
    }
  });

  toggle?.addEventListener("click", () => setMode(mode === "login" ? "signup" : "login"));

  forgot?.addEventListener("click", async () => {
    const email = String(emailInput?.value || "").trim();
    if(!email){
      setMessage("Digite seu e-mail primeiro para receber o link de recuperação.", "error");
      emailInput?.focus();
      return;
    }
    try{
      const {error} = await client.auth.resetPasswordForEmail(email, {redirectTo: location.origin});
      if(error) throw error;
      setMessage("Enviamos um link para redefinir sua senha. Verifique seu e-mail.", "success");
    }catch(err){
      setMessage(err?.message || "Não foi possível enviar o link de recuperação.", "error");
    }
  });

  window.gestorAuthLogout = async function(){
    await client.auth.signOut();
  };

  init();
})();