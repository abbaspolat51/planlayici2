// Uygulamadaki diller. Yeni dil eklemek için: veri dosyası + buraya bir satır.
import { makeLang } from './core';
import * as EN from '../english/data';
import * as DE from '../german/data';

export const LANGS = {
  eng: makeLang({
    key: 'eng', sys: 'eng', route: 'ingilizce', name: 'İngilizce', flag: '🇬🇧', color: '#2F63D9', colorDark: '#8CB0FF',
    tts: 'en-GB', routineName: 'İngilizce: günün dersi', stripS: true, data: EN,
  }),
  deu: makeLang({
    key: 'deu', sys: 'deu', route: 'almanca', name: 'Almanca', flag: '🇩🇪', color: '#C0392B', colorDark: '#FF8A7A',
    tts: 'de-DE', routineName: 'Almanca: günün dersi', stripS: false, data: DE,
  }),
};
export const LANG_LIST = [LANGS.eng, LANGS.deu];
export const langByRoute = (r) => LANG_LIST.find((L) => L.route === r);
