import { useState } from 'react'
import { useInstall } from '../lib/install'
import { IconAddSquare, IconMore, IconPhone, IconShare } from './icons'
import { Sheet } from './Sheet'

interface Props {
  className?: string
  label?: string
  onDone?: (message: string) => void
}

/**
 * One button for every device: Android opens the browser's own install dialog,
 * iPhone shows the three Safari steps, everything else gets the right hint.
 */
export function InstallButton({ className = 'btn btn-primary', label = 'Zum Home-Bildschirm hinzufügen', onDone }: Props) {
  const { mode, install } = useInstall()
  const [guide, setGuide] = useState(false)

  if (mode === 'installed' || mode === 'artifact') return null

  const onClick = async () => {
    if (mode === 'native') {
      if (await install()) onDone?.('Habits ist jetzt auf deinem Home-Bildschirm')
      return
    }
    setGuide(true)
  }

  return (
    <>
      <button className={className} onClick={onClick}>
        <IconPhone size={18} /> {label}
      </button>
      <Sheet open={guide} onClose={() => setGuide(false)} label="Zum Home-Bildschirm hinzufügen">
        <InstallGuide mode={mode} onDone={onDone} onClose={() => setGuide(false)} />
      </Sheet>
    </>
  )
}

function InstallGuide({ mode, onDone, onClose }: { mode: string; onDone?: (m: string) => void; onClose: () => void }) {
  if (mode === 'ios-other') {
    return (
      <div className="install">
        <h2 className="form-title">Bitte in Safari öffnen</h2>
        <p className="install-lead">Auf dem iPhone kann nur Safari Web-Apps auf den Home-Bildschirm legen. Kopiere den Link und öffne ihn in Safari.</p>
        <button
          className="btn btn-primary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(location.href)
              onDone?.('Link kopiert. Jetzt in Safari einfügen.')
            } catch {
              onDone?.(location.href)
            }
            onClose()
          }}
        >
          Link kopieren
        </button>
      </div>
    )
  }

  if (mode === 'ios-safari') {
    return (
      <div className="install">
        <h2 className="form-title">In drei Schritten auf den Home-Bildschirm</h2>
        <ol className="install-steps">
          <li>
            <span className="install-icon">
              <IconShare size={22} />
            </span>
            <span>
              Tippe unten auf <b>Teilen</b>. Siehst du es nicht, tippe zuerst auf <IconMore size={16} className="inline-icon" />.
            </span>
          </li>
          <li>
            <span className="install-icon">
              <IconAddSquare size={22} />
            </span>
            <span>
              Scrolle und wähle <b>Zum Home-Bildschirm</b>.
            </span>
          </li>
          <li>
            <span className="install-icon install-icon-text">OK</span>
            <span>
              Tippe oben rechts auf <b>Hinzufügen</b>. Fertig, Habits startet ab jetzt wie eine App.
            </span>
          </li>
        </ol>
        <button className="btn btn-ghost" onClick={onClose}>
          Verstanden
        </button>
      </div>
    )
  }

  return (
    <div className="install">
      <h2 className="form-title">Als App installieren</h2>
      <p className="install-lead">
        Öffne das Menü deines Browsers (meist <b>⋮</b> oben rechts) und wähle <b>App installieren</b> oder <b>Zum Startbildschirm hinzufügen</b>. Am
        Computer findest du das Installieren-Symbol oft rechts in der Adressleiste.
      </p>
      <button className="btn btn-ghost" onClick={onClose}>
        Verstanden
      </button>
    </div>
  )
}
