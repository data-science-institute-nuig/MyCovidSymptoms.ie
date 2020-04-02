import { LitElement, html } from 'lit-element';

class FevermapLandingCookiePolicy extends LitElement {

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
    <h1>Cookie Policy for My Covid Symptoms</h1>
    This is the Cookie Policy for My Covid Symptoms, accessible from mycovidsymptoms.org, mycovidsymptoms.com and mycovidsymptoms.ie.
    <h3>What Are Cookies</h3>
    A cookie is a small piece of data that a website stores on your device when you visit, typically containing information about the website itself, a unique identifier that allows the site to recognise your web browser when you return, additional data that serves the purpose of the cookie, and the lifespan of the cookie itself.
    <h3>How We Use Cookies</h3>
    We use a single cookie, which is the minimum amount of cookies necessary for MyCovidSymptoms to function. While you may disable cookies, it is recommended that you leave on all cookies if you are not sure whether you need them or not in case they are used to provide a service that you use.
    <h3>Disabling Cookies</h3>
    You can prevent the setting of cookies by adjusting the settings on your browser (see your browser Help for how to do this). Be aware that disabling cookies will affect the functionality of this and many other websites that you visit. Disabling cookies will usually result in also disabling certain functionality and features of the this site. Therefore it is recommended that you do not disable cookies.
    <h3>The Cookies We Set</h3>
    Surveys related cookies: We user cookies to store some of your response information so that you do not have to repeatedly enter details that never or infrequently change. Namely, we store your response to the year of birth, gender and location questions. Additionally, we store an anonymous unique identifier for your device so that we know which symptoms come from the same person.
    <h3>Third Party Cookies</h3>
    We do not use any third party cookies
    <h3>Further Information</h3>
    If you more information you can contact us via email at: mycovidsymptoms@gmail.com
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

if (!customElements.get('fevermap-landing-cookie-policy')) {
  customElements.define('fevermap-landing-cookie-policy', FevermapLandingCookiePolicy);
}