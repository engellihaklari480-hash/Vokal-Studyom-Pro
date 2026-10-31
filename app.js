"use strict";

/* =====================================

   VOKAL STÜDYOM PRO

   Temel uygulama altyapısı

===================================== */

const elements = {

  pages: document.querySelectorAll(".page"),

  navigation: document.querySelectorAll(".nav-button"),

  homeCards: document.querySelectorAll(".home-card"),

  status: document.querySelector(".status-message"),

  audioFile: document.getElementById("audio-file"),

  audioPlayer: document.getElementById("audio-player"),

  recordButton: document.getElementById("record-button"),

  pauseButton: document.getElementById("pause-button"),

  resumeButton: document.getElementById("resume-button"),

  stopButton: document.getElementById("stop-button"),

  recordingState: document.getElementById("recording-state"),

  recordedPlayer: document.getElementById("recorded-player"),

  downloadAudio: document.getElementById("download-audio"),

  videoFile: document.getElementById("video-file"),

  videoPlayer: document.getElementById("video-player"),

  videoInfo: document.getElementById("video-info"),

  projectList: document.getElementById("project-list")

};

let audioObjectUrl = null;

let videoObjectUrl = null;

let recordingObjectUrl = null;

let mediaRecorder = null;

let microphoneStream = null;

let recordedChunks = [];

let recordingBlob = null;

let recordingFileName = "";

let recordingStartedAt = 0;

let recordingElapsedBeforePause = 0;

const projects = [];

/* =====================================

   EKRAN OKUYUCU BİLGİLENDİRMESİ

===================================== */

function announce(message) {

  if (elements.status) {

    elements.status.textContent = "";

    window.setTimeout(() => {

      elements.status.textContent = message;

    }, 50);

  }

  if (elements.recordingState) {

    elements.recordingState.textContent = message;

  }

}

/* =====================================

   SAYFA GEÇİŞLERİ

===================================== */

function openPage(pageId) {

  const targetPage = document.getElementById(pageId);

  if (!targetPage) {

    announce("İstenen sayfa bulunamadı.");

    return;

  }

  elements.pages.forEach((page) => {

    page.classList.remove("active");

    page.hidden = true;

  });

  targetPage.hidden = false;

  targetPage.classList.add("active");

  elements.navigation.forEach((button) => {

    const isCurrent = button.dataset.page === pageId;

    if (isCurrent) {

      button.setAttribute("aria-current", "page");

    } else {

      button.removeAttribute("aria-current");

    }

  });

  const heading = targetPage.querySelector("h2");

  if (heading) {

    heading.setAttribute("tabindex", "-1");

    heading.focus();

  }

  announce(targetPage.getAttribute("aria-label") || "Sayfa açıldı.");

}

elements.navigation.forEach((button) => {

  button.addEventListener("click", () => {

    openPage(button.dataset.page);

  });

});

elements.homeCards.forEach((button) => {

  button.addEventListener("click", () => {

    openPage(button.dataset.page);

  });

});

/* =====================================

   SES DOSYASI İÇE AKTARMA

===================================== */

function releaseAudioUrl() {

  if (audioObjectUrl) {

    URL.revokeObjectURL(audioObjectUrl);

    audioObjectUrl = null;

  }

}

function importAudioFile(file) {

  if (!file) return;

  releaseAudioUrl();

  audioObjectUrl = URL.createObjectURL(file);

  elements.audioPlayer.src = audioObjectUrl;

  elements.audioPlayer.hidden = false;

  addProject(file.name, "Ses dosyası");

  announce(file.name + " ses dosyası yüklendi.");

}

if (elements.audioFile) {

  elements.audioFile.addEventListener("change", (event) => {

    const file = event.target.files[0];

    if (!file) return;

    const allowedExtensions =

      /\.(mp3|wav|m4a|aac|aiff|ogg|opus|flac)$/i;

    if (

      file.type &&

      !file.type.startsWith("audio/") &&

      !allowedExtensions.test(file.name)

    ) {

      announce("Bu dosya desteklenen bir ses dosyası değil.");

      event.target.value = "";

      return;

    }

    importAudioFile(file);

  });

}

/* =====================================

   MİKROFON KAYDI

===================================== */

