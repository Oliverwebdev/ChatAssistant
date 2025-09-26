// OPTIONS PAGE LOGIC - API KEY MANAGEMENT
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔧 Options Page geladen');

    // Event Listener für Buttons hinzufügen
    const saveBtn = document.getElementById('saveApiKeyBtn');
    const testBtn = document.getElementById('testApiKeyBtn');
    const apiKeyInput = document.getElementById('apiKey');

    if (saveBtn) {
        saveBtn.addEventListener('click', saveApiKey);
    }

    if (testBtn) {
        testBtn.addEventListener('click', testApiKey);
    }

    // INPUT CLEANER - Entfernt automatisch Whitespace während der Eingabe
    if (apiKeyInput) {
        apiKeyInput.addEventListener('input', (e) => {
            const cleaned = e.target.value.replace(/\s+/g, '');
            if (cleaned !== e.target.value) {
                e.target.value = cleaned;
                showStatus('✨ Leerzeichen automatisch entfernt', 'warning');
            }
        });

        // ENHANCED COPY-PASTE OPTIMIZATION für API-Keys
        apiKeyInput.addEventListener('paste', (e) => {
            setTimeout(() => {
                const input = e.target;
                let pastedValue = input.value.trim();

                // Automatisch trimmen und cleanen
                pastedValue = pastedValue.replace(/\s+/g, '');
                input.value = pastedValue;

                console.log('📋 API-Key eingefügt:', {
                    originalLength: e.target.value.length,
                    cleanedLength: pastedValue.length,
                    startsCorrectly: pastedValue.startsWith('AIzaSy')
                });

                if (pastedValue.startsWith('AIzaSy') && pastedValue.length >= 35) {
                    showStatus('✅ API-Key eingefügt und bereinigt! Klick "Speichern" um fortzufahren.', 'warning');
                } else if (pastedValue) {
                    showStatus('⚠️ Ungültiger API-Key format. Google Keys beginnen mit "AIzaSy"', 'error');
                }
            }, 100);
        });

        // ENTER-KEY SUPPORT
        apiKeyInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveApiKey();
            }
        });
    }

    // Existierenden API-Key laden
    try {
        const result = await chrome.storage.sync.get(['geminiApiKey']);
        if (result.geminiApiKey) {
            document.getElementById('apiKey').value = result.geminiApiKey;
            showStatus('✅ API-Key bereits gespeichert', 'success');
            console.log('API-Key aus Storage geladen');
        }
    } catch (error) {
        console.error('Fehler beim Laden des API-Keys:', error);
        showStatus('⚠️ Fehler beim Laden der gespeicherten Einstellungen', 'warning');
    }
});

// API-KEY SPEICHERN
async function saveApiKey() {
    const apiKey = document.getElementById('apiKey').value.trim();

    if (!apiKey) {
        showStatus('❌ Bitte gib deinen API-Key ein', 'error');
        return;
    }

    // Erweiterte API-Key Validierung mit Debug-Info
    console.log('🔍 API-Key Validierung:', {
        startsWithAIzaSy: apiKey.startsWith('AIzaSy'),
        length: apiKey.length,
        firstChars: apiKey.substring(0, 10),
        hasWhitespace: /\s/.test(apiKey)
    });

    if (!apiKey.startsWith('AIzaSy')) {
        showStatus('❌ API-Key muss mit "AIzaSy" beginnen', 'error');
        return;
    }

    if (apiKey.length < 35 || apiKey.length > 45) {
        showStatus(`❌ API-Key Länge ungültig (${apiKey.length} Zeichen). Erwartet: 35-45 Zeichen`, 'error');
        return;
    }

    if (/\s/.test(apiKey)) {
        showStatus('❌ API-Key enthält Leerzeichen oder Zeilenumbrüche', 'error');
        return;
    }

    try {
        showStatus('💾 Speichere API-Key...', 'warning', true);

        // In Chrome Storage speichern
        await chrome.storage.sync.set({ geminiApiKey: apiKey });

        console.log('✅ API-Key erfolgreich gespeichert');
        showStatus('✅ API-Key gespeichert! Du kannst jetzt das Extension verwenden.', 'success');

        // Nach 2 Sekunden automatisch testen
        setTimeout(() => {
            testApiKey();
        }, 2000);

    } catch (error) {
        console.error('Fehler beim Speichern:', error);
        showStatus('❌ Fehler beim Speichern des API-Keys', 'error');
    }
}

