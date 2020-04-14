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
    <p>The National University of Ireland Galway with University of Limerick and Orreco are
    conducting this project.</p>
    <p>MyCovidSymptoms only collects through your consent and stores the anonymioused answers
    you provide in the symptom survey, along with information on the time and date of the
    submissions. The aggregate anonymous data will be provided to the Irish health authorities to
    help with their planning and will be used in research by NUI Galway to help prevent and
    mitigate future pandemics.</p>
    <p>An anonymised ous identifier is created from time of your first submission. This anonymised
    ous identifier allows us to understand which anonymioused responses are from the same
    individual. From that we can understand how symptoms change over time. As per the cookie
    policy available on this website, this can be deleted by you at any time under your control.</p>
    <p>The project team will conduct a deletion of their copy of this
    identifier within 90 days of the data collection completing.</p>
    <p>MyCovidSymptoms does not collect any additional information. None of the data we collect
    is of a personal nature, nor will could it be used to identify a user offline.</p>
    <p>If you have any further questions about how MyCovidSymptoms handles the data you
    submit, please contact us at: mycovidsymptoms@gmail.com</p>
    <h2>Data Protection<h2>
    <p>If you have any data protection rights queries or wish to exercise your data protection rights
    please see: <a href="https://www.nuigalway.ie/data-protection">https://www.nuigalway.ie/data-protection</a> or please contact:
    dataprotection@nuigalway.ie</p>
    <p>The Office of the Data Protection Commissioner can be contacted at:
    <a href ="https://www.dataprotection.ie/en/contact/how-contact-us">https://www.dataprotection.ie/en/contact/how-contact-us</a></p>
    <h2>Data Processor</h2>
    <p>The project data is stored by Digital Ocean who are certified under the Privacy Shield
    Principles. Please see this link for details on their data protection information:
    <a href="https://www.digitalocean.com/legal">https://www.digitalocean.com/legal</a></p>
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