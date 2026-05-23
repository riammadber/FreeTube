import shaka from 'shaka-player'
import i18n from '../../../i18n/index'
import { KeyboardShortcuts, PlayerIcons } from '../../../../constants'
import { addKeyboardShortcutToActionTitle } from '../../../helpers/utils'

export class DownloadButton extends shaka.ui.Element {
  constructor(events, parent, controls) {
    super(parent, controls)

    this.button_ = document.createElement('button')
    this.button_.classList.add('download-button', 'shaka-tooltip')

    // eslint-disable-next-line no-new
    new shaka.ui.Icon(this.button_, PlayerIcons.TUNE_FILLED)

    const label = document.createElement('label')
    label.classList.add('shaka-overflow-button-label', 'shaka-overflow-menu-only', 'shaka-simple-overflow-button-label-inline')

    this.nameSpan_ = document.createElement('span')
    label.appendChild(this.nameSpan_)

    this.button_.appendChild(label)
    this.parent.appendChild(this.button_)

    this.eventManager.listen(this.button_, 'click', () => {
      events.dispatchEvent(new CustomEvent('requestDownload'))
    })

    this.eventManager.listen(events, 'localeChanged', () => {
      this.updateLocalisedStrings_()
    })

    if (this.isSubMenu) {
      this.eventManager.listen(this.controls, 'submenuopen', () => this.updateVisibility_())
      this.eventManager.listen(this.controls, 'submenuclose', () => this.updateVisibility_())
    }

    this.updateLocalisedStrings_()
  }

  updateLocalisedStrings_() {
    const label = addKeyboardShortcutToActionTitle(i18n.global.t('Video.Player.Download'), KeyboardShortcuts.VIDEO_PLAYER.GENERAL.TAKE_SCREENSHOT)
    this.nameSpan_.textContent = this.button_.ariaLabel = label
  }

  updateVisibility_() {
    if (this.isSubMenuOpened) this.button_.classList.add('shaka-hidden')
    else this.button_.classList.remove('shaka-hidden')
  }
}
