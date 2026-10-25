export const categories = [
  { id: "all", label: "Tümü" },
  { id: "yag", label: "Zeytinyağı" },
  { id: "zeytin", label: "Zeytin" },
  { id: "avokado", label: "Avokado" },
  { id: "limon", label: "Limon" },
];

export const products = [
  { id: 1, cat: "yag", name: "Sızma Zeytinyağı", size: "1 L", price: 640, art: "bottle", v: "green", tag: "Soğuk sıkım" },
  { id: 2, cat: "yag", name: "Erken Hasat", size: "500 ml", price: 420, art: "bottle", v: "amber", tag: "Sınırlı" },
  { id: 3, cat: "zeytin", name: "Gemlik Siyah", size: "500 g", price: 180, art: "olive", v: "black" },
  { id: 4, cat: "zeytin", name: "Yeşil Kırma", size: "500 g", price: 165, art: "olive", v: "green", tag: "Yeni" },
  { id: 5, cat: "avokado", name: "Hass Avokado", size: "4'lü", price: 210, art: "avocado", tag: "Bugün toplandı" },
  { id: 6, cat: "avokado", name: "Fuerte Avokado", size: "1 kg", price: 130, art: "avocadoWhole" },
  { id: 7, cat: "limon", name: "Yafa Limonu", size: "1 kg", price: 70, art: "lemon" },
  { id: 8, cat: "limon", name: "Meyer Limonu", size: "3 kg", price: 150, art: "lemonSlice", tag: "Çok sulu" },
];

export const chapters = [
  { name: "Zeytinyağı", art: "bottle", v: "green", kicker: "Soğuk sıkım", title: "İlk sıkımın tadı.", text: "Ekim’de toplanan zeytinler 6 saat içinde sıkılır. Acı, baharatlı, taze." },
  { name: "Zeytin", art: "olive", v: "green", kicker: "Taş fıçı", title: "Tuz, güneş, sabır.", text: "Dalında olgunlaşan Gemlik’ler 90 gün fıçıda bekler. Katkısız, sadece deniz tuzu." },
  { name: "Avokado", art: "avocado", kicker: "Alanya bahçeleri", title: "Tam kıvamında.", text: "Sabah toplanır, akşam yola çıkar. Kremamsı doku, kolay ayrılan çekirdek." },
  { name: "Limon", art: "lemon", kicker: "Yafa & Meyer", title: "Sıkınca fark eder.", text: "İnce kabuklu, bol sulu limonlar. Sofraya, çaya, her şeye." },
];

export const cities = ["İzmir", "Ankara", "Bursa", "Antalya", "İstanbul", "Muğla", "Eskişehir", "Adana"];
export const buyers = ["Selin K.", "Mert A.", "Deniz Y.", "Ayşe T.", "Can B.", "Zeynep S.", "Kerem D.", "Elif Ç.", "Burak Ö.", "Nil G."];

export const tl = (n) => "₺" + Math.round(n).toLocaleString("tr-TR");
