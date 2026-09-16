/* ===========================================================
   PRODAVNICA API — ucitava proizvode UZIVO sa Google Sheet-a
   (preko Apps Script-a), umesto iz statickog fajla.

   KESIRANJE: podaci se cuvaju u sessionStorage nakon prvog
   ucitavanja. Sledece stranice (proizvod, korpa, checkout)
   citaju IZ kesa umesto da ponovo zovu Apps Script — mnogo
   brze, i ne trosi Apps Script dnevni limit poziva.
   Kes vazi dok je tab otvoren; zatvaranjem taba ili posle
   30 minuta, sledeca poseta ucitava sveze podatke.
   =========================================================== */

// ISTI URL kao u checkout.html i admin/adminApi.js — popuni posle deploy-a
const PRODAVNICA_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyaTP5RsIOIQ8Lxn03Uxp5THuhU1t00f3htuKijAG0gpVIkMJXel_qhj8R228_Ou8Mt9w/exec';

const KES_KLJUC = 'amara_prodavnica_kes';
const KES_TRAJANJE_MS = 30 * 60 * 1000; // 30 minuta

let proizvodiUcitani = false;
let proizvodiCekanje = [];

function ucitajIzKesa() {
  try {
    const sacuvano = sessionStorage.getItem(KES_KLJUC);
    if (!sacuvano) return null;
    const parsed = JSON.parse(sacuvano);
    if (Date.now() - parsed.vreme > KES_TRAJANJE_MS) return null; // istekao
    return parsed.podaci;
  } catch (e) {
    return null;
  }
}

function sacuvajUKes(podaci) {
  try {
    sessionStorage.setItem(KES_KLJUC, JSON.stringify({ vreme: Date.now(), podaci: podaci }));
  } catch (e) {
    // ako sessionStorage nije dostupan (privatni mod i sl.), samo nastavi bez kesa
  }
}

function primeniPodatke(proizvodi) {
  PRODAVNICA_DATA.proizvodi = proizvodi;
}

function ucitajProizvode(callback) {
  if (proizvodiUcitani) { callback(); return; }

  // PRVO probaj iz kesa — ako postoji i nije istekao, ne zovi server uopste
  const izKesa = ucitajIzKesa();
  if (izKesa) {
    primeniPodatke(izKesa);
    proizvodiUcitani = true;
    callback();
    return;
  }

  proizvodiCekanje.push(callback);
  if (proizvodiCekanje.length > 1) return; // vec je u toku ucitavanje

  fetch(PRODAVNICA_SCRIPT_URL + '?action=getShopData')
    .then(function(r){ return r.json(); })
    .then(function(rez) {
      if (rez.uspesno) {
        const proizvodi = rez.proizvodi.map(function(p) {
          const kat = PRODAVNICA_DATA.kategorije.find(function(k){ return k.id === p.kategorija; });
          p.kategorijaNaziv = kat ? kat.naziv : p.kategorija;
          p.inventar = {};
          rez.inventar.filter(function(i){ return i.productId == p.id; }).forEach(function(i){
            p.inventar[i.velicina] = { zaliha: i.zaliha, prodato: i.prodato };
          });
          return p;
        });
        primeniPodatke(proizvodi);
        sacuvajUKes(proizvodi);
      }
      proizvodiUcitani = true;
      proizvodiCekanje.forEach(function(cb) { cb(); });
      proizvodiCekanje = [];
    }).catch(function() {
      document.body.innerHTML = '<div style="padding:80px 24px;text-align:center;font-family:sans-serif;">Greška pri učitavanju prodavnice. Osvežite stranicu.</div>';
    });
}
