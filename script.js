const modal = document.getElementById('login-modal');
const btnOpenLogin = document.getElementById('btn-open-login');
const btnCloseLogin = document.getElementById('btn-close-login');

const formLogin = document.getElementById('form-login');
const formRegister = document.getElementById('form-register');

const linkRegister = document.getElementById('link-register');
const linkLogin = document.getElementById('link-login');

const loginMsg = document.getElementById('login-msg');
const registerMsg = document.getElementById('register-msg');
const navUser = document.getElementById('nav-user');

function showModal() {
    modal.classList.add('active');
}

function hideModal() {
    modal.classList.remove('active');
    loginMsg.textContent = '';
    loginMsg.className = 'msg';
    registerMsg.textContent = '';
    registerMsg.className = 'msg';
}

function showLoginForm() {
    formLogin.style.display = 'block';
    formRegister.style.display = 'none';
}

function showRegisterForm() {
    formLogin.style.display = 'none';
    formRegister.style.display = 'block';
}

function renderLoggedIn(usuario) {
    navUser.innerHTML = `<span>Olá, ${usuario}</span>`;
    btnOpenLogin.textContent = 'SAIR';
    btnOpenLogin.classList.remove('btn-login');
    btnOpenLogin.classList.add('btn-logout');
    btnOpenLogin.removeEventListener('click', openLoginHandler);
    btnOpenLogin.addEventListener('click', logoutHandler);

    // Mostra botão de pedidos se for admin
    const navPedidos = document.getElementById('nav-pedidos');
    if (navPedidos) {
        navPedidos.style.display = usuario === 'Adimin' ? 'inline' : 'none';
    }
}

function renderLoggedOut() {
    navUser.innerHTML = '';
    btnOpenLogin.textContent = 'ENTRAR';
    btnOpenLogin.classList.remove('btn-logout');
    btnOpenLogin.classList.add('btn-login');
    btnOpenLogin.removeEventListener('click', logoutHandler);
    btnOpenLogin.addEventListener('click', openLoginHandler);

    // Esconde botão de pedidos
    const navPedidos = document.getElementById('nav-pedidos');
    if (navPedidos) {
        navPedidos.style.display = 'none';
    }
}

function openLoginHandler(e) {
    e.preventDefault();
    showModal();
    showLoginForm();
}

function logoutHandler(e) {
    e.preventDefault();
    localStorage.removeItem('pocketwave_user');
    renderLoggedOut();
}

btnOpenLogin.addEventListener('click', openLoginHandler);

btnCloseLogin.addEventListener('click', hideModal);

modal.addEventListener('click', (e) => {
    if (e.target === modal) hideModal();
});

linkRegister.addEventListener('click', (e) => {
    e.preventDefault();
    showRegisterForm();
});

linkLogin.addEventListener('click', (e) => {
    e.preventDefault();
    showLoginForm();
});

async function apiPost(endpoint, data) {
    const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data: json };
}

document.getElementById('btn-login-submit').addEventListener('click', async () => {
    const usuario = document.getElementById('login-usuario').value.trim();
    const senha = document.getElementById('login-senha').value;

    if (!usuario || !senha) {
        loginMsg.textContent = 'Preencha todos os campos.';
        loginMsg.className = 'msg error';
        return;
    }

    const result = await apiPost('/api/login', { usuario, senha });
    if (result.ok) {
        loginMsg.textContent = 'Login realizado com sucesso!';
        loginMsg.className = 'msg success';
        localStorage.setItem('pocketwave_user', result.data.usuario);
        renderLoggedIn(result.data.usuario);
        setTimeout(() => {
            hideModal();
            const redirect = localStorage.getItem('pocketwave_redirect');
            if (redirect) {
                localStorage.removeItem('pocketwave_redirect');
                window.location.href = redirect;
            }
        }, 600);
    } else {
        loginMsg.textContent = result.data.error || 'Erro ao fazer login.';
        loginMsg.className = 'msg error';
    }
});

document.getElementById('btn-register-submit').addEventListener('click', async () => {
    const email = document.getElementById('reg-email').value.trim();
    const telefone = document.getElementById('reg-telefone').value.trim();
    const usuario = document.getElementById('reg-usuario').value.trim();
    const senha = document.getElementById('reg-senha').value;

    if (!email || !telefone || !usuario || !senha) {
        registerMsg.textContent = 'Preencha todos os campos.';
        registerMsg.className = 'msg error';
        return;
    }

    const result = await apiPost('/api/register', { email, telefone, usuario, senha });
    if (result.ok) {
        registerMsg.textContent = 'Conta criada com sucesso!';
        registerMsg.className = 'msg success';
        showLoginForm();
        registerMsg.textContent = '';
        registerMsg.className = 'msg';
    } else {
        registerMsg.textContent = result.data.error || 'Erro ao criar conta.';
        registerMsg.className = 'msg error';
    }
});

function checkAuth() {
    const user = localStorage.getItem('pocketwave_user');
    if (user) {
        renderLoggedIn(user);
    } else {
        renderLoggedOut();
    }
}

checkAuth();

// Menu mobile
const menuToggle = document.getElementById('menu-toggle');
const navMenu = document.getElementById('nav-menu');

if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
    
    // Fecha o menu ao clicar em um link
    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
        });
    });
}

// Verifica login ao clicar em comprar
const navComprar = document.getElementById('nav-comprar');
const btnComprarHero = document.getElementById('btn-comprar-hero');

function handleComprar(e) {
    if (!localStorage.getItem('pocketwave_user')) {
        e.preventDefault();
        localStorage.setItem('pocketwave_redirect', 'checkout.html');
        showModal();
        showLoginForm();
    } else {
        // Se estiver logado, deixa o link funcionar normalmente (vai para checkout.html)
        // Não precisa de preventDefault
    }
}

if (navComprar) navComprar.addEventListener('click', handleComprar);
if (btnComprarHero) btnComprarHero.addEventListener('click', handleComprar);

