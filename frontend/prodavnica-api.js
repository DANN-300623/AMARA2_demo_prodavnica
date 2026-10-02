/* ===========================================================
   PRODAVNICA API — ucitava proizvode UZIVO sa Google Sheet-a
   (preko Apps Script-a), umesto iz statickog fajla.

   KESIRANJE ("stale-while-revalidate"): podaci se cuvaju u
   localStorage (TRAJNO, ne brise se zatvaranjem taba/browsera).
   Ako kes postoji (cak i stariji od 30 min), ODMAH se prikazuje
   - korisnik NIKAD ne gleda prazan ekran ako je vec jednom bio
   na sajtu. U POZADINI se paralelno salje svez zahtev; kad on
   stigne, kes se azurira za SLEDECU posetu (ne menja prikaz koji
   je KORISNIK VEC VIDEO u ovoj poseti, da se izbegne komplikacija
   oko ponovnog iscrtavanja filtera/liste usred gledanja).
   Prvi IKAD posetilac (bez keša) i dalje ceka pravi odgovor,
   kao i do sada.
   =========================================================== */

// ISTI URL kao u checkout.html i admin/adminApi.js — popuni posle deploy-a
const PRODAVNICA_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyaTP5RsIOIQ8Lxn03Uxp5THuhU1t00f3htuKijAG0gpVIkMJXel_qhj8R228_Ou8Mt9w/exec';

const KES_KLJUC = 'amara_prodavnica_kes';

function ucitajIzKesa() {
  try {
    const sacuvano = localStorage.getItem(KES_KLJUC);
    if (!sacuvano) return null;
    const parsed = JSON.parse(sacuvano);
    return parsed.podaci; // kes nema rok trajanja - uvek ga prikazi odmah ako postoji
  } catch (e) {
    return null;
  }
}

function sacuvajUKes(podaci) {
  try {
    localStorage.setItem(KES_KLJUC, JSON.stringify({ vreme: Date.now(), podaci: podaci }));
  } catch (e) {
    // ako localStorage nije dostupan (privatni mod i sl.), samo nastavi bez kesa
  }
}

function primeniPodatke(proizvodi) {
  PRODAVNICA_DATA.proizvodi = proizvodi;
}

function pozoviServer(pokusaj) {
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
      // prvi i drugi neuspeh - tiho probaj ponovo, cesto je samo
      // prolazna spora/hladna veza, ne stvaran kvar
      if (pokusaj < 3) {
        setTimeout(function() { pozoviServer(pokusaj + 1); }, 1500);
      } else {
        document.body.innerHTML = '<div style="padding:80px 24px;text-align:center;font-family:sans-serif;">Greška pri učitavanju prodavnice. Osvežite stranicu.</div>';
      }
    });
}

function osveziKesUPozadini() {
  // tiha verzija - NE diramo vec prikazan ekran, samo azuriramo kes za sledecu posetu
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
        sacuvajUKes(proizvodi);
      }
    }).catch(function() {
      // tiho - ako pozadinsko osvezavanje ne uspe, kes jednostavno ostaje stari do sledeceg pokusaja
    });
}

function ucitajProizvode(callback) {
  if (proizvodiUcitani) { callback(); return; }

  // PRVO probaj iz kesa — ako postoji, ODMAH ga prikazi (bez obzira na starost)
  const izKesa = ucitajIzKesa();
  if (izKesa) {
    primeniPodatke(izKesa);
    proizvodiUcitani = true;
    callback();
    osveziKesUPozadini(); // tiho azuriraj kes za SLEDECI put, ne menja ovaj prikaz
    return;
  }

  // nema kesa (prvi IKAD posetilac) - ceka se pravi odgovor, kao i do sada
  proizvodiCekanje.push(callback);
  if (proizvodiCekanje.length > 1) return; // vec je u toku ucitavanje

  pozoviServer(1);
}
