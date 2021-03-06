/* eslint-disable class-methods-use-this,lit/no-value-attribute */
import { LitElement, html } from 'lit-element';
// eslint-disable-next-line import/no-extraneous-dependencies
import { MDCCheckbox } from '@material/checkbox/component';
import '../components/input-field.js';
import '../components/select-field.js';
import SnackBar from '../components/snackbar.js';
import ScrollService from '../services/scroll-service.js';
import DBUtil, { FEVER_ENTRIES, QUEUED_ENTRIES } from '../util/db-util.js';
import DataEntryService from '../services/data-entry-service.js';
import Translator from '../util/translator.js';
import FeverDataUtil from '../util/fever-data-util.js';
import '../components/gender-input.js';
import PWAService from '../services/pwa-service.js';
import IrishTownsService from '../services/irish-towns-service.js';

class FevermapDataEntry extends LitElement {
  static get properties() {
    return {
      latestEntry: { type: Object },
      queuedEntries: { type: Array },
      firstTimeSubmitting: { type: Boolean },

      hasFever: { type: Boolean },
      feverAmount: { type: Number },
      feverAmountNowKnown: { type: Boolean },
      gender: { type: String },
      birthYear: { type: String },

      geoCodingInfo: { type: Object },

      countySelectionOptions: { type: Array },
      selectedCountyIndex: { type: Number },
      townSelectionOptions: { type: Array },
      selectedTownIndex: { type: Number },

      errorMessage: { type: String },

      carouselWrapper: { type: Object },
      currentQuestion: { type: Number },
      questionCount: { type: Number },

      symptoms: { type: Array },
      covidDiagnosed: { type: String },

      symptomsFirstPage: { type: Number },
      symptomsPagesCount: { type: Number },

      hadSymptoms: { type: Boolean },
    };
  }

  constructor() {
    super();
    const latestEntry = JSON.parse(localStorage.getItem('LATEST_ENTRY'));
    const lastLocation = localStorage.getItem('LAST_LOCATION');
    const gender = localStorage.getItem('GENDER');
    const birthYear = localStorage.getItem('BIRTH_YEAR');
    const diagnosedCovid19 = localStorage.getItem('COVID_DIAGNOSIS');

    this.errorMessage = null;
    this.hadSymptoms = null;
    this.hasFever = null;
    this.feverAmount = 35;
    this.feverAmountNotKnown = false;
    this.birthYear = birthYear || null;
    this.gender = gender || null;
    this.covidDiagnosed = diagnosedCovid19 || null;
    this.location = latestEntry ? latestEntry.location : null;
    this.latestEntry = latestEntry || null;
    this.geoCodingInfo = latestEntry ? JSON.parse(lastLocation) : null;

    this.firstTimeSubmitting = this.gender == null || this.birthYear == null;

    this.createCountySelectOptions();
    this.createTownSelectOptions();
    this.queuedEntries = [];

    this.currentQuestion = 1;
    this.questionCount = 7;
    this.symptoms = [];

    this.symptomsFirstPage = 2;
    this.symptomsPagesCount = 5;
  }

  firstUpdated() {
    this.initSlider();
    this.getLocationInfo();
    this.carouselWrapper = this.querySelector('.fevermap-data-entry-content');
    if (!this.firstTimeSubmitting) {
      setTimeout(() => {
        this.nextQuestion();
      });
    }
    this.selectTestResult(this.diagnosed_covid19);
  }

  createCountySelectOptions() {
    this.countySelectionOptions = IrishTownsService.getCounties().map(entry => ({
      id: entry.county.county_id,
      name: `${entry.county.county_name}`,
      towns: entry.county.towns,
    }));
    this.selectedCountyIndex = 0;
  }

