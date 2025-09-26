document.addEventListener('DOMContentLoaded', async () => {
    const loadingElement = document.getElementById('loading');
    const suggestionsElement = document.getElementById('suggestions');
    const errorElement = document.getElementById('error');
    const copyFeedback = document.getElementById('copyFeedback');

    try {
        console.log('Plugin wird initialisiert...');

        // Chrome API verfügbar prüfen
        if (!chrome || !chrome.tabs) {
            throw new Error('Chrome Extension APIs nicht verfügbar');
        }

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        console.log('Aktuelle Tab URL:', tab?.url);

        if (!tab || !tab.url) {
            showError('Keine aktive Tab gefunden.');
            return;
        }

        // UNIVERSELLE UNTERSTÜTZUNG: Funktioniert auf JEDER Website
        console.log(`🌐 Universeller Chat Assistant aktiviert für: ${tab.url}`);

        console.log('Sende Nachricht an Content Script...');

        // Message Listener vor dem Senden registrieren
        chrome.runtime.onMessage.addListener((message) => {
            console.log('📨 Popup: Nachricht empfangen:', message);

            if (message.action === 'suggestionsReady') {
                // Setup-Required Handler
                if (message.setupRequired) {
                    displaySetupRequired();
                    return;
                }

                displaySuggestions(
                    message.suggestions,
                    message.source,
                    message.reason,
                    message.platform,
                    message.performance
                );
            } else if (message.action === 'error') {
                showError(`Fehler: ${message.error}`);
            }
        });

        try {
            // Erst versuchen, Content Script zu injizieren
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
            });
            console.log('Content Script injiziert');

            // Retry-Logik für Nachrichtenversand
            let retryCount = 0;
            const maxRetries = 3;

            const sendMessageWithRetry = async () => {
                try {
                    await chrome.tabs.sendMessage(tab.id, { action: 'extractChat' });
                } catch (msgError) {
                    console.error(`Nachrichtenfehler (Versuch ${retryCount + 1}):`, msgError);

                    if (retryCount < maxRetries) {
                        retryCount++;
                        console.log(`Wiederhole in ${retryCount * 500}ms...`);
                        setTimeout(sendMessageWithRetry, retryCount * 500);
                        return;
                    }

                    // Universeller Professional Fallback
                    console.log('Verwende Universellen Professional Fallback');
                    displaySuggestions([
                        { title: '🔄 ✨ Professional', text: 'Danke für deine Nachricht! Ich helfe dir gerne weiter. Was genau kann ich für dich tun?', apiStatus: 'retry-fallback' },
                        { title: '🔄 🤝 Hilfsbereit', text: 'Das ist eine interessante Frage! Lass mich kurz nachschauen und dir eine passende Antwort geben.', apiStatus: 'retry-fallback' },
                        { title: '🔄 🎯 Lösungsorientiert', text: 'Verstehe dein Problem gut. Hier ist ein praktischer Lösungsansatz, der dir helfen sollte.', apiStatus: 'retry-fallback' }
                    ], 'fallback-retry', 'Content Script Kommunikation fehlgeschlagen', 'universal');
                }
            };

            // Warten und dann mit Retry senden
            setTimeout(sendMessageWithRetry, 1000);
        } catch (injectError) {
            console.error('Fehler beim Injizieren:', injectError);
            // Professioneller Fallback ohne Content Script
            displaySuggestions([
                { title: '🚫 ✨ Professional Fallback', text: 'Danke für deine Nachricht! Ich helfe dir gerne weiter und finde eine Lösung für dein Anliegen.', apiStatus: 'injection-failed' },
                { title: '🚫 🤝 Support Fallback', text: 'Das ist verständlich! Lass mich das für dich klären und dir schnell eine Antwort geben.', apiStatus: 'injection-failed' },
                { title: '🚫 🎯 Solution Fallback', text: 'Kein Problem! Hier ist ein bewährter Ansatz, der in solchen Situationen meist hilft.', apiStatus: 'injection-failed' }
            ], 'fallback-injection', 'Content Script konnte nicht injiziert werden', 'universal');
        }

        setTimeout(() => {
            if (loadingElement.style.display !== 'none') {
                showError('Timeout: Keine Antwort vom Chat-System erhalten.');
            }
        }, 15000);

    } catch (error) {
        console.error('Popup initialization error:', error);
        showError(`Initialisierungsfehler: ${error.message}`);
    }
});

