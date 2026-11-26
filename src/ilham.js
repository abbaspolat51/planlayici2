// Günün ayeti ve hadisi.
// Ayetler: Arapça metin + Diyanet İşleri meali, api.alquran.cloud üzerinden (6236 ayetin tamamından rastgele).
// Hadisler: Arapça metin + Türkçe tercüme, HadeethEnc (Tercüme Edilmiş Hadis Ansiklopedisi) üzerinden; yalnızca sahih ve hasen olanlar.
// İnternet yoksa son gösterilen ayet/hadis, hiç yoksa aşağıdaki küçük yedek liste kullanılır.
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SURELER = ['Fâtiha', 'Bakara', 'Âl-i İmrân', 'Nisâ', 'Mâide', 'En\'âm', 'A\'râf', 'Enfâl', 'Tevbe', 'Yûnus',
  'Hûd', 'Yûsuf', 'Ra\'d', 'İbrâhîm', 'Hicr', 'Nahl', 'İsrâ', 'Kehf', 'Meryem', 'Tâhâ',
  'Enbiyâ', 'Hac', 'Mü\'minûn', 'Nûr', 'Furkân', 'Şuarâ', 'Neml', 'Kasas', 'Ankebût', 'Rûm',
  'Lokmân', 'Secde', 'Ahzâb', 'Sebe\'', 'Fâtır', 'Yâsîn', 'Sâffât', 'Sâd', 'Zümer', 'Mü\'min',
  'Fussılet', 'Şûrâ', 'Zuhruf', 'Duhân', 'Câsiye', 'Ahkâf', 'Muhammed', 'Fetih', 'Hucurât', 'Kâf',
  'Zâriyât', 'Tûr', 'Necm', 'Kamer', 'Rahmân', 'Vâkıa', 'Hadîd', 'Mücâdele', 'Haşr', 'Mümtehine',
  'Saf', 'Cuma', 'Münâfikûn', 'Teğâbün', 'Talâk', 'Tahrîm', 'Mülk', 'Kalem', 'Hâkka', 'Meâric',
  'Nûh', 'Cin', 'Müzzemmil', 'Müddessir', 'Kıyâme', 'İnsân', 'Mürselât', 'Nebe\'', 'Nâziât', 'Abese',
  'Tekvîr', 'İnfitâr', 'Mutaffifîn', 'İnşikâk', 'Bürûc', 'Târık', 'A\'lâ', 'Gâşiye', 'Fecr', 'Beled',
  'Şems', 'Leyl', 'Duhâ', 'İnşirâh', 'Tîn', 'Alak', 'Kadr', 'Beyyine', 'Zilzâl', 'Âdiyât',
  'Kâria', 'Tekâsür', 'Asr', 'Hümeze', 'Fîl', 'Kureyş', 'Mâûn', 'Kevser', 'Kâfirûn', 'Nasr',
  'Tebbet', 'İhlâs', 'Felak', 'Nâs'];

const CACHE = 'pl-ilham';
const TOPLAM_AYET = 6236;
// HadeethEnc ana bölümleri ve yaklaşık hadis sayıları (rastgele seçimi dengelemek için)
const BOLUMLER = [['5', 728], ['3', 436], ['4', 1054], ['7', 173], ['6', 92], ['1', 72], ['2', 10]];

async function getJson(url, ms = 9000) {
  const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const tm = setTimeout(() => ctl && ctl.abort(), ms);
  try {
    const r = await fetch(url, ctl ? { signal: ctl.signal } : undefined);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  } finally { clearTimeout(tm); }
}

const BESMELE = /^بِسْمِ\s+\S+\s+\S+\s+\S+\s*/;
export async function fetchAyet() {
  const n = 1 + Math.floor(Math.random() * TOPLAM_AYET);
  const j = await getJson('https://api.alquran.cloud/v1/ayah/' + n + '/editions/quran-simple,tr.diyanet');
  const [ar, tr] = j.data;
  const sure = ar.surah.number, ayet = ar.numberInSurah;
  let arText = ar.text;
  if (ayet === 1 && sure !== 1 && sure !== 9) arText = arText.replace(BESMELE, '');
  return {
    ar: arText.trim(), tr: tr.text.trim(),
    src: (SURELER[sure - 1] || ar.surah.englishName) + ' ' + sure + ':' + ayet,
    meal: 'Diyanet İşleri meali',
  };
}

