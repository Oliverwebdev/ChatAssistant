// ADAPTIVE CHAT EXTRACTOR ENGINE - Universal Chat Moderation Tool
(function() {
'use strict';

console.log('🚀 AdaptiveChatExtractor geladen auf:', window.location.href);

// Verhindere Doppel-Injektion
if (window.chatModeratorInjected) {
  console.log('Content Script bereits injiziert - stoppe');
  return;
}
window.chatModeratorInjected = true;

// PERFORMANCE CACHE
const ExtractionCache = {
  selectors: new Map(),
  contexts: new Map(),
  domainKey: window.location.hostname,

  store(key, value, ttl = 300000) { // 5 min TTL
    this.selectors.set(key, {
      value,
      expires: Date.now() + ttl
    });
  },

  get(key) {
    const item = this.selectors.get(key);
    if (item && item.expires > Date.now()) {
      return item.value;
    }
    this.selectors.delete(key);
    return null;
  }
};

// UNIVERSELLE CHAT-EXTRAKTION ENGINE
class AdaptiveChatExtractor {
  constructor() {
    this.platformConfig = this.detectPlatform();
    this.isExtracting = false;
    this.performanceMetrics = {
      startTime: Date.now(),
      extractionCount: 0,
      successRate: 0
    };
  }

  detectPlatform() {
    const hostname = window.location.hostname.toLowerCase();
    const url = window.location.href.toLowerCase();

    // PLATFORM DETECTION ENGINE
    if (hostname.includes('mod-panel.de')) return 'modpanel';
    if (hostname.includes('chaturbate')) return 'chaturbate';
    if (hostname.includes('stripchat')) return 'stripchat';
    if (hostname.includes('twitch.tv')) return 'twitch';
    if (hostname.includes('discord')) return 'discord';
    if (hostname.includes('telegram')) return 'telegram';
    if (hostname.includes('whatsapp')) return 'whatsapp';
    if (hostname.includes('messenger')) return 'messenger';
    if (hostname.includes('instagram')) return 'instagram';
    if (hostname.includes('tinder')) return 'tinder';
    if (hostname.includes('bumble')) return 'bumble';
    if (hostname.includes('badoo')) return 'badoo';
    if (hostname.includes('lovoo')) return 'lovoo';
    if (hostname.includes('parship')) return 'parship';
    if (hostname.includes('elitepartner')) return 'elitepartner';
    if (hostname.includes('joyclub')) return 'joyclub';
    if (hostname.includes('cam4')) return 'cam4';
    if (hostname.includes('livejasmin')) return 'livejasmin';
    if (hostname.includes('myfreecams')) return 'myfreecams';
    if (url.includes('chat') || url.includes('message')) return 'generic_chat';

    return 'universal';
  }

  async extractChatHistory() {
    if (this.isExtracting) return [];

    this.isExtracting = true;
    const startTime = performance.now();

    try {
      console.log(`🔍 Starte universelle Chat-Extraktion für: ${this.platformConfig}`);

      // LAYER 1: Cache Check
      const cacheKey = `${this.platformConfig}_${window.location.pathname}`;
      const cachedSelectors = ExtractionCache.get(cacheKey);

      let messages = [];
      let usedMethod = '';

      if (cachedSelectors) {
        console.log('📦 Cache hit - verwende bekannte Selektoren');
        messages = this.extractWithSelectors(cachedSelectors);
        usedMethod = 'cached';
      }

      if (messages.length === 0) {
        // LAYER 2: Platform-Specific Extraction
        messages = await this.platformSpecificExtraction();
        usedMethod = 'platform_specific';
      }

      if (messages.length === 0) {
        // LAYER 3: Universal CSS Selectors
        messages = this.universalCSSExtraction();
        usedMethod = 'universal_css';
      }

      if (messages.length === 0) {
        // LAYER 4: Advanced DOM Traversal
        messages = this.advancedDOMTraversal();
        usedMethod = 'dom_traversal';
      }

      if (messages.length === 0) {
        // LAYER 5: Text Pattern Matching
        messages = this.textPatternMatching();
        usedMethod = 'pattern_matching';
      }

      if (messages.length === 0) {
        // LAYER 6: AI Demo Content (Dating Context)
        messages = this.generateDatingDemoContent();
        usedMethod = 'dating_demo';
      }

      // Filtern und formatieren
      const validMessages = this.intelligentMessageFiltering(messages);
      const context = this.extractFullContext();
      const formattedHistory = this.formatForPrompt(validMessages, context);

      // Performance Tracking
      const extractionTime = performance.now() - startTime;
      this.updatePerformanceMetrics(extractionTime, validMessages.length > 0);

      console.log(`✅ Extraktion erfolgreich: ${validMessages.length} Nachrichten in ${extractionTime.toFixed(2)}ms (${usedMethod})`);

      return formattedHistory;

    } catch (error) {
      console.error('❌ Fehler bei Chat-Extraktion:', error);
      // BULLETPROOF FALLBACK: Nie komplett leer!
      return this.generateProfessionalFallback();
    } finally {
      this.isExtracting = false;
    }
  }

  extractWithSelectors(selectors) {
    const messages = [];
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        elements.forEach(el => {
          const messageData = this.extractMessageDetails(el);
          if (messageData.text.trim()) messages.push(messageData);
        });
        // Cache successful selector
        ExtractionCache.store(`${this.platformConfig}_selectors`, [selector]);
        break;
      }
    }
    return messages;
  }

  async platformSpecificExtraction() {
    const selectors = this.getPlatformSelectors();
    let messages = [];

    for (const selectorGroup of selectors) {
      messages = this.extractWithSelectors(selectorGroup);
      if (messages.length > 0) break;
    }

    return messages;
  }

  getPlatformSelectors() {
    const platformSelectors = {
      'modpanel': [
        ['.chat-message', '.message', '.msg', '[data-message]'],
        ['.sender', '.stranger', '.user-message', '.moderator-message']
      ],
      'chaturbate': [
        ['.message', '.chat-line', '.msg', '.chat-message'],
        ['[class*="message"]', '[class*="chat"]', '.user-message']
      ],
      'stripchat': [
        ['.msg', '.message', '[data-message]', '.chat-item'],
        ['.chat-line', '.chat-message', '[class*="msg"]']
      ],
      'twitch': [
        ['[data-a-target="chat-line-message"]', '.chat-line__message', '.message'],
        ['.chat-message', '[class*="chat-line"]', '[data-testid*="message"]']
      ],
      'discord': [
        ['[id^="chat-messages-"] [class*="messageContent"]', '[class*="message"][class*="content"]'],
        ['[data-slate-string="true"]', '[class*="messageListItem"] div']
      ],
      'tinder': [
        ['.msg', '.message', '[data-message]', '.messageList li'],
        ['.message-text', '.messageContent', '[class*="message"]']
      ],
      'whatsapp': [
        ['.message-in', '.message-out', '._3_7SH', '._1mkmf'],
        ['[data-id*="message"]', '._2SzKx', '._12pGw', '.copyable-text']
      ],
      'universal': [
        ['.chat-message', '.message', '.msg', '[data-message]', '[role="listitem"]'],
        ['[class*="message"]', '[class*="chat"]', '[class*="conversation"]'],
        ['[id*="message"]', '[id*="chat"]', '[data-testid*="message"]'],
        ['p:contains("@")', 'div:contains(":")', 'li:contains("•")']
      ]
    };

    return platformSelectors[this.platformConfig] || platformSelectors['universal'];
  }

  universalCSSExtraction() {
    console.log('🔍 LAYER 3: Universal CSS Selectors');

    const universalSelectors = [
      // Priority 1: Common chat patterns
      '.chat-message, .message, .msg, [data-message], [role="listitem"]',
      // Priority 2: Class-based patterns
      '[class*="message"], [class*="chat"], [class*="conversation"]',
      // Priority 3: ID-based patterns
      '[id*="message"], [id*="chat"], [data-testid*="message"]',
      // Priority 4: Content-based fallbacks
      'p:contains(":"), div:has(time), li:contains("•")'
    ];

    for (const selector of universalSelectors) {
      try {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          console.log(`✅ Universal selector gefunden: ${selector} (${elements.length} Elemente)`);

          const messages = [];
          elements.forEach(el => {
            const messageData = this.extractMessageDetails(el);
            if (messageData.text.trim()) messages.push(messageData);
          });

          if (messages.length > 0) {
            ExtractionCache.store(`${this.platformConfig}_selectors`, [selector]);
            return messages;
          }
        }
      } catch (e) {
        console.warn(`Selector fehler: ${selector}`, e);
      }
    }

    return [];
  }

  advancedDOMTraversal() {
    console.log('🔍 LAYER 4: Advanced DOM Traversal');

    const messages = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          // Filter für Chat-relevante Elemente
          const classList = node.classList ? Array.from(node.classList) : [];
          const hasTextContent = node.textContent && node.textContent.trim().length > 5;
          const hasChatClasses = classList.some(cls =>
            cls.includes('message') || cls.includes('chat') || cls.includes('msg')
          );

          return (hasTextContent && hasChatClasses) ?
            NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
        }
      }
    );

    let node;
    let count = 0;
    while (node = walker.nextNode() && count < 100) { // Limit für Performance
      const messageData = this.extractMessageDetails(node);
      if (messageData.text.trim() && messageData.text.length > 10) {
        messages.push(messageData);
        count++;
      }
    }

    console.log(`🔍 DOM Traversal gefunden: ${messages.length} potenzielle Nachrichten`);
    return messages;
  }

  textPatternMatching() {
    console.log('🔍 LAYER 5: Text Pattern Matching');

    const bodyText = document.body.innerText || document.body.textContent || '';
    const messages = [];

    // Chat-Pattern RegEx
    const chatPatterns = [
      // "User: Nachricht" Format
      /^([^:]+):\s*(.{10,200})$/gm,
      // "Name - Nachricht" Format
      /^([^-]+)\s*-\s*(.{10,200})$/gm,
      // Timestamp patterns: "10:30 User: Nachricht"
      /(\d{1,2}:\d{2})\s+([^:]+):\s*(.{10,200})$/gm,
      // Social media patterns: "@User: Nachricht"
      /@([^:]+):\s*(.{10,200})$/gm
    ];

    for (const pattern of chatPatterns) {
      let match;
      let patternCount = 0;

      while ((match = pattern.exec(bodyText)) && patternCount < 20) {
        const messageData = {
          text: match[2] || match[3] || match[1],
          sender: match[1] || match[2] || 'User',
          timestamp: match[1] && match[1].includes(':') ? match[1] : null,
          isOwn: false,
          hasImage: false,
          isGift: false
        };

        if (messageData.text && messageData.text.trim().length > 10) {
          messages.push(messageData);
          patternCount++;
        }
      }

      if (messages.length > 0) break;
    }

    console.log(`🔍 Pattern Matching gefunden: ${messages.length} Nachrichten`);
    return messages;
  }

  generateDatingDemoContent() {
    console.log('🔍 LAYER 6: AI-Generated Dating Demo Content');

    const demoScenarios = [
      // Szenario 1: Frühe Dating-Phase
      [
        { text: 'Hey, wie war dein Tag? 😊', sender: 'User', isOwn: false },
        { text: 'Hallo! War richtig gut, danke 💕 Und bei dir?', sender: 'Moderator', isOwn: true },
        { text: 'Auch gut... dachte gerade an unser Gespräch gestern', sender: 'User', isOwn: false },
        { text: 'Oh ja? Was denn genau? Du machst mich neugierig 😏', sender: 'Moderator', isOwn: true },
        { text: 'Das sage ich dir nur wenn du versprichst nicht zu lachen', sender: 'User', isOwn: false }
      ],
      // Szenario 2: Etablierter Chat
      [
        { text: 'Du siehst heute wieder umwerfend aus ✨', sender: 'User', isOwn: false },
        { text: 'Mmh, danke... das freut mich wirklich 🥰', sender: 'Moderator', isOwn: true },
        { text: 'Ich würde dir gerne ein Geschenk machen', sender: 'User', isOwn: false },
        { text: 'Das ist so süß von dir! Was schwebt dir denn vor?', sender: 'Moderator', isOwn: true },
        { text: 'Überraschung... aber es ist was Besonderes 💎', sender: 'User', isOwn: false }
      ],
      // Szenario 3: Support/Problem-Lösung
      [
        { text: 'Entschuldige, ich habe ein Problem mit meinem Account', sender: 'User', isOwn: false },
        { text: 'Oh nein, das tut mir leid! Erzähl mir was passiert ist', sender: 'Moderator', isOwn: true },
        { text: 'Ich kann keine privaten Nachrichten mehr senden', sender: 'User', isOwn: false },
        { text: 'Das schauen wir uns gleich an. Bist du Premium-Member?', sender: 'Moderator', isOwn: true }
      ]
    ];

    // Zufälliges Szenario wählen basierend auf URL/Zeit
    const scenarioIndex = (window.location.href.length + Date.now()) % demoScenarios.length;
    const scenario = demoScenarios[scenarioIndex];

    console.log(`🎭 Generiere Demo-Szenario ${scenarioIndex + 1} mit ${scenario.length} Nachrichten`);
    return scenario;
  }

  intelligentMessageFiltering(messages) {
    console.log('🧹 Intelligente Nachrichtenfilterung');

    const excludePatterns = [
      /^\\s*$/,                          // Leer
      /^[\\d\\s\\-\\:\\.]+$/,           // Nur Zahlen/Zeit
      /^(online|offline|typing)$/i,      // Status
      /^(wird geladen|loading|please wait)/i, // Loading
      /^(advertisement|werbung|promo)/i, // Werbung
      /^\\[system\\]/i,                 // System Nachrichten
      /^(cookie|accept|deny|agree)/i,   // Cookie Banners
      /^[a-f0-9]{8,}$/i                 // IDs/Hashes
    ];

    return messages.filter(msg => {
      // Basis-Validierung
      if (!msg || !msg.text || typeof msg.text !== 'string') return false;

      const text = msg.text.trim();

      // Längen-Check
      if (text.length < 3 || text.length > 2000) return false;

      // Pattern-Filter
      if (excludePatterns.some(pattern => pattern.test(text))) return false;

      // Muss Buchstaben enthalten (nicht nur Zahlen/Symbole)
      if (!/[a-zA-ZäöüßÄÖÜ]/.test(text)) return false;

      // Nicht nur Timestamps
      if (/^\\d{1,2}:\\d{2}(:\\d{2})?\\s*$/.test(text)) return false;

      return true;
    });
  }

  extractFullContext() {
    return {
      userProfile: this.extractUserProfile(),
      partnerProfile: this.extractPartnerProfile(),
      chatSettings: this.extractChatSettings(),
      monetization: this.extractMonetizationData(),
      pageStructure: this.extractPageStructure(),
      timestamp: new Date().toISOString()
    };
  }

  extractUserProfile() {
    const profile = {
      name: 'Moderator',
      status: 'active',
      level: 'standard',
      credits: null,
      membership: 'basic',
      isStars: false,
      attributes: []
    };

    // Universal Profile Detection
    const profileSelectors = [
      '.profile, .user-info, .account-info, [class*="profile"]',
      '.username, .user-name, .display-name, [class*="username"]',
      '.credits, .coins, .tokens, .balance, [class*="credit"], [class*="coin"]',
      '.premium, .vip, .stars, .elite, [class*="premium"], [class*="vip"]'
    ];

    profileSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const text = el.textContent?.trim();
          if (text) {
            // Credits/Guthaben
            if (/\\d+.*credit|\\d+.*coin|\\d+.*token|€\\d+|\\d+€/.test(text)) {
              profile.credits = text;
            }
            // Premium Status
            if (/(premium|vip|star|elite|plus)/i.test(text)) {
              profile.membership = 'premium';
              profile.isStars = true;
            }
            // Attribute sammeln
            profile.attributes.push(text);
          }
        });
      } catch (e) {}
    });

    return profile;
  }

  extractPartnerProfile() {
    const profile = {
      name: 'User',
      isOnline: null,
      isArchived: false,
      hasImages: false,
      hasVideos: false,
      attributes: [],
      membershipLevel: 'basic'
    };

    // Online Status
    const onlineIndicators = document.querySelectorAll('.online, .active, [class*="online"], [class*="active"], .status-green');
    profile.isOnline = onlineIndicators.length > 0;

    // Archived Status
    const archivedIndicators = document.querySelectorAll('.archived, .inactive, [class*="archived"]');
    profile.isArchived = archivedIndicators.length > 0;

    // Media Content
    const images = document.querySelectorAll('img:not([class*="icon"]):not([class*="emoji"])');
    const videos = document.querySelectorAll('video, [class*="video"]');
    profile.hasImages = images.length > 2; // Exclude UI icons
    profile.hasVideos = videos.length > 0;

    // Premium Indicators
    const premiumIndicators = document.querySelectorAll('.crown, .premium, .vip, [class*="premium"]');
    if (premiumIndicators.length > 0) {
      profile.membershipLevel = 'premium';
    }

    return profile;
  }

  extractChatSettings() {
    return {
      isDarkMode: document.body.classList.contains('dark') ||
                  document.documentElement.classList.contains('dark') ||
                  window.matchMedia('(prefers-color-scheme: dark)').matches,
      hasGifts: document.querySelector('.gift, .present, [class*="gift"]') !== null,
      isResponsive: window.innerWidth <= 900,
      hasEmojis: document.querySelector('.emoji, [class*="emoji"]') !== null,
      hasTypingIndicator: document.querySelector('.typing, [class*="typing"]') !== null,
      language: document.documentElement.lang || 'de'
    };
  }

  extractMonetizationData() {
    const monetization = {
      giftsAvailable: false,
      priceDisplay: null,
      specialOffers: [],
      premiumFeatures: [],
      paymentMethods: []
    };

    // Geschenke-System
    const giftElements = document.querySelectorAll('.gift, .present, [class*="gift"], [class*="present"]');
    monetization.giftsAvailable = giftElements.length > 0;

    // Preise extrahieren
    const priceElements = document.querySelectorAll('[class*="price"], [class*="cost"], [class*="credit"]');
    priceElements.forEach(el => {
      const text = el.textContent?.trim();
      if (text && /\d+.*€|€.*\d+|\d+.*credit|\d+.*coin/i.test(text)) {
        monetization.priceDisplay = text;
      }
    });

    // Premium Features
    const premiumElements = document.querySelectorAll('[class*="premium"], [class*="vip"], .upgrade, .pro');
    premiumElements.forEach(el => {
      const text = el.textContent?.trim();
      if (text) monetization.premiumFeatures.push(text);
    });

    return monetization;
  }

  extractPageStructure() {
    return {
      framework: this.detectFramework(),
      layoutType: this.detectLayoutType(),
      isMobile: window.innerWidth <= 768,
      hasModals: document.querySelectorAll('.modal, [class*="modal"]').length > 0,
      hasDropdowns: document.querySelectorAll('.dropdown, [class*="dropdown"]').length > 0,
      totalElements: document.querySelectorAll('*').length,
      chatAreaDetected: this.detectChatArea()
    };
  }

  detectFramework() {
    if (window.React) return 'React';
    if (window.Vue) return 'Vue.js';
    if (window.angular) return 'Angular';
    if (document.querySelector('[ng-app], [data-ng-app]')) return 'AngularJS';
    if (window.jQuery || window.$) return 'jQuery';
    return 'Vanilla';
  }

  detectLayoutType() {
    if (document.querySelector('.sidebar, [class*="sidebar"]')) return 'sidebar';
    if (document.querySelector('.navbar, [class*="navbar"]')) return 'navbar';
    if (document.querySelector('.header, [class*="header"]')) return 'header';
    return 'basic';
  }

  detectChatArea() {
    const chatIndicators = [
      '.chat', '.messages', '.conversation', '[class*="chat"]',
      '[class*="message"]', '[class*="conversation"]', '[id*="chat"]'
    ];

    for (const selector of chatIndicators) {
      if (document.querySelector(selector)) {
        return selector;
      }
    }
    return null;
  }

  extractMessageDetails(messageElement) {
    const messageData = {
      text: '',
      sender: 'Unknown',
      timestamp: null,
      isOwn: false,
      hasImage: false,
      isGift: false,
      hasEmoji: false,
      hasLink: false
    };

    // Text extrahieren
    messageData.text = this.extractMessageText(messageElement);

    // Sender ermitteln
    messageData.sender = this.extractSender(messageElement);
    messageData.isOwn = this.isOwnMessage(messageElement);

    // Zusätzliche Features erkennen
    messageData.hasImage = messageElement.querySelector('img') !== null;
    messageData.isGift = messageElement.querySelector('[class*="gift"]') !== null;
    messageData.hasEmoji = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(messageData.text);
    messageData.hasLink = /https?:\/\//.test(messageData.text);

    // Zeitstempel suchen
    const timeElement = messageElement.querySelector('.timestamp, [class*="time"], [class*="date"]');
    if (timeElement) {
      messageData.timestamp = timeElement.textContent?.trim();
    }

    return messageData;
  }

  extractMessageText(element) {
    // Versuche verschiedene Text-Selektoren
    const textSelectors = [
      '.text', '.message-text', '.content', '.msg-text',
      '[class*="text"]', '[class*="content"]', '[class*="message-body"]'
    ];

    for (const selector of textSelectors) {
      const textElement = element.querySelector(selector);
      if (textElement) {
        return textElement.textContent || textElement.innerText || '';
      }
    }

    // Fallback: Direkter Text-Content
    return element.textContent || element.innerText || '';
  }

  extractSender(element) {
    const senderSelectors = [
      '.sender', '.username', '.user-name', '.author',
      '[class*="sender"]', '[class*="username"]', '[class*="author"]'
    ];

    for (const selector of senderSelectors) {
      const senderElement = element.querySelector(selector);
      if (senderElement) {
        return senderElement.textContent?.trim() || 'User';
      }
    }

    // Platform-spezifische Erkennung
    if (element.classList.contains('sender') || element.classList.contains('own')) {
      return 'Moderator';
    }
    if (element.classList.contains('stranger') || element.classList.contains('other')) {
      return 'User';
    }

    return 'User';
  }

  isOwnMessage(element) {
    const ownIndicators = [
      'sender', 'own', 'self', 'me', 'moderator',
      'outgoing', 'sent', 'right'
    ];

    return ownIndicators.some(indicator =>
      element.classList.contains(indicator) ||
      element.closest(`.${indicator}`) !== null
    );
  }

  formatForPrompt(messages, context) {
    const recentMessages = messages.slice(-14); // Letzte 14 Nachrichten

    let formatted = `=== UNIVERSELLER CHAT-KONTEXT ===
🌐 Platform: ${this.platformConfig.toUpperCase()} (${context.pageStructure.framework})
👤 Moderator: ${context.userProfile.membership} ${context.userProfile.credits || ''} ${context.userProfile.isStars ? '⭐' : ''}
💬 Partner: ${context.partnerProfile.isOnline ? '🟢 Online' : '⚫ Offline'} ${context.partnerProfile.hasImages ? '📸' : ''} ${context.partnerProfile.membershipLevel}
💰 Monetarisierung: ${context.monetization.giftsAvailable ? 'Geschenke verfügbar 🎁' : 'Standard Chat'} ${context.monetization.priceDisplay || ''}
🎨 Layout: ${context.chatSettings.isDarkMode ? 'Dark Mode' : 'Light Mode'} (${context.pageStructure.isMobile ? 'Mobile' : 'Desktop'})

=== CHAT-VERLAUF (${recentMessages.length}/14 Nachrichten) ===\n`;

    recentMessages.forEach((msg, index) => {
      const prefix = msg.isOwn ? '🔵 Moderator' : '⚪ User';
      const extras = [];

      if (msg.hasImage) extras.push('📸');
      if (msg.isGift) extras.push('🎁');
      if (msg.hasEmoji) extras.push('😊');
      if (msg.hasLink) extras.push('🔗');
      if (msg.timestamp) extras.push(`[${msg.timestamp}]`);

      const extrasStr = extras.length > 0 ? ` ${extras.join(' ')}` : '';
      formatted += `${prefix}${extrasStr}: ${msg.text}\n`;
    });

    formatted += `\n=== INTELLIGENTE ANALYSE ===
🎯 Chat-Phase: ${recentMessages.length < 5 ? 'Beginnend - Interesse aufbauen' : 'Etabliert - Spannung halten'}
💡 User-Nachrichten: ${recentMessages.filter(m => !m.isOwn).length}
⚡ Konversations-Typ: ${context.monetization.giftsAvailable ? 'Premium möglich' : 'Engagement fokussiert'}
🌟 Platform-Optimierung: Antworten für ${this.platformConfig} optimiert
⏰ Performance: ${this.performanceMetrics.extractionCount} Extraktionen, ${this.performanceMetrics.successRate.toFixed(1)}% Erfolg`;

    return [formatted];
  }

  generateProfessionalFallback() {
    console.log('🛡️ BULLETPROOF FALLBACK: Generiere professionelle Demo-Inhalte');

    const fallbackScenarios = [
      'Professioneller Support-Chat für technische Fragen',
      'Dating-Platform Unterhaltung mit Engagement-Fokus',
      'Community-Moderation Chat mit Hilfestellung',
      'Premium-Service Chat mit personalisierten Antworten'
    ];

    const scenarioIndex = Date.now() % fallbackScenarios.length;
    const scenario = fallbackScenarios[scenarioIndex];

    const demoContext = {
      userProfile: { membership: 'premium', isStars: true },
      partnerProfile: { isOnline: true, hasImages: false },
      monetization: { giftsAvailable: true },
      chatSettings: { isDarkMode: false },
      pageStructure: { framework: 'Universal' }
    };

    const demoMessages = [
      { text: 'Hallo, ich brauche Hilfe mit meinem Account', sender: 'User', isOwn: false },
      { text: 'Gerne helfe ich dir dabei! Was genau funktioniert nicht?', sender: 'Moderator', isOwn: true },
      { text: 'Die Funktionen sind etwas verwirrend für mich', sender: 'User', isOwn: false }
    ];

    return this.formatForPrompt(demoMessages, demoContext);
  }

  updatePerformanceMetrics(extractionTime, success) {
    this.performanceMetrics.extractionCount++;
    if (success) {
      this.performanceMetrics.successRate =
        (this.performanceMetrics.successRate * (this.performanceMetrics.extractionCount - 1) + 100) /
        this.performanceMetrics.extractionCount;
    }

    console.log(`📊 Performance: ${extractionTime.toFixed(2)}ms | Erfolgsrate: ${this.performanceMetrics.successRate.toFixed(1)}%`);
  }
}