// API-KEY TESTEN
async function testApiKey() {
    const apiKey = document.getElementById('apiKey').value.trim();

    console.log('🧪 Test API-Key:', {
        length: apiKey.length,
        firstChars: apiKey.substring(0, 10),
        startsCorrectly: apiKey.startsWith('AIzaSy')
    });

    if (!apiKey) {
        showStatus('❌ Bitte gib zuerst deinen API-Key ein', 'error');
        return;
    }

    try {
        showStatus('🧪 Teste Verbindung zu Google Gemini...', 'warning', true);

        const testUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

        const response = await fetch(testUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-goog-api-key': apiKey
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: 'Test: Antworte nur mit "OK" wenn du mich verstehst.'
                    }]
                }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 10
                }
            })
        });

        console.log('API Test Response Status:', response.status);

        if (response.ok) {
            const data = await response.json();
            const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

            console.log('✅ API Test erfolgreich:', generatedText);

            showStatus(`✅ Verbindung erfolgreich! KI-Antwort: "${generatedText.trim()}"`, 'success');

            // Psychologie: Erfolg verstärken
            setTimeout(() => {
                showStatus('🎉 Perfekt! Dein Chat Assistant ist einsatzbereit. Geh zu einer beliebigen Chat-Seite und klick das Extension-Icon!', 'success');
            }, 3000);

        } else {
            const errorText = await response.text();
            console.error('API Test Fehler:', response.status, errorText);

            let userMessage = 'API-Test fehlgeschlagen. ';

            if (response.status === 400) {
                userMessage += 'API-Key Format oder Anfrage ungültig.';
            } else if (response.status === 401) {
                userMessage += 'API-Key ungültig oder deaktiviert.';
            } else if (response.status === 403) {
                userMessage += 'API-Key hat keine Berechtigung für Gemini API.';
            } else if (response.status === 429) {
                userMessage += 'Rate Limit erreicht. Warte kurz und versuche es erneut.';
            } else {
                userMessage += `Server Fehler (${response.status}).`;
            }

            showStatus(`❌ ${userMessage}`, 'error');
        }

    } catch (error) {
        console.error('Netzwerk-Fehler beim API-Test:', error);

        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            showStatus('❌ Netzwerk-Fehler. Prüfe deine Internetverbindung.', 'error');
        } else {
            showStatus('❌ Unbekannter Fehler beim API-Test', 'error');
        }
    }
}

// STATUS ANZEIGEN
function showStatus(message, type = 'warning', loading = false) {
    const statusDiv = document.getElementById('status');

    statusDiv.className = `status-indicator status-${type}`;
    if (loading) {
        statusDiv.className += ' loading';
    }

    statusDiv.textContent = message;
    statusDiv.classList.remove('hidden');

    // Auto-hide nach 10 Sekunden außer bei Success
    if (type !== 'success') {
        setTimeout(() => {
            statusDiv.classList.add('hidden');
        }, 10000);
    }
}

// MODERATOR-PSYCHOLOGIE: Erfolgserlebnis verstärken
window.addEventListener('beforeunload', () => {
    const apiKeyElement = document.getElementById('apiKey');
    if (apiKeyElement) {
        const apiKey = apiKeyElement.value.trim();
        if (apiKey && apiKey.startsWith('AIzaSy')) {
            console.log('🎯 Moderator hat Setup abgeschlossen - bereit für Chat-Assistenz!');
        }
    }
});

// ENTWICKLER-MODUS: Shortcuts für Testing
if (window.location.search.includes('dev=1')) {
    console.log('🛠️ Entwickler-Modus aktiviert');

    // Ctrl+T für schnellen Test
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 't') {
            e.preventDefault();
            testApiKey();
        }
    });
}