export async function fetchHadis() {
  const top = BOLUMLER.reduce((a, b) => a + b[1], 0);
  for (let deneme = 0; deneme < 4; deneme++) {
    let r = Math.random() * top, cat = BOLUMLER[0];
    for (const b of BOLUMLER) { if (r < b[1]) { cat = b; break; } r -= b[1]; }
    const page = 1 + Math.floor(Math.random() * cat[1]);
    const L = await getJson('https://hadeethenc.com/api/v1/hadeeths/list/?language=tr&category_id=' + cat[0] + '&page=' + page + '&per_page=1');
    const id = L && L.data && L.data[0] && L.data[0].id;
    if (!id) continue;
    const h = await getJson('https://hadeethenc.com/api/v1/hadeeths/one/?language=tr&id=' + id);
    const grade = String(h.grade || '');
    if (!/sahih|hasen/i.test(grade) || !h.hadeeth) continue;
    return { ar: String(h.hadeeth_ar || '').trim(), tr: String(h.hadeeth).trim(), src: String(h.attribution || '').trim(), grade, id };
  }
  throw new Error('Uygun hadis bulunamadı');
}

// Yedek: internet yokken
export function fallbackPair() {
  const a = AYETLER[Math.floor(Math.random() * AYETLER.length)];
  const h = HADISLER[Math.floor(Math.random() * HADISLER.length)];
  return {
    ayet: { ar: '', tr: a[0], src: a[1], meal: 'uygulamadaki yedek liste', yedek: true },
    hadis: { ar: '', tr: h[0], src: h[1], grade: '', yedek: true },
  };
}
export async function loadCached() {
  try { const v = await AsyncStorage.getItem(CACHE); return v ? JSON.parse(v) : null; } catch (e) { return null; }
}
export async function saveCached(v) {
  try { await AsyncStorage.setItem(CACHE, JSON.stringify(v)); } catch (e) { /* yok say */ }
}

// Yedek liste (sade Türkçe, anlam olarak). İnternet yokken gösterilir.
export const AYETLER = [
  ['Şüphesiz zorlukla beraber bir kolaylık vardır. Evet, zorlukla beraber bir kolaylık vardır.', 'İnşirâh 94:5–6'],
  ['Allah hiç kimseye gücünün yetmeyeceği bir yük yüklemez.', 'Bakara 2:286'],
  ['Ey iman edenler! Sabır ve namazla yardım dileyin. Şüphesiz Allah sabredenlerle beraberdir.', 'Bakara 2:153'],
  ['Bilin ki kalpler ancak Allah’ı anmakla huzur bulur.', 'Ra‘d 13:28'],
  ['İnsan için ancak çalıştığının karşılığı vardır.', 'Necm 53:39'],
  ['De ki: Rabbim, ilmimi artır.', 'Tâhâ 20:114'],
  ['De ki: Hiç bilenlerle bilmeyenler bir olur mu?', 'Zümer 39:9'],
  ['Bir kere karar verdin mi artık Allah’a dayan. Allah kendisine dayananları sever.', 'Âl-i İmrân 3:159'],
  ['Kim Allah’a dayanırsa, O ona yeter.', 'Talâk 65:3'],
  ['Asra yemin olsun ki insan gerçekten ziyandadır; ancak iman edip iyi işler yapanlar, birbirine hakkı ve sabrı tavsiye edenler başka.', 'Asr 103:1–3'],
  ['Siz beni anın ki ben de sizi anayım. Bana şükredin, nankörlük etmeyin.', 'Bakara 2:152'],
  ['Rabbiniz şöyle buyurdu: Bana dua edin, size karşılık vereyim.', 'Mü’min 40:60'],
  ['Kullarım sana beni sorarlarsa, ben çok yakınım. Bana dua edenin duasına karşılık veririm.', 'Bakara 2:186'],
  ['Kim zerre kadar iyilik yaparsa onu görür. Kim zerre kadar kötülük yaparsa onu görür.', 'Zilzâl 99:7–8'],
  ['Erkek olsun kadın olsun, mümin olarak kim iyi bir iş yaparsa ona mutlaka güzel bir hayat yaşatırız.', 'Nahl 16:97'],
  ['Allah’ın rahmetinden ümit kesmeyin.', 'Yûsuf 12:87'],
  ['De ki: Ey kendi aleyhine haddi aşan kullarım! Allah’ın rahmetinden ümidinizi kesmeyin. Allah bütün günahları bağışlar.', 'Zümer 39:53'],
  ['Bizim yolumuzda gayret gösterenleri elbette yollarımıza ulaştırırız.', 'Ankebût 29:69'],
  ['Nerede olursanız olun, O sizinle beraberdir.', 'Hadîd 57:4'],
  ['Biz insana şah damarından daha yakınız.', 'Kâf 50:16'],
  ['Rahmân’ın kulları yeryüzünde vakarla yürürler; cahiller onlara laf attığında “selâm” deyip geçerler.', 'Furkân 25:63'],
  ['İyiliğin karşılığı ancak iyilik değil midir?', 'Rahmân 55:60'],
  ['Ahiret senin için dünyadan daha hayırlıdır. Rabbin sana verecek, sen de razı olacaksın.', 'Duhâ 93:4–5'],
  ['Allah katında en değerliniz, O’na karşı en saygılı olanınızdır.', 'Hucurât 49:13'],
  ['İyilikte ve takvada yardımlaşın; günahta ve düşmanlıkta yardımlaşmayın.', 'Mâide 5:2'],
  ['Hayırlarda birbirinizle yarışın.', 'Bakara 2:148'],
];

