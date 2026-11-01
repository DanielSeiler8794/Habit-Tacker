# Habits

Schlechte Gewohnheiten abgewöhnen, gute aufbauen. Eine Web-App für das Handy, installierbar als PWA.

**Live:** https://danielseiler8794.github.io/habit-tracker/

## Funktionen

- **Abgewöhnen:** Die Uhr ohne Rückfall läuft von allein, jeder Tag ohne Rückfall wird automatisch gutgeschrieben. Eingetragen werden nur Rückfälle, auch nachträglich im Monatskalender.
- **Ersparnis:** Pro Gewohnheit beliebig kombinierbar Geld, Zeit und Kalorien pro Tag. Zeit optional bewertet mit eigenem Stundenwert oder als Gegenwert („1 Std = 10 Std Lernen“). Beträge in Euro.
- **Aufbauen:** Gute Gewohnheiten täglich oder an bestimmten Wochentagen abhaken, mit Serien und Jahres-Heatmap.
- **Serien nach Kategorie**, Abzeichen, Backup als JSON.

Die Daten liegen nur im Browser des Geräts (localStorage). Für einen Gerätewechsel unter „Mehr“ ein Backup exportieren und importieren.

## Aufs Handy

In der App unter **Mehr → Aufs Handy holen** auf **Zum Home-Bildschirm hinzufügen** tippen. Auf dem Handy bietet die App das beim ersten Öffnen auch einmal von selbst an. Die App erkennt das Gerät:

- **Android** (Chrome, Edge, Samsung Internet): öffnet direkt den Installations-Dialog des Browsers.
- **iPhone/iPad in Safari:** zeigt die drei Schritte **Teilen → Zum Home-Bildschirm → Hinzufügen**. Apple erlaubt Web-Apps kein automatisches Installieren.
- **iPhone in einem anderen Browser:** bittet darum, die Seite in Safari zu öffnen, und kopiert den Link.

Läuft die App schon vom Home-Bildschirm, verschwindet der Button.

## Entwicklung

```bash
npm install
npm run dev      # http://localhost:5199
npm run build    # Ausgabe in dist/
```

Veröffentlichen:

```bash
npm run deploy   # baut die App und legt sie auf den Branch gh-pages, den GitHub Pages ausliefert
```