  createTownSelectOptions() {
    if (this.geoCodingInfo) {
      const countyInSelect = this.countySelectionOptions.find(
        opt => opt.id === this.geoCodingInfo.county_code,
      );
      if (countyInSelect) {
        this.townSelectionOptions = countyInSelect.towns.map(town => ({
          id: town,
          name: town,
        }));
        const townInSelect = countyInSelect.towns.find(opt =>
          this.geoCodingInfo.town_name.includes(opt),
        );
        this.selectedTownIndex = countyInSelect.towns.indexOf(townInSelect) + 1;
      }
    } else {
      this.townSelectionOptions = [
        {
          id: 0,
          name: `Please select a county first`,
        },
      ];
      this.selectedTownIndex = 0;
    }
  }

  updateTownSelectOpts(countyName) {
    let selectedCounty = this.countySelectionOptions.filter(
      county => county.name.toLowerCase() === countyName,
    )[0];
    this.townSelectionOptions = selectedCounty.towns.map(town => ({
      id: town,
      name: town,
    }));
    this.requestUpdate('townSelectionOptions');
    this.selectedTownIndex = this.querySelector('#location-town').getValue().index;
  }

  handleFeverButton(hasFever) {
    this.hasFever = hasFever;
    if (this.hasFever) {
      setTimeout(() => {
        const slider = this.initSlider();
        const checkboxElem = this.querySelector('.mdc-checkbox');
        const checkbox = new MDCCheckbox(checkboxElem);
        checkboxElem.addEventListener('change', () => {
          this.feverAmountNotKnown = checkbox.checked;
          this.feverAmount = checkbox.checked ? 0 : slider.value.toFixed(1);
          slider.getDefaultFoundation().setDisabled(checkbox.checked);
        });
      });
    }
  }

  initSlider() {
    const tempMeter = this.querySelector('#temperature-meter');
    if (!tempMeter) {
      return;
    }
    const celcius = this.querySelector('.celcius');
    const fahrenheit = this.querySelector('.fahrenheit');
    // This is extremely hacky but it works rn so
    tempMeter.addEventListener('input', e => {
      this.feverAmount = e.target.value;
      celcius.value = this.feverAmount;
      fahrenheit.value = FeverDataUtil.celsiusToFahrenheit(this.feverAmount);
    });
    celcius.addEventListener('keyup', e => {
      this.handleCommaInput(e);
      this.feverAmount = e.target.value;
      fahrenheit.value = FeverDataUtil.celsiusToFahrenheit(e.target.value);
      tempMeter.value = this.feverAmount;
    });
    fahrenheit.addEventListener('keyup', e => {
      this.handleCommaInput(e);
      this.feverAmount = FeverDataUtil.fahrenheitToCelsius(e.target.value);
      celcius.value = this.feverAmount;
    });

    celcius.addEventListener('focus', e => {
      e.target.value = '';
    });

    celcius.addEventListener('blur', e => {
      if (e.target.value.length < 1) {
        e.target.value = this.feverAmount;
      }
    });

    fahrenheit.addEventListener('blur', e => {
      if (e.target.value.length < 1) {
        e.target.value = FeverDataUtil.celsiusToFahrenheit(this.feverAmount);
      }
    });

    fahrenheit.addEventListener('focus', e => {
      e.target.value = '';
    });
    // Programmatically set height of the temp meter
    setTimeout(() => {
      tempMeter.style.width = `${tempMeter.parentNode.clientHeight}px`;
    }, 0);
  }

  // Quite hacky but should work
  // eslint-disable-next-line class-methods-use-this
  handleCommaInput(e) {
    if (e.key === ',') {
      e.target.setAttribute('comma-was-input', true);
      e.target.value += '.0';
    } else if (e.target.getAttribute('comma-was-input')) {
      e.target.removeAttribute('comma-was-input');
      if (!Number.isNaN(e.key)) {
        // is number
        const oldVal = e.target.value;
        e.target.value = `${oldVal.split('.')[0]}.${e.key}`;
      }
    }
  }

