import { LitElement, html } from 'lit-element';
import Translator from '../util/translator.js';
import logoImg from '../../assets/images/landing-logo.png';
import DataEntryService from '../services/data-entry-service.js';
import GoogleAnalyticsService from '../services/google-analytics-service.js';
import PWAService from '../services/pwa-service.js';

class FevermapLanding extends LitElement {
  static get properties() {
    return {
      currentParticipantCount: { type: Number },
    };
  }

  static get styles() {
    return [];
  }

  constructor() {
    super();
    this.currentParticipantCount = 0;
  }

  firstUpdated() {
    this.getCurrentStats();
    GoogleAnalyticsService.reportNavigationAction('About View');
  }

  async getCurrentStats() {
    const stats = await DataEntryService.getStats();
    this.currentParticipantCount = stats ? stats.data.submitters.total : 0;
  }

  showCookiePolicy() {
    const dataEntryDialog = document.createElement('fevermap-landing-cookie-policy');
    document.querySelector('fevermap-root').appendChild(dataEntryDialog);
    setTimeout(() => {
      dataEntryDialog
        .querySelector('.view-wrapper')
        .classList.remove('fevermap-entry-dialog--hidden');
    });
  }

  showPrivacyPolicy() {
    const dataEntryDialog = document.createElement('fevermap-landing-privacy-policy');
    document.querySelector('fevermap-root').appendChild(dataEntryDialog);
    setTimeout(() => {
      dataEntryDialog
        .querySelector('.view-wrapper')
        .classList.remove('fevermap-entry-dialog--hidden');
    });
  }

  render() {
    return html`
      <div class="container view-wrapper">
        <div class="fevermap-landing-content">
          <a href="https://fevermap.net"><img src="${logoImg}"/></a>
          ${PWAService.installable()
            ? html`
                <material-button
                  class="install-button"
                  label="Download app"
                  icon="play_for_work"
                  @click="${() => {
                    PWAService.launchInstallDialog();
                  }}"
                ></material-button>
              `
            : ''}
          <div class="about mb-4">
            <h2>${Translator.get('landing.about_title')}</h2>
            <p>
              <b>${Translator.get('app_title')}</b> ${Translator.get(
                'landing.about_text',
              )}
            </p>
          </div>
          <div class="scope mb-4">
            <h2>${Translator.get('landing.scope_title')}</h2>
            <p>
              ${Translator.get('landing.scope_text')}
            </p>
          </div>
          <div class="scope mb-4">
            <h2>${Translator.get('landing.data_title')}</h2>
            <p>
              ${Translator.get('landing.data_text_p1')}
            </p>
            <p>
              ${Translator.get('landing.data_text_p2')}
            </p>
          </div>
          <div class="scope mb-4">
            <h2>${Translator.get('landing.participate_title')}</h2>
            <p>
              ${Translator.get('landing.participate_text_p1')}
            </p>
            <p>
              ${Translator.get('landing.participate_text_p2')}
            </p>
            <p>
              ${Translator.get('landing.participate_text_p3')}
            </p>
          </div>
          <div class="scope mb-4">
            <h2>${Translator.get('landing.credits_title')}</h2>
            <p>
              ${Translator.get('landing.credits_text')}
            </p>
            <p>
              ${Translator.get('landing.credits_people')}:
            </p>
            <ul>
              <li>NUIG: Prof. Derek O’Keeffe, Carlos Tighe, Dr. Andrew Simpkin, Marc Mellotte</li>
              <li>UL: Dr. Kevin Johnson</li>
              <li>Orreco: Kevin McGinley, Conor Maguire, Gearoid Hynes</li>
              <li>eamonwhyte.com: Eamon Whyte</li>
            </ul>
          </div>
          <div class="scope mb-4">
            <p class="participant-count-subtitle">
              ${Translator.get('landing.about_current_participant_count', {
                participantCount: this.currentParticipantCount,
              })}
            </p>
          </div>
          <div class="data-use">
            <material-button
              @button-clicked="${this.showCookiePolicy}"
              class="policy-button"
              icon="policy"
              label="${Translator.get('landing.cookie_policy')}"
            ></material-button>
            <material-button
              @button-clicked="${this.showPrivacyPolicy}"
              class="policy-button"
              icon="policy"
              label="${Translator.get('landing.privacy_policy')}"
            ></material-button>
          </div>
        </div>
      </div>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

if (!customElements.get('fevermap-landing')) {
  customElements.define('fevermap-landing', FevermapLanding);
}