function getSupportedRecordingType() {

  if (!window.MediaRecorder) {

    return "";

  }

  const types = [

    "audio/mp4",

    "audio/webm;codecs=opus",

    "audio/webm",

    "audio/ogg;codecs=opus"

  ];

  for (const type of types) {

    if (MediaRecorder.isTypeSupported(type)) {

      return type;

    }

  }

  return "";

}

async function startRecording() {

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {

    announce("Bu tarayıcı mikrofon erişimini desteklemiyor.");

    return;

  }

  if (!window.MediaRecorder) {

    announce("Bu tarayıcı ses kaydı özelliğini desteklemiyor.");

    return;

  }

  try {

    microphoneStream = await navigator.mediaDevices.getUserMedia({

      audio: {
         echoCancellation: false,

        noiseSuppression: false,

        autoGainControl: false

      }

    });

    const mimeType = getSupportedRecordingType();

    const options = mimeType

      ? { mimeType: mimeType }

      : undefined;

    mediaRecorder = new MediaRecorder(

      microphoneStream,

      options

    );

    recordedChunks = [];

    recordingBlob = null;

    recordingElapsedBeforePause = 0;

    recordingStartedAt = Date.now();

    mediaRecorder.addEventListener("dataavailable", (event) => {

      if (event.data && event.data.size > 0) {

        recordedChunks.push(event.data);

      }

    });

    mediaRecorder.addEventListener("stop", () => {

      finishRecording();

    });

    mediaRecorder.start();

    updateRecordingButtons("recording");

    announce("Ses kaydı başladı.");

  } catch (error) {

    announce(

      "Mikrofon açılamadı. Safari mikrofon iznini ve site bağlantısını kontrol edin."

    );

    stopMicrophoneTracks();

  }
 }

function pauseRecording() {

  if (!mediaRecorder || mediaRecorder.state !== "recording") {

    announce("Duraklatılabilecek aktif bir kayıt bulunmuyor.");

    return;

  }

  recordingElapsedBeforePause += Date.now() - recordingStartedAt;

  mediaRecorder.pause();

  updateRecordingButtons("paused");

  announce("Ses kaydı duraklatıldı.");

}

function resumeRecording() {

  if (!mediaRecorder || mediaRecorder.state !== "paused") {

    announce("Devam ettirilebilecek duraklatılmış kayıt bulunmuyor.");

    return;

  }

  recordingStartedAt = Date.now();

  mediaRecorder.resume();

  updateRecordingButtons("recording");

  announce("Ses kaydı devam ediyor.");

}

function stopRecording() {

  if (

    !mediaRecorder ||

    mediaRecorder.state === "inactive"

  ) {

    announce("Durdurulabilecek aktif kayıt bulunmuyor.");

    return;

  }

  if (mediaRecorder.state === "recording") {

    recordingElapsedBeforePause += Date.now() - recordingStartedAt;

  }

  mediaRecorder.stop();

  stopMicrophoneTracks();

  updateRecordingButtons("stopped");

  announce("Kayıt tamamlanıyor.");

}

function finishRecording() {

  if (recordedChunks.length === 0) {

    announce("Kayıt verisi oluşturulamadı.");

    updateRecordingButtons("stopped");

    return;

  }

  const mimeType =

    mediaRecorder && mediaRecorder.mimeType

      ? mediaRecorder.mimeType

      : "audio/webm";

  recordingBlob = new Blob(recordedChunks, {

    type: mimeType

  });

  if (recordingObjectUrl) {

    URL.revokeObjectURL(recordingObjectUrl);

  }

  recordingObjectUrl = URL.createObjectURL(recordingBlob);

  elements.recordedPlayer.src = recordingObjectUrl;

  elements.recordedPlayer.hidden = false;

  const extension = mimeType.includes("mp4")

    ? "m4a"

    : mimeType.includes("ogg")

      ? "ogg"

      : "webm";

  recordingFileName =

    "vokal-kaydi-" +

    new Date().toISOString().replace(/[:.]/g, "-") +

    "." +

    extension;

  elements.downloadAudio.href = recordingObjectUrl;

  elements.downloadAudio.download = recordingFileName;

  elements.downloadAudio.hidden = false;

  addProject(recordingFileName, "Mikrofon kaydı");

  recordedChunks = [];

  updateRecordingButtons("stopped");

  announce("Ses kaydı tamamlandı. Kaydı dinleyebilir veya indirebilirsiniz.");

}