  async buildFeverData() {
    const feverData = {};
    const geoCodingInfo = await this.getGeoCodingInputInfo();
    let initialTimestamp = localStorage.getItem('INITIAL_TIMESTAMP');
    if (!initialTimestamp) {
      initialTimestamp = Date.now();
      localStorage.setItem('INITIAL_TIMESTAMP', initialTimestamp);
    }

    feverData.initial_timestamp = initialTimestamp;
    feverData.had_symptoms = this.hadSymptoms === true;
    feverData.fever_status = this.hasFever;
    feverData.fever_temp = this.feverAmount;
    if (this.hasFever) {
      feverData.fever_temp = !this.feverAmountNotKnown && this.hasFever ? this.feverAmount : null;
    }
    feverData.birth_year = this.birthYear;
    feverData.gender = this.gender;

    feverData.location_county_code = geoCodingInfo.county_code;
    feverData.location_town_name = geoCodingInfo.town_name;

    const possibleSymptoms = [
      'symptom_chest_tightness',
      'symptom_chills',
      'symptom_disorientation',
      'symptom_dizziness',
      'symptom_diarrhoea',
      'symptom_dry_cough',
      'symptom_fatigue',
      'symptom_loss_of_smell',
      'symptom_loss_of_taste',
      'symptom_nasal_congestion',
      'symptom_nausea_vomiting',
      'symptom_muscle_joint_pain',
      'symptom_sputum_production',
      'symptom_shortness_breath',
      'symptom_sore_throat',
      'symptom_headache',
    ];
    possibleSymptoms.forEach(symp => {
      feverData[symp] = this.symptoms.includes(symp);
    });

    feverData.diagnosed_covid19 = this.covidDiagnosed;
    return feverData;
  }

  validateFeverData(feverData) {
    const ageIsValid = this.validateAge(feverData.birth_year);
    if (!ageIsValid) {
      return false;
    }
    const genderIsValid = this.validateGender(feverData.gender);
    if (!genderIsValid) {
      return false;
    }
    const feverTempIsValid = this.validateFeverTemp(feverData.fever_temp);
    if (!feverTempIsValid) {
      return false;
    }
    const locationIsValid = this.validateLocation(feverData);
    if (!locationIsValid) {
      return false;
    }
    return true;
  }

  validateAge(birthYear) {
    if (birthYear > 2020 || birthYear < 1900) {
      this.errorMessage = Translator.get('system_messages.error.age_not_in_range');
      SnackBar.error(this.errorMessage);
      return false;
    }
    return true;
  }

  validateGender(gender) {
    if (gender === null) {
      this.errorMessage = Translator.get('system_messages.error.gender_not_set');
      SnackBar.error(this.errorMessage);
      return false;
    }
    return true;
  }

  validateFeverTemp(feverTemp) {
    if (feverTemp != null && (feverTemp < 35 || feverTemp > 44)) {
      this.errorMessage = Translator.get('system_messages.error.fever_temp_value_invalid');
      SnackBar.error(this.errorMessage);
      return false;
    }
    return true;
  }

  validateLocation(feverData) {
    if (this.locationDataIsInvalid(feverData)) {
      this.errorMessage = Translator.get('system_messages.error.location_data_invalid');
      SnackBar.error(this.errorMessage);
      return false;
    }
    return true;
  }

  locationDataIsInvalid(feverData) {
    return !feverData || !feverData.location_town_name;
  }

  async handleSubmit() {
    const feverData = await this.buildFeverData();
    const valid = this.validateFeverData(feverData);
    if (!valid) {
      return;
    }
    this.errorMessage = null;

    const submissionResponse = await DataEntryService.handleDataEntrySubmission(feverData);

    if (submissionResponse.success) {
      this.handlePostSubmissionActions(feverData, Date.now(), false, submissionResponse);
      this.currentQuestion = 1;
    } else {
      switch (submissionResponse.reason) {
        case 'INVALID_DATA':
          SnackBar.error(Translator.get('system_messages.error.api_data_invalid'));
          break;
        case 'NETWORK_STATUS_OFFLINE':
          this.handlePostSubmissionActions(feverData, Date.now(), true);
          break;
        default:
          SnackBar.error(submissionResponse.message);
      }
    }
  }