// SETUP-REQUIRED DISPLAY - Führt User zum Options-Setup
function displaySetupRequired() {
    const loadingElement = document.getElementById('loading');
    const suggestionsElement = document.getElementById('suggestions');

    loadingElement.style.display = 'none';
    suggestionsElement.style.display = 'block';
    suggestionsElement.innerHTML = '';

    // Setup-Required Header
    const setupDiv = document.createElement('div');
    setupDiv.className = 'setup-required';
    setupDiv.innerHTML = `
        <div class="setup-header">
            <h2>🔑 Setup erforderlich</h2>
            <p>Hol dir deinen kostenlosen Google Gemini API-Key</p>
        </div>
        <div class="setup-benefits">
            <div class="benefit">✅ 1,5 Millionen Token/Monat kostenlos</div>
            <div class="benefit">✅ Funktioniert auf jeder Chat-Plattform</div>
            <div class="benefit">✅ 5 Minuten Setup, dann bereit</div>
        </div>
        <div class="setup-actions">
            <button class="setup-button primary" onclick="openOptionsPage()">
                🚀 Jetzt einrichten (2 Min)
            </button>
            <button class="setup-button secondary" onclick="showSetupHelp()">
                ❓ Wie funktioniert das?
            </button>
        </div>
    `;

    suggestionsElement.appendChild(setupDiv);
}

// ENHANCED SUGGESTIONS DISPLAY mit Platform-Information
function displaySuggestions(suggestions, source = 'unknown', reason = null, platform = 'universal', performance = null) {
    const loadingElement = document.getElementById('loading');
    const suggestionsElement = document.getElementById('suggestions');

    loadingElement.style.display = 'none';
    suggestionsElement.style.display = 'block';

    suggestionsElement.innerHTML = '';

    // ENHANCED STATUS-HEADER mit Platform-Info
    const statusDiv = document.createElement('div');
    statusDiv.className = 'status-header';

    let statusInfo = getStatusInfo(source, platform, performance);

    statusDiv.innerHTML = `
        <div class="status-indicator ${statusInfo.class}">
            <span class="status-dot ${statusInfo.dotColor}"></span>
            <span class="status-text">${statusInfo.text}</span>
        </div>
        <div class="platform-info">
            🌐 ${getPlatformDisplayName(platform)} | ⚡ ${performance ? performance.extractionCount || 0 : 0} Extraktionen
        </div>
    `;

    suggestionsElement.appendChild(statusDiv);

    if (!suggestions || suggestions.length === 0) {
        showError('Keine Vorschläge generiert. Bitte versuche es erneut.');
        return;
    }

    // ENHANCED SUGGESTION RENDERING
    suggestions.forEach((suggestion, index) => {
        const suggestionDiv = document.createElement('div');
        suggestionDiv.className = 'suggestion enhanced';
        suggestionDiv.setAttribute('data-index', index);
        suggestionDiv.setAttribute('data-source', source);

        const titleDiv = document.createElement('div');
        titleDiv.className = 'suggestion-title';
        titleDiv.innerHTML = `
            <span class="title-text">${suggestion.title}</span>
            <span class="source-badge ${getSourceBadgeClass(source)}">${getSourceBadgeText(source)}</span>
        `;

        const textDiv = document.createElement('div');
        textDiv.className = 'suggestion-text';
        textDiv.textContent = suggestion.text;

        // COPY INDICATOR
        const copyIndicator = document.createElement('div');
        copyIndicator.className = 'copy-indicator';
        copyIndicator.innerHTML = '📋 Klicken zum Kopieren';

        suggestionDiv.appendChild(titleDiv);
        suggestionDiv.appendChild(textDiv);
        suggestionDiv.appendChild(copyIndicator);

        // ENHANCED CLICK HANDLER mit Visual Feedback
        suggestionDiv.addEventListener('click', () => {
            copyToClipboard(suggestion.text, suggestionDiv);
        });

        // HOVER EFFECTS
        suggestionDiv.addEventListener('mouseenter', () => {
            copyIndicator.style.opacity = '1';
        });

        suggestionDiv.addEventListener('mouseleave', () => {
            copyIndicator.style.opacity = '0.6';
        });

        suggestionsElement.appendChild(suggestionDiv);
    });

    // SUCCESS PSYCHOLOGY: Positive Verstärkung
    if (source === 'api') {
        setTimeout(() => {
            console.log('🎯 Live KI-Antworten erfolgreich generiert - Moderator ist produktiver!');
        }, 1000);
    }
}

// ENHANCED COPY TO CLIPBOARD mit Visual Feedback
async function copyToClipboard(text, element = null) {
    try {
        await navigator.clipboard.writeText(text);

        // Visual Feedback am Element selbst
        if (element) {
            element.classList.add('copied');
            const originalBg = element.style.background;
            element.style.background = 'linear-gradient(45deg, #4CAF50, #45a049)';
            element.style.transform = 'scale(1.02)';

            setTimeout(() => {
                element.classList.remove('copied');
                element.style.background = originalBg;
                element.style.transform = 'scale(1)';
            }, 1500);
        }

        showCopyFeedback(text);

        // PSYCHOLOGY: Erfolgsstatistik für Moderator
        incrementSuccessCounter();

    } catch (error) {
        console.error('Failed to copy text:', error);
        showTypingFeedback(text);
    }
}

