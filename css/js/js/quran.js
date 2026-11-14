
(function () {
  "use strict";

  const API = "https://mp3quran.net/api/v3";
  const $ = id => document.getElementById(id);

  let surahs = [];
  let reciters = [];
  let audio;
  let selectedSurah = 1;

  const wantedReaders = [
    { name: "مشاري راشد العفاسي", keys: ["مشاري", "العفاسي"] },
    { name: "محمود خليل الحصري", keys: ["الحصري"] },
    { name: "محمد صديق المنشاوي", keys: ["المنشاوي"] },
    { name: "محمد محمود الطبلاوي", keys: ["الطبلاوي"] }
  ];

  function normalize(value) {
    return (value || "")
      .replace(/[\u064B-\u065F\u0670]/g, "")
      .replace(/[أإآ]/g, "ا")
      .trim();
  }

  async function getData(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error("فشل تحميل البيانات");
    return response.json();
  }

  function setupPlayer() {
    const list = $("surah-list");

    audio = document.createElement("audio");
    audio.controls = true;
    audio.preload = "none";
    audio.style.width = "100%";

    const status = document.createElement("p");
    status.id = "quran-status";
    status.style.cssText =
      "color:#E5B85C;margin:12px 0;line-height:1.8";

    list.parentElement.insertBefore(audio, list);
    list.parentElement.insertBefore(status, list);

    audio.addEventListener("playing", () => {
      status.textContent = "التلاوة تعمل الآن بإذن الله.";
    });

    audio.addEventListener("error", () => {
      status.textContent =
        "تعذر تحميل ملف السورة. جرّب قارئاً آخر.";
    });

    audio.addEventListener("ended", () => {
      status.textContent = "انتهت السورة.";
    });
  }

  function loadReaders(data) {
    const select = $("quran-reader");
    select.innerHTML = "";

    reciters = [];

    wantedReaders.forEach(wanted => {
      const reader = (data.reciters || []).find(r => {
        const name = normalize(r.name);
        return wanted.keys.some(key =>
          name.includes(normalize(key))
        );
      });

      if (!reader) return;

      const moshaf = (reader.moshaf || [])
        .filter(m => m.server && m.surah_list)
        .sort((a, b) =>
          (b.surah_total || 0) - (a.surah_total || 0)
        )[0];

      if (!moshaf) return;

      reciters.push({
        name: reader.name,
        server: moshaf.server,
        surahs: moshaf.surah_list.split(",").map(Number)
      });

      const option = document.createElement("option");
      option.value = reciters.length - 1;
      option.textContent = wanted.name;
      select.appendChild(option);
    });

    if (!reciters.length) {
      throw new Error("لم يتم العثور على القراء المطلوبين");
    }
  }

  function renderSurahs() {
    const list = $("surah-list");
    list.innerHTML = "";

    surahs.forEach(surah => {
      const card = document.createElement("div");
      card.className = "surah-item";

      card.style.cssText =
        "padding:12px;margin:8px 0;border:1px solid #E5B85C55;border-radius:12px;display:flex;justify-content:space-between;align-items:center;gap:8px;background:#111923;color:#E7EEF2";

      const title = document.createElement("span");
      title.textContent = surah.id + " - " + surah.name;

      const button = document.createElement("button");
      button.textContent = "▶ استماع";
      button.style.cssText =
        "background:#E5B85C;color:#080B10;border:0;border-radius:9px;padding:9px 13px";

      button.onclick = () => playSurah(surah.id);

      card.appendChild(title);
      card.appendChild(button);
      list.appendChild(card);
    });
  }

  async function playSurah(id) {
    const reader = reciters[Number($("quran-reader").value)];

    if (!reader) return;

    if (!reader.surahs.includes(Number(id))) {
      $("quran-status").textContent =
        "هذه السورة غير متاحة لهذا القارئ.";
      return;
    }

    selectedSurah = Number(id);

    const url =
      reader.server.replace(/\/?$/, "/") +
      String(selectedSurah).padStart(3, "0") +
      ".mp3";

    audio.pause();
    audio.src = url;
    audio.load();

    $("quran-status").textContent =
      "جارٍ تشغيل السورة كاملة...";

    try {
      await audio.play();
    } catch (error) {
      $("quran-status").textContent =
        "اضغط زر التشغيل في مشغل الصوت لبدء التلاوة.";
    }
  }

  async function init() {
    if (!$("quran-reader") || !$("surah-list")) return;

    try {
      $("surah-list").textContent =
        "جارٍ تحميل السور والقراء...";

      setupPlayer();

      const [s, r] = await Promise.all([
        getData(API + "/suwar?language=ar"),
        getData(API + "/reciters?language=ar")
      ]);

      surahs = s.suwar || [];

      if (!surahs.length) throw new Error("لا توجد سور");

      loadReaders(r);
      renderSurahs();

      $("quran-status").textContent =
        "اختر القارئ والسورة للاستماع إلى التلاوة الكاملة.";

    } catch (error) {
      console.error("Quran error:", error);

      $("quran-status").textContent =
        "تعذر تحميل القرآن والقراء. حاول تحديث الصفحة.";
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