  async handlePostSubmissionActions(feverData, submissionTime, entryGotQueued, submissionResponse) {
    localStorage.setItem('LATEST_ENTRY', JSON.stringify(feverData));
    localStorage.setItem('GENDER', feverData.gender);
    localStorage.setItem('BIRTH_YEAR', feverData.birth_year);
    localStorage.setItem('COVID_DIAGNOSIS', feverData.diagnosed_covid19);
    localStorage.setItem('LAST_ENTRY_SUBMISSION_TIME', submissionTime);

    if (!entryGotQueued) {
      DataEntryService.setEntriesToIndexedDb(submissionResponse);
      SnackBar.success(Translator.get('system_messages.success.data_entry'));

      PWAService.launchInstallDialog();
      this.closeView();
    } else {
      document.dispatchEvent(new CustomEvent('update-queued-count'));
      SnackBar.success(Translator.get('system_messages.success.entry_send_failed_queued'));
      this.closeView();
    }
    ScrollService.scrollToTop();
  }

  closeView() {
    const wrapper = this.querySelector('.view-wrapper');
    wrapper.classList.add('fevermap-entry-dialog--hidden');
    wrapper.addEventListener('transitionend', () => {
      this.remove();
    });
  }

  /**
   * Enable this if we start allowing offline sync.
   *
   * Needs changes to the IDB code
   * @return {Promise<void>}
   */
  async submitQueuedEntries() {
    const db = await DBUtil.getInstance();
    let successfulSyncCount = 0;
    await this.queuedEntries.map(async (entry, i) => {
      const { id } = entry;
      // delete entry.id;
      const submissionResponse = await DataEntryService.handleDataEntrySubmission(entry, false);
      if (submissionResponse.success) {
        db.delete(QUEUED_ENTRIES, id);
        await db.add(FEVER_ENTRIES, entry);
        successfulSyncCount += 1;
      }
      if (i === this.queuedEntries.length - 1) {
        if (successfulSyncCount > 0) {
          SnackBar.success(Translator.get('system_messages.success.sync_finished'));
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        }
      }
    });
  }

  async getGeoCodingInputInfo() {
    const town = this.querySelector('#location-town').getValue();
    const county = this.querySelector('#location-county').getValue();
    let locationData = {
      county_code: county.value.id,
      town_name: town.value.name,
    };
    localStorage.setItem('LAST_LOCATION', JSON.stringify(locationData));
    return locationData;
  }

  getLocationInfo() {
    if (this.geoCodingInfo) {
      const countyInSelect = this.countySelectionOptions.find(
        opt => opt.id === this.geoCodingInfo.county_code,
      );
      if (countyInSelect) {
        this.selectedCountyIndex = this.countySelectionOptions.indexOf(countyInSelect) + 1; // Take into account the empty option
        const townInSelect = countyInSelect.towns.find(opt =>
          this.geoCodingInfo.town_name.includes(opt),
        );
        this.selectedTownIndex = countyInSelect.towns.indexOf(townInSelect) + 1;
      }
    }
  }

  handlePersonalInfoSubmit() {
    this.birthYear = this.querySelector('#birth-year').getValue();
    if (!this.validateAge(this.birthYear) || !this.validateGender(this.gender)) {
      return;
    }
    let townSelect = this.querySelector('#location-town').getValue();
    let countySelect = this.querySelector('#location-county').getValue();
    if (!townSelect.value || !countySelect.value) {
      this.errorMessage = Translator.get('system_messages.error.location_data_invalid');
      SnackBar.error(this.errorMessage);
      return false;
    }
    this.nextQuestion();
  }

