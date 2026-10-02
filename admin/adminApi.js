/* ===========================================================
   Admin API — komunikacija sa Apps Script pozadinom
   =========================================================== */

// ISTI URL kao na checkout.html, popuni posle deploy-a
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxYCrTmIYjc7BthqCtNnIg0G_SP0EsEqLFqz8MC6lW6cRq0pW_WqRHpRBH_pekB5oW45Q/exec';

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
