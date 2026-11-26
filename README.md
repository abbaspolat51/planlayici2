# Planlayıcı 2 (JavaScript / React Native)

Tamamen JavaScript ile yazılmış, telefonda gerçek bir uygulama olarak çalışan planlayıcı.
Aynı kod bilgisayarda tarayıcıda da çalışır. Veriler Firebase'de durur; telefon ve bilgisayar eşitlenir.

İçindekiler: görevler (öncelik renkleri, başlıklar, Günlük İşler), rutin zincirleri, ana takvim,
haftalık saat saat program, yemek/kalori takibi, pomodoro (zil + titreşim), ders ambarı, para takibi,
kitaplar, telefon takvimi bağlantısı, gruplar (yarış, öğretmen–öğrenci, birlikte pomodoro),
seçilebilir temalar (Klasik, Yumuşak, Okyanus), profil ve ayarlar, telefon bildirimleri.

Kurulum bir kerelik, yaklaşık 20 dakika sürer.

---

## 1. Firebase kurulumu (ücretsiz)

1. https://console.firebase.google.com adresine Google hesabınla gir → **Proje ekle** →
   bir ad ver (örn. `planlayici`) → Google Analytics'i kapatabilirsin → **Proje oluştur**.
2. Sol menüde **Derleme (Build) → Authentication → Başlayın** →
   **E-posta/Şifre**'yi seç → ilk anahtarı aç → **Kaydet**.
3. Sol menüde **Derleme → Firestore Database → Veritabanı oluştur** →
   konum olarak `eur3 (europe-west)` → **Üretim modunda başlat** → **Oluştur**.
   Sonra **Kurallar (Rules)** sekmesine geç, oradaki her şeyi sil, bu klasördeki
   `firestore.rules` dosyasının içeriğini yapıştır → **Yayınla**.
4. Sol üstteki dişli → **Proje ayarları** → aşağıda **Uygulamalarınız** → web simgesi (`</>`) →
   bir ad yaz → **Uygulamayı kaydet**. Ekranda `firebaseConfig` değerleri görünecek
   (apiKey, authDomain, projectId…). Bu sayfayı açık bırak.

## 2. GitHub'a yükleme

1. github.com'da **New repository** → ad: `planlayici2` → **Public** seç
   (bilgisayar sürümü için gerekli; verilerin yine sadece sana açık, Firebase kuralları koruyor) → **Create**.
2. **uploading an existing file** bağlantısına tıkla, bu klasörün *içindeki her şeyi* sürükle → **Commit changes**.
   (Actions sekmesinde iş görünmezse gizli `.github` klasörü yüklenmemiştir: **Add file → Create new file**
   ile `.github/workflows/android.yml` ve `.github/workflows/web.yml` dosyalarını oluşturup içeriklerini yapıştır.)
3. Depoda `firebaseConfig.js` dosyasına tıkla → kalem simgesi (Edit) → 1. bölümün 4. adımındaki değerleri
   tırnak içlerine yapıştır → **Commit changes**.
4. **Settings → Pages → Source: GitHub Actions** seç (bilgisayar sürümü için).

## 3. Uygulamayı kurma

- **Telefon:** Actions sekmesinde "Android APK" işi bitince (ilk sefer 20–30 dk) deponun
  **Releases → Planlayıcı (son sürüm)** sayfasından `Planlayici.apk`'yı telefondan indirip kur.
  İlk açılışta **Yeni hesap oluştur** ile e-posta ve şifre belirle, bildirim iznine **İzin ver** de.
- **Bilgisayar:** "Bilgisayar sürümü (web)" işi bitince `https://KULLANICI-ADIN.github.io/planlayici2/`
  adresini aç, aynı e-posta ve şifreyle giriş yap. Tarayıcıda "Yer işaretlerine ekle" ile kaydet.

Eski Planlayıcı uygulaması ayrı bir uygulama olarak kalır; yenisi çalışınca onu kaldırabilirsin.

## 4. Eski verileri taşıma

Eski planlayıcı sayfasının ana sayfasının en altındaki **Verilerini dışa aktar** düğmesine bas
(metin panoya kopyalanır). Yeni uygulamada **Ana sayfa → Ayarlar → Eski planlayıcıdan veri aktar**
kutusuna yapıştırıp **Aktar**'a bas.

## Sürüm 2.1 güncellemesi (bir kerelik)

1. **Firestore kuralları:** Firebase → Firestore Database → Kurallar → `firestore.rules` dosyasının
   yeni içeriğini yapıştır → Yayınla. (Gruplar için gerekli.)
2. **İş akışları:** `.github/workflows/android.yml` ve `web.yml` içindeki "Paketleri kur" adımı artık
   `npm run paketler` çalıştırıyor. Bundan sonra yeni paket eklemek için yalnızca `package.json` değişir.
3. Telefonda ilk açılışta **takvim iznine** "İzin ver" de.

