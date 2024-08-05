import { use } from 'i18next';
import i18nextFsBackend from 'i18next-fs-backend';

export const supportedLanguages = ['en', 'de'];

export async function initTranslation() {
  await use(i18nextFsBackend).init({
    debug: process.argv.includes('--debug-lang') ? true : false,
    defaultNS: 'messages',
    ns: ['commands', 'messages'],
    preload: supportedLanguages,
    fallbackLng: supportedLanguages[0],
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: 'src/structure/locales/{{lng}}_{{ns}}.json',
    },
  });
}
