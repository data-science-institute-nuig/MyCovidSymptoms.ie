import { LitElement, html } from 'lit-element';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import Translator from '../util/translator.js';
import DBUtil, { FEVER_ENTRIES, QUEUED_ENTRIES } from '../util/db-util.js';
import FeverDataUtil from '../util/fever-data-util.js';
import '../components/fever-chart.js';
import ScrollService from '../services/scroll-service.js';
import DataEntryService from '../services/data-entry-service.js';
import SnackBar from '../components/snackbar.js';

class FevermapDataView extends LitElement {
  static get properties() {
    return {
      lastSubmissionTime: { type: String },
      submissionCount: { type: Number },
      submissionStreak: { type: Number },
      previousSubmissions: { type: Array },
      geoCodingInfo: { type: Object },
      firstTimeSubmitting: { type: Boolean },
      lastSubmissionIsTooCloseToNow: { type: Boolean },
      nextAllowedSubmitTime: { type: String },

      setGender: { type: String },
      setBirthYear: { type: String },
      setCovidDiagnosis: { type: Boolean },

      queuedEntries: { type: Array },
    };
  }

  constructor() {
    super();
    const submissionCount = localStorage.getItem('SUBMISSION_COUNT');
    const submissionStreak = localStorage.getItem('SUBMISSION_STREAK');
    this.submissionCount = submissionCount || 0;
    this.submissionStreak = submissionStreak || 0;
    dayjs.extend(utc);

    this.checkLastSubmissionTime();

    const gender = localStorage.getItem('GENDER');
    const birthYear = localStorage.getItem('BIRTH_YEAR');
    const lastLocation = localStorage.getItem('LAST_LOCATION');
    const covidDiagnosis = localStorage.getItem('COVID_DIAGNOSIS');
    this.setGender = gender || null;
    this.setBirthYear = birthYear || '';
    this.location = lastLocation ? lastLocation : null;
    this.setCovidDiagnosis = covidDiagnosis === 'true';
    this.previousSubmissions = null;

    this.firstTimeSubmitting = this.setGender == null || this.setBirthYear == null;

    this.getPreviousSubmissionsFromIndexedDb();
  }

  firstUpdated() {
    document.addEventListener('update-submission-list', () => {
      this.getPreviousSubmissionsFromIndexedDb();

      const submissionCount = localStorage.getItem('SUBMISSION_COUNT');
      const submissionStreak = localStorage.getItem('SUBMISSION_STREAK');

      this.setGender = localStorage.getItem('GENDER');
      this.setBirthYear = localStorage.getItem('BIRTH_YEAR');
      this.setCovidDiagnosis = localStorage.getItem('COVID_DIAGNOSIS') === 'true';

      this.submissionCount = submissionCount || 0;
      this.submissionStreak = submissionStreak || 0;
      this.checkLastSubmissionTime();
    });
    document.addEventListener('update-queued-count', () => {
      this.getQueuedEntriesFromIndexedDb();
    });
    if (this.firstTimeSubmitting) {
      this.showEntryDialog();
    }
    this.getQueuedEntriesFromIndexedDb();
  }

  checkLastSubmissionTime() {
    const lastEntryTime = localStorage.getItem('LAST_ENTRY_SUBMISSION_TIME');
    if (lastEntryTime && lastEntryTime !== 'undefined') {
      this.lastSubmissionTime = dayjs(Number(lastEntryTime)).format('DD-MM-YYYY : HH:mm');
      this.lastSubmissionIsTooCloseToNow = dayjs(Number(lastEntryTime))
        .local()
        .add(1, 'hour')
        .isAfter(dayjs(Date.now()));
      this.nextAllowedSubmitTime = dayjs(Number(lastEntryTime))
        .add(1, 'hour')
        .local()
        .format('DD-MM-YYYY : HH:mm');
    }
  }

