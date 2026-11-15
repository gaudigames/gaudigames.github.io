// Small browser helpers for the Gaudi Games team app.
(function () {
    'use strict';

    let audioContext = null;

    // Browsers only allow sound after a user gesture. Unlock on every tap until it works.
    function unlockAudio() {
        try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) { return; }
            if (!audioContext) { audioContext = new Ctx(); }
            if (audioContext.state === 'suspended') { audioContext.resume(); }
            // iPhone: let web audio play even when the ring switch is on silent (Safari 16.4+).
            if (navigator.audioSession) { navigator.audioSession.type = 'playback'; }
        } catch (e) { /* no sound support */ }
    }
    document.addEventListener('pointerdown', unlockAudio, { passive: true });

    function beep(when, frequency) {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = 'square';
        osc.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, when);
        gain.gain.exponentialRampToValueAtTime(0.4, when + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.35);
        osc.connect(gain).connect(audioContext.destination);
        osc.start(when);
        osc.stop(when + 0.4);
    }

    window.gaudi = {
        storageGet: function (key) {
            try { return localStorage.getItem(key); } catch (e) { return null; }
        },
        storageSet: function (key, value) {
            try { localStorage.setItem(key, value); return true; } catch (e) { return false; }
        },
        storageRemove: function (key) {
            try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
        },
        persist: async function () {
            try {
                return !!(navigator.storage && navigator.storage.persist && await navigator.storage.persist());
            } catch (e) { return false; }
        },
        getHash: function () { return location.hash || ''; },
        clearHash: function () {
            try { history.replaceState(history.state, '', location.pathname + location.search); } catch (e) { /* ignore */ }
        },
        isSoundReady: function () { return !!audioContext && audioContext.state === 'running'; },
        alarm: function () {
            try {
                if (audioContext && audioContext.state === 'running') {
                    const t = audioContext.currentTime + 0.05;
                    for (let i = 0; i < 3; i++) { beep(t + i * 0.5, 880); beep(t + i * 0.5 + 0.18, 660); }
                }
            } catch (e) { /* ignore */ }
            // Browsers only allow vibration after the user has tapped the page at least once.
            const activated = !navigator.userActivation || navigator.userActivation.hasBeenActive;
            try { if (navigator.vibrate && activated) { navigator.vibrate([400, 200, 400, 200, 400]); } } catch (e) { /* ignore */ }
        },
        download: function (fileName, mimeType, content) {
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
        }
    };
})();