function stopMicrophoneTracks() {

  if (microphoneStream) {

    microphoneStream.getTracks().forEach((track) => {

      track.stop();

    });

    microphoneStream = null;

  }

}

function updateRecordingButtons(state) {

  if (elements.recordButton) {

    elements.recordButton.disabled = state === "recording" ||

      state === "paused";

  }

  if (elements.pauseButton) {

    elements.pauseButton.disabled = state !== "recording";

  }

  if (elements.resumeButton) {

    elements.resumeButton.disabled = state !== "paused";

  }

  if (elements.stopButton) {

    elements.stopButton.disabled = ![

      "recording",

      "paused"

    ].includes(state);

  }

}

if (elements.recordButton) {

  elements.recordButton.addEventListener("click", startRecording);

}

if (elements.pauseButton) {

  elements.pauseButton.addEventListener("click", pauseRecording);

}

if (elements.resumeButton) {

  elements.resumeButton.addEventListener("click", resumeRecording);

}

if (elements.stopButton) {

  elements.stopButton.addEventListener("click", stopRecording);

}

/* =====================================

   VİDEO DOSYASI İÇE AKTARMA

===================================== */

function releaseVideoUrl() {

  if (videoObjectUrl) {

    URL.revokeObjectURL(videoObjectUrl);

    videoObjectUrl = null;

  }

}

function importVideoFile(file) {

  if (!file) return;

  releaseVideoUrl();

  videoObjectUrl = URL.createObjectURL(file);

  elements.videoPlayer.src = videoObjectUrl;

  elements.videoPlayer.hidden = false;

  elements.videoPlayer.load();

  elements.videoInfo.textContent =

    "Video adı: " + file.name +

    ". Dosya boyutu: " + formatFileSize(file.size) +

    ". Bu sürümde video önizlemesi kullanılabilir.";

  addProject(file.name, "Video dosyası");

  announce(file.name + " video dosyası yüklendi.");

}

if (elements.videoFile) {

  elements.videoFile.addEventListener("change", (event) => {

    const file = event.target.files[0];

    if (!file) return;

    const allowedExtensions =

      /\.(mp4|mov|m4v|webm)$/i;

    if (

      file.type &&

      !file.type.startsWith("video/") &&

      !allowedExtensions.test(file.name)

    ) {

      announce("Bu dosya desteklenen bir video dosyası değil.");

      event.target.value = "";

      return;

    }

    importVideoFile(file);

  });

}

/* =====================================

   PROJELERİM

===================================== */

function addProject(name, type) {

  const project = {

    name: name,

    type: type,

    date: new Date()

  };

  projects.unshift(project);

  renderProjects();

}

function renderProjects() {

  if (!elements.projectList) return;

  elements.projectList.innerHTML = "";

  if (projects.length === 0) {

    const empty = document.createElement("p");

    empty.className = "empty-message";

    empty.textContent = "Henüz bir projeniz bulunmuyor.";

    elements.projectList.appendChild(empty);

    return;

  }

  projects.forEach((project) => {

    const item = document.createElement("div");

    item.className = "project-item";

    const title = document.createElement("strong");

    title.textContent = project.name;

    const description = document.createElement("p");

    description.textContent =

      project.type + " - " +

      project.date.toLocaleString("tr-TR");

    item.appendChild(title);

    item.appendChild(description);

    elements.projectList.appendChild(item);

  });

}

/* =====================================

   DOSYA BOYUTU

===================================== */

function formatFileSize(bytes) {

  if (!Number.isFinite(bytes) || bytes < 0) {

    return "Bilinmiyor";

  }

  if (bytes < 1024) {

    return bytes + " bayt";

  }

  if (bytes < 1024 * 1024) {

    return (bytes / 1024).toFixed(1) + " KB";

  }

  return (bytes / (1024 * 1024)).toFixed(2) + " MB";

}

/* =====================================

   UYGULAMA BAŞLANGICI

===================================== */

updateRecordingButtons("stopped");

renderProjects();

announce("Vokal Stüdyom Pro hazır.");
