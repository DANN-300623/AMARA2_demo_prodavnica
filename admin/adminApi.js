/* ===========================================================
   Admin API — komunikacija sa Apps Script pozadinom
   =========================================================== */

// ISTI URL kao na checkout.html, popuni posle deploy-a
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyaTP5RsIOIQ8Lxn03Uxp5THuhU1t00f3htuKijAG0gpVIkMJXel_qhj8R228_Ou8Mt9w/exec';

function getLozinku(){
  return sessionStorage.getItem('amara_admin_lozinka');
}

function zahtev(akcija, dodatniParametri){
  const params = new URLSearchParams(Object.assign({
    action: akcija,
    lozinka: getLozinku(),
  }, dodatniParametri || {}));
  return fetch(SCRIPT_URL + '?' + params.toString()).then(function(res){ return res.json(); });
}

// zastita: ako nema sacuvane lozinke, vrati na login (osim na samoj login stranici)
function zahtevajPrijavu(){
  if (!getLozinku() && !window.location.pathname.endsWith('login.html')) {
    window.location.href = 'login.html';
  }
}
