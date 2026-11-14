
(function () {
  "use strict";

  const surahList = document.getElementById("surah-list");
  const readerSelect = document.getElementById("quran-reader");

  if (!surahList) return;

  // القراء
  const readers = {
    mishary: "ar.alafasy",
    husary: "ar.husary",
    abdulbasit: "ar.abdulbasitmurattal",
    sudais: "ar.abdurrahmaansudais"
  };

  // أسماء سور القرآن الكريم - 114 سورة
  const surahNames = [
    "الفاتحة","البقرة","آل عمران","النساء","المائدة",
    "الأنعام","الأعراف","الأنفال","التوبة","يونس",
    "هود","يوسف","الرعد","إبراهيم","الحجر",
    "النحل","الإسراء","الكهف","مريم","طه",
    "الأنبياء","الحج","المؤمنون","النور","الفرقان",
    "الشعراء","النمل","القصص","العنكبوت","الروم",
    "لقمان","السجدة","الأحزاب","سبأ","فاطر",
    "يس","الصافات","ص","الزمر","غافر",
    "فصلت","الشورى","الزخرف","الدخان","الجاثية",
    "الأحقاف","محمد","الفتح","الحجرات","ق",
    "الذاريات","الطور","النجم","القمر","الرحمن",
    "الواقعة","الحديد","المجادلة","الحشر","الممتحنة",
    "الصف","الجمعة","المنافقون","التغابن","الطلاق",
    "التحريم","الملك","القلم","الحاقة","المعارج",
    "نوح","الجن","المزمل","المدثر","القيامة",
    "الإنسان","المرسلات","النبأ","النازعات","عبس",
    "التكوير","الانفطار","المطففين","الانشقاق","البروج",
    "الطارق","الأعلى","الغاشية","الفجر","البلد",
    "الشمس","الليل","الضحى","الشرح","التين",
    "العلق","القدر","البينة","الزلزلة","العاديات",
    "القارعة","التكاثر","العصر","الهمزة","الفيل",
    "قريش","الماعون","الكوثر","الكافرون","النصر",
    "المسد","الإخلاص","الفلق","الناس"
  ];

  const audio = new Audio();
  audio.preload = "none";

  let currentAyahs = [];
  let currentAyahIndex = 0;
  let playRequest = 0;

  let status = document.createElement("p");
  status.id = "quran-status";
  status.style.cssText =
    "text-align:center;padding:10px;color:#E5B85C;";

  surahList.innerHTML = "";
  surahList.appendChild(status);

  // عرض السور بدون الحاجة للإنترنت
  function showSurahs() {
    surahList.innerHTML = "";

    const heading = document.createElement("p");
    heading.textContent = "القرآن الكريم كاملاً - 114 سورة";
    heading.style.cssText =
      "color:#E5B85C;text-align:center;margin-bottom:15px;";

    surahList.appendChild(heading);

    surahNames.forEach(function (name, index) {
      const number = index + 1;

      const card = document.createElement("div");
      card.className = "surah-item";

      const info = document.createElement("div");

      const title = document.createElement("strong");
      title.textContent = number + ". سورة " + name;

      const details = document.createElement("small");
      details.textContent = "اضغط للاستماع";

      info.appendChild(title);
      info.appendChild(document.createElement("br"));
      info.appendChild(details);

      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "▶ استماع";

      button.addEventListener("click", function () {
        playSurah(number, button);
      });

      card.appendChild(info);
      card.appendChild(button);

      surahList.appendChild(card);
    });
  }

  // اختيار القارئ
  function getReader() {
    const selected = readerSelect
      ? readerSelect.value
      : "mishary";

    return readers[selected] || readers.mishary;
  }

  // تشغيل السورة
  async function playSurah(surahNumber, button) {
    const requestId = ++playRequest;

    audio.pause();
    audio.removeAttribute("src");

    currentAyahs = [];
    currentAyahIndex = 0;

    status.textContent =
      "جاري تحميل سورة " + surahNames[surahNumber - 1] + "...";

    try {
      const edition = getReader();

      const url =
        "https://api.alquran.cloud/v1/surah/" +
        surahNumber + "/" + edition;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("فشل الاتصال بخادم القرآن");
      }

      const result = await response.json();

      if (
        requestId !== playRequest ||
        result.code !== 200 ||
        !result.data ||
        !Array.isArray(result.data.ayahs)
      ) {
        return;
      }

      currentAyahs = result.data.ayahs;

      if (!currentAyahs.length) {
        throw new Error("لا توجد آيات صوتية");
      }

      status.textContent =
        "🎧 الآن تستمع إلى سورة " +
        surahNames[surahNumber - 1];

      playCurrentAyah(requestId);

    } catch (error) {
      if (requestId !== playRequest) return;

      console.error("Quran error:", error);

      status.textContent =
        "تعذر تحميل الصوت. حاول مرة أخرى أو اختر قارئاً آخر.";
    }
  }

  // تشغيل الآيات بالتتابع
  function playCurrentAyah(requestId) {
    if (requestId !== playRequest) return;

    if (currentAyahIndex >= currentAyahs.length) {
      status.textContent = "انتهت السورة، تقبل الله منك 🤍";
      currentAyahs = [];
      return;
    }

    const ayah = currentAyahs[currentAyahIndex];

    if (!ayah || !ayah.audio) {
      currentAyahIndex++;
      playCurrentAyah(requestId);
      return;
    }

    audio.src = ayah.audio;

    audio.play().catch(function (error) {
      if (requestId !== playRequest) return;

      console.error("Audio error:", error);

      status.textContent =
        "تعذر تشغيل الصوت. تحقق من اتصال الإنترنت.";
    });
  }

  // الانتقال للآية التالية بعد انتهاء الحالية
  audio.addEventListener("ended", function () {
    if (!currentAyahs.length) return;

    currentAyahIndex++;
    playCurrentAyah(playRequest);
  });

  audio.addEventListener("error", function () {
    if (!currentAyahs.length) return;

    status.textContent = "حدث خطأ في تحميل الآية الصوتية.";
  });

  // إيقاف الصوت عند مغادرة صفحة القرآن
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      audio.pause();
    }
  });

  // إظهار السور فوراً
  showSurahs();

  console.log("Yaqeen Quran loaded successfully - 114 Surahs");

})();
