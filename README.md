# Habits

Schlechte Gewohnheiten abgewöhnen, gute aufbauen. Eine Web-App für das Handy, installierbar als PWA.

**Live:** https://danielseiler8794.github.io/Habit-Tracker/

## Funktionen

- **Abgewöhnen:** Die Uhr ohne Rückfall läuft von allein, jeder Tag ohne Rückfall wird automatisch gutgeschrieben. Eingetragen werden nur Rückfälle, auch nachträglich im Monatskalender.
- **Ersparnis:** Pro Gewohnheit Geld und/oder Zeit pro Tag, Zeit optional bewertet mit eigenem Stundenwert oder als Gegenwert („1 Std = 10 Std Lernen“). Beträge in Euro.
- **Aufbauen:** Gute Gewohnheiten täglich oder an bestimmten Wochentagen abhaken, mit Serien und Jahres-Heatmap.
- **Serien nach Kategorie**, Abzeichen, Backup als JSON.

Die Daten liegen nur im Browser des Geräts (localStorage). Für einen Gerätewechsel unter „Mehr“ ein Backup exportieren und importieren.

## Aufs Handy

Die Live-Adresse in Safari öffnen, **Teilen → Zum Home-Bildschirm**. Unter Android in Chrome **Zum Startbildschirm hinzufügen**.

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
