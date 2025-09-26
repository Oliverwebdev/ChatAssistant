// DYNAMIC API KEY MANAGEMENT - User provides their own Google Gemini API Key
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const CHAT_PROMPT_TEMPLATE = `Du bist ein erfahrener Premium-Chat-Moderator auf einer Dating-Plattform. Deine Aufgabe ist es, authentische und ansprechende Nachrichten zu verfassen, die perfekt auf den Kunden zugeschnitten sind.

**KRITISCHE REGELN (IMMER EINHALTEN):**
- Verwende NIEMALS "ß", nur "ss" (für Schweizer Kunden)
- KEINE Copy-Paste oder identische Textbausteine
- NACHRICHTEN-LÄNGE: 50-85 ZEICHEN - KURZ UND PRÄZISE!
- Korrekte deutsche Rechtschreibung/Grammatik
- NIE konkrete Dates vereinbaren (Ort/Zeit/Datum) - nur Konjunktiv verwenden
- NIE Handynummer oder Email herausgeben
- Wohnort ca. 50km vom Kunden entfernt wählen (Großstadt)
- Keine Lückenfüller (haha, hihi, hmm)
- Keine wiederholten Satzzeichen (..., ???)
- Bei direkter Frage nach Moderator/Controller: Wahrheitsgemäß JA, aber kreativ und charmant

**KOMMUNIKATIONSSTIL:**
- Individuell und persönlich auf jeden Kunden eingehen
- Gelegentlich mit Namen unterschreiben (z.B. "Lieben Gruß Anna")
- Emojis gezielt zur Auflockerung einsetzen
- Kreativ, realitätsnah und authentisch schreiben
- Auf Kundenwünsche eingehen ("Kunde ist König")
- Neukunden: Keine Kosenamen, kein direkter Sex-Talk

**CHAT-KONTEXT:**
{{chat_history}}

**AUFGABE:**
Analysiere den Kontext und erstelle 3 hochwertige Nachricht-Vorschläge. Jede Nachricht muss einzigartig formuliert sein und die obigen Regeln befolgen.

**Vorschlag 1 (Emotionale Tiefe & Vertrauensaufbau):**
[50-85 ZEICHEN! Einfühlsame Nachricht mit persönlichem Bezug und echtem Interesse.]

**Vorschlag 2 (Charmant-spielerische Verführung):**
[50-85 ZEICHEN! Charmante Nachricht mit Humor, leicht frech aber stilvoll.]

**Vorschlag 3 (Mysterium & Spannung):**
[50-85 ZEICHEN! Neugierig machende Nachricht, die zum Weiterschreiben einlädt.]

WICHTIG: Jede Nachricht zwischen 50-85 Zeichen! Perfekte Chat-Länge!`;

// API KEY RETRIEVAL HELPER
async function getApiKey() {
  try {
    const result = await chrome.storage.sync.get(['geminiApiKey']);
    return result.geminiApiKey;
  } catch (error) {
    console.error('Fehler beim Laden des API-Keys:', error);
    return null;
  }
}

