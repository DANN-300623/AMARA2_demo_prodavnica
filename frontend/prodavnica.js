/* ===========================================================
   PRODAVNICA — filteri, sortiranje, prikaz grid-a
   =========================================================== */

function pokreniProdavnicu(){
  const D = PRODAVNICA_DATA;
  let aktivniFilteri = {
    pol: 'sve',
    kategorije: new Set(),
    boje: new Set(),
    velicine: new Set(),
    maxCena: 9800,
  };
  let sortiranje = 'novo';

  // procitaj ?pol= iz URL-a pri ucitavanju
  const urlParams = new URLSearchParams(window.location.search);
  const polIzUrl = urlParams.get('pol');
  if (polIzUrl === 'zensko' || polIzUrl === 'musko') {
    aktivniFilteri.pol = polIzUrl;
  }

  function preostaliZaVelicinu(proizvod, velicina){
    const inv = proizvod.inventar[velicina];
    if (!inv) return 0;
    return Math.max(0, inv.zaliha - inv.prodato);
  }

  function proizvodImaStanje(proizvod){
    return D.velicine.some(function(v){ return preostaliZaVelicinu(proizvod, v) > 0; });
  }

  function renderKategorijaFilters(){
    const wrap = document.getElementById('kategorijaFilters');
    const relevantneKat = D.kategorije.filter(function(k){
      return aktivniFilteri.pol === 'sve' || k.pol === aktivniFilteri.pol;
    });
    wrap.innerHTML = relevantneKat.map(function(k){
      const checked = aktivniFilteri.kategorije.has(k.id) ? 'checked' : '';
      return '<label class="filter-option"><input type="checkbox" value="' + k.id + '" class="kat-check" ' + checked + '> ' + k.naziv + (k.pol !== aktivniFilteri.pol && aktivniFilteri.pol !== 'sve' ? '' : '') + '</label>';
    }).join('');
    wrap.querySelectorAll('.kat-check').forEach(function(cb){
      cb.addEventListener('change', function(){
        if (cb.checked) aktivniFilteri.kategorije.add(cb.value);
        else aktivniFilteri.kategorije.delete(cb.value);
        primeniFiltere();
      });
    });
  }

  function renderColorFilters(){
    const wrap = document.getElementById('colorFilters');
    wrap.innerHTML = D.boje.map(function(b){
      const sel = aktivniFilteri.boje.has(b) ? 'selected' : '';
      return '<span class="color-swatch ' + sel + '" data-color="' + b + '" title="' + b + '"></span>';
    }).join('');
    wrap.querySelectorAll('.color-swatch').forEach(function(sw){
      sw.addEventListener('click', function(){
        const boja = sw.dataset.color;
        if (aktivniFilteri.boje.has(boja)) { aktivniFilteri.boje.delete(boja); sw.classList.remove('selected'); }
        else { aktivniFilteri.boje.add(boja); sw.classList.add('selected'); }
        primeniFiltere();
      });
    });
  }

  function renderVelicinaFilters(){
    const wrap = document.getElementById('velicinaFilters');
    wrap.innerHTML = D.velicine.map(function(v){
      const checked = aktivniFilteri.velicine.has(v) ? 'checked' : '';
      return '<label class="filter-option"><input type="checkbox" value="' + v + '" class="vel-check" ' + checked + '> ' + v + '</label>';
    }).join('');
    wrap.querySelectorAll('.vel-check').forEach(function(cb){
      cb.addEventListener('change', function(){
        if (cb.checked) aktivniFilteri.velicine.add(cb.value);
        else aktivniFilteri.velicine.delete(cb.value);
        primeniFiltere();
      });
    });
  }

  function filtrirajProizvode(){
    let lista = D.proizvodi.slice();

    if (aktivniFilteri.pol !== 'sve') {
      lista = lista.filter(function(p){ return p.pol === aktivniFilteri.pol; });
    }
    if (aktivniFilteri.kategorije.size > 0) {
      lista = lista.filter(function(p){ return aktivniFilteri.kategorije.has(p.kategorija); });
    }
    if (aktivniFilteri.boje.size > 0) {
      lista = lista.filter(function(p){ return p.boje.some(function(b){ return aktivniFilteri.boje.has(b); }); });
    }
    if (aktivniFilteri.velicine.size > 0) {
      lista = lista.filter(function(p){
        return Array.from(aktivniFilteri.velicine).some(function(v){ return preostaliZaVelicinu(p, v) > 0; });
      });
    }
    lista = lista.filter(function(p){ return p.cena <= aktivniFilteri.maxCena; });

    if (sortiranje === 'cena-rastuce') lista.sort(function(a,b){ return a.cena - b.cena; });
    else if (sortiranje === 'cena-opadajuce') lista.sort(function(a,b){ return b.cena - a.cena; });
    else lista.sort(function(a,b){ return b.id - a.id; }); // "novo" = visi id prvo

    return lista;
  }

  function renderGrid(){
    const lista = filtrirajProizvode();
    const grid = document.getElementById('productGrid');
    document.getElementById('resultsCount').textContent = lista.length + (lista.length === 1 ? ' proizvod' : ' proizvoda');

    if (lista.length === 0) {
      grid.innerHTML = '<div class="no-results"><h3>Nema proizvoda</h3><p>Probajte da promenite ili poništite filtere.</p></div>';
      return;
    }

    grid.innerHTML = lista.map(function(p){
      const nemaStanja = !proizvodImaStanje(p);
      const bojeHtml = p.boje.map(function(b){
        const boja_css = b === 'Crna' ? '#201F1C' : (b === 'Bez' ? '#E4D9C4' : '#6B2737');
        return '<span style="background:' + boja_css + '"></span>';
      }).join('');
      return (
        '<a href="proizvod.html?id=' + p.id + '" class="product-card reveal-card">' +
          '<div class="product-card__img">' +
            (nemaStanja ? '<span class="product-card__sold-out">Nema na stanju</span>' : '') +
            (p.foto1 ? '<img src="' + p.foto1 + '" alt="' + p.naziv + '" style="width:100%;height:100%;object-fit:cover;">' : '<span class="ph">' + p.kategorijaNaziv + '</span>') +
          '</div>' +
          '<h3 class="product-card__name">' + p.naziv + '</h3>' +
          '<div class="product-card__price">' + formatCena(p.cena) + '</div>' +
          '<div class="product-card__colors">' + bojeHtml + '</div>' +
        '</a>'
      );
    }).join('');

    // reveal animacija
    const cards = grid.querySelectorAll('.reveal-card');
    const io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
      });
    }, { threshold: .1 });
    cards.forEach(function(c){ io.observe(c); });
  }

  function primeniFiltere(){
    renderKategorijaFilters();
    renderGrid();
  }

  function postaviPocetnoStanjeFiltera(){
    document.querySelectorAll('input[name="pol"]').forEach(function(r){
      r.checked = (r.value === aktivniFilteri.pol);
      r.addEventListener('change', function(){
        aktivniFilteri.pol = r.value;
        aktivniFilteri.kategorije.clear();
        primeniFiltere();
      });
    });
    renderKategorijaFilters();
    renderColorFilters();
    renderVelicinaFilters();

    document.getElementById('priceRange').addEventListener('input', function(e){
      aktivniFilteri.maxCena = parseInt(e.target.value, 10);
      document.getElementById('priceRangeMax').textContent = 'do ' + formatCena(aktivniFilteri.maxCena);
      renderGrid();
    });

    document.getElementById('sortSelect').addEventListener('change', function(e){
      sortiranje = e.target.value;
      renderGrid();
    });

    document.getElementById('clearFiltersBtn').addEventListener('click', function(){
      aktivniFilteri = { pol: 'sve', kategorije: new Set(), boje: new Set(), velicine: new Set(), maxCena: 9800 };
      sortiranje = 'novo';
      document.getElementById('priceRange').value = 9800;
      document.getElementById('priceRangeMax').textContent = 'do 9.800 RSD';
      document.getElementById('sortSelect').value = 'novo';
      postaviPocetnoStanjeFiltera();
      renderGrid();
    });

    // mobilni filter panel
    const filtersPanel = document.getElementById('filtersPanel');
    document.getElementById('filterToggleBtn').addEventListener('click', function(){ filtersPanel.classList.add('open'); });
    document.getElementById('filtersCloseBtn').addEventListener('click', function(){ filtersPanel.classList.remove('open'); });
  }

  postaviPocetnoStanjeFiltera();
  renderGrid();
}
