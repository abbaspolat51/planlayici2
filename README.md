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
