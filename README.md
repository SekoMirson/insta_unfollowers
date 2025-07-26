# Instagram Unfollow Panel

Bu uygulama, Instagram hesabınıza giriş yaparak takip ettiğiniz kişileri otomatik olarak takipten çıkarmanızı sağlar.

## Kurulum

1. Node.js'i bilgisayarınıza kurun (https://nodejs.org/)
2. Proje klasöründe terminal açın ve aşağıdaki komutu çalıştırın:

```bash
npm install
```

## Kullanım

1. Aşağıdaki komutu çalıştırarak sunucuyu başlatın:

```bash
npm start
```

2. Tarayıcınızda `http://localhost:1995` adresine gidin
3. Instagram kullanıcı adı ve şifrenizi girin
4. Takipten çıkarmak istediğiniz kişi sayısını belirtin (boş bırakırsanız tüm takip ettiklerinizi çıkarır)
5. "Unfollow İşlemini Başlat" butonuna tıklayın

## Güvenlik Notları

- Bu uygulama sadece yerel ağda çalışacak şekilde tasarlanmıştır
- Instagram şifreniz sunucuda saklanmaz, sadece Instagram API'sine gönderilir
- Instagram'ın API kullanım politikalarına dikkat edin, çok fazla işlem yapmak hesabınızın kısıtlanmasına neden olabilir

## Teknik Detaylar

- Node.js ve Express.js kullanılarak geliştirilmiştir
- Instagram işlemleri için `instagram-private-api` kütüphanesi kullanılmıştır
- Tüm işlemler log dosyalarına kaydedilir (`logs` klasöründe bulabilirsiniz)
