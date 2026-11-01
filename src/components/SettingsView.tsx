import { useRef, useState } from 'react'
import { toKey } from '../lib/dates'
import { inArtifact, notificationsSupported, requestNotifications, saveFile } from '../lib/reminders'
import { emptyState, isAppState, normalize, type SyncStatus } from '../lib/store'
import type { AppState } from '../lib/types'
import { ConfirmButton } from './ConfirmButton'
import { IconBell, IconDownload, IconPhone, IconTrash, IconUpload } from './icons'

interface Props {
  state: AppState
  sync: SyncStatus
  onReplace: (s: AppState) => void
  onToast: (msg: string) => void
}

export function SettingsView({ state, sync, onReplace, onToast }: Props) {
  const artifact = inArtifact()
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
          <p>
            iPhone: diesen Link in Safari öffnen, auf <b>Teilen</b> tippen und <b>Zum Home-Bildschirm</b> wählen. Android: in Chrome über das Menü <b>Zum Startbildschirm hinzufügen</b>.
          </p>
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
