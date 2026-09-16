/* ===========================================================
   PRODAVNICA API — ucitava proizvode UZIVO sa Google Sheet-a
   (preko Apps Script-a), umesto iz statickog fajla.
   =========================================================== */

// ISTI URL kao u checkout.html i admin/adminApi.js — popuni posle deploy-a
const PRODAVNICA_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyaTP5RsIOIQ8Lxn03Uxp5THuhU1t00f3htuKijAG0gpVIkMJXel_qhj8R228_Ou8Mt9w/exec';

let proizvodiUcitani = false;
let proizvodiCekanje = [];

function ucitajProizvode(callback) {
  if (proizvodiUcitani) { callback(); return; }
  proizvodiCekanje.push(callback);
  if (proizvodiCekanje.length > 1) return; // vec je u toku ucitavanje

  fetch(PRODAVNICA_SCRIPT_URL + '?action=getShopData')
    .then(function(r){ return r.json(); })
    .then(function(rez) {
      if (rez.uspesno) {
        PRODAVNICA_DATA.proizvodi = rez.proizvodi.map(function(p) {
          const kat = PRODAVNICA_DATA.kategorije.find(function(k){ return k.id === p.kategorija; });
          p.kategorijaNaziv = kat ? kat.naziv : p.kategorija;
          p.inventar = {};
          rez.inventar.filter(function(i){ return i.productId == p.id; }).forEach(function(i){
            p.inventar[i.velicina] = { zaliha: i.zaliha, prodato: i.prodato };
          });
          return p;
        });
      }
      proizvodiUcitani = true;
      proizvodiCekanje.forEach(function(cb) { cb(); });
      proizvodiCekanje = [];
    }).catch(function() {
      document.body.innerHTML = '<div style="padding:80px 24px;text-align:center;font-family:sans-serif;">Greška pri učitavanju prodavnice. Osvežite stranicu.</div>';
    });
}
