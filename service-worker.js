// DYNAMIC API KEY MANAGEMENT - User provides their own Google Gemini API Key
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const CHAT_PROMPT_TEMPLATE = `Du bist ein Elite-Chat-Moderator auf einer Dating-Plattform. Analysiere schnell den Chat-Kontext und generiere sofort 3 konkrete Nachricht-Vorschläge ohne Erklärungen.

{{chat_history}}

Antworte nur mit diesen 3 Nachrichten im exakten Format:

**Vorschlag 1 (Emotional verbindend):**
[Eine einfühlsame, persönliche Nachricht die Vertrauen aufbaut]

**Vorschlag 2 (Spielerisch verführerisch):**
[Eine charmante, leicht provozierende Nachricht mit Flirt-Faktor]

**Vorschlag 3 (Geheimnisvoll verlockend):**
[Eine geheimnisvolle Nachricht die Neugier weckt]

Keine Analyse, keine Erklärungen - nur die 3 Nachrichten!`;

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
            { title: '📚 💕 Emotional verbindend', text: 'Ich spüre, dass da mehr zwischen uns ist... Du bewegst etwas in mir, was schon lange still war. 💫' },
            { title: '📚 😈 Spielerisch verführerisch', text: 'Weißt du was? Du hast etwas Faszinierendes an dir... aber das sage ich nur, wenn du versprichst, dass es unser Geheimnis bleibt 😉' },
            { title: '📚 🔮 Geheimnisvoll verlockend', text: 'Ich denke gerade an etwas... aber das kann ich hier nicht schreiben. Das zeige ich dir nur, wenn wir allein sind ✨' }
          ],
          'twitch': [
            { title: '📚 💬 Community Support', text: 'Hey! Danke für deinen Support im Stream! Die Community schätzt dich wirklich. 🎮' },
            { title: '📚 🎯 Engagement', text: 'Das war ein krasser Move gerade! Wie hast du das so schnell hinbekommen? Respect! 💪' },
            { title: '📚 🔥 Hype Builder', text: 'Chat ist heute richtig am Start! Ihr seid die beste Community überhaupt! 🚀' }
          ],
          'discord': [
            { title: '📚 🛠️ Tech Support', text: 'Kenne das Problem! Versuch mal einen Restart des Clients - hilft meistens bei solchen Bugs.' },
            { title: '📚 🤝 Community Help', text: 'Willkommen im Server! Falls du Fragen hast, ping einfach die Mods - wir helfen gerne weiter!' },
            { title: '📚 ⚡ Quick Response', text: 'Good point! Das sollten wir definitiv im nächsten Update berücksichtigen. Danke für den Input! 👍' }
          ],
          'universal': [
            { title: '📚 ✨ Professional', text: 'Danke für deine Nachricht! Ich helfe dir gerne weiter. Was genau kann ich für dich tun?' },
            { title: '📚 🤝 Freundlich', text: 'Das ist eine interessante Frage! Lass mich kurz nachschauen und dir eine passende Antwort geben.' },
            { title: '📚 🎯 Lösungsorientiert', text: 'Verstehe dein Problem gut. Hier ist ein praktischer Lösungsansatz, der dir helfen sollte:' }
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
      const suggestionsWithStatus = suggestions.map((suggestion, index) => ({
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
          { title: '⚠️ 💕 Emotional verbindend', text: 'Hey... ich merke, dass du etwas beschäftigt bist. Lass mich für dich da sein. Was denkst du gerade? 💭' },
          { title: '⚠️ 😈 Spielerisch verführerisch', text: 'Mmh, so still heute? Normalerweise bringst du mich ja zum Lächeln... vermisst du mich etwa? 😏' },
          { title: '⚠️ 🔮 Geheimnisvoll verlockend', text: 'Ich habe heute von dir geträumt... aber was, das verrate ich dir nur, wenn du mich danach fragst ✨' }
        ],
        'twitch': [
          { title: '⚠️ 🎮 Stream Support', text: 'Stream läuft super! Chat ist heute richtig aktiv - ihr macht das großartig!' },
          { title: '⚠️ 💪 Community Power', text: 'Wow, ihr seid heute on fire! So eine geile Community hab ich selten gesehen!' },
          { title: '⚠️ 🚀 Hype Train', text: 'Next Level! Wer ist bereit für die nächste Challenge? Let\'s go! 🔥' }
        ],
        'discord': [
          { title: '⚠️ 🛠️ Server Support', text: 'Alles klar, lass uns das Problem zusammen lösen. Hast du schon einen Restart versucht?' },
          { title: '⚠️ 🤝 Mod Help', text: 'Kein Problem! Als Mod bin ich hier um zu helfen. Was genau brauchst du?' },
          { title: '⚠️ ⚡ Quick Fix', text: 'Verstehe! Das ist ein bekanntes Issue. Hier ist die schnelle Lösung dafür:' }
        ],
        'universal': [
          { title: '⚠️ 🔧 Technical', text: 'Entschuldige die Verzögerung. Lass mich das für dich klären und dir schnell helfen.' },
          { title: '⚠️ 💼 Professional', text: 'Danke für deine Geduld. Ich kümmere mich sofort um dein Anliegen.' },
          { title: '⚠️ 🎯 Solution Focus', text: 'Verstehe dein Problem. Hier ist der beste Weg, das zu lösen:' }
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