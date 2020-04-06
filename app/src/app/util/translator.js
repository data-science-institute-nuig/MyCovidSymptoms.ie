/* eslint-disable camelcase */
import Polyglot from 'node-polyglot';

/* Split each translation into a separate file for easier source code management */

import translation_en from '../../assets/language/en.json';
import translation_ga from '../../assets/language/ga.json';
import translation_ar from '../../assets/language/ar.json';

const translations = {
  en: translation_en,
  ar: translation_ar,
  ga: translation_ga,
};

export default class Translator {
  static getLang() {
    return { key: Translator.lang, name: Translator.get('lang_name') };
  }

  static getPossibleLanguages() {
    return Object.keys(translations).map(langKey => ({
      key: langKey,
      name: translations[langKey].lang_name,
    }));
  }

  static setLang(lang) {
    Translator.lang = lang ? lang.toLowerCase() : 'en';
    // Set fallback language based on current language
    Translator.fallback = Translator.lang === 'en' ? null : 'en';
    Translator._loadPhrases();
    document.querySelector('html').setAttribute('lang', lang ? lang.toLowerCase() : 'en');
  }

  static _loadPhrases() {
    Translator.polyglot = new Polyglot({
      phrases: translations,
      onMissingKey: (key, params) => {
        if (!key || !Translator.fallback || key.startsWith(Translator.fallback)) {
          // Return key as last resort if there's no fallback or this is the fallback language
          return key;
        }
        const fallbackKey = Translator.fallback + key.substr(key.indexOf('.'));
        return Translator.polyglot.t(fallbackKey, params);
      },
    });
  }

  static get(word, params) {
    if (!Translator.polyglot) {
      Translator.setLang('en');
    }
    return Translator.polyglot.t(`${this.lang}.${word}`, params);
  }
}
