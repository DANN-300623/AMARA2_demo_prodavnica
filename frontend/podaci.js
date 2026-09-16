const PRODAVNICA_STRUKTURA = {
  "kategorije": [
    {
      "id": "haljine",
      "naziv": "Haljine",
      "pol": "zensko"
    },
    {
      "id": "pantalone-z",
      "naziv": "Pantalone",
      "pol": "zensko"
    },
    {
      "id": "majice-z",
      "naziv": "Majice",
      "pol": "zensko"
    },
    {
      "id": "pantalone-m",
      "naziv": "Pantalone",
      "pol": "musko"
    },
    {
      "id": "majice-m",
      "naziv": "Majice",
      "pol": "musko"
    }
  ],
  "boje": [
    "Crna",
    "Bez",
    "Bordo"
  ],
  "velicine": [
    "S",
    "M",
    "L",
    "XL"
  ]
};

let PRODAVNICA_DATA = { proizvodi: [], kategorije: PRODAVNICA_STRUKTURA.kategorije, boje: PRODAVNICA_STRUKTURA.boje, velicine: PRODAVNICA_STRUKTURA.velicine };