  handleFeverInfoSubmit() {
    this.nextQuestion();
  }

  handleNoFeverSubmit() {
    this.feverAmount = null;
    this.nextQuestion();
  }

  handleHadSymptoms(hadSymptoms) {
    this.hadSymptoms = hadSymptoms;
    this.nextQuestion();
  }

  previousQuestion() {
    if (this.currentQuestion === 1) {
      return;
    }
    this.currentQuestion -= 1;
    this.scrollToCurrentQuestion(false);
  }

  nextQuestion() {
    if (this.currentQuestion === this.questionCount) {
      return;
    }
    this.currentQuestion += 1;
    this.scrollToCurrentQuestion();
  }

  scrollToCurrentQuestion(forwards = true) {
    const targetElem = this.querySelector(`#question-${this.currentQuestion}`);
    if (!targetElem) {
      return;
    }
    const target = targetElem.offsetLeft - (window.innerWidth - targetElem.clientWidth) / 2;
    this.smoothScroll(this.carouselWrapper, target, forwards);
  }

  smoothScroll(div, target, forwards = true) {
    // Tickrate will determine the amount of iterations + 1 that the scrolling will do
    // To speed things up, change the division value. Smaller is faster.
    const tickRate = Math.abs(target - div.scrollLeft) / 30;
    if (forwards) {
      (function smoothScroll() {
        if (div.scrollLeft >= target) return;
        div.scroll(div.scrollLeft + tickRate, 0);
        setTimeout(smoothScroll, 10);
      })();
    } else {
      if (target < 0) {
        // eslint-disable-next-line no-param-reassign
        target = 0;
      }
      (function smoothScrollBackwards() {
        if (div.scrollLeft <= target) return;
        div.scroll(div.scrollLeft - tickRate, 0);
        setTimeout(smoothScrollBackwards, 10);
      })();
    }
  }

  handleSymptomAdd(e) {
    let { target } = e;
    if (e.target.nodeName === 'P') {
      target = target.parentNode;
    }
    if (this.symptoms.includes(e.target.id)) {
      this.symptoms.splice(this.symptoms.indexOf(e.target.id), 1);
      target.classList.remove('symptom--selected');
    } else {
      this.symptoms.push(e.target.id);
      target.classList.add('symptom--selected');
    }
  }

  handleTestSelect(e) {
    let { target } = e;
    if (e.target.nodeName === 'P') {
      target = target.parentNode;
    }
    this.covidDiagnosed = e.target.id;
    let testResultOptions = ['positive', 'negative', 'awaitingTests', 'unTested'];
    for (let testResultOption of testResultOptions) {
      document.getElementById(`test_${testResultOption}`).classList.remove('symptom--selected');
    }
    target.classList.add('symptom--selected');
  }

  selectTestResult(testResult) {
    if (testResult) document.getElementById(`${testResult}`).classList.add('symptom--selected');
  }

  render() {
    return html`
      <div class="container view-wrapper fevermap-entry-dialog fevermap-entry-dialog--hidden">
        <div class="fevermap-data-entry-content">
          <div
            class="fevermap-entry-carousel${this.questionCount === 7
              ? ' fevermap-entry-carousel--full-width'
              : ' fevermap-entry-carousel--smaller-width'}"
          >
            ${this.renderQuestions()}
          </div>
        </div>
      </div>
    `;
  }

