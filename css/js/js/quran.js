
(function () {
  "use strict";

  const surahList = document.getElementById("surah-list");
  const readerSelect = document.getElementById("quran-reader");

  // أسماء السور محفوظة داخل التطبيق وتظهر بدون إنترنت
  const surahNames = [
    "الفاتحة", "البقرة", "آل عمران", "النساء",
    "المائدة", "الأنعام", "الأعراف", "الأنفال",
    "التوبة", "يونس", "هود", "يوسف",
    "الرعد", "إبراهيم", "الحجر", "النحل",
    "الإسراء", "الكهف", "مريم", "طه",
    "الأنبياء", "الحج", "المؤمنون", "النور",
    "الفرقان", "الشعراء", "النمل", "القصص",
    "العنكبوت", "الروم", "لقمان", "السجدة",
    "الأحزاب", "سبأ", "فاطر", "يس",
    "الصافات", "ص", "الزمر", "غافر",
    "فصلت", "الشورى", "الزخرف", "الدخان",
    "الجاثية", "الأحقاف", "محمد", "الفتح",
    "الحجرات", "ق", "الذاريات", "الطور",
    "النجم", "القمر", "الرحمن", "الواقعة",
    "الحديد", "المجادلة", "الحشر", "الممتحنة",
    "الصف", "الجمعة", "المنافقون", "التغابن",
    "الطلاق", "التحريم", "الملك", "القلم",
    "الحاقة", "المعارج", "نوح", "الجن",
    "المزمل", "المدثر", "القيامة", "الإنسان",
    "المرسلات", "النبأ", "النازعات", "عبس",
    "التكوير", "الانفطار", "المطففين", "الانشقاق",
    "البروج", "الطارق", "الأعلى", "الغاشية",
    "الفجر", "البلد", "الشمس", "الليل",
    "الضحى", "الشرح", "التين", "العلق",
    "القدر", "البينة", "الزلزلة", "العاديات",
    "القارعة", "التكاثر", "العصر", "الهمزة",
    "الفيل", "قريش", "الماعون", "الكوثر",
    "الكافرون", "النصر", "المسد", "الإخلاص",
    "الفلق", "الناس"
  ];

  // معرفات القراء في خدمة الصوت
  const readers = {
    mishary: "ar.alafasy",
    husary: "ar.husary",
    abdulbasit: "ar.abdulbasitmurattal",
    sudais: "ar.abdurrahmaansudais"
  };

  const audio = new Audio();
  audio.preload = "none";

  let currentAyahs = [];
  let currentAyahIndex = 0;
  let playRequest = 0;

  // عرض السور الـ114 بدون الحاجة للإنترنت
  function loadSurahs() {
    if (!surahList) {
      console.error("لم يتم العثور على العنصر surah-list");
      return;
    }

    surahList.innerHTML = "";

    surahNames.forEach(function (name, index) {
      const surahNumber = index + 1;

      const card = document.createElement("div");
      card.className = "surah-item";

      const info = document.createElement("div");

      const title = document.createElement("strong");
      title.textContent = surahNumber + ". سورة " + name;

      info.appendChild(title);

      const playButton = document.createElement("button");
      playButton.type = "button";
      playButton.textContent = "▶ استماع";

      playButton.addEventListener("click", function () {
        playSurah(surahNumber);
      });

      card.appendChild(info);
      card.appendChild(playButton);

      surahList.appendChild(card);
    });
  }

  // إيقاف التشغيل الحالي
  function stopAudio() {
    playRequest++;
    currentAyahs = [];
    currentAyahIndex = 0;

    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  }

  // تشغيل السورة بالقارئ المختار
  async function playSurah(surahNumber) {
    const requestId = ++playRequest;

    currentAyahs = [];
    currentAyahIndex = 0;

    audio.pause();
    audio.removeAttribute("src");

    const reader = readerSelect
      ? readerSelect.value
      : "mishary";

    const edition = readers[reader] || readers.mishary;

    try {
      const response = await fetch(
        "https://api.alquran.cloud/v1/surah/" +
        surahNumber + "/" + edition
      );

      if (!response.ok) {
        throw new Error("تعذر تحميل صوت القارئ");
      }

      const result = await response.json();

      // تجاهل أي طلب قديم
      if (requestId !== playRequest) return;

      if (
        result.code !== 200 ||
        !result.data ||
        !Array.isArray(result.data.ayahs)
      ) {
        throw new Error("بيانات السورة غير متاحة");
      }

      currentAyahs = result.data.ayahs;

      if (currentAyahs.length === 0) {
        throw new Error("السورة لا تحتوي على آيات صوتية");
      }

      playCurrentAyah(requestId);

    } catch (error) {
      if (requestId !== playRequest) return;

      console.error("Quran audio error:", error);

      alert(
        "تعذر تشغيل السورة. تأكد من الإنترنت أو جرّب قارئًا آخر."
      );
    }
  }

  // تشغيل الآيات بالترتيب
  function playCurrentAyah(requestId) {
    if (requestId !== playRequest) return;

    // تخطي الآيات التي لا يتوفر لها رابط صوتي
    while (
      currentAyahIndex < currentAyahs.length &&
      !currentAyahs[currentAyahIndex].audio
    ) {
      currentAyahIndex++;
    }

    // انتهت السورة
    if (currentAyahIndex >= currentAyahs.length) {
      currentAyahs = [];
      currentAyahIndex = 0;
      return;
    }

    const ayah = currentAyahs[currentAyahIndex];

    audio.src = ayah.audio;
    audio.load();

    audio.play().catch(function (error) {
      if (requestId !== playRequest) return;

      console.error("Audio playback error:", error);

      stopAudio();

      alert(
        "تعذر تشغيل الصوت. تأكد من اتصال الإنترنت ثم حاول مرة أخرى."
      );
    });
  }

  // الانتقال للآية التالية تلقائيًا
  audio.addEventListener("ended", function () {
    if (currentAyahs.length === 0) return;

    currentAyahIndex++;

    playCurrentAyah(playRequest);
  });

  // إظهار أسماء السور فور تشغيل الملف
  loadSurahs();

})();
