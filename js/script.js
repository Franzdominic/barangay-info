(() => {
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmtDate = d => new Date(d + 'T00:00').toLocaleDateString('en-PH', {month:'long', day:'numeric', year:'numeric'});
  const peso = n => '₱' + n.toLocaleString('en-PH');

  /* ---------- Sample data ---------- */
  const FEES = {'Barangay clearance':50, 'Certificate of residency':30, 'Certificate of indigency':0, 'Business clearance':200};
  const ANN = [
    {t:'Free anti-rabies vaccination', c:'Health', d:'2026-11-22', x:'Bring your dog or cat to the covered court, 8 AM to 12 NN.'},
    {t:'Barangay assembly', c:'Event', d:'2026-11-28', x:'Residents are invited to hear the year-end report at the barangay hall, 4 PM.'},
    {t:'Water interruption on Rizal Street', c:'Notice', d:'2026-11-20', x:'Expect low or no water from 9 PM to 5 AM while the pipe is repaired.'},
    {t:'Curfew reminder for minors', c:'Safety', d:'2026-11-18', x:'Minors must be home by 10 PM. Parents can call the BPAT hotline for concerns.'},
    {t:'Christmas lantern contest', c:'Event', d:'2026-12-05', x:'Register your purok team at the hall until December 1. Lanterns must use recycled materials.'},
    {t:'Dengue clean-up drive', c:'Health', d:'2026-11-24', x:'Clear stagnant water around your home. Volunteers meet at the hall at 7 AM.'},
    {t:'Fire safety seminar', c:'Safety', d:'2026-12-02', x:'The local fire station will teach home fire prevention and extinguisher use.'}
  ];
  const OFF = [
    {n:'Maria L. Santos', p:'Punong Barangay', r:0}, {n:'Roberto D. Cruz', p:'Kagawad, Peace and Order', r:1},
    {n:'Lorna P. Reyes', p:'Kagawad, Health', r:2}, {n:'Eduardo M. Bautista', p:'Kagawad, Infrastructure', r:3},
    {n:'Cynthia A. Mendoza', p:'Kagawad, Education', r:4}, {n:'Jose R. Villanueva', p:'SK Chairperson', r:5},
    {n:'Teresita G. Ramos', p:'Barangay Secretary', r:6}, {n:'Antonio B. Flores', p:'Barangay Treasurer', r:7}
  ];

  /* ---------- Feature 1: live Barangay Hall status ---------- */
  function hallStatus() {
    const now = new Date(), day = now.getDay(), mins = now.getHours() * 60 + now.getMinutes();
    const close = day === 6 ? 720 : 1020;
    const open = day !== 0 && mins >= 480 && mins < close;
    $('.status-card').classList.toggle('closed', !open);
    $('#hallState').textContent = open ? 'Open now' : 'Closed now';
    $('#hallNote').textContent = open
      ? `Closes at ${day === 6 ? '12:00 NN' : '5:00 PM'} today.`
      : (day === 0 || (day === 6 && mins >= 720) ? 'Opens Monday at 8:00 AM.' : (mins < 480 ? 'Opens today at 8:00 AM.' : 'Opens tomorrow at 8:00 AM.'));
  }

  /* ---------- Feature 2: search and filter announcements ---------- */
  function renderAnn() {
    const q = $('#annSearch').value.trim().toLowerCase(), c = $('#annCat').value;
    const res = ANN.filter(a => (c === 'All' || a.c === c) && (a.t + ' ' + a.x).toLowerCase().includes(q))
                   .sort((a, b) => a.d.localeCompare(b.d));
    $('#annList').innerHTML = res.map(a => `<div class="col-md-6 col-lg-4"><article class="card h-100"><div class="card-body">
      <span class="tag tag-${a.c.toLowerCase()}">${a.c}</span> <time class="small ms-1" datetime="${a.d}">${fmtDate(a.d)}</time>
      <h3 class="h5 mt-2">${a.t}</h3><p class="mb-0">${a.x}</p></div></article></div>`).join('');
    $('#annEmpty').hidden = res.length > 0;
    $('#annCount').textContent = `${res.length} of ${ANN.length} announcements shown`;
  }

  /* ---------- Feature 3: search and sort officials ---------- */
  function renderOff() {
    const q = $('#offSearch').value.trim().toLowerCase(), by = $('#offSort').value;
    const res = OFF.filter(o => (o.n + ' ' + o.p).toLowerCase().includes(q))
                   .sort((a, b) => by === 'name' ? a.n.localeCompare(b.n) : a.r - b.r);
    $('#offList').innerHTML = res.map(o => {
      const w = o.n.split(' '), ini = w[0][0] + w[w.length - 1][0];
      return `<div class="col-sm-6 col-lg-3"><div class="card h-100"><div class="card-body d-flex gap-3 align-items-center">
      <div class="avatar" aria-hidden="true">${ini}</div>
      <div><h3 class="h6 mb-0">${o.n}</h3><span class="small">${o.p}</span></div></div></div></div>`;
    }).join('');
    $('#offEmpty').hidden = res.length > 0;
  }

  /* ---------- Feature 4: fee calculator ---------- */
  function calc() {
    const qty = Math.min(10, Math.max(1, parseInt($('#calcQty').value, 10) || 1));
    const fee = FEES[$('#calcDoc').value] + ($('#calcRush').checked ? 20 : 0);
    $('#calcTotal').textContent = peso(fee * qty);
  }

  /* ---------- Feature 5: request form + localStorage records ---------- */
  const KEY = 'barangayMaligayaRequests';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
  const save = l => { try { localStorage.setItem(KEY, JSON.stringify(l)); } catch {} };
  let reqs = load();

  function renderReqs() {
    $('#reqBody').innerHTML = reqs.map(r => `<tr><td>${esc(r.name)}<div class="small text-muted">${esc(r.phone)}</div></td>
      <td>${esc(r.doc)}<div class="small text-muted">${esc(r.purpose)}</div></td><td>${fmtDate(r.date)}</td>
      <td><button class="btn btn-outline-danger btn-sm" data-id="${r.id}" aria-label="Remove request of ${esc(r.name)}">Remove</button></td></tr>`).join('');
    $('#reqEmpty').hidden = reqs.length > 0;
    $('#clearAll').disabled = !reqs.length;
  }
  function toast(msg) { $('#toastMsg').textContent = msg; bootstrap.Toast.getOrCreateInstance($('#toast')).show(); }

  function init() {
    const names = Object.keys(FEES);
    $('#calcDoc').innerHTML = names.map(n => `<option value="${n}">${n} (${FEES[n] ? peso(FEES[n]) : 'Free'})</option>`).join('');
    $('#fDoc').insertAdjacentHTML('beforeend', names.map(n => `<option>${n}</option>`).join(''));
    const today = new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
    $('#fDate').min = today;

    ['#annSearch', '#annCat'].forEach(s => $(s).addEventListener('input', renderAnn));
    ['#offSearch', '#offSort'].forEach(s => $(s).addEventListener('input', renderOff));
    ['#calcDoc', '#calcQty', '#calcRush'].forEach(s => $(s).addEventListener('input', calc));

    const form = $('#reqForm');
    form.addEventListener('submit', e => {
      e.preventDefault();
      $('#fDate').setCustomValidity($('#fDate').value && $('#fDate').value < today ? 'past' : '');
      form.classList.add('was-validated');
      if (!form.checkValidity()) { form.querySelector(':invalid').focus(); return; }
      reqs.unshift({id: Date.now(), name: $('#fName').value.trim(), doc: $('#fDoc').value, phone: $('#fPhone').value,
                    date: $('#fDate').value, purpose: $('#fPurpose').value.trim()});
      save(reqs); renderReqs(); form.reset(); form.classList.remove('was-validated');
      toast('Request saved. Bring a valid ID on your pickup date.');
    });
    $('#reqBody').addEventListener('click', e => {
      const b = e.target.closest('button[data-id]'); if (!b) return;
      reqs = reqs.filter(r => String(r.id) !== b.dataset.id); save(reqs); renderReqs(); toast('Request removed.');
    });
    $('#clearAll').addEventListener('click', () => {
      if (confirm('Remove all saved requests from this browser?')) { reqs = []; save(reqs); renderReqs(); }
    });

    hallStatus(); setInterval(hallStatus, 60000);
    renderAnn(); renderOff(); calc(); renderReqs();
  }
  document.addEventListener('DOMContentLoaded', init);
})();