  renderQuestions() {
    const symptomsPage1 = [
      'chest_tightness',
      'chills',
      'disorientation',
      'dizziness',
      'diarrhoea',
      'dry_cough',
    ];
    const symptomsPage2 = [
      'fatigue',
      'loss_of_smell',
      'loss_of_taste',
      'nasal_congestion',
      'nausea_vomiting',
    ];
    const symptomsPage3 = [
      'muscle_joint_pain',
      'sputum_production',
      'shortness_breath',
      'sore_throat',
      'headache',
    ];
    return html`
      <div class="entry-dialog-close-button">
        <material-icon @click="${this.closeView}" icon="close"></material-icon>
      </div>
      <div class="fevermap-entry-window mdc-elevation--z9" id="question-1">
        ${this.getPersonalQuestions()}
      </div>
      <div class="fevermap-entry-window mdc-elevation--z9 fevermap-fever-questions" id="question-2">
        ${this.getHaveHadQuestion()}
      </div>
      <div class="fevermap-entry-window mdc-elevation--z9 fevermap-fever-questions" id="question-3">
        ${this.getFeverMeter()}
      </div>
      <div
        class="fevermap-entry-window mdc-elevation--z9 fevermap-other-symptoms-questions"
        id="question-4"
      >
        ${this.getSymptomsFields(3, symptomsPage1)}
      </div>
      <div
        class="fevermap-entry-window mdc-elevation--z9 fevermap-other-symptoms-questions"
        id="question-5"
      >
        ${this.getSymptomsFields(4, symptomsPage2)}
      </div>
      <div
        class="fevermap-entry-window mdc-elevation--z9 fevermap-other-symptoms-questions"
        id="question-6"
      >
        ${this.getSymptomsFields(5, symptomsPage3)}
      </div>
      <div class="fevermap-entry-window mdc-elevation--z9 fevermap-fever-questions" id="question-7">
        ${this.getTestFields()}
      </div>
    `;
  }

  getPersonalQuestions() {
    return html`
      <div class="title-holder">
        <h2>${Translator.get('entry.new_entry')}</h2>
        <p class="subtitle">${Translator.get('entry.first_time_disclaimer')}</p>
        <p class="subtitle">${Translator.get('entry.these_questions_wont_be_repeated')}</p>
      </div>
      <div class="question-number-holder">
        1/${this.questionCount}
      </div>
      ${this.getYearOfBirthInput()} ${this.getGenderInput()} ${this.getIrishLocationInput()}
      <div class="proceed-button">
        <button class="mdc-button mdc-button--raised" @click="${this.handlePersonalInfoSubmit}">
          <div class="mdc-button__ripple"></div>

          <i class="material-icons mdc-button__icon" aria-hidden="true">save</i>
          <span class="mdc-button__label">${Translator.get('entry.save')}</span>
        </button>
      </div>
    `;
  }

  getHaveHadQuestion() {
    return html`
      <div class="back-button" @click="${this.previousQuestion}">
        <material-icon icon="keyboard_arrow_left"></material-icon>${Translator.get('back')}
      </div>
      <div class="question-number-holder">
        2/${this.questionCount}
      </div>
      <div class="title-holder">
        <h2>${Translator.get('entry.symptoms')} 1/${this.symptomsPagesCount}</h2>
      </div>
      <div class="entry-field">
        <div class="proceed-button had-symptoms">
          <button
            class="mdc-button mdc-button--raised"
            @click="${() => this.handleHadSymptoms(false)}"
          >
            <div class="mdc-button__ripple"></div>

            <i class="material-icons mdc-button__icon" aria-hidden="true">done</i>
            <span class="mdc-button__label"
              >${Translator.get('entry.questions.have_symptoms')}</span
            >
          </button>
          <div class="or-text">${Translator.get('entry.questions.or')}</div>
          <button
            class="mdc-button mdc-button--raised"
            @click="${() => this.handleHadSymptoms(true)}"
          >
            <div class="mdc-button__ripple"></div>

            <i class="material-icons mdc-button__icon" aria-hidden="true">done</i>
            <span class="mdc-button__label">${Translator.get('entry.questions.had_symptoms')}</span>
          </button>
        </div>
      </div>
      <div class="spacing"></div>
    `;
  }

