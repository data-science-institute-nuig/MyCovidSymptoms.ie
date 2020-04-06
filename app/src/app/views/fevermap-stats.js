import { LitElement, html } from 'lit-element';
import Translator from '../util/translator.js';
import placeholderImage from '../../assets/images/chart.png';

class FevermapStats extends LitElement {
  static get properties() {
    return {};
  }

  firstUpdated() {

  }

  render() {
    return html`
      <div class="container view-wrapper">
        <div class="fevermap-stats-content">
          <h1>${Translator.get('stats.stats')}</h1>
          <div class="stats-placeholder-image">
            <img src="${placeholderImage}" />
            <div class="coming-soon-banner"><p>County-level summary available soon</p></div>
          </div>
        </div>
      </div>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

if (!customElements.get('fevermap-stats')) {
  customElements.define('fevermap-stats', FevermapStats);
}