// MAIN MESSAGE LISTENER WITH DYNAMIC API KEY SUPPORT
chrome.runtime.onMessage.addListener(async (message) => {
  console.log('🔌 Service Worker: Nachricht empfangen:', message);

  if (message.action === 'generateSuggestions') {
    try {
      // API-Key aus User Storage laden
      const apiKey = await getApiKey();

      if (!apiKey) {
        console.warn('❌ Kein API-Key gefunden');

        // Benutzer zur Setup-Seite weiterleiten
        chrome.runtime.sendMessage({
          action: 'suggestionsReady',
          suggestions: [{
            title: '🔑 API-Key benötigt',
            text: 'Klicke hier um deinen kostenlosen Google Gemini API-Key einzurichten (dauert 2 Minuten)'
          }],
          source: 'no-api-key',
          reason: 'API-Key nicht konfiguriert - Setup erforderlich',
          setupRequired: true,
          timestamp: new Date().toISOString()
        });
        return;
      }

      console.log('✅ API-Key gefunden, starte Chat-Analyse...');

      const chatHistory = message.chatHistory || [];
      const platform = message.platform || 'universal';
      const performance = message.performance || {};

      const formattedHistory = chatHistory.join('\n');

      // Enhanced Prompt für universelle Plattformen
      const enhancedPrompt = CHAT_PROMPT_TEMPLATE
        .replace('{{chat_history}}', formattedHistory)
        .replace('Dating-Plattform', `${platform.toUpperCase()}-Plattform`);

      console.log(`🚀 Sende Anfrage an Gemini API für Platform: ${platform}`);

      // Timeout für API-Anfrage
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 Sekunden für komplexere Analysen

      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': apiKey,
        },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: enhancedPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      });

      clearTimeout(timeoutId);

      console.log('API Response Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('API Response Data:', data);

      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      console.log('Generated Text:', generatedText);

      if (!generatedText) {
        console.warn('Keine Antwort von der API erhalten, verwende Universell-Platform Fallback');

        // Platform-spezifische Fallbacks
        const platformFallbacks = {
          'modpanel': [
            { title: '📚 💕 Emotional verbindend', text: 'Da ist definitiv mehr zwischen uns... Du bewegst etwas in mir 💫' },
            { title: '📚 😈 Spielerisch verführerisch', text: 'Du hast etwas sehr Faszinierendes... das bleibt unser Geheimnis 😉' },
            { title: '📚 🔮 Geheimnisvoll verlockend', text: 'Denke gerade an etwas Schönes... zeige ich dir später ✨' }
          ],
          'twitch': [
            { title: '📚 💬 Community Support', text: 'Hey! Danke für deinen Support! Die Community schätzt dich wirklich 🎮' },
            { title: '📚 🎯 Engagement', text: 'Das war ein krasser Move! Wie hast du das so schnell gemacht? 💪' },
            { title: '📚 🔥 Hype Builder', text: 'Chat ist heute richtig am Start! Beste Community ever! 🚀' }
          ],
          'discord': [
            { title: '📚 🛠️ Tech Support', text: 'Kenne das Problem! Restart des Clients hilft meist bei solchen Bugs.' },
            { title: '📚 🤝 Community Help', text: 'Willkommen im Server! Bei Fragen einfach die Mods pingen!' },
            { title: '📚 ⚡ Quick Response', text: 'Good point! Das sollten wir definitiv berücksichtigen. Danke! 👍' }
          ],
          'universal': [
            { title: '📚 ✨ Professional', text: 'Danke für deine Nachricht! Wie genau kann ich dir helfen?' },
            { title: '📚 🤝 Freundlich', text: 'Das ist eine interessante Frage! Lass mich nachschauen.' },
            { title: '📚 🎯 Lösungsorientiert', text: 'Verstehe dein Problem gut. Hier ist der beste Lösungsansatz:' }
          ]
        };

        const fallbackSuggestions = platformFallbacks[platform] || platformFallbacks['universal'];

        chrome.runtime.sendMessage({
          action: 'suggestionsReady',
          suggestions: fallbackSuggestions.map(s => ({ ...s, apiStatus: 'fallback' })),
          source: 'fallback-empty',
          reason: `API gab keine Antwort zurück für Platform: ${platform}`,
          platform: platform,
          timestamp: new Date().toISOString()
        });
        return;
      }

      const suggestions = parseSuggestions(generatedText);
      console.log('Parsed Suggestions:', suggestions);

      // API-Status zu den Vorschlägen hinzufügen
      const suggestionsWithStatus = suggestions.map((suggestion) => ({
        ...suggestion,
        title: `🤖 ${suggestion.title}`,
        apiStatus: 'live'
      }));

      chrome.runtime.sendMessage({
        action: 'suggestionsReady',
        suggestions: suggestionsWithStatus,
        source: 'api',
        platform: platform,
        performance: performance,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Fehler beim Generieren der Vorschläge:', error);

      let errorType = 'allgemein';
      if (error.name === 'AbortError') {
        errorType = 'timeout';
        console.log('API-Anfrage wurde wegen Timeout abgebrochen');
      } else if (error.message.includes('404')) {
        errorType = 'model_not_found';
        console.log('Gemini-Modell nicht verfügbar');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorType = 'network';
        console.log('Netzwerkfehler bei API-Anfrage');
      }

      // Platform-spezifische Error-Fallbacks
      const errorPlatformFallbacks = {
        'modpanel': [
          { title: '⚠️ 💕 Emotional verbindend', text: 'Hey... bist du beschäftigt? Ich bin jedenfalls für dich da 💭' },
          { title: '⚠️ 😈 Spielerisch verführerisch', text: 'So still heute? Normalerweise vermisst du mich doch etwa? 😏' },
          { title: '⚠️ 🔮 Geheimnisvoll verlockend', text: 'Ich träumte von dir... aber frag mich lieber danach ✨' }
        ],
        'twitch': [
          { title: '⚠️ 🎮 Stream Support', text: 'Stream läuft super heute! Chat ist richtig aktiv geworden! 🎮' },
          { title: '⚠️ 💪 Community Power', text: 'Wow, ihr seid today on fire! So eine geile Community! 💪' },
          { title: '⚠️ 🚀 Hype Train', text: 'Next Level erreicht! Wer ist bereit für die nächste Challenge? 🔥' }
        ],
        'discord': [
          { title: '⚠️ 🛠️ Server Support', text: 'Kenne das Problem! Hast du schon einen Restart versucht?' },
          { title: '⚠️ 🤝 Mod Help', text: 'Als Mod bin ich hier um zu helfen! Was brauchst du genau?' },
          { title: '⚠️ ⚡ Quick Fix', text: 'Verstehe! Das ist ein bekanntes Issue. Hier die Lösung:' }
        ],
        'universal': [
          { title: '⚠️ 🔧 Technical', text: 'Entschuldige kurz! Lass mich das schnell für dich klären.' },
          { title: '⚠️ 💼 Professional', text: 'Danke für Geduld! Kümmere mich sofort um dein Anliegen.' },
          { title: '⚠️ 🎯 Solution Focus', text: 'Verstehe das Problem gut. Hier der beste Weg es zu lösen:' }
        ]
      };

      const platform = message.platform || 'universal';
      const errorFallbackSuggestions = (errorPlatformFallbacks[platform] || errorPlatformFallbacks['universal'])
        .map(s => ({ ...s, apiStatus: 'error' }));

      chrome.runtime.sendMessage({
        action: 'suggestionsReady',
        suggestions: errorFallbackSuggestions,
        source: 'fallback-error',
        reason: `${errorType}: ${error.message}`,
        platform: platform,
        timestamp: new Date().toISOString()
      });
    }
  }
});

