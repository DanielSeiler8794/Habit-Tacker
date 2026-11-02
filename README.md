# Habits

Schlechte Gewohnheiten abgewöhnen, gute aufbauen. Eine Web-App für das Handy, installierbar als PWA.

**Live:** https://danielseiler8794.github.io/habit-tracker/

## Funktionen

- **Abgewöhnen:** Die Uhr ohne Rückfall läuft von allein, jeder Tag ohne Rückfall wird automatisch gutgeschrieben. Eingetragen werden nur Rückfälle, mit Uhrzeit, Auslöser (Stress, Langeweile, Gesellschaft …) und Notiz, auch nachträglich im Monatskalender. Zeit und Auslöser lassen sich später korrigieren.
- **Muster:** Ab zwei Rückfällen zeigt die Detailansicht, an welchen Wochentagen, zu welcher Tageszeit und bei welchen Auslösern es am häufigsten passiert.
- **Etappen:** Ziele nach 1, 3, 7, 14, 30 … Tagen, mit Bedeutung je nach Gewohnheit (z. B. beim Rauchen der WHO-Zeitplan der Erholung).
- **Ersparnis:** Pro Gewohnheit beliebig kombinierbar Geld, Zeit und Kalorien pro Tag. Zeit optional bewertet mit eigenem Stundenwert oder als Gegenwert („1 Std = 10 Std Lernen“). Beträge in Euro. Optional ein **Sparziel** („Kopfhörer, 250 €“), das sich aus der Ersparnis füllt.
- **Vorlagen:** Rauchen, Alkohol, Süssigkeiten, Fast Food, Energy Drinks, Social Media, Online-Shopping sowie Wasser, Sport, Lesen u. a., mit typischen Werten zum Anpassen.
- **Aufbauen:** Gute Gewohnheiten täglich, an bestimmten Wochentagen oder **X-mal pro Woche** an beliebigen Tagen. Optional mit **Menge pro Tag** (z. B. 8 Gläser Wasser, zählt hoch). Serien und Jahres-Heatmap.
- **Pause-Tage:** Urlaub oder krank eintragen; an diesen Tagen brechen gute Gewohnheiten keine Serie.
- **Geschafft:** Gewohnheiten, die man im Griff hat, wandern mit ihrer Bilanz in die Erfolge, statt gelöscht zu werden; „Wieder aufnehmen“ holt sie zurück.
- **Monatsrückblick:** Ersparnis, Tage ohne Rückfall, Rückfälle und erledigte gute Gewohnheiten je Monat, mit Vergleich zum Vormonat und den letzten sechs Monaten als Balken.
- **Serien nach Kategorie**, Abzeichen, eigene Reihenfolge der Gewohnheiten, Backup als JSON.

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
