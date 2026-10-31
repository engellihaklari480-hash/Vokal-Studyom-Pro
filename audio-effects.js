

/* =========================================================

   VOKAL STUDYOM PRO

   PROFESSIONAL AUDIO EFFECTS ENGINE

   File: audio-effects.js

   ========================================================= */

(function () {

    "use strict";

    const audio = document.getElementById("audio-player");

    if (!audio) {

        console.error("Ses oynatıcısı bulunamadı.");

        return;

    }

    if (window.vokalAudioEffectsLoaded) return;

    window.vokalAudioEffectsLoaded = true;

    let ctx = null;

    let source = null;

    let initialized = false;

    const nodes = {};

    const values = {};

    const dbToGain = db => Math.pow(10, db / 20);

    const clamp = (value, min, max) =>

        Math.max(min, Math.min(max, Number(value)));

    const definitions = [

        // EQUALIZER

        {

            id: "subBass",

            label: "Alt Bas",

            category: "Frekans ve EQ",

            min: -24, max: 24, step: 0.1,

            unit: "dB", initial: 0

        },

        {

            id: "bass",

            label: "Bas",

            category: "Frekans ve EQ",

            min: -24, max: 24, step: 0.1,

            unit: "dB", initial: 0

        },

        {

            id: "mid",

            label: "Orta Frekans",

            category: "Frekans ve EQ",

            min: -24, max: 24, step: 0.1,

            unit: "dB", initial: 0

        },

        {

            id: "upperMid",

            label: "Üst Orta Frekans",

            category: "Frekans ve EQ",

            min: -24, max: 24, step: 0.1,

            unit: "dB", initial: 0

        },

        {

            id: "treble",

            label: "Tiz",

            category: "Frekans ve EQ",

            min: -24, max: 24, step: 0.1,

            unit: "dB", initial: 0

        },

        // REVERB

        {

            id: "reverb",

            label: "Reverb Miktarı",

            category: "Reverb",

            min: 0, max: 100, step: 1,

            unit: "%", initial: 0

        },

        {

            id: "roomSize",

            label: "Oda Büyüklüğü",

            category: "Reverb",

            min: 0, max: 100, step: 1,

            unit: "%", initial: 50

        },

        {

            id: "reverbTime",

            label: "Yankı Süresi",

            category: "Reverb",

            min: 0.1, max: 10, step: 0.1,

            unit: "sn", initial: 2.5

        },

        {

            id: "preDelay",

            label: "Reverb Ön Gecikme",

            category: "Reverb",

            min: 0, max: 200, step: 1,

            unit: "ms", initial: 20

        },

        {

            id: "reverbBrightness",

            label: "Reverb Parlaklığı",

            category: "Reverb",

            min: 0, max: 100, step: 1,

            unit: "%", initial: 60

        },

        // ECHO

        {

            id: "echo",

            label: "Echo Miktarı",

            category: "Echo",

            min: 0, max: 100, step: 1,

            unit: "%", initial: 0

        },

        {

            id: "echoTime",

            label: "Echo Gecikme Süresi",

            category: "Echo",

            min: 0.05, max: 2, step: 0.01,

            unit: "sn", initial: 0.28

        },

        {

            id: "echoFeedback",

            label: "Echo Tekrar Yoğunluğu",

            category: "Echo",

            min: 0, max: 90, step: 1,

            unit: "%", initial: 25

        },

        // COMPRESSOR

        {

            id: "compression",

            label: "Compressor Miktarı",

            category: "Compressor",

            min: 0, max: 100, step: 1,

            unit: "%", initial: 0

        },

        {

            id: "threshold",

            label: "Threshold",

            category: "Compressor",

            min: -60, max: 0, step: 0.1,

            unit: "dB", initial: -24

        },

        {

            id: "ratio",

            label: "Ratio",

            category: "Compressor",

            min: 1, max: 20, step: 0.1,

            unit: ":1", initial: 4

        },

        {

            id: "attack",

            label: "Attack",

            category: "Compressor",

            min: 0.1, max: 100, step: 0.1,

            unit: "ms", initial: 3

        },

        {

            id: "release",

            label: "Release",

            category: "Compressor",

            min: 10, max: 1000, step: 1,

            unit: "ms", initial: 250

        },

        {

            id: "makeupGain",

            label: "Makeup Gain",

            category: "Compressor",

            min: -24, max: 24, step: 0.1,

            unit: "dB", initial: 0

        },

        // STEREO

        {

            id: "stereoWidth",

            label: "Stereo Genişliği",

            category: "Stereo",

            min: 0, max: 200, step: 1,

            unit: "%", initial: 100

        },

        {

            id: "leftLevel",

            label: "Sol Kanal Seviyesi",

            category: "Stereo",

            min: -24, max: 24, step: 0.1,

            unit: "dB", initial: 0

        },

        {

            id: "rightLevel",

            label: "Sağ Kanal Seviyesi",

            category: "Stereo",

            min: -24, max: 24, step: 0.1,

            unit: "dB", initial: 0

        },

        // OUTPUT

        {

            id: "vocalLevel",

            label: "Vokal Seviyesi",

            category: "Ses Seviyesi",

            min: -24, max: 24, step: 0.1,

            unit: "dB", initial: 0

        },

        {

            id: "masterLevel",

            label: "Ana Çıkış Seviyesi",

            category: "Ses Seviyesi",

            min: -24, max: 24, step: 0.1,

            unit: "dB", initial: 0

        }

    ];

    definitions.forEach(item => {

        values[item.id] = item.initial;

    });

    function announce(message) {

        let status = document.getElementById(

            "vokal-effects-status"

        );

        if (!status) {

            status = document.createElement("div");

            status.id = "vokal-effects-status";

            status.setAttribute("role", "status");

            status.setAttribute("aria-live", "polite");

            status.style.cssText =

                "position:absolute;width:1px;height:1px;" +

                "overflow:hidden;clip:rect(0,0,0,0);";

            document.body.appendChild(status);

        }

        status.textContent = message;

    }

    function setMessage(message) {

        const element = document.getElementById(

            "vokal-effects-message"

        );

        if (element) element.textContent = message;

        announce(message);

    }

    function createImpulseResponse() {

        const duration = values.reverbTime;

        const sampleRate = ctx.sampleRate;

        const length = Math.floor(sampleRate * duration);

        const buffer = ctx.createBuffer(2, length, sampleRate);

        const room = values.roomSize / 100;

        const brightness = values.reverbBrightness / 100;

        const decay = 1.2 + room * 4;

        for (let channel = 0; channel < 2; channel++) {

            const data = buffer.getChannelData(channel);

            for (let i = 0; i < length; i++) {

                const progress = i / length;

                const envelope = Math.pow(

                    1 - progress,

                    decay

                );

                const highFrequencyDamping =

                    1 - progress * (1 - brightness) * 0.8;

                data[i] =

                    (Math.random() * 2 - 1) *

                    envelope *

                    highFrequencyDamping;

            }

        }

        return buffer;

    }

    function createAudioEngine() {

        if (initialized) return true;

        const AudioContextClass =

            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) {

            setMessage( 
                "Tarayıcı ses işleme desteği sunmuyor."

            );

            return false;

        }

        try {

            ctx = new AudioContextClass();

            source = ctx.createMediaElementSource(audio);

            // EQ FILTERS

            nodes.subBass = ctx.createBiquadFilter();

            nodes.subBass.type = "lowshelf";

            nodes.subBass.frequency.value = 50;

            nodes.bass = ctx.createBiquadFilter();

            nodes.bass.type = "lowshelf";

            nodes.bass.frequency.value = 120;

            nodes.mid = ctx.createBiquadFilter();

            nodes.mid.type = "peaking";

            nodes.mid.frequency.value = 1000;

            nodes.mid.Q.value = 0.8;

            nodes.upperMid = ctx.createBiquadFilter();

            nodes.upperMid.type = "peaking";

            nodes.upperMid.frequency.value = 3500;

            nodes.upperMid.Q.value = 1;

            nodes.treble = ctx.createBiquadFilter();

            nodes.treble.type = "highshelf";

            nodes.treble.frequency.value = 9000;

            // COMPRESSOR

            nodes.compressor = ctx.createDynamicsCompressor();

            // REVERB

            nodes.convolver = ctx.createConvolver();

            nodes.convolver.buffer = createImpulseResponse();

            nodes.reverbDelay = ctx.createDelay(0.3);

            nodes.reverbBrightness =

                ctx.createBiquadFilter();

            nodes.reverbBrightness.type = "highshelf";

            nodes.reverbBrightness.frequency.value = 6000;

            nodes.reverbGain = ctx.createGain();

            // ECHO

            nodes.echoDelay = ctx.createDelay(2.5);

            nodes.echoFeedback = ctx.createGain();

            nodes.echoGain = ctx.createGain();

            // MIXER

            nodes.dryGain = ctx.createGain();

            nodes.masterBus = ctx.createGain();

            nodes.makeupGain = ctx.createGain();

            nodes.vocalGain = ctx.createGain();

            // STEREO MATRIX

            nodes.splitter = ctx.createChannelSplitter(2);

            nodes.merger = ctx.createChannelMerger(2);

            nodes.ll = ctx.createGain();

            nodes.lr = ctx.createGain();

            nodes.rl = ctx.createGain();

            nodes.rr = ctx.createGain();

            nodes.leftGain = ctx.createGain();

            nodes.rightGain = ctx.createGain();

            // OUTPUT LIMITER

            nodes.limiter = ctx.createDynamicsCompressor();

            nodes.limiter.threshold.value = -1;

            nodes.limiter.knee.value = 0;

            nodes.limiter.ratio.value = 20;

            nodes.limiter.attack.value = 0.003;

            nodes.limiter.release.value = 0.1;

            // EQ CONNECTIONS

            source.connect(nodes.subBass);

            nodes.subBass.connect(nodes.bass);

            nodes.bass.connect(nodes.mid);

            nodes.mid.connect(nodes.upperMid);

            nodes.upperMid.connect(nodes.treble);

            nodes.treble.connect(nodes.compressor);

            // DRY SIGNAL

            nodes.compressor.connect(nodes.dryGain);

            nodes.dryGain.connect(nodes.masterBus);

            // REVERB SIGNAL

            nodes.compressor.connect(nodes.convolver);

            nodes.convolver.connect(nodes.reverbDelay);

            nodes.reverbDelay.connect(nodes.reverbBrightness);

            nodes.reverbBrightness.connect(nodes.reverbGain);

            nodes.reverbGain.connect(nodes.masterBus);

            // ECHO SIGNAL

            nodes.compressor.connect(nodes.echoDelay);

            nodes.echoDelay.connect(nodes.echoGain);

            nodes.echoGain.connect(nodes.masterBus);

            nodes.echoDelay.connect(nodes.echoFeedback);

            nodes.echoFeedback.connect(nodes.echoDelay);

            // MIXER AND GAIN

            nodes.masterBus.connect(nodes.vocalGain);

            nodes.vocalGain.connect(nodes.makeupGain); 
            nodes.makeupGain.connect(nodes.splitter);

            // STEREO MATRIX

            nodes.splitter.connect(nodes.ll, 0);

            nodes.splitter.connect(nodes.lr, 0);

            nodes.splitter.connect(nodes.rl, 1);

            nodes.splitter.connect(nodes.rr, 1);

            nodes.ll.connect(nodes.merger, 0, 0);

            nodes.lr.connect(nodes.merger, 0, 1);

            nodes.rl.connect(nodes.merger, 0, 0);

            nodes.rr.connect(nodes.merger, 0, 1);

            nodes.merger.connect(nodes.leftGain, 0);

            nodes.merger.connect(nodes.rightGain, 1);

            // Separate channel gains

            nodes.leftGain.connect(nodes.limiter);

            nodes.rightGain.connect(nodes.limiter);

            nodes.limiter.connect(ctx.destination);

            initialized = true;

            applyAllSettings();

            return true;

        } catch (error) {

            console.error("Ses motoru hatası:", error);

            setMessage(

                "Ses motoru başlatılamadı. Tarayıcı desteğini kontrol et."

            );

            return false;

        }

    }

    function smooth(node, parameter, value, time = 0.025) {

        if (!node || !node[parameter] || !ctx) return;

        const audioParam = node[parameter];

        audioParam.setTargetAtTime(

            value,

            ctx.currentTime,

            time

        );

    }

    function applyEqualizer() {

        smooth(nodes.subBass, "gain", values.subBass);

        smooth(nodes.bass, "gain", values.bass);

        smooth(nodes.mid, "gain", values.mid);

        smooth(nodes.upperMid, "gain", values.upperMid);

        smooth(nodes.treble, "gain", values.treble);

    }

    function applyReverb() {

        if (!initialized) return;

        const amount = values.reverb / 100;

        smooth(

            nodes.reverbGain,

            "gain",

            amount * 0.7

        );

        smooth(

            nodes.dryGain,

            "gain",

            1 - amount * 0.2

        );

        smooth(

            nodes.reverbDelay,

            "delayTime",

            values.preDelay / 1000

        );

        smooth(

            nodes.reverbBrightness,

            "gain",

            (values.reverbBrightness - 50) * 0.12

        );

        // Reverb süresi, oda büyüklüğü veya parlaklık

        // değiştiğinde yankı karakteri yeniden oluşturulur.

        nodes.convolver.buffer = createImpulseResponse();

    }

    function applyEcho() {

        const amount = values.echo / 100;

        smooth(

            nodes.echoDelay,

            "delayTime",

            values.echoTime

        );

        smooth(

            nodes.echoFeedback,

            "gain",

            (values.echoFeedback / 100) * 0.9

        );

        smooth(

            nodes.echoGain,

            "gain",

            amount * 0.7

        );

    }

    function applyCompressor() {

        const amount = values.compression / 100;

        const effectiveRatio =

            1 + (values.ratio - 1) * amount;

        smooth(

            nodes.compressor,

            "threshold",

            values.threshold

        );

        smooth(

            nodes.compressor,

            "ratio",

            effectiveRatio

        );

        smooth(

            nodes.compressor,

            "attack",

            values.attack / 1000

        );

        smooth(

            nodes.compressor,

            "release",

            values.release / 1000

        );

        smooth(

            nodes.makeupGain,

            "gain",

            dbToGain(values.makeupGain)

        );

    }

    function applyStereo() {

        const width = values.stereoWidth / 100;

        // Mid/side stereo genişlik matrisi.

        const direct = (1 + width) / 2;

        const cross = (1 - width) / 2;

        smooth(nodes.ll, "gain", direct);

        smooth(nodes.rr, "gain", direct);

        smooth(nodes.lr, "gain", cross);

        smooth(nodes.rl, "gain", cross);

        smooth(

            nodes.leftGain,

            "gain",

            dbToGain(values.leftLevel)

        );

        smooth(

            nodes.rightGain,

            "gain",

            dbToGain(values.rightLevel)

        );

    }

    function applyAllSettings() {

        if (!initialized) return;

        applyEqualizer();

        applyReverb();

        applyEcho();

        applyCompressor();

        applyStereo();

        smooth(

            nodes.vocalGain,

            "gain",

            dbToGain(values.vocalLevel)

        );

        smooth(

            nodes.masterBus,

            "gain",

            dbToGain(values.masterLevel)

        );

    }

    function updateSetting(id, value, announceChange) {

        const item = definitions.find(def => def.id === id);

        if (!item) return;

        let numeric = Number(value);

        if (!Number.isFinite(numeric)) numeric = item.initial;

        numeric = clamp(numeric, item.min, item.max);

        const decimals = item.step < 1 ? 2 : 0;

        numeric = Number(numeric.toFixed(decimals));

        values[id] = numeric;

        const range = document.getElementById(id + "-range");

        const number = document.getElementById(id + "-number");

        if (range) range.value = numeric;

        if (number) number.value = numeric;

        if (initialized) {

            if (id === "roomSize" ||

                id === "reverbTime" ||

                id === "reverbBrightness" ||

                id === "preDelay" ||

                id === "reverb") {

                applyReverb();

            } else if (

                id === "echo" ||

                id === "echoTime" ||

                id === "echoFeedback"

            ) {

                applyEcho();

            } else if (

                id === "compression" ||

                id === "threshold" ||

                id === "ratio" ||

                id === "attack" ||

                id === "release" ||

                id === "makeupGain"

            ) {

                applyCompressor();

            } else if (

                id === "stereoWidth" ||

                id === "leftLevel" ||

                id === "rightLevel"

            ) {

                applyStereo();

            } else if (

                id === "vocalLevel"

            ) {

                smooth(

                    nodes.vocalGain,

                    "gain",

                    dbToGain(numeric)

                );

            } else if (

                id === "masterLevel"

            ) {

                smooth(

                    nodes.masterBus,

                    "gain",

                    dbToGain(numeric)

                );

            } else {

                applyEqualizer();

            }

        }

        if (announceChange) {

            announce(

                item.label + ": " + numeric + " " + item.unit

            );

        }

    }

    function createControl(item, parent) {

        const group = document.createElement("div");

        group.style.cssText = `

            margin:18px 0;

            padding:14px 0;

            border-bottom:1px solid #444;

        `;

        const label = document.createElement("label");

        label.htmlFor = item.id + "-range";

        label.textContent = item.label;

        label.style.cssText = `

            display:block;

            font-size:17px;

            font-weight:bold;

            margin-bottom:10px;

        `;

        const row = document.createElement("div");

        row.style.cssText = `

            display:flex;

            align-items:center;

            gap:10px;

        `;

        const range = document.createElement("input");

        range.type = "range";

        range.id = item.id + "-range";

        range.min = item.min;

        range.max = item.max;

        range.step = item.step;

        range.value = item.initial;

        range.setAttribute(

            "aria-label",

            item.label + " kaydırma ayarı"

        );

        range.style.cssText = `

            flex:1;

            min-width:0;

            min-height:44px;

            accent-color:#42a5f5;

        `;

        const number = document.createElement("input");

        number.type = "number";

        number.id = item.id + "-number";

        number.min = item.min;

        number.max = item.max;

        number.step = item.step;

        number.value = item.initial;

        number.setAttribute(

            "aria-label",

            item.label + " sayısal değeri"

        );

        number.style.cssText = `

            width:92px;

            min-height:44px;

            padding:7px;

            box-sizing:border-box;

            border:1px solid #777;

            border-radius:7px;

            background:#111;

            color:white;

            font-size:16px;

        `;

        const unit = document.createElement("span");

        unit.textContent = item.unit;

        unit.setAttribute("aria-hidden", "true");

        range.addEventListener("input", function () {

            updateSetting(item.id, range.value, false);

        });

        range.addEventListener("change", function () {

            announce(

                item.label + ": " + range.value + " " + item.unit

            );

        });

        number.addEventListener("change", function () {

            updateSetting(item.id, number.value, true);

        });

        number.addEventListener("keydown", function (event) {

            if (event.key === "Enter") {

                updateSetting(item.id, number.value, true);

            }

        });

        row.appendChild(range);

        row.appendChild(number);

        row.appendChild(unit);

        group.appendChild(label);

        group.appendChild(row);

        parent.appendChild(group);

    }

    function createInterface() {

        if (document.getElementById("vokal-audio-effects")) {

            return;

        }

        const panel = document.createElement("section");

        panel.id = "vokal-audio-effects";

        panel.setAttribute(

            "aria-labelledby",

            "vokal-effects-heading"

        );

        panel.style.cssText = `

            margin:22px 0;

            padding:18px;

            background:#202020;

            color:#fff;

            border:1px solid #555;

            border-radius:14px;

            font-family:Arial,sans-serif;

        `;

        const heading = document.createElement("h2");

        heading.id = "vokal-effects-heading";

        heading.textContent = "Profesyonel Ses Efektleri";

        heading.style.cssText = "font-size:22px;";

        const intro = document.createElement("p");

        intro.textContent =

            "Şarkı çalarken ayarları değiştirebilirsin. " +

            "Değişiklikler gerçek zamanlı uygulanır.";

        intro.style.cssText = "line-height:1.6;";

        panel.appendChild(heading);

        panel.appendChild(intro);

        let currentCategory = "";

        definitions.forEach(item => {

            if (item.category !== currentCategory) {

                currentCategory = item.category;

                const categoryHeading =

                    document.createElement("h3");

                categoryHeading.textContent = currentCategory;

                categoryHeading.style.cssText = `

                    margin-top:28px;

                    padding-bottom:8px;

                    border-bottom:2px solid #555;

                    font-size:19px;

                `;

                panel.appendChild(categoryHeading);

            }

            createControl(item, panel);

        });

        const resetButton = document.createElement("button");

        resetButton.type = "button";

        resetButton.textContent = "Bütün Efektleri Sıfırla";

        resetButton.style.cssText = `

            width:100%;

            min-height:52px;

            margin-top:20px;

            padding:12px;

            border:0;

            border-radius:10px;

            background:#444;

            color:white;

            font-size:17px;

            font-weight:bold;

        `;

        resetButton.addEventListener("click", resetAll);

        panel.appendChild(resetButton);

        const message = document.createElement("p");

        message.id = "vokal-effects-message";

        message.setAttribute("role", "status");

        message.setAttribute("aria-live", "polite");

        message.textContent =

            "Ses efektleri hazır. Şarkını oynatarak başlayabilirsin.";

        panel.appendChild(message);

        const container = audio.parentElement || document.body;

        container.insertAdjacentElement("afterend", panel);

    }

    function resetAll() {

        definitions.forEach(item => {

            values[item.id] = item.initial;

            const range = document.getElementById(

                item.id + "-range"

            );

            const number = document.getElementById(

                item.id + "-number"

            );

            if (range) range.value = item.initial;

            if (number) number.value = item.initial;

        });

        if (initialized) {

            applyAllSettings();

        }

        setMessage("Bütün ses ayarları başlangıç değerlerine döndürüldü.");

    }

    async function activateAudio() {

        if (!createAudioEngine()) return;

        try {

            if (ctx.state === "suspended") {

                await ctx.resume();

            }

            applyAllSettings();

            setMessage(

                "Ses motoru etkinleştirildi. Efektler uygulanıyor."

            );

        } catch (error) {

            console.error("Ses motoru etkinleştirilemedi:", error);

            setMessage(

                "Ses motoru etkinleştirilemedi. Sayfayı yenileyip tekrar dene."

            );

        }

    }

    audio.addEventListener("play", activateAudio);

    // Kullanıcı efekt kontrollerine dokunursa motoru hazırla.

    document.addEventListener("input", function (event) {

        if (

            event.target.closest &&

            event.target.closest("#vokal-audio-effects")

        ) {

            if (!initialized) {

                createAudioEngine();

            }

            if (ctx && ctx.state === "suspended") {

                ctx.resume().catch(() => {});

            }

        }

    });

    createInterface();

    console.log(

        "Vokal Stüdyom Pro ses efektleri arayüzü yüklendi."

    );

})();
