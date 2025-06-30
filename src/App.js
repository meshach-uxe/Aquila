import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QrCode, Link, MessageSquare, User, Download, Copy, Check } from 'lucide-react';
import './App.css';

// Translation system for internationalization
const TRANSLATIONS = {
  "en-US": {
    "appTitle": "Aquila",
    "appDescription": "Generate QR codes for URLs, text, and contact information",
    "urlTab": "URL",
    "textTab": "Text",
    "contactTab": "Contact",
    "enterUrl": "Enter URL",
    "enterText": "Enter Text",
    "contactInformation": "Contact Information",
    "websiteUrl": "Website URL",
    "urlPlaceholder": "example.com or https://example.com",
    "urlHelp": "Enter a website URL. If you don't include http://, we'll add https:// automatically.",
    "textContent": "Text Content",
    "textPlaceholder": "Enter any text to generate QR code...",
    "firstName": "First Name",
    "firstNamePlaceholder": "John",
    "lastName": "Last Name",
    "lastNamePlaceholder": "Doe",
    "phoneNumber": "Phone Number",
    "phonePlaceholder": "+1 (555) 123-4567",
    "emailAddress": "Email Address",
    "emailPlaceholder": "john.doe@example.com",
    "organization": "Organization",
    "organizationPlaceholder": "Company Name",
    "website": "Website",
    "websitePlaceholder": "https://example.com",
    "clearAllFields": "Clear All Fields",
    "generatedQrCode": "Generated QR Code",
    "scanQrCode": "Scan this QR code with your device",
    "fillFormPrompt": "Fill in the form to generate your QR code",
    "download": "Download",
    "copyData": "Copy Data",
    "copied": "Copied!",
    "qrCodeData": "QR Code Data:",
    "footerText": "Generate QR codes instantly • No data stored • Free to use",
    "qrCodeAlt": "Generated QR Code"
  }
};

// Locale detection and translation function
const appLocale = '{{APP_LOCALE}}';
const browserLocale = navigator.languages?.[0] || navigator.language || 'en-US';
const findMatchingLocale = (locale) => {
  if (TRANSLATIONS[locale]) return locale;
  const lang = locale.split('-')[0];
  const match = Object.keys(TRANSLATIONS).find(key => key.startsWith(lang + '-'));
  return match || 'en-US';
};
const locale = (appLocale !== '{{APP_LOCALE}}') ? findMatchingLocale(appLocale) : findMatchingLocale(browserLocale);
const t = (key) => TRANSLATIONS[locale]?.[key] || TRANSLATIONS['en-US'][key] || key;

/**
 * Main QR Code Generator Component
 * Provides functionality to generate QR codes for URLs, text, and contact information
 */