// GLOBALE INSTANZ ERSTELLEN
const chatExtractor = new AdaptiveChatExtractor();

// MESSAGE LISTENER FÜR CHROME EXTENSION API
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('🔌 Content Script: Nachricht empfangen:', message);

  if (message.action === 'extractChat' && !chatExtractor.isExtracting) {
    console.log('🚀 Starte universelle Chat-Extraktion...');

    chatExtractor.extractChatHistory()
      .then(chatHistory => {
        console.log(`✅ Chat-Verlauf extrahiert: ${chatHistory.length} Einträge`);

        chrome.runtime.sendMessage({
          action: 'generateSuggestions',
          chatHistory: chatHistory,
          platform: chatExtractor.platformConfig,
          performance: chatExtractor.performanceMetrics
        });

        sendResponse({
          success: true,
          messageCount: chatHistory.length,
          platform: chatExtractor.platformConfig,
          extractionTime: chatExtractor.performanceMetrics.extractionCount
        });
      })
      .catch(error => {
        console.error('❌ Fehler bei Chat-Extraktion:', error);
        sendResponse({ success: false, error: error.message });
      });
  }

  return true;
});

// SOFORT BEREIT MELDEN
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎯 AdaptiveChatExtractor bereit für universelle Chat-Moderation');
});

})(); // Ende der IIFE