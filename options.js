// OPTIONS PAGE LOGIC - API KEY MANAGEMENT
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔧 Options Page geladen');

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

    // Basis-Validierung des API-Key Formats
    if (!apiKey.startsWith('AIzaSy') || apiKey.length < 35) {
        showStatus('❌ API-Key Format ungültig. Google API-Keys beginnen mit "AIzaSy"', 'error');
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

// ENTER-KEY SUPPORT
document.getElementById('apiKey').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        saveApiKey();
    }
});

// MODERATOR-PSYCHOLOGIE: Erfolgserlebnis verstärken
window.addEventListener('beforeunload', () => {
    const apiKey = document.getElementById('apiKey').value.trim();
    if (apiKey && apiKey.startsWith('AIzaSy')) {
        // Positive Verstärkung auch beim Verlassen der Seite
        console.log('🎯 Moderator hat Setup abgeschlossen - bereit für Chat-Assistenz!');
    }
});

// COPY-PASTE OPTIMIZATION für API-Keys
document.getElementById('apiKey').addEventListener('paste', (e) => {
    setTimeout(() => {
        const pastedValue = e.target.value.trim();
        if (pastedValue.startsWith('AIzaSy') && pastedValue.length > 35) {
            showStatus('📋 API-Key eingefügt! Klick "Speichern" um fortzufahren.', 'warning');
        }
    }, 100);
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