## Günün ayeti ve hadisi nereden geliyor?

- **Ayetler:** Kur'an'ın 6236 ayetinden rastgele; Arapça metin ve **Diyanet İşleri meali**, [api.alquran.cloud](https://alquran.cloud) üzerinden.
- **Hadisler:** Arapça metin ve Türkçe tercümesiyle, kaynak kitabı ve sıhhat derecesi (yalnızca sahih ve hasen) ile
  [HadeethEnc – Tercüme Edilmiş Hadis Ansiklopedisi](https://hadeethenc.com) üzerinden.
- İnternet yoksa en son gösterilen ayet ve hadis, hiç yoksa uygulamanın içindeki küçük yedek liste görünür.

## Bilgisayar uygulaması (Windows)

`desktop/` klasörü Planlayıcı'yı Windows'ta kendi penceresinde açan küçük bir masaüstü uygulamasıdır.
GitHub'da **"Bilgisayar uygulaması (Windows)"** işi kurulum dosyasını derler ve **Releases → Planlayıcı masaüstü (Windows)**
sayfasına `Planlayici-Kurulum.exe` olarak koyar. Bir kez kurman yeter: içerik web sürümünden geldiği için
GitHub'a yüklediğin her güncelleme masaüstü uygulamasına da kendiliğinden yansır.
Kısayollar: F5 yenile, F11 tam ekran, Ctrl + / Ctrl - yakınlaştır.

## Sürüm 2.4: İngilizce kelime dersleri

Menüde yeni bir **İngilizce** bölümü var. Her gün bir ders açılır: A1, A2, B1, B2, C1 ve C2 olmak üzere 6 seviye var, her seviyede 40 metin (toplam 240 ders, yaklaşık 2.600 kelime).

- **Bağlantılı konular:** Metinler, mühendislik öğrencisi Deniz'in hikâyesini anlatır. A1'de üniversite ve aile var. A2'de Londra'da dil kursu, B1'de staj ve proje, B2'de mezuniyet ve yurt dışında yüksek lisans. C1'de araştırma ve girişim, C2'de mühendislik etiği ve olgunluk yılları anlatılır.
- **Seviye seviye kelime:** Her metin yalnızca önceki derslerde öğrenilen kelimeleri ve o günün yeni kelimelerini kullanır. Bu kural 240 metnin tamamında otomatik olarak denetlendi.
- **Ders akışı:**
  1. Metindeki yeni kelimeler, anlamlarıyla birlikte
  2. Metin: bir kelimeye dokununca anlamı altında açılır, yeni kelimeler altı çizili görünür; metni sesli de dinleyebilirsin
  3. Kelime kartları (dokunarak çevrilir)
  4. Kısa sınav: 4 seçenekli; yanlış cevaplanan soru sona eklenir
- **Tekrar:** Bitirdiğin kelimeler 1, 2, 4, 8, 16 ve 32 gün arayla tekrar kartı olarak geri gelir. Bildiğin kelime daha seyrek, bilemediğin kelime daha sık gelir.
- **Kelime defteri:** Öğrendiğin tüm kelimeleri seviyeye göre listeler, arama yapmanı sağlar.
- **Aç / kapat düğmesi:** İngilizce ekranında ve **Rutinler** ekranının üstünde **Günlük İngilizce görevi** düğmesi var.
  - Açınca rutinlerine "İngilizce: günün dersi" eklenir ve dersi bitirdiğin gün zincir kendiliğinden işaretlenir.
  - Kapatınca rutin kalkar ama zincirin saklanır; yeniden açınca geri gelir.
  - İstersen bir hatırlatma saati de koyabilirsin.
- Bölümü tamamen gizlemek için Ayarlar'da **Bölümleri aç / kapat**'ı kullan. Ana ekran kartı için de **Ana ekranda görünenler**'deki "Günün İngilizce dersi" ayarı var.

Sesli okuma için `expo-speech` paketi eklendi; GitHub derlemesi onu kendiliğinden kurar. Bu sürümde yeni APK'yı bir kez kurman gerekir.

Metinleri ve sözlüğü değiştirmek istersen kaynaklar `eng/content` klasöründe:
- `A1.txt` … `C2.txt`: metinler
- `dict.txt`: Türkçe anlamlar
- `names.txt`: özel adlar

Değişiklikten sonra `node eng/build.js --write src/english/data.js` komutu uygulama verisini yeniden üretir.

## Sürüm 2.3'te neler var

- **Yeni konsept "Nişan – hedefe odaklan":** gece mavisi/petrol yeşili, altın ve mercan renkler; ana sayfada hedef halkalı
  karşılama alanı (selamlama, bugünkü ilerleme, çalışma süresi, öndeki hedef), hızlı işlem düğmeleri, her bölümün kendi rengi,
  yüzen alt menü. Üst sağdaki güneş/ay düğmesiyle tek dokunuşta açık–koyu mod.
- **Açık (pastel) renk paletleri:** Pudra, Lavanta, Nane, Gökyüzü, Şeftali, Limon.
- **Ekip görevleri:** ekipte herkes birbirine görev verebilir (öğretmen–öğrencide yalnızca öğretmen); yeni görev panosu
  ve ana sayfada "Grup görevleri". Yeni uygulama simgesi: yay ve ok.

## Sürüm 2.2'de neler var

- **Yeni sade arayüz:** telefonda alt menü çubuğu (Bugün, Görevler, Hedefler, Çalışma, Menü), bilgisayarda sol menü.
  Tik kutularının hepsi açma–kapama düğmesi (switch) oldu.
- **Günün ayeti ve hadisi:** ana sayfanın en üstünde; karıştır düğmesiyle yenisi gelir.
- **Hedefler:** haftalık, aylık, yıllık hedefler; her hedef bir pil gibi dolar. Saat hedefleri pomodoro ile
  otomatik sayılır (örn. “C1 İngilizce, yıllık 800 saat”: Çalışma'da “C1 İngilizce”yi seçip çalıştıkça pil dolar).
- **Gruplar:** Grup çalışması, Öğretmen–öğrenci ve yeni **Ekip–lider**. Görevler ve Çalışma sayfalarında
  “Birlikte çalış” kartından rolünü seçersin. Atanan görevler bildirim olarak gider ve takvime işlenir;
  ekipte herkes birbirinin bugünkü/haftalık çalışma saatini ve şu an çalışıp çalışmadığını görür.
- **Temalar:** Sade, Klasik, Yumuşak, Okyanus, Orman, Gece mavisi; her birinin içinde 8 renk paleti.
- **Bölümleri aç / kapat:** Ayarlar'da kullanmadığın bölümü (örn. Yemek takibi) kapatabilirsin.

Bu sürüm için Firebase kurallarını değiştirmen gerekmez.

## Anlık bildirim (gruplar için, isteğe bağlı)

Öğretmen ya da ekip lideri görev atadığında ya da grupta birlikte çalışma başladığında, uygulama kapalıyken de
anında bildirim gelmesi için:

1. https://expo.dev adresinde ücretsiz hesap aç.
2. **Projects → Create a project**: ad `planlayici`. Açılan sayfadaki **Project ID**'yi kopyala.
3. GitHub'da `push.json` dosyasını düzenle: `projectId` ve `owner` (Expo kullanıcı adın) değerlerini yaz.
4. Firebase → Proje ayarları → **Uygulama ekle → Android** → paket adı `com.planlayici.mobil` →
   **Uygulamayı kaydet** → `google-services.json` dosyasını indir → GitHub'da deponun ana klasörüne yükle.
5. Firebase → Proje ayarları → **Hizmet hesapları → Yeni özel anahtar oluştur** → bir JSON dosyası iner.
   **Bu dosya gizlidir, GitHub'a yükleme.**
6. expo.dev → `planlayici` projesi → **Credentials → Android** → uygulama kimliği `com.planlayici.mobil` →
   **FCM V1 service account key** → 5. adımdaki dosyayı yükle.
7. Yeni APK derlenince kur. Profil → "Anlık bildirim" kartında **Kurulu** yazmalı.

Kurulmazsa da her şey çalışır; grup bildirimleri yalnızca uygulama açıkken gelir.

## Telefon takvimi

- Telefon takvimindeki etkinlikler (ve hatırlatıcıları) **Görevler → Telefon Takvimi** altına gelir,
  bilgisayarda da görünür. Takvim uygulamasında değiştirince burada da güncellenir.
- Görevlerin son günleri ve haftalık program telefonda **Planlayıcı** adlı ayrı bir takvime yazılır.
- Profil → Telefon takvimi kartından hangi takvimlerin alınacağını ve yönleri seçebilirsin.

## Bildirimler

- Göreve, rutine ya da haftalık programa saat eklediğinde telefon önümüzdeki 14 günün hatırlatmalarını kurar.
  Uygulama kapalıyken de gelir. Pomodoro bitince de bildirim gelir.
- Bilgisayardan eklediğin yeni hatırlatmalar, telefonda uygulamayı bir kez açtığında kurulur.
- Samsung'da gecikirse: Ayarlar → Uygulamalar → Planlayıcı → Pil → **Kısıtlanmamış**.

## Ders ambarı

PDF'ler eklendiği cihazda saklanır (telefona eklenen telefonda açılır). Her iki yerde de açmak
istediklerini Google Drive bağlantısı olarak ekle.

## Bir şey bozulursa

Actions sekmesinde kırmızı çarpılı işe tıkla, hatalı adımın son satırlarının ekran görüntüsünü al
ve Claude'a gönder.

## Geliştirme (isteğe bağlı)

```
npm install --legacy-peer-deps
npx expo start
```
