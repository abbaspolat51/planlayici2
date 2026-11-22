# Planlayıcı 2 (JavaScript / React Native)

Tamamen JavaScript ile yazılmış, telefonda gerçek bir uygulama olarak çalışan planlayıcı.
Aynı kod bilgisayarda tarayıcıda da çalışır. Veriler Firebase'de durur; telefon ve bilgisayar eşitlenir.

İçindekiler: görevler (öncelik renkleri, başlıklar, Günlük İşler), rutin zincirleri, ana takvim,
haftalık saat saat program, yemek/kalori takibi, pomodoro, ders ambarı, para takibi, kitaplar,
telefon bildirimleri, aydınlık/karanlık mod.

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
