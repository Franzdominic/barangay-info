(() => {
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const USERS = 'barangayMaligayaUsers', SESSION = 'barangayMaligayaSession';
  const read = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  async function hash(p) {
    if (window.crypto && crypto.subtle) {
      const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(p));
      return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
    }
    return btoa(unescape(encodeURIComponent(p)));
  }

  function renderNav() {
    const s = read(SESSION), nav = $('#authNav');
    if (!nav) return;
    nav.innerHTML = s
      ? `<li class="nav-item"><span class="navbar-text text-white">Hi, ${esc(s.name.split(' ')[0])}</span></li>
         <li class="nav-item"><button id="logout" class="btn btn-outline-light btn-sm" type="button">Log out</button></li>`
      : `<li class="nav-item"><a class="nav-link" href="login.html">Log in</a></li>
         <li class="nav-item"><a class="btn btn-sun btn-sm" href="signup.html">Sign up</a></li>`;
    const out = $('#logout');
    if (out) out.addEventListener('click', () => { localStorage.removeItem(SESSION); renderNav(); });
    const f = $('#fName');
    if (f && s && !f.value) f.value = s.name;
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderNav();
    const show = $('#showPw');
    if (show) show.addEventListener('change', () => document.querySelectorAll('[data-pw]').forEach(i => i.type = show.checked ? 'text' : 'password'));

    const su = $('#signupForm');
    if (su) {
      const email = $('#sEmail'), pass = $('#sPass'), conf = $('#sConfirm');
      const sync = () => conf.setCustomValidity(conf.value && conf.value !== pass.value ? 'mismatch' : '');
      pass.addEventListener('input', sync); conf.addEventListener('input', sync);
      email.addEventListener('input', () => { email.setCustomValidity(''); $('#sEmailMsg').textContent = 'Enter a valid email address.'; });
      su.addEventListener('submit', async e => {
        e.preventDefault(); sync();
        const users = read(USERS) || [], mail = email.value.trim().toLowerCase();
        if (users.some(u => u.email === mail)) {
          email.setCustomValidity('taken'); $('#sEmailMsg').textContent = 'This email is already registered. Log in instead.';
        }
        su.classList.add('was-validated');
        if (!su.checkValidity()) { su.querySelector(':invalid').focus(); return; }
        users.push({name: $('#sName').value.trim(), email: mail, pw: await hash(pass.value)});
        write(USERS, users);
        location.href = 'login.html?registered=1';
      });
    }

    const li = $('#loginForm');
    if (li) {
      if (location.search.includes('registered=1')) $('#regOk').hidden = false;
      li.addEventListener('submit', async e => {
        e.preventDefault(); li.classList.add('was-validated');
        if (!li.checkValidity()) { li.querySelector(':invalid').focus(); return; }
        const mail = $('#lEmail').value.trim().toLowerCase(), pw = await hash($('#lPass').value);
        const u = (read(USERS) || []).find(x => x.email === mail && x.pw === pw);
        const err = $('#authError');
        if (!u) { err.textContent = 'Email or password is incorrect. Check both, or create an account.'; err.hidden = false; $('#lPass').focus(); return; }
        write(SESSION, {name: u.name, email: u.email});
        location.href = 'index.html';
      });
    }
  });
})();