  async getPreviousSubmissionsFromIndexedDb() {
    const db = await DBUtil.getInstance();
    const previousSubmissions = await db.getAll(FEVER_ENTRIES);
    if (previousSubmissions && previousSubmissions.length > 0) {
      this.previousSubmissions = previousSubmissions.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
      );
    } else {
      this.previousSubmissions = [];
    }
  }

  // eslint-disable-next-line class-methods-use-this
  showEntryDialog() {
    const dataEntryDialog = document.createElement('fevermap-data-entry');
    document.querySelector('fevermap-root').appendChild(dataEntryDialog);
    setTimeout(() => {
      dataEntryDialog
        .querySelector('.view-wrapper')
        .classList.remove('fevermap-entry-dialog--hidden');
    });
  }

  // For use when we enable offline
  async getQueuedEntriesFromIndexedDb() {
    const db = await DBUtil.getInstance();
    const queuedSubmissions = await db.getAll(QUEUED_ENTRIES);
    if (queuedSubmissions && queuedSubmissions.length > 0) {
      this.queuedEntries = queuedSubmissions;
    } else {
      this.queuedEntries = null;
    }
  }

  // eslint-disable-next-line class-methods-use-this
  getSymptomsForSubmission(sub) {
    const possibleSymptoms = [
      'chest_tightness',
      'chills',
      'disorientation',
      'dizziness',
      'diarrhoea',
      'dry_cough',
      'fatigue',
      'loss_of_smell',
      'loss_of_taste',
      'nasal_congestion',
      'nausea_vomiting',
      'muscle_joint_pain',
      'sputum_production',
      'shortness_breath',
      'sore_throat',
      'headache',
    ];
    const symptoms = [];
    for (let symptom of possibleSymptoms) {
      symptoms.push({
        translation: Translator.get(`entry.questions.${symptom}`),
        hasSymptom: sub[`symptom_${symptom}`],
      });
    }
    return symptoms.filter(symp => symp.hasSymptom);
  }

  handleGenderChange(newGender) {
    this.setGender = newGender;
    localStorage.setItem('GENDER', newGender);
  }

  getAge() {
    const age = dayjs(new Date()).year() - this.setBirthYear;
    return `${age - 1}-${age}`;
  }

  handleAgeChange(newAge) {
    if (newAge < 1900 || newAge > 2020) {
      return;
    }
    this.setBirthYear = newAge;
    localStorage.setItem('BIRTH_YEAR', newAge);
  }

  handleLocationChange() {
    const town = this.querySelector('#location-town').getValue();
    const county = this.querySelector('#location-county').getValue();
    this.location = {
      county_code: this.querySelector('#location-county').getValue().id,
      town_name: this.querySelector('#location-town').getValue().name,
    };
    localStorage.setItem('LAST_LOCATION', JSON.stringify(this.location));
  }

  handleCovidDiagnosisChange() {
    this.setCovidDiagnosis = this.querySelector('#covid-diagnosed').checked;
    localStorage.setItem('COVID_DIAGNOSIS', this.setCovidDiagnosis);
  }

  async syncQueuedEntries() {
    const db = await DBUtil.getInstance();
    let successfulSyncCount = 0;
    await this.queuedEntries.map(async (entry, i) => {
      const { id } = entry;
      // delete entry.id;
      const submissionResponse = await DataEntryService.handleDataEntrySubmission(entry, false);
      if (submissionResponse.success) {
        db.delete(QUEUED_ENTRIES, id);
        DataEntryService.setEntriesToIndexedDb(submissionResponse);
        successfulSyncCount += 1;
      } else {
        SnackBar.success(Translator.get('system_messages.success.entry_send_failed_queued'));
      }
      if (i === this.queuedEntries.length - 1) {
        if (successfulSyncCount > 0) {
          this.getQueuedEntriesFromIndexedDb();
          this.getPreviousSubmissionsFromIndexedDb();
          SnackBar.success(Translator.get('system_messages.success.sync_finished'));
        }
      }
    });
  }

  // eslint-disable-next-line class-methods-use-this
  showSubmissionTooCloseSnackbar() {
    SnackBar.success(
      Translator.get('system_messages.error.do_not_submit_new_temp_until', {
        dateTime: this.nextAllowedSubmitTime,
      }),
    );
  }

  render() {
    return html`
      <div class="container view-wrapper fevermap-entry-view">
        <div class="fevermap-data-view-content">
          <div class="entry-history-title-area">
            <h2>${Translator.get('history.title')}</h2>
            <material-button
              @button-clicked="${this.lastSubmissionIsTooCloseToNow
                ? this.showSubmissionTooCloseSnackbar
                : this.showEntryDialog}"
              class="add-new-entry-button${this.lastSubmissionIsTooCloseToNow
                ? ' add-new-entry-button--disabled'
                : ''}"
              icon="add_circle"
              label="${Translator.get('history.add_entry')}"
            ></material-button>
          </div>
          <div class="entry-info-view-wrapper">
            <div class="progression-chart">
              <fever-chart
                .data="${this.previousSubmissions}"
                chartId="fever-history-chart"
                .geoCodingInfo="${this.geoCodingInfo}"
              ></fever-chart>
            </div>
            <div class="statistics-fields">
              <div class="statistics-field statistics-field--streak-statistics">
                <p class="statistics-field--title">${Translator.get('history.your_streak')}</p>
                <p class="statistics-field--result">${this.submissionStreak}</p>
                <p class="statistics-field--subtitle">${Translator.get('history.days')}</p>
              </div>
              <div class="statistics-fields--splitter"></div>
              <div class="statistics-field statistics-field--total-statistics">
                <p class="statistics-field--title">${Translator.get('history.total_entries')}</p>
                <p class="statistics-field--result">${this.submissionCount}</p>
                <p class="statistics-field--subtitle">${Translator.get('history.measurements')}</p>
              </div>
            </div>
            ${this.queuedEntries && this.queuedEntries.length > 0
              ? html`
                  <div class="queued-entries">
                    <p>${Translator.get('entry.queued_entries')}</p>
                    <material-button
                      label="${Translator.get('entry.send_now')}"
                      icon="sync"
                      @click="${() => this.syncQueuedEntries()}"
                    ></material-button>
                  </div>
                `
              : ''}
            <div class="previous-submissions-list">
              ${this.previousSubmissions &&
                this.previousSubmissions.map((sub, i) => {
                  const previousSubmission = this.previousSubmissions[i + 1]; // +1 because we're going from latest
                  const symptoms = this.getSymptomsForSubmission(sub);
                  return html`
                    <div class="previous-submission">
                      <div class="previous-submission--data-row">
                        <p class="previous-submission--data-row__date">
                          ${dayjs
                            .utc(sub.timestamp)
                            .local()
                            .format('ddd DD.MM HH:mm')}
                        </p>
                        <p class="previous-submission--data-row__fever">
                          ${previousSubmission && sub.fever_temp
                            ? html`
                                ${previousSubmission.fever_temp === sub.fever_temp
                                  ? html`
                                      <material-icon
                                        class="no-new-trend"
                                        icon="arrow_right_alt"
                                      ></material-icon>
                                    `
                                  : html`
                                      ${previousSubmission.fever_temp > sub.fever_temp
                                        ? html`
                                            <material-icon
                                              class="downward-trend"
                                              icon="call_received"
                                            ></material-icon>
                                          `
                                        : html`
                                            <material-icon
                                              class="upward-trend"
                                              icon="call_made"
                                            ></material-icon>
                                          `}
                                    `}
                              `
                            : ''}
                          ${this.getFeverAmountForSubmission(sub)}
                        </p>
                      </div>
                      <div class="previous-submission--symptom-row">
                        <div class="previous-submission--symptom-row__symptoms">
                          ${symptoms.map(
                            (symp, j) => html`
                              ${symp.hasSymptom
                                ? html`
                                    <p>
                                      ${symp.translation}${j < symptoms.length - 1 ? ', ' : ''}
                                    </p>
                                  `
                                : ''}
                            `,
                          )}
                        </div>
                      </div>
                    </div>
                  `;
                })}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  getGenderTranslated() {
    return this.setGender === 'M'
      ? Translator.get('entry.questions.male').toLowerCase()
      : Translator.get('entry.questions.female').toLowerCase();
  }

  getCovidStatusTranslated() {
    return this.setCovidDiagnosis
      ? Translator.get('a_covid_diagnosis')
      : Translator.get('no_covid_diagnosis');
  }

  getFeverAmountForSubmission(sub) {
    if (sub.fever_status || sub.fever_temp) {
      return html`
        ${sub.fever_temp
          ? `${FeverDataUtil.getFeverWithUnit(false, sub.fever_temp, this.geoCodingInfo)}`
          : '-'}
      `;
    }
    return html`
      <material-icon class="green-text" icon="done"></material-icon>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

if (!customElements.get('fevermap-data-view')) {
  customElements.define('fevermap-data-view', FevermapDataView);
}
