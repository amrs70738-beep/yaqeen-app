
(function () {
  "use strict";

  const surahs = [
    "الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة",
    "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس",
    "هود", "يوسف", "الرعد", "إبراهيم", "الحجر",
    "النحل", "الإسراء", "الكهف", "مريم", "طه",
    "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان",
    "الشعراء", "النمل", "القصص", "العنكبوت", "الروم",
    "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر",
    "يس", "الصافات", "ص", "الزمر", "غافر",
    "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية",
    "الأحقاف", "محمد", "الفتح", "الحجرات", "ق",
    "الذاريات", "الطور", "النجم", "القمر", "الرحمن",
    "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة",
    "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق",
    "التحريم", "الملك", "القلم", "الحاقة", "المعارج",
    "نوح", "الجن", "المزمل", "المدثر", "القيامة",
    "الإنسان", "المرسلات", "النبأ", "النازعات", "عبس",
    "التكوير", "الانفطار", "المطففين", "الانشقاق", "البروج",
    "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد",
    "الشمس", "الليل", "الضحى", "الشرح", "التين",
    "العلق", "القدر", "البينة", "الزلزلة", "العاديات",
    "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل",
    "قريش", "الماعون", "الكوثر", "الكافرون", "النصر",
    "المسد", "الإخلاص", "الفلق", "الناس"
  ];

  const readers = {
    mishary: "ar.alafasy",
    husary: "ar.husary",
    abdulbasit: "ar.abdulbasit",
    sudais: "ar.abdurrahmaansudais"
  };

  const list = document.getElementById("surah-list");
  const reader = document.getElementById("quran-reader");

  if (!list || !reader) {
    console.error("Quran elements not found");
    return;
  }

  let audio = new Audio();
  let currentAyahs = [];
  let currentAyahIndex = 0;
  let selectedReader = "mishary";
  let playRequest = 0;

  function showMessage(message) {
    reader.innerHTML = `<p>${message}</p>`;
  }

  function loadSurahs() {
    list.innerHTML = "";

    surahs.forEach((name, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "surah-item";
      button.textContent = `${index + 1} - سورة ${name}`;

      button.addEventListener("click", function () {
        loadSurah(index + 1, name);
      });

      list.appendChild(button);
    });

    console.log("Yaqeen Quran loaded successfully - 114 Surahs");
  }

  async function loadSurah(number, name) {
    stopAudio();
    showMessage("جاري تحميل سورة " + name + "...");

    try {
      const response = await fetch(
        `https://api.alquran.cloud/v1/surah/${number}`
      );

      if (!response.ok) throw new Error("Network error");

      const data = await response.json();

      if (!data.data || !data.data.ayahs) {
        throw new Error("Surah data unavailable");
      }

      currentAyahs = data.data.ayahs;

      reader.innerHTML = "";

      const heading = document.createElement("h2");
      heading.textContent = "سورة " + name;
      reader.appendChild(heading);

      const text = document.createElement("div");
      text.className = "ayahs-text";

      currentAyahs.forEach((ayah) => {
        const span = document.createElement("span");
        span.textContent = ayah.text + " ۞ ";
        text.appendChild(span);
      });

      reader.appendChild(text);

      const playButton = document.createElement("button");
      playButton.type = "button";
      playButton.textContent = "▶ تشغيل السورة";
      playButton.addEventListener("click", playSurah);
      reader.appendChild(playButton);

      const stopButton = document.createElement("button");
      stopButton.type = "button";
      stopButton.textContent = "⏹ إيقاف";
      stopButton.addEventListener("click", stopAudio);
      reader.appendChild(stopButton);

    } catch (error) {
      console.error("Surah loading error:", error);
      showMessage("تعذر تحميل آيات السورة. تأكد من اتصال الإنترنت وحاول مرة أخرى.");
    }
  }

  function stopAudio() {
    playRequest++;
    audio.pause();
    audio.currentTime = 0;
    currentAyahIndex = 0;
  }

  async function playSurah() {
    if (!currentAyahs.length) return;

    stopAudio();
    const request = playRequest;
    currentAyahIndex = 0;

    playCurrentAyah(request);
  }

  function playCurrentAyah(request) {
    if (request !== playRequest) return;

    if (currentAyahIndex >= currentAyahs.length) {
      currentAyahIndex = 0;
      return;
    }

    const ayahNumber = currentAyahs[currentAyahIndex].numberInSurah;
    const surahNumber = currentAyahs[currentAyahIndex].surah.number;

    const readerCode = readers[selectedReader];

    audio.src =
      `https://cdn.islamic.network/quran/audio/128/${readerCode}/${currentAyahs[currentAyahIndex].number}.mp3`;

    audio.play().catch(function (error) {
      console.error("Audio playback error:", error);
      alert("تعذر تشغيل الصوت. تأكد من اتصال الإنترنت.");
    });
  }

  audio.addEventListener("ended", function () {
    currentAyahIndex++;

    if (currentAyahIndex < currentAyahs.length) {
      playCurrentAyah(playRequest);
    }
  });

  const readerSelect = document.getElementById("reader-select");

  if (readerSelect) {
    readerSelect.addEventListener("change", function () {
      const value = this.value.toLowerCase();

      if (value.includes("حصري")) selectedReader = "husary";
      else if (value.includes("عبد الباسط")) selectedReader = "abdulbasit";
      else if (value.includes("السديس")) selectedReader = "sudais";
      else selectedReader = "mishary";
    });
  }

  loadSurahs();

})();