export const HADISLER = [
  ['Ameller ancak niyetlere göredir. Herkese niyet ettiği şey vardır.', 'Buhârî, Müslim'],
  ['Allah sizin dış görünüşünüze ve mallarınıza bakmaz; kalplerinize ve amellerinize bakar.', 'Müslim'],
  ['Sizden biriniz, kendisi için istediğini kardeşi için de istemedikçe gerçek anlamda iman etmiş olmaz.', 'Buhârî, Müslim'],
  ['Güçlü kişi güreşte rakibini yenen değil, öfkelendiğinde kendine hâkim olandır.', 'Buhârî, Müslim'],
  ['Allah’a ve ahiret gününe iman eden ya hayır söylesin ya da sussun.', 'Buhârî, Müslim'],
  ['Kolaylaştırın, zorlaştırmayın; müjdeleyin, nefret ettirmeyin.', 'Buhârî, Müslim'],
  ['Allah’a en sevimli gelen amel, az da olsa devamlı yapılanıdır.', 'Buhârî, Müslim'],
  ['İki nimet vardır ki insanların çoğu onlarda aldanır: sağlık ve boş vakit.', 'Buhârî'],
  ['Müslüman, diğer Müslümanların dilinden ve elinden güvende olduğu kimsedir.', 'Buhârî, Müslim'],
  ['Kim ilim öğrenmek için bir yola girerse, Allah ona cennete giden yolu kolaylaştırır.', 'Müslim'],
  ['Hiçbir iyiliği küçük görme; kardeşini güler yüzle karşılamak bile olsa.', 'Müslim'],
  ['Temizlik imanın yarısıdır.', 'Müslim'],
  ['Müminin durumu ne güzeldir! Her hâli onun için hayırlıdır: Sevince şükreder, bu ona hayır olur; sıkıntıya uğrayınca sabreder, bu da ona hayır olur.', 'Müslim'],
  ['Dünyada bir garip ya da yolcu gibi ol.', 'Buhârî'],
  ['Nerede olursan ol Allah’tan kork. Kötülüğün ardından bir iyilik yap ki onu silsin. İnsanlara güzel ahlakla davran.', 'Tirmizî'],
  ['Güçlü mümin, zayıf müminden daha hayırlıdır. Sana faydalı olana sarıl, Allah’tan yardım iste ve acze düşme.', 'Müslim'],
  ['Kişinin kendisini ilgilendirmeyen şeyi bırakması, Müslümanlığının güzelliğindendir.', 'Tirmizî'],
  ['Sizin en hayırlınız, Kur’an’ı öğrenen ve öğretendir.', 'Buhârî'],
  ['Merhamet etmeyene merhamet edilmez.', 'Buhârî, Müslim'],
  ['Kim bir iyiliğe yol gösterirse, onu yapanın sevabı kadar sevap alır.', 'Müslim'],
  ['Utanma duygusu ancak hayır getirir.', 'Buhârî, Müslim'],
  ['Doğruluk iyiliğe, iyilik de cennete götürür.', 'Buhârî, Müslim'],
  ['Seni şüpheye düşüreni bırak, şüphe vermeyene yönel.', 'Tirmizî, Nesâî'],
  ['Kim bir müminin dünya sıkıntılarından birini giderirse, Allah da kıyamet günü onun sıkıntılarından birini giderir. Kul kardeşine yardım ettikçe Allah da ona yardım eder.', 'Müslim'],
  ['Birbirinizi kıskanmayın, birbirinize kin tutmayın, birbirinize sırt çevirmeyin. Ey Allah’ın kulları, kardeş olun.', 'Buhârî, Müslim'],
  ['Güzel söz sadakadır.', 'Buhârî, Müslim (hadisin bir bölümü)'],
];

