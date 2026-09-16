/* ===========================================================
   KORPA — deljena logika, koristi localStorage
   Format stavke: { productId, boja, velicina, kolicina }
   =========================================================== */

const KORPA_KEY = 'butik_korpa';

function ucitajKorpu(){
  try{
    const raw = localStorage.getItem(KORPA_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){ return []; }
}

function sacuvajKorpu(korpa){
  localStorage.setItem(KORPA_KEY, JSON.stringify(korpa));
  azurirajBrojacKorpe();
}

function dodajUKorpu(productId, boja, velicina, kolicina){
  const korpa = ucitajKorpu();
  const postojeca = korpa.find(function(st){
    return st.productId === productId && st.boja === boja && st.velicina === velicina;
  });
  if (postojeca) {
    postojeca.kolicina += kolicina;
  } else {
    korpa.push({ productId: productId, boja: boja, velicina: velicina, kolicina: kolicina });
  }
  sacuvajKorpu(korpa);
}

function ukloniIzKorpe(indeks){
  const korpa = ucitajKorpu();
  korpa.splice(indeks, 1);
  sacuvajKorpu(korpa);
}

function promeniKolicinu(indeks, novaKolicina){
  const korpa = ucitajKorpu();
  if (novaKolicina <= 0) {
    korpa.splice(indeks, 1);
  } else {
    korpa[indeks].kolicina = novaKolicina;
  }
  sacuvajKorpu(korpa);
}

function brojStavkiUKorpi(){
  return ucitajKorpu().reduce(function(zbir, st){ return zbir + st.kolicina; }, 0);
}

function azurirajBrojacKorpe(){
  const el = document.getElementById('cartCount');
  if (el) el.textContent = brojStavkiUKorpi();
}

function nadjiProizvod(id){
  return PRODAVNICA_DATA.proizvodi.find(function(p){ return p.id === id; });
}

function formatCena(broj){
  return broj.toLocaleString('sr-RS') + ' RSD';
}

document.addEventListener('DOMContentLoaded', azurirajBrojacKorpe);
