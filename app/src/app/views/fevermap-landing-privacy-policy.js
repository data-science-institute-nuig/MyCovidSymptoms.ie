import { LitElement, html } from 'lit-element';

class FevermapLandingPrivacyPolicy extends LitElement {

  render() {
    return html`
      <div class="container view-wrapper fevermap-landing-policy fevermap-entry-dialog fevermap-entry-dialog--hidden">
        <div class="fevermap-data-entry-content">
          <div
            class="fevermap-entry-carousel fevermap-entry-carousel--smaller-width"
          >
            <div class="entry-dialog-close-button">
              <material-icon @click="${this.closeView}" icon="close"></material-icon>
            </div>
            <div class="fevermap-entry-window mdc-elevation--z9" id="question-1">
              <div class="container">
                ${this.renderPolicy()}
              <div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderPolicy() {
    return html`
    <h1>Privacy Policy</h1>
    <p>MyCovidSymptoms only collects and stores the anonymous answers you provide in the symptom survey, along with information on the time and date of the submissions.</p>
    <p>An anonymous identifier is created from time of your first submission. This anonymous identifier allows us to understand which anonymous responses are from the same individual. From that we can understand how symptoms change over time.</p>
    <p>MyCovidSymptoms does not collect any additional information. None of the data we collect is of a personal nature, nor could it be used to identify a user offline.</p>
    <p>If you have any further questions about how MyCovidSymptoms handles the data you submit, please contact us at: mycovidsymptoms@gmail.com</p>
    `
  }

  closeView() {
    const wrapper = this.querySelector('.view-wrapper');
    wrapper.classList.add('fevermap-entry-dialog--hidden');
    wrapper.addEventListener('transitionend', () => {
      this.remove();
    });
  }

  createRenderRoot() {
    return this;
  }
}

if (!customElements.get('fevermap-landing-privacy-policy')) {
  customElements.define('fevermap-landing-privacy-policy', FevermapLandingPrivacyPolicy);
}