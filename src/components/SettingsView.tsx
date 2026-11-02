import { useRef, useState } from 'react'
import { toKey } from '../lib/dates'
import { inArtifact, notificationsSupported, requestNotifications, saveFile } from '../lib/reminders'
import { emptyState, isAppState, normalize, type SyncStatus } from '../lib/store'
import type { AppState, Pause } from '../lib/types'
import { useInstall } from '../lib/install'
import { ConfirmButton } from './ConfirmButton'
import { InstallButton } from './InstallButton'
import { ReorderList } from './ReorderList'
import { Sheet } from './Sheet'
import { IconBell, IconCalendar, IconDownload, IconEdit, IconPhone, IconTrash, IconUpload } from './icons'

interface Props {
  state: AppState
  sync: SyncStatus
  onReplace: (s: AppState) => void
  onReorder: (ids: string[]) => void
  onAddPause: (p: Pause) => void
  onRemovePause: (index: number) => void
  onToast: (msg: string) => void
}

export function SettingsView({ state, sync, onReplace, onReorder, onAddPause, onRemovePause, onToast }: Props) {
  const [ordering, setOrdering] = useState(false)
  const todayKey = toKey(new Date())
  const [pauseFrom, setPauseFrom] = useState(todayKey)
  const [pauseTo, setPauseTo] = useState(todayKey)
  const active = state.habits.filter((h) => !h.archivedAt)
  const fmt = (k: string) => new Date(`${k}T12:00:00`).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })
  const artifact = inArtifact()
  const { mode } = useInstall()
  const file = useRef<HTMLInputElement>(null)
  const [permission, setPermission] = useState(notificationsSupported() ? Notification.permission : 'denied')

  const permissionText =
    !notificationsSupported() ? 'Dieser Browser unterstützt keine Benachrichtigungen.'
    : permission === 'granted' ? 'Aktiv. Erinnerungen kommen, solange die App offen ist oder im Hintergrund läuft.'
    : permission === 'denied' ? 'Blockiert. Du kannst sie in den Browser-Einstellungen wieder erlauben.'
    : 'Noch nicht erlaubt.'

  return (
    <div className="view">
      <header className="top">
        <div>
          <p className="eyebrow">Einstellungen</p>
          <h1 className="title">Deine App</h1>
        </div>
      </header>

      <section className="card settings-card">
        <div className="settings-icon">
          <IconCalendar size={20} />
        </div>
        <div className="settings-body">
          <h3>Pause-Tage</h3>
          <p>Urlaub oder krank? An Pause-Tagen zählen gute Gewohnheiten nicht gegen deine Serien. Abgewöhnen läuft weiter.</p>
          {state.pauses.length > 0 && (
            <ul className="pause-list">
              {state.pauses.map((p, i) => (
                <li key={`${p.from}-${p.to}`}>
                  <span>{p.from === p.to ? fmt(p.from) : `${fmt(p.from)} – ${fmt(p.to)}`}</span>
                  <button className="link-btn" onClick={() => onRemovePause(i)}>
                    Entfernen
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="pause-form">
            <label>
              <span>Von</span>
              <input id="pause-from" type="date" className="input" value={pauseFrom} onChange={(e) => {
                setPauseFrom(e.target.value)
                if (e.target.value > pauseTo) setPauseTo(e.target.value)
              }} />
            </label>
            <label>
              <span>Bis</span>
              <input id="pause-to" type="date" className="input" value={pauseTo} min={pauseFrom} onChange={(e) => setPauseTo(e.target.value)} />
            </label>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            disabled={!pauseFrom || !pauseTo || pauseTo < pauseFrom}
            onClick={() => {
              onAddPause({ from: pauseFrom, to: pauseTo })
              onToast(pauseFrom === pauseTo ? `Pause am ${fmt(pauseFrom)}` : `Pause vom ${fmt(pauseFrom)} bis ${fmt(pauseTo)}`)
            }}
          >
            Pause hinzufügen
          </button>
        </div>
      </section>

      {active.length > 1 && (
        <section className="card settings-card">
          <div className="settings-icon">
            <IconEdit size={20} />
          </div>
          <div className="settings-body">
            <h3>Reihenfolge</h3>
            <p>Bestimme, welche Gewohnheiten im Heute-Screen oben stehen.</p>
            <button className="btn btn-ghost btn-sm" onClick={() => setOrdering(true)}>
              Sortieren
            </button>
          </div>
        </section>
      )}
      <Sheet open={ordering} onClose={() => setOrdering(false)} label="Reihenfolge">
        {ordering && (
          <ReorderList
            habits={active}
            onCancel={() => setOrdering(false)}
            onSave={(ids) => {
              onReorder(ids)
              setOrdering(false)
              onToast('Reihenfolge gespeichert')
            }}
          />
        )}
      </Sheet>

      <section className="card settings-card">
        <div className="settings-icon">
          <IconDownload size={20} />
        </div>
        <div className="settings-body">
          <h3>Speicherort</h3>
          <p>
            {sync === 'synced'
              ? 'Synchronisiert mit deinem Claude-Account. Handy und Computer zeigen denselben Stand.'
              : sync === 'connecting'
                ? 'Verbinde mit deinem Claude-Account …'
                : sync === 'offline'
                  ? 'Gerade keine Verbindung. Deine Änderungen sind auf diesem Gerät gespeichert und werden nachgereicht.'
                  : 'Nur auf diesem Gerät gespeichert.'}
          </p>
        </div>
      </section>

      {!artifact && (
      <section className="card settings-card">
        <div className="settings-icon">
          <IconBell size={20} />
        </div>
        <div className="settings-body">
          <h3>Benachrichtigungen</h3>
          <p>{permissionText}</p>
          {permission === 'default' && (
            <button className="btn btn-primary btn-sm" onClick={async () => setPermission(await requestNotifications())}>
              Erlauben
            </button>
          )}
          <p className="hint">Für zuverlässige Erinnerungen auch bei geschlossener App: in einer Gewohnheit auf „In Google Kalender eintragen“ tippen.</p>
        </div>
      </section>
      )}

      <section className="card settings-card">
        <div className="settings-icon">
          <IconPhone size={20} />
        </div>
        <div className="settings-body">
          <h3>Aufs Handy holen</h3>
          {mode === 'installed' ? (
            <p>Habits ist auf diesem Gerät installiert und startet vom Home-Bildschirm.</p>
          ) : mode === 'artifact' ? (
            <p>
              Öffne die App in Safari unter <b>danielseiler8794.github.io/habit-tracker</b> und lege sie dort auf den Home-Bildschirm.
            </p>
          ) : (
            <>
              <p>Mit eigenem Icon, im Vollbild und auch offline nutzbar.</p>
              <InstallButton className="btn btn-primary btn-sm" onDone={onToast} />
            </>
          )}
        </div>
      </section>

      <section className="card settings-card">
        <div className="settings-icon">
          <IconDownload size={20} />
        </div>
        <div className="settings-body">
          <h3>Backup</h3>
          <p>Deine Daten liegen nur auf diesem Gerät. Sichere sie ab und zu als Datei.</p>
          <div className="btn-row">
            <button
              className="btn btn-ghost btn-sm"
              onClick={async () => {
                const result = await saveFile(`habits-backup-${toKey(new Date())}.json`, JSON.stringify(state, null, 2), 'application/json')
                if (result === 'saved') onToast('Backup gespeichert')
                else if (result === 'unavailable') onToast('Speichern ist hier nicht möglich')
              }}
            >
              <IconDownload size={16} /> Exportieren
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => file.current?.click()}>
              <IconUpload size={16} /> Importieren
            </button>
            <input
              ref={file}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (!f) return
                try {
                  const parsed = JSON.parse(await f.text())
                  if (!isAppState(parsed)) throw new Error('invalid')
                  onReplace(normalize(parsed))
                  onToast('Backup geladen')
                } catch {
                  onToast('Diese Datei ist kein gültiges Backup')
                }
              }}
            />
          </div>
        </div>
      </section>

      <section className="card settings-card">
        <div className="settings-icon danger">
          <IconTrash size={20} />
        </div>
        <div className="settings-body">
          <h3>Daten</h3>
          <p>Alle Gewohnheiten und ihren Verlauf löschen und frisch starten.</p>
          <div className="btn-row">
            <ConfirmButton
              className="btn btn-danger btn-sm"
              confirmLabel="Alles löschen?"
              onConfirm={() => {
                onReplace(emptyState())
                onToast('Alles gelöscht. Frischer Start!')
              }}
            >
              Leer starten
            </ConfirmButton>
          </div>
        </div>
      </section>
      <p className="hint center">Habits · Version 0.1</p>
    </div>
  )
}