  getFeverMeter() {
    return html`
      <div class="back-button" @click="${this.previousQuestion}">
        <material-icon icon="keyboard_arrow_left"></material-icon>${Translator.get('back')}
      </div>
      <div class="question-number-holder">
        3/${this.questionCount}
      </div>
      <div class="title-holder">
        <h2>${Translator.get('entry.symptoms')} 2/${this.symptomsPagesCount}</h2>
        <p class="temperature-title">
          ${Translator.get('entry.questions.what_is_your_temperature')}
        </p>
      </div>
      <div class="entry-field fever-meter-field">
        <div class="fever-meters">
          <div class="fever-slider">
            <div class="fever-amount-display">
              <div class="fever-amount-field  mdc-elevation--z3">
                <input
                  class="celcius"
                  type="number"
                  step="0.1"
                  value="${FeverDataUtil.getFeverWithUnitWithoutSuffix(
                    false,
                    this.feverAmount,
                    this.geoCodingInfo,
                  )}"
                />
                <p>${FeverDataUtil.getFeverUnitSuffix(false, this.geoCodingInfo)}</p>
              </div>
            </div>
            <div class="fever-slider-element">
              <input type="range" id="temperature-meter" min="35" max="42" step="0.1" value="35" />
            </div>
            <div class="fever-amount-display">
              <div class="fever-amount-field  mdc-elevation--z3">
                <input
                  type="number"
                  step="0.1"
                  class="fahrenheit"
                  value="${FeverDataUtil.getFeverWithUnitWithoutSuffix(
                    true,
                    this.feverAmount,
                    this.geoCodingInfo,
                  )}"
                />
                <p>${FeverDataUtil.getFeverUnitSuffix(true, this.geoCodingInfo)}</p>
              </div>
            </div>
          </div>

          <div class="proceed-button">
            <button
              class="mdc-button mdc-button--raised"
              @click="${() => this.handleFeverInfoSubmit()}"
            >
              <div class="mdc-button__ripple"></div>

              <i class="material-icons mdc-button__icon" aria-hidden="true">done</i>
              <span class="mdc-button__label"
                >${Translator.get('entry.questions.set_temperature')}</span
              >
            </button>
            <div class="or-text">${Translator.get('entry.questions.or')}</div>
            <button
              class="mdc-button mdc-button--raised"
              @click="${() => this.handleNoFeverSubmit()}"
            >
              <div class="mdc-button__ripple"></div>

              <i class="material-icons mdc-button__icon" aria-hidden="true">clear</i>
              <span class="mdc-button__label"
                >${Translator.get('entry.questions.not_measured')}</span
              >
            </button>
          </div>
        </div>
      </div>
    `;
  }

  getTestFields() {
    return html`
      <div class="back-button" @click="${this.previousQuestion}">
        <material-icon icon="keyboard_arrow_left"></material-icon>${Translator.get('back')}
      </div>
      <div class="question-number-holder">
        7/${this.questionCount}
      </div>
      <div class="title-holder">
        <h3>${Translator.get('entry.questions.covid_diagnosis')}</h3>
      </div>
      <p class="subtitle">${Translator.get('entry.questions.prompt_diagnosis')}</p>
      <div class="symptom-holder">
        <div class="symptom" id="test_positive" @click="${this.handleTestSelect}">
          <p>${Translator.get('entry.questions.positive')}</p>
        </div>
        <div class="symptom" id="test_negative" @click="${this.handleTestSelect}">
          <p>${Translator.get('entry.questions.negative')}</p>
        </div>
        <div class="symptom" id="test_awaitingTests" @click="${this.handleTestSelect}">
          <p>${Translator.get('entry.questions.awaitingTests')}</p>
        </div>
        <div class="symptom" id="test_unTested" @click="${this.handleTestSelect}">
          <p>${Translator.get('entry.questions.unTested')}</p>
        </div>
      </div>

      <div class="proceed-button">
        <button class="mdc-button mdc-button--raised" @click="${this.handleSubmit}">
          <div class="mdc-button__ripple"></div>
          <i class="material-icons mdc-button__icon" aria-hidden="true">done</i>
          <span class="mdc-button__label">${Translator.get('entry.questions.set_diagnosis')}</span>
        </button>
      </div>
    `;
  }

