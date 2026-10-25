# highanimationwebsite

Zeytinyağı, zeytin, avokado ve limon satan bir online mağaza ve satıcı paneli. Sayfa tek sayfa, koyu ve editoryal bir tasarıma sahip. Animasyonlar halftone (nokta desenli) bir alan motoruyla çalışıyor: imleç üstünde nokta alanı dağılıyor, kaydırdıkça şekiller birbirine dönüşüyor.

## Kullanılan araçlar ve eklentiler

| Araç | Ne için kullanıldı |
| --- | --- |
| [Claude Code](https://claude.com/claude-code) | Projenin tamamı bu araçla, komut satırında yazıldı |
| **UI UX Pro Max** (Claude Code eklentisi, `ui-ux-pro-max` skill'i) | Tasarım sistemi seçimi: stil, renk paleti ve font çifti önerileri, tipografi ve renk aramaları |
| [Motion](https://motion.dev) (`motion` paketi) | Açılış, kaydırma ve hover animasyonları: `animate`, `scroll`, `inView`, `stagger` |
| [Vite](https://vite.dev) | Geliştirme sunucusu ve build |
| Claude in Chrome (tarayıcı eklentisi) | Sayfayı gerçek tarayıcıda açıp animasyonları ve konsolu kontrol etmek |
| Halftone dot-field motoru (`src/halftone.js`) | Canvas üzerinde yay fiziğiyle çalışan nokta alanı. Bir React bileşeninin mantığından esinlenilip React'siz yeniden yazıldı |

Yazı tipleri Google Fonts üzerinden geliyor: Instrument Serif, Inter Tight, JetBrains Mono.

## Tasarım sistemi

- **Stil:** Koyu, editoryal, ince çizgili. Hareketler yavaş ve kontrollü.
- **Palet:** Koyu zemin `#0A0B08`, krem yazı `#ECE7D6`, zeytinyağı altını `#D9A441` tek vurgu rengi.
- **Font çifti:** Instrument Serif (başlıklar) ve Inter Tight (gövde), etiketlerde JetBrains Mono.

## Animasyonlar

- **Hero:** Nokta desenli avokado. Açılışta noktalar toplanıyor, imleç üstünde dağılıyor, tıklayınca şok halkası geçiyor, kaydırdıkça dağılıyor.
- **Koleksiyon:** Kaydırdıkça nokta alanı zeytinyağı, zeytin, avokado ve limon arasında şekil değiştiriyor.
- **Dükkân:** Her ürün kendi nokta alanı. Sepete eklemede şok halkası, kategori sekmesinde kayan çizgi.
- **Süreç:** Kaydırdıkça dolan zeytinyağı şişesi.
- **Satıcı paneli:** Grafikler ve canlı sipariş akışı.
- **Footer:** Dev, noktalardan oluşan "zeytin" yazısı.
- `prefers-reduced-motion` açıksa animasyonlar atlanır.

## Çalıştırma

```bash
npm install
npm run dev
```

Build için `npm run build`.

Not: Ürünler, fiyatlar, şehirler ve sipariş akışı yer tutucu verilerdir.