function showTypingFeedback(text) {
    const copyFeedback = document.getElementById('copyFeedback');

    // Zeige Zeichen-Anzahl für Abschreiben
    const charCount = text.length;
    const wordsCount = text.split(' ').length;

    copyFeedback.innerHTML = `
        <div>📝 Zum Abschreiben bereit</div>
        <div style="font-size: 10px; opacity: 0.8; margin-top: 2px;">
            ${wordsCount} Wörter • ${charCount} Zeichen
        </div>
    `;

    copyFeedback.classList.add('show');

    setTimeout(() => {
        copyFeedback.classList.remove('show');
    }, 4000);
}

function showCopyFeedback(text) {
    const copyFeedback = document.getElementById('copyFeedback');
    const wordsCount = text.split(' ').length;

    copyFeedback.innerHTML = `
        <div>✓ In Zwischenablage kopiert!</div>
        <div style="font-size: 10px; opacity: 0.8; margin-top: 2px;">
            ${wordsCount} Wörter • Bereit zum Einfügen
        </div>
    `;
    copyFeedback.classList.add('show');

    setTimeout(() => {
        copyFeedback.classList.remove('show');
    }, 3000);
}

function showError(message) {
    const loadingElement = document.getElementById('loading');
    const suggestionsElement = document.getElementById('suggestions');
    const errorElement = document.getElementById('error');

    loadingElement.style.display = 'none';
    suggestionsElement.style.display = 'none';
    errorElement.style.display = 'block';
    errorElement.querySelector('p').textContent = message;
}

// HELPER FUNCTIONS FÜR ENHANCED UI

function getStatusInfo(source, platform, performance) {
    const statusMap = {
        'api': {
            class: 'api',
            dotColor: 'green',
            text: '🤖 Live KI-Antworten'
        },
        'fallback-empty': {
            class: 'fallback',
            dotColor: 'yellow',
            text: '📚 Intelligente Vorschläge'
        },
        'fallback-error': {
            class: 'error',
            dotColor: 'red',
            text: '⚠️ Backup-Modus'
        },
        'fallback-retry': {
            class: 'retry',
            dotColor: 'yellow',
            text: '🔄 Retry-Modus'
        },
        'fallback-injection': {
            class: 'injection',
            dotColor: 'red',
            text: '🚫 Injection-Fehler'
        },
        'no-api-key': {
            class: 'setup',
            dotColor: 'blue',
            text: '🔑 Setup benötigt'
        },
        'demo': {
            class: 'demo',
            dotColor: 'blue',
            text: '🧪 Demo-Modus'
        }
    };

    return statusMap[source] || {
        class: 'unknown',
        dotColor: 'blue',
        text: '💡 System aktiv'
    };
}

function getPlatformDisplayName(platform) {
    const platformNames = {
        'modpanel': 'ModPanel Dating',
        'chaturbate': 'Chaturbate',
        'stripchat': 'StripChat',
        'twitch': 'Twitch',
        'discord': 'Discord',
        'telegram': 'Telegram',
        'whatsapp': 'WhatsApp',
        'instagram': 'Instagram',
        'tinder': 'Tinder',
        'bumble': 'Bumble',
        'universal': 'Universal Chat'
    };

    return platformNames[platform] || platform.toUpperCase();
}

function getSourceBadgeClass(source) {
    if (source === 'api') return 'live';
    if (source.includes('fallback')) return 'fallback';
    return 'system';
}

function getSourceBadgeText(source) {
    if (source === 'api') return 'LIVE';
    if (source.includes('fallback')) return 'SMART';
    return 'SYS';
}

// OPTIONS PAGE INTEGRATION
function openOptionsPage() {
    chrome.runtime.openOptionsPage();
}

function showSetupHelp() {
    const helpWindow = window.open('https://aistudio.google.com/app/apikey', '_blank', 'width=800,height=600');

    // Schließe Popup nach 1 Sekunde (UX Optimization)
    setTimeout(() => {
        window.close();
    }, 1000);
}

// SUCCESS COUNTER für Moderator Psychology
function incrementSuccessCounter() {
    chrome.storage.local.get(['successCount'], (result) => {
        const count = (result.successCount || 0) + 1;
        chrome.storage.local.set({ successCount: count });

        // Milestone Celebrations
        if (count === 10) {
            console.log('🎉 10 erfolgreich kopierte Antworten! Du wirst immer effizienter!');
        } else if (count === 50) {
            console.log('🚀 50 Chat-Antworten generiert! Du bist ein echter Power-Moderator!');
        } else if (count === 100) {
            console.log('⭐ 100 KI-Antworten! Du hast das Tool gemeistert - Respekt!');
        }
    });
}