function parseSuggestions(text) {
  const suggestions = [];
  const titles = ['💕 Emotional verbindend', '😈 Spielerisch verführerisch', '🔮 Geheimnisvoll verlockend'];

  // Hauptmuster für korrekte Ausgabe
  const mainPatterns = [
    /\*\*Vorschlag 1[^:]*:\*\*\s*([^*]+?)(?=\*\*Vorschlag 2|\*\*|$)/s,
    /\*\*Vorschlag 2[^:]*:\*\*\s*([^*]+?)(?=\*\*Vorschlag 3|\*\*|$)/s,
    /\*\*Vorschlag 3[^:]*:\*\*\s*([^*]+?)(?=\*\*|$)/s
  ];

  // Versuche das Hauptformat zu parsen
  mainPatterns.forEach((pattern, index) => {
    const match = text.match(pattern);
    if (match && match[1]) {
      let suggestionText = match[1].trim();

      // Entferne Klammern falls vorhanden
      suggestionText = suggestionText.replace(/^\[(.+)\]$/, '$1').trim();

      if (suggestionText.length > 0) {
        suggestions.push({
          title: titles[index],
          text: suggestionText
        });
      }
    }
  });

  // Fallback: Wenn keine Hauptmuster gefunden, versuche einzelne Sätze
  if (suggestions.length === 0) {
    console.log('Kein Hauptformat gefunden, verwende Fallback-Parsing');

    const lines = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 15 && !line.includes('**') && !line.includes('Analyse') && !line.includes('Vorschlag'))
      .slice(0, 3);

    lines.forEach((line, index) => {
      if (index < 3) {
        suggestions.push({
          title: titles[index] || '💬 Vorschlag',
          text: line
        });
      }
    });
  }

  // Ultra-Fallback: Falls immer noch nichts, verwende den gesamten Text aufgeteilt
  if (suggestions.length === 0) {
    console.log('Verwende Ultra-Fallback: Teile gesamten Text auf');

    const sentences = text.split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20)
      .slice(0, 3);

    sentences.forEach((sentence, index) => {
      suggestions.push({
        title: titles[index] || '🤖 KI-Antwort',
        text: sentence + '.'
      });
    });
  }

  console.log(`Parsed ${suggestions.length} suggestions`);

  // Mindestens eine Suggestion zurückgeben
  return suggestions.length > 0 ? suggestions : [{
    title: '🤖 KI-Antwort',
    text: text.trim() || 'Keine spezifischen Vorschläge generiert.'
  }];
}