  getSymptomsFields(pageNumber, symptoms) {
    let symptomButtons = '';
    for (let symptom of symptoms) {
      let symptomButton = html`
        <div class="symptom" id="symptom_${symptom}" @click="${this.handleSymptomAdd}">
          <p>${Translator.get(`entry.questions.${symptom}`)}</p>
        </div>
      `;
      symptomButtons = html`
        ${symptomButtons} ${symptomButton}
      `;
    }
    let totalPageNumber = pageNumber + (this.symptomsFirstPage - 1);
    return html`
      <div class="back-button" @click="${this.previousQuestion}">
        <material-icon icon="keyboard_arrow_left"></material-icon>${Translator.get('back')}
      </div>
      <div class="question-number-holder">
        ${totalPageNumber}/${this.questionCount}
      </div>
      <div class="title-holder">
        <h2>${Translator.get('entry.symptoms')} ${pageNumber}/${this.symptomsPagesCount}</h2>
      </div>
      <p class="subtitle">${Translator.get('entry.questions.choose_all_that_apply')}</p>
      <div class="symptom-holder">
        ${symptomButtons}
      </div>

      <div class="proceed-button">
        <button class="mdc-button mdc-button--raised" @click="${this.nextQuestion}">
          <div class="mdc-button__ripple"></div>

          <i class="material-icons mdc-button__icon" aria-hidden="true">done</i>
          <span class="mdc-button__label">${Translator.get('entry.questions.set_symptoms')}</span>
        </button>
      </div>
    `;
  }

  getIrishLocationInput() {
    return html`
      <div class="title-holder">
        <p>${Translator.get('entry.questions.whats_your_location')}</p>
      </div>
      <div class="entry-field">
        <div
          @update-town="${e => {
            this.updateTownSelectOpts(e.detail.county);
          }}"
          class="location-select-fields"
        >
          <select-field
            id="location-county"
            label="${Translator.get('entry.questions.county')}"
            .options="${this.countySelectionOptions}"
            selectedValueIndex="${this.selectedCountyIndex}"
          ></select-field>
          <select-field
            id="location-town"
            label="${Translator.get('entry.questions.town')}"
            .options="${this.townSelectionOptions}"
            selectedValueIndex="${this.selectedTownIndex}"
          ></select-field>
        </div>
      </div>
    `;
  }

  getYearOfBirthInput() {
    return html`
      <div class="entry-field">
        <p>${Translator.get('entry.questions.birth_year')}</p>
        <input-field
          placeHolder=${Translator.get('entry.questions.birth_year_placeholder')}
          fieldId="year-of-birth-input"
          id="birth-year"
          value="${this.birthYear ? this.birthYear : ''}"
          type="number"
        ></input-field>
      </div>
    `;
  }

  getGenderInput() {
    return html`
      <div class="entry-field">
        <p>${Translator.get('entry.questions.gender_in_passport')}</p>
        <gender-input
          gender="${this.gender}"
          @gender-changed="${e => {
            this.gender = e.detail.gender;
          }})}"
        ></gender-input>
      </div>
    `;
  }

  getSubmitButton() {
    return html`
      <div class="entry-field">
        ${this.errorMessage
          ? html`
              <p class="mdc-theme--error">${this.errorMessage}</p>
            `
          : ''}
        <div class="submit-button">
          <button class="mdc-button mdc-button--outlined" @click="${this.handleSubmit}">
            <div class="mdc-button__ripple"></div>

            <i class="material-icons mdc-button__icon" aria-hidden="true">send</i>
            <span class="mdc-button__label">${Translator.get('entry.submit')}</span>
          </button>
        </div>
      </div>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

if (!customElements.get('fevermap-data-entry')) {
  customElements.define('fevermap-data-entry', FevermapDataEntry);
}
