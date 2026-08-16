# ⚡ Laadpaal Routeplanner

Een installeerbare PWA om een auto-/laadroute te plannen en onderweg laadpalen te vinden.

## Functionaliteit

- **Route bouwen**: startpunt, eindpunt en (optioneel) meerdere tussenliggende routepunten toevoegen — door op de kaart te klikken of een adres/plaats te zoeken. Routepunten kunnen verwijderd of herordend worden.
- **Route berekenen**: rijroute via [OSRM](https://project-osrm.org/) getekend op een OpenStreetMap-kaart.
- **Laadpalen langs de route**: alle laadpalen binnen ~2 km van de route worden opgehaald bij [OpenChargeMap](https://openchargemap.org/) en als bliksem-icoon op de kaart getoond.
- **Aantallen met icoon**: een samenvattingsbalk toont het totaal aantal gevonden laadpalen en het aantal daarvan dat "beschikbaar" (operationeel) is, elk met een eigen bliksem-icoon (blauw = totaal, groen = beschikbaar).
- **Filters op voorzieningen**: filter laadpalen op de aanwezigheid van een toilet, tankstation, restaurant of McDonald's in de buurt (~300 m), op basis van [OpenStreetMap/Overpass](https://overpass-api.de/)-data.
- **PWA**: installeerbaar op telefoon/desktop, met offline caching van de app-shell en kaarttegels.

## Belangrijk: "beschikbaar" is indicatief

OpenChargeMap bevat geen live bezettingsdata voor de meeste laadpassen/operators. "Beschikbaar" betekent hier: door OpenChargeMap als **operationeel** gemarkeerd (niet: nu een vrije stekker). Zie het als een indicatie, niet als real-time bezetting.

## Techniek

- [Vite](https://vite.dev/) + React
- [Leaflet](https://leafletjs.com/) / [react-leaflet](https://react-leaflet.js.org/) voor de kaart (OpenStreetMap-tegels)
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) voor manifest + service worker
- Externe API's:
  - Nominatim (adres zoeken) — geen key nodig, wel eerlijk gebruik
  - OSRM demo-server (routeberekening) — geen key nodig, wel eerlijk gebruik
  - OpenChargeMap (laadpalen) — **vereist een gratis API-key**, zie hieronder
  - Overpass API (voorzieningen: toilet/tankstation/restaurant/McDonald's) — geen key nodig, wel eerlijk gebruik

Alle logica rond geo-berekeningen en API-aanroepen staat in `src/lib/`; UI-componenten staan in `src/components/`.

## OpenChargeMap API-key instellen (verplicht)

OpenChargeMap wijst onbeauthenticeerde `/v3/poi`-verzoeken af met een 403. Zonder key wordt de route wel berekend, maar worden er geen laadpalen getoond.

1. Registreer gratis op <https://openchargemap.org/site/profile/register> en maak een API-key aan op <https://openchargemap.org/site/profile/applications>.
2. Lokaal: kopieer `.env.example` naar `.env` en vul `VITE_OCM_API_KEY` in.
3. Op Vercel: **Project Settings → Environment Variables** → voeg `VITE_OCM_API_KEY` toe → redeploy.

## Lokaal draaien

```bash
npm install
cp .env.example .env   # vul VITE_OCM_API_KEY in
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Iconen opnieuw genereren

De app-iconen (`public/icons/`, `public/favicon.png`) worden gegenereerd uit `scripts/icon-source.svg`:

```bash
node scripts/gen-icons.mjs
```

## Bekende beperkingen

- De publieke demo-API's (OSRM, Nominatim, Overpass, OpenChargeMap) hebben eerlijk-gebruik rate limits; voor zware productie is een eigen API-key/server aan te raden.
- Voorzieningen-filters zijn zo goed als de OpenStreetMap-data ter plekke; ontbrekende OSM-tags leiden tot gemiste matches.
