import { useEffect, useState } from 'react';
import { h } from './h';
import { UI_ENGLISH_TEXT } from './uiEnglishText';
import { LanguageContext, useLanguage } from './languageContext';

const LANGUAGE_STORAGE_KEY = 'pcms-ui-language-v1';
const MAX_SESSION_CHARACTERS = 4500;
const MAX_REQUEST_BYTES = 500;
const translationCache = new Map();
const pendingTranslations = new Map();
const requestQueue = [];
let activeRequests = 0;
let sessionCharacters = 0;
let translationLimitReached = false;
let translationServiceUnavailable = false;

const normalize = text => text.replace(/\s+/g, ' ').trim();

function getStoredLanguage() {
  try {
    return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === 'si' ? 'si' : 'en';
  } catch (error) {
    console.warn('Language preference could not be read; using English.', error);
    return 'en';
  }
}

function setStoredLanguage(language) {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.warn('Language preference could not be saved.', error);
  }
}

function translationError(kind, message) {
  return Object.assign(new Error(message), { kind });
}

async function requestTranslation(text) {
  if (translationServiceUnavailable) {
    throw translationError('service', 'The translation service is unavailable.');
  }
  if (translationLimitReached) {
    throw translationError('limit', 'The free Sinhala translation limit has been reached.');
  }
  if (new TextEncoder().encode(text).length > MAX_REQUEST_BYTES) {
    throw translationError('limit', 'This fixed UI message is too long for the free translation API.');
  }
  const characterCount = [...text].length;
  if (sessionCharacters + characterCount > MAX_SESSION_CHARACTERS) {
    translationLimitReached = true;
    throw translationError('limit', 'The free Sinhala translation limit has been reached.');
  }

  sessionCharacters += characterCount;
  const url = new URL('https://api.mymemory.translated.net/get');
  url.searchParams.set('q', text);
  url.searchParams.set('langpair', 'en|si');

  const response = await fetch(url, { credentials: 'omit', cache: 'no-store' });
  if (!response.ok) {
    throw translationError('service', `Translation service returned HTTP ${response.status}.`);
  }

  const result = await response.json();
  if (result.quotaFinished) {
    translationLimitReached = true;
    throw translationError('limit', 'The free Sinhala translation limit has been reached.');
  }
  const translatedText = result.responseData?.translatedText;
  if (result.responseStatus !== 200 || typeof translatedText !== 'string' || !translatedText.trim()) {
    throw translationError('service', 'Translation service returned no translation.');
  }

  return translatedText;
}

function queueTranslation(text) {
  if (translationCache.has(text)) return Promise.resolve(translationCache.get(text));
  if (pendingTranslations.has(text)) return pendingTranslations.get(text);

  const promise = new Promise((resolve, reject) => {
    requestQueue.push({ text, resolve, reject });
    processRequestQueue();
  });
  pendingTranslations.set(text, promise);
  return promise;
}

function processRequestQueue() {
  while (activeRequests < 3 && requestQueue.length) {
    const request = requestQueue.shift();
    activeRequests += 1;
    requestTranslation(request.text)
      .then(translatedText => {
        translationCache.set(request.text, translatedText);
        request.resolve(translatedText);
      })
      .catch(error => {
        if (error.kind !== 'limit') translationServiceUnavailable = true;
        request.reject(error);
      })
      .finally(() => {
        pendingTranslations.delete(request.text);
        activeRequests -= 1;
        processRequestQueue();
      });
  }
}

function keepWhitespace(original, translated) {
  const leading = original.match(/^\s*/)?.[0] || '';
  const trailing = original.match(/\s*$/)?.[0] || '';
  return `${leading}${translated}${trailing}`;
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(getStoredLanguage);
  const [serviceStatus, setServiceStatus] = useState('');

  const setLanguage = nextLanguage => {
    setLanguageState(nextLanguage);
    setStoredLanguage(nextLanguage);
    setServiceStatus('');
  };

  useEffect(() => {
    document.documentElement.lang = language === 'si' ? 'si' : 'en';
  }, [language]);

  useEffect(() => {
    const originals = new WeakMap();
    const applied = new WeakMap();
    const activeNodes = new Set();
    const skipSelector = 'script,style,noscript,textarea,input,svg,[contenteditable="true"]';

    const restoreEnglish = () => {
      activeNodes.forEach(node => {
        if (node.isConnected && originals.has(node)) {
          node.nodeValue = originals.get(node);
        }
      });
      activeNodes.clear();
    };

    if (language !== 'si') {
      restoreEnglish();
      setServiceStatus('');
      return undefined;
    }

    let active = true;
    const applyTranslation = node => {
      if (node.nodeType !== Node.TEXT_NODE || !node.parentElement
        || node.parentElement.closest(skipSelector)) return;

      const currentText = node.nodeValue || '';
      const previousTranslation = applied.get(node);
      if (previousTranslation && currentText !== previousTranslation) {
        originals.delete(node);
        applied.delete(node);
      }

      const originalText = originals.get(node) ?? currentText;
      const phrase = normalize(originalText);
      if (!UI_ENGLISH_TEXT.has(phrase)) return;

      originals.set(node, originalText);
      activeNodes.add(node);
      queueTranslation(phrase).then(translatedText => {
        if (!active || !node.isConnected || node.nodeValue !== originalText) return;
        const displayedText = keepWhitespace(originalText, translatedText);
        applied.set(node, displayedText);
        node.nodeValue = displayedText;
      }).catch(error => {
        if (!active) return;
        setServiceStatus(error.kind === 'limit' ? 'limit' : 'service');
        console.warn('Sinhala UI translation could not be loaded.', error);
      });
    };

    const scan = root => {
      if (root.nodeType === Node.TEXT_NODE) {
        applyTranslation(root);
        return;
      }
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node) {
        applyTranslation(node);
        node = walker.nextNode();
      }
    };

    scan(document.body);
    const observer = new MutationObserver(records => {
      records.forEach(record => {
        if (record.type === 'characterData') {
          const previousTranslation = applied.get(record.target);
          if (previousTranslation && record.target.nodeValue === previousTranslation) return;
          originals.delete(record.target);
          applied.delete(record.target);
          applyTranslation(record.target);
          return;
        }
        record.addedNodes.forEach(scan);
      });
    });
    observer.observe(document.body, { childList: true, characterData: true, subtree: true });

    return () => {
      active = false;
      observer.disconnect();
      restoreEnglish();
    };
  }, [language]);

  return h`<${LanguageContext.Provider} value=${{ language, setLanguage, serviceStatus }}>${children}<//>`;
}

export function LanguageToggle({ className = '' }) {
  const { language, setLanguage, serviceStatus } = useLanguage();
  const statusText = serviceStatus === 'limit'
    ? 'Free translation limit reached; remaining labels stay in English.'
    : serviceStatus === 'service'
      ? 'Translation service unavailable; remaining labels stay in English.'
      : '';

  return h`<div className=${`relative ${className}`}>
    <button type="button" className="px-3 py-1.5 rounded-lg border border-bd bg-cd hover:bg-ip text-sm font-medium min-h-[36px]" aria-label="Change language" title=${statusText || 'Change language'} onClick=${() => setLanguage(language === 'en' ? 'si' : 'en')}>
      ${language === 'en' ? 'සිංහල' : 'English'}
    </button>
    ${statusText && h`<span role="status" className="absolute right-0 top-full mt-1 w-64 rounded-lg border border-bd bg-cd p-2 text-xs shadow-lg">${statusText}</span>`}
  </div>`;
}
