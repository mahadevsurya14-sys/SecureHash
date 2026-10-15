/**
 * SecureHash — Professional Client-Side Cryptographic Hash Terminal
 * Technology: HTML5, CSS3, Vanilla JavaScript, Web Crypto API
 * 
 * Strict Privacy:
 * - 100% In-Memory Local Execution
 * - Zero Network Requests (CSP connect-src 'none')
 * - No LocalStorage / Cookies / SessionStorage
 * - Zero Console Logging of Sensitive Inputs
 */

(function () {
  'use strict';

  // --- Constants & Algorithm Definitions ---
  const ALGORITHM_SPECS = {
    'SHA-256': { bits: 256, hexChars: 64, bytes: 32, blockBits: 512 },
    'SHA-384': { bits: 384, hexChars: 96, bytes: 48, blockBits: 1024 },
    'SHA-512': { bits: 512, hexChars: 128, bytes: 64, blockBits: 1024 }
  };

  // Known NIST FIPS 180-4 Test Vectors for Sanity Verification
  const NIST_TEST_VECTORS = {
    'SHA-256': {
      'abc': 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
      '': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    },
    'SHA-384': {
      'abc': 'cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7',
      '': '38b060a751ac96384cd9327eb1b1e36a21fdb71114be07434c0cc7bf63f6e1da274edebfe76f65fbd51ad2f14898b95b'
    },
    'SHA-512': {
      'abc': 'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f',
      '': 'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e'
    }
  };

  // --- DOM Elements ---
  const el = {
    // Inputs
    passwordInput: document.getElementById('password-input'),
    btnToggleVisibility: document.getElementById('btn-toggle-visibility'),
    eyeIconShow: document.getElementById('eye-icon-show'),
    eyeIconHide: document.getElementById('eye-icon-hide'),
    charCount: document.getElementById('char-count'),
    byteCount: document.getElementById('byte-count'),
    inputErrorMsg: document.getElementById('input-error-msg'),

    // Entropy HUD
    entropyBits: document.getElementById('entropy-bits'),
    entropyLevel: document.getElementById('entropy-level'),
    entropySegments: [
      document.getElementById('seg-1'),
      document.getElementById('seg-2'),
      document.getElementById('seg-3'),
      document.getElementById('seg-4'),
      document.getElementById('seg-5')
    ],
    flags: {
      lower: document.getElementById('flag-lower'),
      upper: document.getElementById('flag-upper'),
      digits: document.getElementById('flag-digits'),
      symbols: document.getElementById('flag-symbols'),
      unicode: document.getElementById('flag-unicode')
    },

    // Actions
    btnGenerate: document.getElementById('btn-generate'),
    btnGenerateText: document.getElementById('btn-generate-text'),
    btnSpinner: document.getElementById('btn-spinner'),
    generateIcon: document.getElementById('generate-icon'),
    btnClear: document.getElementById('btn-clear'),

    // Output Section
    outputSection: document.getElementById('output-section'),
    hashOutput: document.getElementById('hash-output'),
    outputAlgoBadge: document.getElementById('output-algo-badge'),
    outputLengthBadge: document.getElementById('output-length-badge'),
    outputTimeBadge: document.getElementById('output-time-badge'),
    btnCopyHash: document.getElementById('btn-copy-hash'),
    copyBtnText: document.getElementById('copy-btn-text'),
    copyIcon: document.getElementById('copy-icon'),
    checkIcon: document.getElementById('check-icon'),

    // Status Boxes
    statusBox: document.getElementById('status-message-box'),
    statusTitle: document.getElementById('status-title'),
    statusDesc: document.getElementById('status-desc'),

    // Header Status
    cryptoStatusDot: document.getElementById('crypto-status-dot'),
    cryptoStatusTitle: document.getElementById('crypto-status-title'),
    cryptoStatusDesc: document.getElementById('crypto-status-desc'),

    // Presets Drawer
    btnQuickPresets: document.getElementById('btn-quick-presets'),
    presetsPanel: document.getElementById('presets-panel'),
    presetPills: document.querySelectorAll('.preset-pill'),

    // Verifier / Compare
    btnToggleVerifier: document.getElementById('btn-toggle-verifier'),
    verifierPanel: document.getElementById('verifier-panel'),
    compareInput: document.getElementById('compare-input'),
    compareResult: document.getElementById('compare-result'),

    // Audio & Matrix Controls
    btnToggleSound: document.getElementById('btn-toggle-sound'),
    soundIconOn: document.getElementById('sound-icon-on'),
    soundIconOff: document.getElementById('sound-icon-off'),
    soundLabel: document.getElementById('sound-label'),
    btnToggleMatrix: document.getElementById('btn-toggle-matrix'),
    matrixLabel: document.getElementById('matrix-label'),
    matrixCanvas: document.getElementById('cyber-bg-canvas')
  };

  // State
  let currentGeneratedHash = '';
  let isSoundEnabled = true;
  let isMatrixEnabled = true;
  let audioCtx = null;
  let scrambleInterval = null;

  // --- Cyber Audio Synthesizer (Web Audio API) ---
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playCyberSound(type) {
    if (!isSoundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === 'generate') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.12);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'copy') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1320, now + 0.06);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.start(now);
        osc.stop(now + 0.16);
      } else if (type === 'error') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.setValueAtTime(140, now + 0.08);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      }
    } catch (_) {
      // Audio autoplay policy or browser restriction fallback: ignore silently
    }
  }

  // --- Background Matrix Digital Rain Canvas ---
  let matrixAnimId = null;
  function initMatrixRain() {
    const canvas = el.matrixCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Characters: Katakana, Cyrillic, Hexadecimal, Binary
    const chars = '0123456789ABCDEF010101XYZΩΨ0123456789abcdef';
    const fontSize = 14;
    let columns = Math.floor(width / fontSize);
    let drops = Array(columns).fill(1);

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      columns = Math.floor(width / fontSize);
      drops = Array(columns).fill(1);
    }
    window.addEventListener('resize', resize, { passive: true });

    function draw() {
      if (!isMatrixEnabled) return;
      ctx.fillStyle = 'rgba(5, 8, 14, 0.08)';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#00ff9d';
      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        ctx.fillText(text, x, y);

        if (y > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
      matrixAnimId = requestAnimationFrame(draw);
    }

    draw();
  }

  // --- Web Crypto API & Secure Context Validation ---
  function verifyCryptoEnvironment() {
    const isCryptoAvailable = typeof window !== 'undefined' && 
                              window.crypto && 
                              Boolean(window.crypto.subtle);
    const isSecureContext = window.isSecureContext !== undefined ? window.isSecureContext : (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    if (isCryptoAvailable) {
      el.cryptoStatusDot.className = 'status-indicator-dot online';
      el.cryptoStatusTitle.textContent = isSecureContext ? 'LOCAL SECURE CONTEXT' : 'CRYPTO ENGINE ACTIVE';
      el.cryptoStatusDesc.textContent = 'HARDWARE-ACCELERATED SUBTLE_CRYPTO READY';
      return true;
    } else {
      el.cryptoStatusDot.className = 'status-indicator-dot error';
      el.cryptoStatusTitle.textContent = 'CRYPTO UNAVAILABLE';
      el.cryptoStatusDesc.textContent = 'REQUIRE HTTPS OR COMPLIANT BROWSER';
      showStatus('Cryptographic Subsystem Error', 'Your browser does not support Web Crypto API or is running in an insecure non-HTTPS context.', 'error');
      el.btnGenerate.disabled = true;
      return false;
    }
  }

  // --- Password Strength & Entropy Telemetry Calculator ---
  function computeEntropy(str) {
    if (!str || str.length === 0) {
      return {
        entropy: 0,
        length: 0,
        bytes: 0,
        poolSize: 0,
        hasLower: false,
        hasUpper: false,
        hasDigits: false,
        hasSymbols: false,
        hasUnicode: false,
        level: 'EMPTY'
      };
    }

    const utf8Bytes = new TextEncoder().encode(str).length;
    let poolSize = 0;
    const hasLower = /[a-z]/.test(str);
    const hasUpper = /[A-Z]/.test(str);
    const hasDigits = /[0-9]/.test(str);
    const hasSymbols = /[^a-zA-Z0-9\s\u0080-\uFFFF]/.test(str);
    const hasUnicode = /[\u0080-\uFFFF]/.test(str);

    if (hasLower) poolSize += 26;
    if (hasUpper) poolSize += 26;
    if (hasDigits) poolSize += 10;
    if (hasSymbols) poolSize += 33;
    if (hasUnicode) poolSize += 128; // Estimate for extended UTF-8 character space

    // Shannon / Bit-strength calculation: E = Length * log2(Pool)
    const entropy = poolSize > 0 ? (str.length * Math.log2(poolSize)).toFixed(1) : '0.0';
    const numEntropy = parseFloat(entropy);

    let level = 'WEAK';
    if (numEntropy === 0) level = 'EMPTY';
    else if (numEntropy < 28) level = 'WEAK';
    else if (numEntropy < 50) level = 'MODERATE';
    else if (numEntropy < 80) level = 'STRONG';
    else level = 'MILSPEC';

    return {
      entropy: numEntropy,
      length: str.length,
      bytes: utf8Bytes,
      poolSize,
      hasLower,
      hasUpper,
      hasDigits,
      hasSymbols,
      hasUnicode,
      level
    };
  }

  function updateEntropyHUD() {
    const text = el.passwordInput.value;
    const stats = computeEntropy(text);

    // Update Counts
    el.charCount.textContent = `${stats.length} CHAR${stats.length === 1 ? '' : 'S'}`;
    el.byteCount.textContent = `${stats.bytes} UTF-8 BYTE${stats.bytes === 1 ? '' : 'S'}`;

    // Update Entropy Bits & Badge
    el.entropyBits.textContent = `${stats.entropy.toFixed(1)} BITS`;
    el.entropyLevel.className = `entropy-level-badge ${stats.level.toLowerCase()}`;
    
    if (stats.level === 'EMPTY') {
      el.entropyLevel.textContent = 'BUFFER EMPTY';
    } else if (stats.level === 'WEAK') {
      el.entropyLevel.textContent = 'CRITICAL // WEAK';
    } else if (stats.level === 'MODERATE') {
      el.entropyLevel.textContent = 'SECURE // MODERATE';
    } else if (stats.level === 'STRONG') {
      el.entropyLevel.textContent = 'ARMORED // HIGH';
    } else {
      el.entropyLevel.textContent = 'MIL-SPEC // CRYPTOGRAPHIC';
    }

    // Segment LED Gauges
    el.entropySegments.forEach(seg => {
      seg.className = 'entropy-segment';
    });

    if (stats.entropy > 0) el.entropySegments[0].classList.add('active-red');
    if (stats.entropy >= 28) el.entropySegments[1].classList.add('active-orange');
    if (stats.entropy >= 50) el.entropySegments[2].classList.add('active-cyan');
    if (stats.entropy >= 70) el.entropySegments[3].classList.add('active-green');
    if (stats.entropy >= 90) el.entropySegments[4].classList.add('active-green');

    // Update Flags
    el.flags.lower.classList.toggle('active', stats.hasLower);
    el.flags.upper.classList.toggle('active', stats.hasUpper);
    el.flags.digits.classList.toggle('active', stats.hasDigits);
    el.flags.symbols.classList.toggle('active', stats.hasSymbols);
    el.flags.unicode.classList.toggle('active', stats.hasUnicode);
  }

  // --- Status Banner Helper ---
  function showStatus(title, description, type) {
    el.statusBox.className = `status-box ${type}`;
    el.statusTitle.textContent = title;
    el.statusDesc.textContent = description;
    el.statusBox.classList.remove('is-hidden');
  }

  function hideStatus() {
    el.statusBox.classList.add('is-hidden');
  }

  function showInputError(message) {
    el.inputErrorMsg.textContent = message;
    el.inputErrorMsg.classList.remove('is-hidden');
    el.passwordInput.classList.add('is-invalid');
  }

  function clearInputError() {
    el.inputErrorMsg.textContent = '';
    el.inputErrorMsg.classList.add('is-hidden');
    el.passwordInput.classList.remove('is-invalid');
  }

  // --- Password Visibility Toggle ---
  function togglePasswordVisibility() {
    playCyberSound('click');
    const isPassword = el.passwordInput.type === 'password';
    el.passwordInput.type = isPassword ? 'text' : 'password';

    if (isPassword) {
      el.eyeIconShow.classList.add('is-hidden');
      el.eyeIconHide.classList.remove('is-hidden');
      el.btnToggleVisibility.setAttribute('aria-label', 'Mask password as bullet characters');
      el.btnToggleVisibility.setAttribute('title', 'Hide password');
    } else {
      el.eyeIconShow.classList.remove('is-hidden');
      el.eyeIconHide.classList.add('is-hidden');
      el.btnToggleVisibility.setAttribute('aria-label', 'Show password as plaintext');
      el.btnToggleVisibility.setAttribute('title', 'Show password');
    }
    el.passwordInput.focus();
  }

  // --- Get Selected Algorithm ---
  function getSelectedAlgorithm() {
    const selectedRadio = document.querySelector('input[name="hashAlgorithm"]:checked');
    return selectedRadio ? selectedRadio.value : 'SHA-256';
  }

  // --- Hollywood Sci-Fi Decrypting / Text Scrambler Effect ---
  function animateHashReveal(finalHash, callback) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.hashOutput.textContent = finalHash;
      if (callback) callback();
      return;
    }

    if (scrambleInterval) clearInterval(scrambleInterval);

    const chars = '0123456789abcdef';
    const totalChars = finalHash.length;
    let iterations = 0;
    const maxIterations = 14;

    scrambleInterval = setInterval(() => {
      let scrambled = '';
      const progress = Math.floor((iterations / maxIterations) * totalChars);

      for (let i = 0; i < totalChars; i++) {
        if (i < progress) {
          scrambled += finalHash[i];
        } else {
          scrambled += chars[Math.floor(Math.random() * chars.length)];
        }
      }

      el.hashOutput.textContent = scrambled;
      iterations++;

      if (iterations > maxIterations) {
        clearInterval(scrambleInterval);
        el.hashOutput.textContent = finalHash;
        if (callback) callback();
      }
    }, 20);
  }

  // --- Cryptographic Hash Generator Execution ---
  async function generateHash() {
    clearInputError();
    hideStatus();

    const textToHash = el.passwordInput.value;
    const algorithm = getSelectedAlgorithm();

    // Input Validation
    if (!textToHash && textToHash !== '') {
      showInputError('Input buffer is empty. Please enter a password or plaintext string to digest.');
      el.passwordInput.focus();
      playCyberSound('error');
      return;
    }

    // Check Crypto API
    if (!window.crypto || !window.crypto.subtle) {
      showStatus('SubtleCrypto API Unavailable', 'The browser Web Crypto API is not accessible in this context. Ensure you are on HTTPS or localhost.', 'error');
      playCyberSound('error');
      return;
    }

    // Set UI processing state
    el.btnGenerate.disabled = true;
    el.btnSpinner.classList.remove('is-hidden');
    el.generateIcon.classList.add('is-hidden');
    el.btnGenerateText.textContent = 'COMPUTING DIGEST...';
    playCyberSound('generate');

    try {
      const startTime = performance.now();

      // Encode input text as UTF-8 byte stream
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(textToHash);

      // Perform cryptographic digest via Web Crypto API
      const hashBuffer = await window.crypto.subtle.digest(algorithm, dataBuffer);

      // Convert ArrayBuffer to lowercase hexadecimal string
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
      const endTime = performance.now();
      const executionTime = (endTime - startTime).toFixed(2);

      currentGeneratedHash = hashHex;

      // Update Output Meta Tags
      const specs = ALGORITHM_SPECS[algorithm] || { bits: 256, hexChars: 64 };
      el.outputAlgoBadge.textContent = algorithm;
      el.outputLengthBadge.textContent = `${specs.hexChars} HEX CHARS (${specs.bits} BITS)`;
      el.outputTimeBadge.textContent = `${executionTime} MS`;

      // Reveal output container
      el.outputSection.classList.remove('is-hidden');

      // Animate Terminal Hash Reveal
      animateHashReveal(hashHex, () => {
        // Live accessibility confirmation
        showStatus('Digest Generated Successfully', `Computed ${algorithm} (${specs.bits}-bit) cryptographic digest in ${executionTime} ms.`, 'success');
      });

      // Reset Verifier if open
      if (!el.verifierPanel.classList.contains('is-hidden')) {
        verifyChecksumAgainstOutput();
      }

    } catch (err) {
      showStatus('Cryptographic Error', `Failed to generate hash: ${err.message || 'Unknown internal error'}`, 'error');
      playCyberSound('error');
    } finally {
      el.btnGenerate.disabled = false;
      el.btnSpinner.classList.add('is-hidden');
      el.generateIcon.classList.remove('is-hidden');
      el.btnGenerateText.textContent = 'EXECUTE DIGEST';
    }
  }

  // --- Copy Hash to Clipboard ---
  async function copyHashToClipboard() {
    if (!currentGeneratedHash) return;

    playCyberSound('copy');

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(currentGeneratedHash);
      } else {
        // Fallback for older browsers or restricted clipboard contexts
        const textarea = document.createElement('textarea');
        textarea.value = currentGeneratedHash;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (!success) throw new Error('Copy command failed');
      }

      // Visual success confirmation
      el.copyBtnText.textContent = 'COPIED TO CLIPBOARD!';
      el.copyIcon.classList.add('is-hidden');
      el.checkIcon.classList.remove('is-hidden');
      el.btnCopyHash.classList.add('text-success');

      setTimeout(() => {
        el.copyBtnText.textContent = 'COPY HASH';
        el.copyIcon.classList.remove('is-hidden');
        el.checkIcon.classList.add('is-hidden');
        el.btnCopyHash.classList.remove('text-success');
      }, 2000);

    } catch (_) {
      // Manual select fallback
      const range = document.createRange();
      range.selectNodeContents(el.hashOutput);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      showStatus('Clipboard Permission Blocked', 'Automatic clipboard copy was denied. The hash text has been selected; press Ctrl+C (Cmd+C) to copy.', 'info');
    }
  }

  // --- Reset / Clear Buffer Function ---
  function clearAll() {
    playCyberSound('click');
    if (scrambleInterval) clearInterval(scrambleInterval);

    // Empty input
    el.passwordInput.value = '';

    // Reset password visibility to masked
    el.passwordInput.type = 'password';
    el.eyeIconShow.classList.remove('is-hidden');
    el.eyeIconHide.classList.add('is-hidden');
    el.btnToggleVisibility.setAttribute('aria-label', 'Show password as plaintext');
    el.btnToggleVisibility.setAttribute('title', 'Show password');

    // Reset output & states
    currentGeneratedHash = '';
    el.hashOutput.textContent = '';
    el.outputSection.classList.add('is-hidden');
    hideStatus();
    clearInputError();

    // Reset Verifier
    el.compareInput.value = '';
    el.compareResult.className = 'compare-result is-hidden';
    el.compareResult.textContent = '';

    // Reset Entropy HUD
    updateEntropyHUD();

    // Return focus
    el.passwordInput.focus();
  }

  // --- Constant-Time Hash Comparison Verifier ---
  function constantTimeStringCompare(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    const lenA = a.length;
    const lenB = b.length;
    let mismatch = lenA === lenB ? 0 : 1;
    for (let i = 0; i < lenA; i++) {
      mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i % lenB);
    }
    return mismatch === 0;
  }

  function verifyChecksumAgainstOutput() {
    const inputExpected = el.compareInput.value.trim().toLowerCase();
    const actual = currentGeneratedHash.toLowerCase();

    if (!inputExpected) {
      el.compareResult.className = 'compare-result is-hidden';
      el.compareResult.textContent = '';
      return;
    }

    if (!actual) {
      el.compareResult.className = 'compare-result mismatch';
      el.compareResult.textContent = '⚠️ GENERATE A DIGEST FIRST TO CROSS-VERIFY CHECKSUM';
      return;
    }

    const isMatch = constantTimeStringCompare(inputExpected, actual);

    if (isMatch) {
      el.compareResult.className = 'compare-result match';
      el.compareResult.textContent = '✓ CHECKSUM VERIFIED: EXACT CRYPTOGRAPHIC MATCH DETECTED!';
      playCyberSound('copy');
    } else {
      el.compareResult.className = 'compare-result mismatch';
      el.compareResult.textContent = '✕ CHECKSUM MISMATCH: HASHES DO NOT MATCH!';
    }
  }

  // --- NIST Test Vectors Injection ---
  function injectTestVector(vector, algo) {
    playCyberSound('click');
    el.passwordInput.value = vector;

    // Check target radio button
    const radio = document.querySelector(`input[name="hashAlgorithm"][value="${algo}"]`);
    if (radio) radio.checked = true;

    updateEntropyHUD();
    generateHash();
  }

  // --- Event Listeners Setup ---
  function setupEventListeners() {
    // Input live events
    el.passwordInput.addEventListener('input', () => {
      clearInputError();
      updateEntropyHUD();
    });

    el.passwordInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        generateHash();
      }
    });

    // Visibility toggle
    el.btnToggleVisibility.addEventListener('click', togglePasswordVisibility);

    // Form buttons
    el.btnGenerate.addEventListener('click', generateHash);
    el.btnClear.addEventListener('click', clearAll);
    el.btnCopyHash.addEventListener('click', copyHashToClipboard);

    // Algorithm radio buttons change
    document.querySelectorAll('input[name="hashAlgorithm"]').forEach(radio => {
      radio.addEventListener('change', () => {
        playCyberSound('click');
        if (el.passwordInput.value.length > 0 && !el.outputSection.classList.contains('is-hidden')) {
          generateHash();
        }
      });
    });

    // Presets drawer toggle
    el.btnQuickPresets.addEventListener('click', () => {
      playCyberSound('click');
      const isHidden = el.presetsPanel.classList.toggle('is-hidden');
      el.btnQuickPresets.setAttribute('aria-expanded', String(!isHidden));
    });

    // Preset pills click
    el.presetPills.forEach(pill => {
      pill.addEventListener('click', () => {
        const vector = pill.getAttribute('data-vector');
        const algo = pill.getAttribute('data-algo');
        injectTestVector(vector, algo);
      });
    });

    // Verifier toggle & input
    el.btnToggleVerifier.addEventListener('click', () => {
      playCyberSound('click');
      const isHidden = el.verifierPanel.classList.toggle('is-hidden');
      el.btnToggleVerifier.setAttribute('aria-expanded', String(!isHidden));
      if (!isHidden) el.compareInput.focus();
    });

    el.compareInput.addEventListener('input', verifyChecksumAgainstOutput);

    // Audio & Matrix Telemetry Buttons
    el.btnToggleSound.addEventListener('click', () => {
      isSoundEnabled = !isSoundEnabled;
      if (isSoundEnabled) {
        el.soundIconOn.classList.remove('is-hidden');
        el.soundIconOff.classList.add('is-hidden');
        el.soundLabel.textContent = 'AUDIO: ON';
        playCyberSound('click');
      } else {
        el.soundIconOn.classList.add('is-hidden');
        el.soundIconOff.classList.remove('is-hidden');
        el.soundLabel.textContent = 'AUDIO: MUTED';
      }
    });

    el.btnToggleMatrix.addEventListener('click', () => {
      isMatrixEnabled = !isMatrixEnabled;
      playCyberSound('click');
      if (isMatrixEnabled) {
        el.matrixCanvas.style.opacity = '0.22';
        el.matrixLabel.textContent = 'MATRIX: FX';
      } else {
        el.matrixCanvas.style.opacity = '0';
        el.matrixLabel.textContent = 'MATRIX: OFF';
      }
    });
  }

  // --- Self-Test NIST Vectors Sanity Check ---
  async function runSelfDiagnostics() {
    try {
      const encoder = new TextEncoder();
      const testData = encoder.encode('abc');
      const digestBuffer = await window.crypto.subtle.digest('SHA-256', testData);
      const computedHex = Array.from(new Uint8Array(digestBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
      const expected = NIST_TEST_VECTORS['SHA-256']['abc'];

      if (computedHex === expected) {
        // Crypto engine verified
      } else {
        showStatus('NIST Vector Mismatch', 'Web Crypto self-test failed standard vector validation.', 'error');
      }
    } catch (_) {
      // Handled by verifyCryptoEnvironment
    }
  }

  // --- Initialization ---
  function init() {
    verifyCryptoEnvironment();
    initMatrixRain();
    setupEventListeners();
    updateEntropyHUD();
    runSelfDiagnostics();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