const QRCodeGenerator = () => {
  // State management for active tab and QR data
  const [activeTab, setActiveTab] = useState('url');
  const [qrData, setQrData] = useState('');
  const [copied, setCopied] = useState(false);
  const qrContainerRef = useRef(null);

  // Form states for different input types
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [contactInfo, setContactInfo] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    organization: '',
    url: ''
  });

  /**
   * Fallback QR generation using external APIs
   * @param {string} text - The text to encode
   */
  const generateFallbackQR = useCallback((text) => {
    if (!qrContainerRef.current) return;

    // Clear previous content
    qrContainerRef.current.innerHTML = '';
    
    // Create img element for fallback
    const img = document.createElement('img');
    const encodedData = encodeURIComponent(text);
    img.src = `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodedData}&choe=UTF-8`;
    img.alt = t('qrCodeAlt');
    img.className = 'qr-image';
    img.style.maxWidth = '300px';
    img.style.height = 'auto';
    img.style.borderRadius = '12px';
    img.style.border = '2px solid #646669';
    
    // Add error handling for the fallback image
    img.onerror = () => {
      // If Google Charts also fails, try QR Server API
      img.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedData}&format=png&margin=10`;
    };
    
    qrContainerRef.current.appendChild(img);
  }, []);

  /**
   * Create QR code using QRious library
   * @param {string} text - The text to encode
   */
  const createQR = useCallback((text) => {
    if (!qrContainerRef.current) return;

    try {
      // Clear previous QR code
      qrContainerRef.current.innerHTML = '';
      
      // Create canvas element
      const canvas = document.createElement('canvas');
      qrContainerRef.current.appendChild(canvas);
      
      // Generate QR code with Monkeytype-inspired styling
      new window.QRious({
        element: canvas,
        value: text,
        size: 300,
        background: '#2c2e31', // Dark background matching Monkeytype theme
        foreground: '#e2b714', // Yellow accent color from Monkeytype
        level: 'M'
      });
      
      // Style the canvas with dark theme
      canvas.className = 'qr-canvas';
      canvas.style.maxWidth = '300px';
      canvas.style.height = 'auto';
      canvas.style.borderRadius = '12px';
      canvas.style.border = '2px solid #646669';
      
    } catch (error) {
      console.error('Error creating QR code:', error);
      generateFallbackQR(text);
    }
  }, [generateFallbackQR]);

  /**
   * Generate QR Code using QRious library with fallback options
   * @param {string} text - The text to encode in the QR code
   */
  const generateQRCode = useCallback(async (text) => {
    if (!text.trim()) {
      if (qrContainerRef.current) {
        qrContainerRef.current.innerHTML = '';
      }
      return;
    }

    try {
      // Load QRious library dynamically
      if (!window.QRious) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js';
        script.onload = () => {
          createQR(text);
        };
        document.head.appendChild(script);
      } else {
        createQR(text);
      }
    } catch (error) {
      console.error('Error loading QR library:', error);
      // Fallback to Google Charts API
      generateFallbackQR(text);
    }
  }, [createQR, generateFallbackQR]);

  /**
   * Format URL to ensure it has proper protocol
   * @param {string} url - The URL to format
   * @returns {string} - Formatted URL with protocol
   */
  const formatUrl = (url) => {
    if (!url.trim()) return '';

    // Add protocol if missing to ensure QR code triggers URL directly
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return 'https://' + url;
    }
    return url;
  };

  /**
   * Generate vCard format for contact information
   * @param {Object} contact - Contact information object
   * @returns {string} - vCard formatted string
   */
  const generateVCard = (contact) => {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${contact.firstName} ${contact.lastName}
N:${contact.lastName};${contact.firstName};;;
ORG:${contact.organization}
TEL:${contact.phone}
EMAIL:${contact.email}
URL:${contact.url}
END:VCARD`;
    return vcard;
  };

  // Effect to update QR data based on active tab and form inputs
  useEffect(() => {
    let data = '';

    switch (activeTab) {
      case 'url':
        data = formatUrl(urlInput);
        break;
      case 'text':
        data = textInput;
        break;
      case 'contact':
        if (contactInfo.firstName || contactInfo.lastName || contactInfo.phone || contactInfo.email) {
          data = generateVCard(contactInfo);
        }
        break;
      default:
        data = '';
    }
    
    setQrData(data);
    generateQRCode(data);
  }, [activeTab, urlInput, textInput, contactInfo, generateQRCode]);

  /**
   * Download the generated QR code as PNG
   */
  const downloadQRCode = () => {
    if (!qrData) return;

    const canvas = qrContainerRef.current?.querySelector('canvas');
    const img = qrContainerRef.current?.querySelector('img');
    
    if (canvas) {
      // Download from canvas
      const link = document.createElement('a');
      link.download = `qr-code-${activeTab}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } else if (img) {
      // Download from image
      const link = document.createElement('a');
      link.download = `qr-code-${activeTab}.png`;
      link.href = img.src;
      link.click();
    }
  };

  /**
   * Copy QR data to clipboard
   */
  const copyToClipboard = async () => {
    if (qrData) {
      try {
        await navigator.clipboard.writeText(qrData);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    }
  };

  /**
   * Reset all form fields and clear QR code
   */
  const resetForm = () => {
    setUrlInput('');
    setTextInput('');
    setContactInfo({
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      organization: '',
      url: ''
    });
    setQrData('');
    if (qrContainerRef.current) {
      qrContainerRef.current.innerHTML = '';
    }
  };

  // Tab configuration with icons
  const tabs = [
    { id: 'url', label: t('urlTab'), icon: Link },
    { id: 'text', label: t('textTab'), icon: MessageSquare },
    { id: 'contact', label: t('contactTab'), icon: User }
  ];

  return (
    <div className="app-container">
      <div className="main-content">
        {/* Header Section */}
        <div className="header">
          <div className="header-brand">
            <div className="logo-container">
              <QrCode className="logo-icon" />
            </div>
            <h1 className="app-title">
              {t('appTitle')}
            </h1>
          </div>
          <p className="app-description">{t('appDescription')}</p>
        </div>

        {/* Main Card */}
        <div className="main-card">
          {/* Tab Navigation */}
          <div className="tab-navigation">
            <nav className="tab-nav">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`tab-button ${
                      activeTab === tab.id ? 'tab-active' : 'tab-inactive'
                    }`}
                  >
                    <IconComponent className="tab-icon" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="card-content">
            <div className="content-grid">
              {/* Input Section */}
              <div className="input-section">
                <h2 className="section-title">
                  {activeTab === 'url' && t('enterUrl')}
                  {activeTab === 'text' && t('enterText')}
                  {activeTab === 'contact' && t('contactInformation')}
                </h2>

                {/* URL Input */}
                {activeTab === 'url' && (
                  <div className="input-group">
                    <label className="input-label">
                      {t('websiteUrl')}
                    </label>
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder={t('urlPlaceholder')}
                      className="text-input"
                    />
                    <p className="input-help">
                      {t('urlHelp')}
                    </p>
                  </div>
                )}

                {/* Text Input */}
                {activeTab === 'text' && (
                  <div className="input-group">
                    <label className="input-label">
                      {t('textContent')}
                    </label>
                    <textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder={t('textPlaceholder')}
                      rows={4}
                      className="textarea-input"
                    />
                  </div>
                )}

                {/* Contact Input */}
                {activeTab === 'contact' && (
                  <div className="contact-form">
                    <div className="contact-row">
                      <div className="input-group">
                        <label className="input-label">
                          {t('firstName')}
                        </label>
                        <input
                          type="text"
                          value={contactInfo.firstName}
                          onChange={(e) => setContactInfo({...contactInfo, firstName: e.target.value})}
                          placeholder={t('firstNamePlaceholder')}
                          className="text-input"
                        />
                      </div>
                      <div className="input-group">
                        <label className="input-label">
                          {t('lastName')}
                        </label>
                        <input
                          type="text"
                          value={contactInfo.lastName}
                          onChange={(e) => setContactInfo({...contactInfo, lastName: e.target.value})}
                          placeholder={t('lastNamePlaceholder')}
                          className="text-input"
                        />
                      </div>
                    </div>
                    
                    <div className="input-group">
                      <label className="input-label">
                        {t('phoneNumber')}
                      </label>
                      <input
                        type="tel"
                        value={contactInfo.phone}
                        onChange={(e) => setContactInfo({...contactInfo, phone: e.target.value})}
                        placeholder={t('phonePlaceholder')}
                        className="text-input"
                      />
                    </div>
                    
                    <div className="input-group">
                      <label className="input-label">
                        {t('emailAddress')}
                      </label>
                      <input
                        type="email"
                        value={contactInfo.email}
                        onChange={(e) => setContactInfo({...contactInfo, email: e.target.value})}
                        placeholder={t('emailPlaceholder')}
                        className="text-input"
                      />
                    </div>
                    
                    <div className="input-group">
                      <label className="input-label">
                        {t('organization')}
                      </label>
                      <input
                        type="text"
                        value={contactInfo.organization}
                        onChange={(e) => setContactInfo({...contactInfo, organization: e.target.value})}
                        placeholder={t('organizationPlaceholder')}
                        className="text-input"
                      />
                    </div>
                    
                    <div className="input-group">
                      <label className="input-label">
                        {t('website')}
                      </label>
                      <input
                        type="url"
                        value={contactInfo.url}
                        onChange={(e) => setContactInfo({...contactInfo, url: e.target.value})}
                        placeholder={t('websitePlaceholder')}
                        className="text-input"
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={resetForm}
                  className="clear-button"
                >
                  {t('clearAllFields')}
                </button>
              </div>

              {/* QR Code Display Section */}
              <div className="qr-section">
                <h2 className="section-title">{t('generatedQrCode')}</h2>
                
                <div className="qr-container">
                  {qrData ? (
                    <div className="qr-display">
                      <div ref={qrContainerRef} className="qr-code-wrapper">
                        {/* QR code will be dynamically inserted here */}
                      </div>
                      <p className="qr-instruction">
                        {t('scanQrCode')}
                      </p>
                    </div>
                  ) : (
                    <div className="qr-placeholder">
                      <QrCode className="placeholder-icon" />
                      <p className="placeholder-text">
                        {t('fillFormPrompt')}
                      </p>
                    </div>
                  )}
                </div>

                {qrData && (
                  <div className="action-buttons">
                    <button
                      onClick={downloadQRCode}
                      className="action-button primary"
                    >
                      <Download className="button-icon" />
                      {t('download')}
                    </button>
                    
                    <button
                      onClick={copyToClipboard}
                      className="action-button secondary"
                    >
                      {copied ? (
                        <>
                          <Check className="button-icon success" />
                          {t('copied')}
                        </>
                      ) : (
                        <>
                          <Copy className="button-icon" />
                          {t('copyData')}
                        </>
                      )}
                    </button>
                  </div>
                )}

                {qrData && (
                  <div className="qr-data-display">
                    <h3 className="data-title">{t('qrCodeData')}</h3>
                    <div className="data-content">
                      <pre className="data-text">{qrData}</pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="footer">
          <p className="footer-text">{t('footerText')}</p>
        </div>
      </div>
    </div>
  );
};

export default QRCodeGenerator;