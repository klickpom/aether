// --- Elements ---
const langToggleBtn = document.getElementById('langToggle');
const mode3DToggleBtn = document.getElementById('mode3DToggle');
const perspectiveScene = document.getElementById('perspectiveScene');
const htmlEl = document.documentElement;

// --- State ---
let userData = { package: '', industry: '', goal: '', platform: '', features: [], integrations: [], readiness: '', timeline: '', payment: 'FiftyFifty' };
let currentLang = 'ar';
let is3DMode = false;
let plannerBound = false;
window.__AETHER_VERSION = '31.0';

function onReady(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback);
    } else {
        callback();
    }
}

// --- 1. Language Toggle ---
onReady(() => {
    updateContentLanguage();
});

if (langToggleBtn) {
    langToggleBtn.addEventListener('click', () => {
        currentLang = currentLang === 'ar' ? 'en' : 'ar';
        htmlEl.setAttribute('lang', currentLang);
        htmlEl.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');
        updateContentLanguage();
        
        const arText = langToggleBtn.querySelector('.arabic-only');
        const enText = langToggleBtn.querySelector('.english-only');
        
        if (currentLang === 'ar') {
            arText.style.display = 'block'; enText.style.display = 'none';
        } else {
            arText.style.display = 'none'; enText.style.display = 'block';
        }
    });
}

function scrambleText(element, newText) {
    const chars = 'XO^#*+=>_\\/[]{}';
    let iteration = 0;
    
    if(!newText) return;
    clearInterval(element.scrambleInterval);
    
    element.scrambleInterval = setInterval(() => {
        element.innerText = newText.split('').map((letter, index) => {
            if (index < iteration) return newText[index];
            return chars[Math.floor(Math.random() * chars.length)];
        }).join('');
        
        if (iteration >= newText.length) {
            clearInterval(element.scrambleInterval);
            element.innerHTML = newText;
        }
        iteration += 1 / 2;
    }, 20);
}

function updateContentLanguage() {
    const elements = document.querySelectorAll('[data-lang-ar]');
    elements.forEach(el => {
        const targetText = currentLang === 'ar' ? el.getAttribute('data-lang-ar') : el.getAttribute('data-lang-en');
        el.innerHTML = targetText;
    });
    if (typeof populateCurrencySelectors === 'function') populateCurrencySelectors();
    if (typeof updateStaticPlanPrices === 'function') updateStaticPlanPrices();
    if (typeof updateCurrencyNote === 'function') updateCurrencyNote();
    if (typeof syncPlannerLabels === 'function') syncPlannerLabels();
    if (typeof updatePlanner === 'function') updatePlanner();
}

// --- 2. Interactive Isometric 3D Mode Toggle ---
if (mode3DToggleBtn) {
    mode3DToggleBtn.addEventListener('click', () => {
        is3DMode = !is3DMode;
        if (is3DMode) {
            perspectiveScene.classList.add('is-3d-active');
            mode3DToggleBtn.style.color = 'var(--neon-pink)';
            mode3DToggleBtn.style.boxShadow = '0 0 20px var(--neon-pink)';
        } else {
            perspectiveScene.classList.remove('is-3d-active');
            mode3DToggleBtn.style.color = '';
            mode3DToggleBtn.style.boxShadow = '';
        }
    });
}

// --- 3. 3D Card Hover Physics Tilt ---
const tiltCards = document.querySelectorAll('.tilt-card');
tiltCards.forEach(card => {
    const inner = card.querySelector('.tilt-card-inner');
    
    card.addEventListener('mousemove', e => {
        // Only run physics if NOT in master 3D mode (or you can keep it on, but it gets crazy)
        if (is3DMode) return; 
        if (e.target?.closest?.('.plan-cta, .action-btn, button, a, select, textarea, input')) return;

        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = ((y - centerY) / centerY) * -15; // Max 15 degree tilt
        const rotateY = ((x - centerX) / centerX) * 15;
        
        inner.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });
    
    card.addEventListener('mouseleave', () => {
        if (is3DMode) return;
        inner.style.transform = `rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    });
});

// --- 4. Intelligent Project Planner ---
let currentPlannerStep = 1;
const totalPlannerSteps = 8;
let plannerMessage = '';

const planCopy = {
    ar: {
        mvp: 'MVP ذكي',
        growth: 'منصة نمو احترافية',
        advanced: 'نظام متقدم قابل للتوسع',
        enterprise: 'منظومة كاملة للمؤسسات',
        reasonMvp: 'سبرنت سريع يناسب مشروع يريد حضور قوي بأقل تكلفة ووقت.',
        reasonGrowth: 'مناسب للبيع والحجوزات بسرعة مع لوحة تحكم وتكاملات أساسية.',
        reasonAdvanced: 'مناسب لنظام تشغيل حقيقي بتقارير وصلاحيات وأتمتة عملية.',
        reasonEnterprise: 'مناسب لمنظومة كبيرة نبدأها بإصدار أول سريع ثم نوسعها.',
        days: 'أيام',
        weeks: 'أسابيع',
        egp: 'ج.م'
    },
    en: {
        mvp: 'Smart MVP',
        growth: 'Professional Growth Platform',
        advanced: 'Advanced Scalable System',
        enterprise: 'Enterprise Ecosystem',
        reasonMvp: 'A fast sprint for a strong launch at lower cost and time.',
        reasonGrowth: 'Built for quick selling or booking with dashboard and core integrations.',
        reasonAdvanced: 'Built for real operations with reports, roles, and practical automation.',
        reasonEnterprise: 'A larger ecosystem started as a fast first release, then expanded.',
        days: 'days',
        weeks: 'weeks',
        egp: 'EGP'
    }
};

const packageEstimateOverrides = {
    Launch: { low: 4500, high: 7500, daysMin: 1, daysMax: 3 },
    Business: { low: 9500, high: 16500, daysMin: 3, daysMax: 5 },
    SmartSystem: { low: 19500, high: 35000, daysMin: 5, daysMax: 9 },
    Ecosystem: { low: 39500, high: 75000, daysMin: 10, daysMax: 18 }
};

const platformEstimateOverrides = {
    Landing: { low: 4500, high: 7500, daysMin: 1, daysMax: 3 },
    Website: { low: 5000, high: 8000, daysMin: 1, daysMax: 3 },
    Store: { low: 9500, high: 16500, daysMin: 3, daysMax: 5 },
    Dashboard: { low: 19500, high: 35000, daysMin: 5, daysMax: 9 },
    Mobile: { low: 25000, high: 45000, daysMin: 7, daysMax: 12 },
    Ecosystem: { low: 39500, high: 75000, daysMin: 10, daysMax: 18 }
};

const leadMessages = {
    ar: {
        consultation: 'مرحباً فريق AETHER، أريد استشارة مجانية لمشروع برمجة أو موقع أو تطبيق. ممكن نحدد أفضل باقة وخطة تنفيذ مناسبة؟',
        footer: 'مرحباً فريق AETHER، أريد التواصل بخصوص خدمات البرمجة والباقات المتاحة للشركات في مصر.',
        custom: 'مرحباً فريق AETHER، أريد بناء مشروع مخصص وأحتاج مساعدتكم في تحديد أفضل خطة وسعر مناسب.'
    },
    en: {
        consultation: 'Hello AETHER Team, I would like a free consultation for a website, app, or software project. Can we define the best package and delivery plan?',
        footer: 'Hello AETHER Team, I would like to ask about your coding services and packages for businesses in Egypt.',
        custom: 'Hello AETHER Team, I want to build a custom project and need help defining the best plan and price.'
    }
};

function plannerText(ar, en) {
    return currentLang === 'ar' ? ar : en;
}

const currencyCountries = [
    { key: 'EG', countryAr: 'مصر', countryEn: 'Egypt', currency: 'EGP', nameAr: 'جنيه مصري', nameEn: 'Egyptian Pound', suffixAr: 'ج.م', step: 500 },
    { key: 'SA', countryAr: 'السعودية', countryEn: 'Saudi Arabia', currency: 'SAR', nameAr: 'ريال سعودي', nameEn: 'Saudi Riyal', suffixAr: 'ر.س', step: 10 },
    { key: 'AE', countryAr: 'الإمارات', countryEn: 'United Arab Emirates', currency: 'AED', nameAr: 'درهم إماراتي', nameEn: 'UAE Dirham', suffixAr: 'د.إ', step: 10 },
    { key: 'KW', countryAr: 'الكويت', countryEn: 'Kuwait', currency: 'KWD', nameAr: 'دينار كويتي', nameEn: 'Kuwaiti Dinar', suffixAr: 'د.ك', step: 0.5 },
    { key: 'QA', countryAr: 'قطر', countryEn: 'Qatar', currency: 'QAR', nameAr: 'ريال قطري', nameEn: 'Qatari Riyal', suffixAr: 'ر.ق', step: 10 },
    { key: 'BH', countryAr: 'البحرين', countryEn: 'Bahrain', currency: 'BHD', nameAr: 'دينار بحريني', nameEn: 'Bahraini Dinar', suffixAr: 'د.ب', step: 0.5 },
    { key: 'OM', countryAr: 'عمان', countryEn: 'Oman', currency: 'OMR', nameAr: 'ريال عماني', nameEn: 'Omani Rial', suffixAr: 'ر.ع', step: 0.5 },
    { key: 'JO', countryAr: 'الأردن', countryEn: 'Jordan', currency: 'JOD', nameAr: 'دينار أردني', nameEn: 'Jordanian Dinar', suffixAr: 'د.أ', step: 0.5 },
    { key: 'IQ', countryAr: 'العراق', countryEn: 'Iraq', currency: 'IQD', nameAr: 'دينار عراقي', nameEn: 'Iraqi Dinar', suffixAr: 'د.ع', step: 1000 },
    { key: 'MA', countryAr: 'المغرب', countryEn: 'Morocco', currency: 'MAD', nameAr: 'درهم مغربي', nameEn: 'Moroccan Dirham', suffixAr: 'د.م', step: 20 },
    { key: 'DZ', countryAr: 'الجزائر', countryEn: 'Algeria', currency: 'DZD', nameAr: 'دينار جزائري', nameEn: 'Algerian Dinar', suffixAr: 'د.ج', step: 500 },
    { key: 'TN', countryAr: 'تونس', countryEn: 'Tunisia', currency: 'TND', nameAr: 'دينار تونسي', nameEn: 'Tunisian Dinar', suffixAr: 'د.ت', step: 1 },
    { key: 'LY', countryAr: 'ليبيا', countryEn: 'Libya', currency: 'LYD', nameAr: 'دينار ليبي', nameEn: 'Libyan Dinar', suffixAr: 'د.ل', step: 5 },
    { key: 'TR', countryAr: 'تركيا', countryEn: 'Turkey', currency: 'TRY', nameAr: 'ليرة تركية', nameEn: 'Turkish Lira', suffixAr: 'TRY', step: 25 },
    { key: 'US', countryAr: 'أمريكا', countryEn: 'United States', currency: 'USD', nameAr: 'دولار أمريكي', nameEn: 'US Dollar', suffixAr: 'USD', step: 5 },
    { key: 'CA', countryAr: 'كندا', countryEn: 'Canada', currency: 'CAD', nameAr: 'دولار كندي', nameEn: 'Canadian Dollar', suffixAr: 'CAD', step: 5 },
    { key: 'GB', countryAr: 'بريطانيا', countryEn: 'United Kingdom', currency: 'GBP', nameAr: 'جنيه إسترليني', nameEn: 'British Pound', suffixAr: 'GBP', step: 5 },
    { key: 'EU', countryAr: 'دول اليورو', countryEn: 'Eurozone', currency: 'EUR', nameAr: 'يورو', nameEn: 'Euro', suffixAr: 'EUR', step: 5 },
    { key: 'AU', countryAr: 'أستراليا', countryEn: 'Australia', currency: 'AUD', nameAr: 'دولار أسترالي', nameEn: 'Australian Dollar', suffixAr: 'AUD', step: 5 }
];

const currencyFallbackRates = {
    EGP: 1,
    SAR: 0.077,
    AED: 0.075,
    KWD: 0.0063,
    QAR: 0.075,
    BHD: 0.0077,
    OMR: 0.0079,
    JOD: 0.0146,
    IQD: 27,
    MAD: 0.19,
    DZD: 2.75,
    TND: 0.064,
    LYD: 0.1,
    TRY: 0.67,
    USD: 0.0206,
    CAD: 0.028,
    GBP: 0.016,
    EUR: 0.019,
    AUD: 0.031
};

let currencyRates = { ...currencyFallbackRates };
let currencyRatesLive = false;

function safeStorageGet(key) {
    try { return localStorage.getItem(key); } catch (error) { return null; }
}

function safeStorageSet(key, value) {
    try { localStorage.setItem(key, value); } catch (error) {}
}

function detectInitialCurrencyKey() {
    const saved = safeStorageGet('aether_currency_country');
    if (saved && currencyCountries.some(item => item.key === saved)) return saved;

    try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const timezoneMap = {
            'Africa/Cairo': 'EG',
            'Asia/Riyadh': 'SA',
            'Asia/Dubai': 'AE',
            'Asia/Kuwait': 'KW',
            'Asia/Qatar': 'QA',
            'Asia/Bahrain': 'BH',
            'Asia/Muscat': 'OM',
            'Asia/Amman': 'JO',
            'Asia/Baghdad': 'IQ',
            'Africa/Casablanca': 'MA',
            'Africa/Algiers': 'DZ',
            'Africa/Tunis': 'TN',
            'Africa/Tripoli': 'LY',
            'Europe/Istanbul': 'TR',
            'America/New_York': 'US',
            'America/Chicago': 'US',
            'America/Denver': 'US',
            'America/Los_Angeles': 'US',
            'America/Toronto': 'CA',
            'Europe/London': 'GB',
            'Europe/Paris': 'EU',
            'Europe/Berlin': 'EU',
            'Europe/Rome': 'EU',
            'Australia/Sydney': 'AU'
        };
        if (timezoneMap[timezone]) return timezoneMap[timezone];
    } catch (error) {}

    const language = typeof navigator !== 'undefined' ? (navigator.language || '') : '';
    const languageCountry = language.split('-')[1]?.toUpperCase();
    if (languageCountry && currencyCountries.some(item => item.key === languageCountry)) return languageCountry;

    return 'EG';
}

let selectedCurrencyKey = detectInitialCurrencyKey();

function getCurrencyOption() {
    return currencyCountries.find(item => item.key === selectedCurrencyKey) || currencyCountries[0];
}

function getCurrencyOptionLabel(option) {
    return currentLang === 'ar'
        ? `${option.countryAr} - ${option.nameAr} (${option.currency})`
        : `${option.countryEn} - ${option.nameEn} (${option.currency})`;
}

function populateCurrencySelectors() {
    const optionsHtml = currencyCountries.map(option => `<option value="${option.key}">${getCurrencyOptionLabel(option)}</option>`).join('');
    document.querySelectorAll('[data-currency-select]').forEach(select => {
        select.innerHTML = optionsHtml;
        select.value = selectedCurrencyKey;
    });
}

function bindCurrencySelectors() {
    populateCurrencySelectors();
    document.querySelectorAll('[data-currency-select]').forEach(select => {
        if (select.dataset.boundCurrency === 'true') return;
        select.dataset.boundCurrency = 'true';
        select.addEventListener('change', () => {
            selectedCurrencyKey = select.value;
            safeStorageSet('aether_currency_country', selectedCurrencyKey);
            document.querySelectorAll('[data-currency-select]').forEach(peer => {
                peer.value = selectedCurrencyKey;
            });
            updateCurrencyDisplay();
        });
    });
}

function getStepDecimals(step) {
    if (Number.isInteger(step)) return 0;
    const text = String(step);
    return text.includes('.') ? text.split('.')[1].length : 0;
}

function roundConvertedPrice(value, option) {
    const step = option.step || 1;
    return Math.max(step, Math.round(value / step) * step);
}

function formatPrice(value) {
    const option = getCurrencyOption();
    const rate = currencyRates[option.currency] || 1;
    const converted = roundConvertedPrice(Math.max(0, value * rate), option);
    const decimals = getStepDecimals(option.step || 1);
    const formatted = converted.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
    return `${formatted} ${currentLang === 'ar' ? option.suffixAr : option.currency}`;
}

function formatEGP(value) {
    return formatPrice(value);
}

function formatPriceRange(low, high) {
    return `${formatPrice(low)} - ${formatPrice(high)}`;
}

function getSelectedCurrencyLine() {
    const option = getCurrencyOption();
    return currentLang === 'ar'
        ? `${option.countryAr} - ${option.nameAr} (${option.currency})`
        : `${option.countryEn} - ${option.nameEn} (${option.currency})`;
}

function updateCurrencyNote() {
    const note = document.getElementById('currencyRateNote');
    if (!note) return;
    const option = getCurrencyOption();
    if (option.currency === 'EGP') {
        note.textContent = plannerText('الأسعار معروضة بالجنيه المصري، وهو السعر الأساسي المعتمد.', 'Prices are shown in Egyptian Pound, the base pricing currency.');
        return;
    }
    note.textContent = currencyRatesLive
        ? plannerText('التحويل يتم تلقائياً حسب سعر الصرف المتاح عند فتح الصفحة، والسعر النهائي يؤكد على واتساب.', 'Conversion uses the available live exchange rate when the page opens; final pricing is confirmed on WhatsApp.')
        : plannerText('التحويل تقريبي احتياطي حتى يتاح سعر صرف مباشر، والسعر النهائي يؤكد على واتساب.', 'Conversion is an approximate fallback until a live exchange rate is available; final pricing is confirmed on WhatsApp.');
}

function updateStaticPlanPrices() {
    document.querySelectorAll('[data-base-price]').forEach(element => {
        const basePrice = Number(element.dataset.basePrice || 0);
        element.textContent = formatPrice(basePrice);
    });
}

function updateCurrencyDisplay() {
    populateCurrencySelectors();
    updateStaticPlanPrices();
    updateCurrencyNote();
    if (typeof updatePlanner === 'function') updatePlanner();
}

async function loadLiveCurrencyRates() {
    if (typeof fetch !== 'function') return;
    try {
        const response = await fetch('https://open.er-api.com/v6/latest/EGP', { cache: 'no-store' });
        if (!response.ok) throw new Error('Currency rate request failed');
        const data = await response.json();
        if (!data || !data.rates) throw new Error('Currency rates unavailable');
        currencyRates = { ...currencyRates, ...data.rates, EGP: 1 };
        currencyRatesLive = true;
        updateCurrencyDisplay();
    } catch (error) {
        currencyRatesLive = false;
        updateCurrencyNote();
    }
}

function getOptionLabel(field, value) {
    const selector = `.planner-option[data-field="${field}"][data-value="${value}"]`;
    const option = document.querySelector(selector);
    if (!option) return value;
    return currentLang === 'ar' ? option.dataset.labelAr : option.dataset.labelEn;
}

function getSelectedLabels(field) {
    const value = userData[field];
    if (Array.isArray(value)) return value.map(item => getOptionLabel(field, item));
    return value ? [getOptionLabel(field, value)] : [];
}

function syncPlannerLabels() {
    document.querySelectorAll('.planner-option').forEach(option => {
        const label = currentLang === 'ar' ? option.dataset.labelAr : option.dataset.labelEn;
        const span = option.querySelector('span');
        if (span && label) span.textContent = label;
        if (!span && label) option.textContent = label;
    });
}

function initializePlannerState() {
    document.querySelectorAll('.planner-option.active').forEach(option => {
        const field = option.dataset.field;
        const value = option.dataset.value;
        if (!field || !value) return;
        if (option.classList.contains('multi')) {
            if (!Array.isArray(userData[field])) userData[field] = [];
            if (!userData[field].includes(value)) userData[field].push(value);
        } else {
            userData[field] = value;
        }
    });
}

function setPlannerSingle(field, value) {
    document.querySelectorAll(`.planner-option[data-field="${field}"]`).forEach(option => {
        option.classList.toggle('active', option.dataset.value === value);
    });
    userData[field] = value;
}

function setPlannerMulti(field, value, isActive) {
    if (!Array.isArray(userData[field])) userData[field] = [];
    if (isActive) {
        if (!userData[field].includes(value)) userData[field].push(value);
    } else {
        userData[field] = userData[field].filter(item => item !== value);
    }
}

function calculatePlannerEstimate() {
    if (userData.package && packageEstimateOverrides[userData.package]) {
        return { ...packageEstimateOverrides[userData.package] };
    }

    const base = platformEstimateOverrides[userData.platform] || platformEstimateOverrides.Landing;
    let { low, high, daysMin, daysMax } = base;
    if (userData.timeline === 'Rush') {
        daysMin = Math.max(1, daysMin - 1);
        daysMax = Math.max(daysMin + 1, daysMax - 1);
    }
    if (userData.timeline === 'Flexible') {
        daysMax += 2;
    }
    return { low, high, daysMin, daysMax };
}

function getRecommendedPlan(estimate) {
    const copy = planCopy[currentLang];
    if (userData.package === 'Ecosystem' || userData.platform === 'Ecosystem') {
        return { name: copy.enterprise, reason: copy.reasonEnterprise };
    }
    if (['SmartSystem'].includes(userData.package) || ['Dashboard', 'Mobile'].includes(userData.platform)) {
        return { name: copy.advanced, reason: copy.reasonAdvanced };
    }
    if (userData.package === 'Business' || userData.platform === 'Store') {
        return { name: copy.growth, reason: copy.reasonGrowth };
    }
    return { name: copy.mvp, reason: copy.reasonMvp };
}

function buildPlannerMessage(estimate, recommendation) {
    const features = getSelectedLabels('features');
    const integrations = getSelectedLabels('integrations');
    const selectedCurrency = getSelectedCurrencyLine();
    const estimateRange = formatPriceRange(estimate.low, estimate.high);
    if (currentLang === 'ar') {
        return `مرحباً فريق AETHER،

أريد عرض سعر مبدئي بناءً على اختياراتي من نظام AETHER الذكي:

الخطة المقترحة: ${recommendation.name}
دولة العميل / العملة: ${selectedCurrency}
السعر المبدئي: ${estimateRange}
مدة التنفيذ المتوقعة: ${estimate.daysMin} - ${estimate.daysMax} يوم
نظام الدفع: 50% قبل البدء + 50% بعد المعاينة النهائية وقبل التسليم/النشر
ملاحظة السعر: السعر مبني على نوع المنصة أو الباقة الأساسية، وباقي الاختيارات لتوضيح المطلوب فقط. التحويل للعملة المختارة تقديري ويتم تأكيد النهائي على واتساب.

المجال: ${getOptionLabel('industry', userData.industry)}
الهدف: ${getOptionLabel('goal', userData.goal)}
نوع المنصة: ${getOptionLabel('platform', userData.platform)}
الجاهزية: ${getOptionLabel('readiness', userData.readiness)}
الإطار الزمني: ${getOptionLabel('timeline', userData.timeline)}

الخصائص المطلوبة: ${features.length ? features.join('، ') : 'لم يتم تحديد خصائص إضافية'}
التكاملات المطلوبة: ${integrations.length ? integrations.join('، ') : 'لم يتم تحديد تكاملات إضافية'}

ملاحظتي: أريد تنفيذ سريع ومنافس للسوق المستهدف مع الحفاظ على جودة التصميم وسهولة الاستخدام.`;
    }
    return `Hello AETHER Team,

I would like an initial quote based on my selections from the AETHER smart planner:

Recommended plan: ${recommendation.name}
Client country / currency: ${selectedCurrency}
Estimated price: ${estimateRange}
Expected delivery: ${estimate.daysMin} - ${estimate.daysMax} days
Payment: 50% before kickoff + 50% after final preview before handoff/publishing
Pricing note: pricing is based on the selected platform or core package; the other selections clarify the scope only. Currency conversion is an estimate and the final price is confirmed on WhatsApp.

Industry: ${getOptionLabel('industry', userData.industry)}
Goal: ${getOptionLabel('goal', userData.goal)}
Platform: ${getOptionLabel('platform', userData.platform)}
Readiness: ${getOptionLabel('readiness', userData.readiness)}
Timeline: ${getOptionLabel('timeline', userData.timeline)}

Required features: ${features.length ? features.join(', ') : 'No extra features selected'}
Required integrations: ${integrations.length ? integrations.join(', ') : 'No extra integrations selected'}

Note: I want fast delivery that competes strongly in the target market while keeping good UX and quality.`;
}

function updatePlanner() {
    const estimate = calculatePlannerEstimate();
    const recommendation = getRecommendedPlan(estimate);
    const range = formatPriceRange(estimate.low, estimate.high);
    const timeline = plannerText(`تسليم متوقع: ${estimate.daysMin}-${estimate.daysMax} يوم`, `Expected delivery: ${estimate.daysMin}-${estimate.daysMax} days`);

    const estimateRange = document.getElementById('estimateRange');
    const estimateTimeline = document.getElementById('estimateTimeline');
    const recommendedPlan = document.getElementById('recommendedPlan');
    const recommendedReason = document.getElementById('recommendedReason');
    const finalEstimate = document.getElementById('finalEstimate');
    const finalTimeline = document.getElementById('finalTimeline');
    const whatsappPreview = document.getElementById('whatsappPreview');

    if (estimateRange) estimateRange.textContent = range;
    if (estimateTimeline) estimateTimeline.textContent = timeline;
    if (recommendedPlan) recommendedPlan.textContent = recommendation.name;
    if (recommendedReason) recommendedReason.textContent = recommendation.reason;
    if (finalEstimate) finalEstimate.textContent = range;
    if (finalTimeline) finalTimeline.textContent = timeline;

    plannerMessage = buildPlannerMessage(estimate, recommendation);
    if (whatsappPreview) {
        whatsappPreview.value = plannerMessage;
        whatsappPreview.textContent = plannerMessage;
    }
}

function showPlannerStep(stepIndex) {
    currentPlannerStep = Math.min(totalPlannerSteps, Math.max(1, stepIndex));
    document.querySelectorAll('.planner-step').forEach(step => {
        step.classList.toggle('active', Number(step.dataset.step) === currentPlannerStep);
    });
    document.querySelectorAll('.planner-progress-item').forEach(item => {
        const itemStep = Number(item.dataset.jumpStep);
        item.classList.toggle('active', itemStep === currentPlannerStep);
        item.classList.toggle('completed', itemStep < currentPlannerStep);
    });
    const next = document.getElementById('plannerNext');
    const back = document.getElementById('plannerBack');
    if (next) {
        next.querySelector('span').textContent = currentPlannerStep === totalPlannerSteps ? plannerText('إرسال واتساب', 'Send WhatsApp') : plannerText('التالي', 'Next');
    }
    if (back) back.style.visibility = currentPlannerStep === 1 ? 'hidden' : 'visible';
    updatePlanner();
}

function bindPlanner() {
    if (plannerBound) {
        syncPlannerLabels();
        updatePlanner();
        return;
    }
    plannerBound = true;
    initializePlannerState();
    syncPlannerLabels();
    document.querySelectorAll('.planner-option').forEach(option => {
        option.addEventListener('click', () => {
            const field = option.dataset.field;
            const value = option.dataset.value;
            if (!field || !value) return;
            userData.package = '';
            if (option.classList.contains('multi')) {
                option.classList.toggle('active');
                setPlannerMulti(field, value, option.classList.contains('active'));
            } else {
                setPlannerSingle(field, value);
            }
            updatePlanner();
        });
    });
    document.querySelectorAll('.planner-progress-item').forEach(item => {
        item.addEventListener('click', () => showPlannerStep(Number(item.dataset.jumpStep)));
    });
    const next = document.getElementById('plannerNext');
    const back = document.getElementById('plannerBack');
    if (next) next.addEventListener('click', () => {
        if (currentPlannerStep === totalPlannerSteps) {
            sendWhatsApp();
            return;
        }
        showPlannerStep(currentPlannerStep + 1);
    });
    if (back) back.addEventListener('click', () => showPlannerStep(currentPlannerStep - 1));
    showPlannerStep(1);
}

function applyPackagePreset(pkgName) {
    const presets = {
        Launch: {
            industry: 'LocalService', goal: 'Leads', platform: 'Landing', readiness: 'Ready', timeline: 'Standard', payment: 'FiftyFifty',
            features: ['Responsive', 'SEO', 'Maps'], integrations: ['WhatsApp', 'MetaPixel', 'Analytics']
        },
        Business: {
            industry: 'Ecommerce', goal: 'Sell', platform: 'Store', readiness: 'Ready', timeline: 'Standard', payment: 'FiftyFifty',
            features: ['Responsive', 'CMS', 'Products', 'Orders', 'SEO'], integrations: ['WhatsApp', 'MetaPixel', 'Analytics', 'Paymob', 'Shipping']
        },
        SmartSystem: {
            industry: 'Enterprise', goal: 'Operations', platform: 'Dashboard', readiness: 'Idea', timeline: 'Standard', payment: 'FiftyFifty',
            features: ['Responsive', 'Roles', 'Reports', 'AIChat', 'Automation'], integrations: ['WhatsApp', 'Analytics', 'Sheets', 'Odoo']
        },
        Ecosystem: {
            industry: 'SaaS', goal: 'Scale', platform: 'Ecosystem', readiness: 'Idea', timeline: 'Standard', payment: 'FiftyFifty',
            features: ['Responsive', 'CMS', 'Products', 'Orders', 'Roles', 'Reports', 'Notifications', 'AIChat', 'Automation'], integrations: ['WhatsApp', 'MetaPixel', 'Analytics', 'Paymob', 'Fawry', 'Shipping', 'SMS']
        }
    };
    const preset = presets[pkgName];
    if (!preset) return;
    userData.package = pkgName;
    ['industry', 'goal', 'platform', 'readiness', 'timeline', 'payment'].forEach(field => setPlannerSingle(field, preset[field]));
    ['features', 'integrations'].forEach(field => {
        userData[field] = [];
        document.querySelectorAll(`.planner-option[data-field="${field}"]`).forEach(option => {
            const active = preset[field].includes(option.dataset.value);
            option.classList.toggle('active', active);
            if (active) userData[field].push(option.dataset.value);
        });
    });
    updatePlanner();
}

function scrollToSection(targetSelector) {
    const target = typeof targetSelector === 'string' ? document.querySelector(targetSelector) : targetSelector;
    if (!target) return false;
    target.classList.add('active');
    const navHeight = document.querySelector('.nav-container')?.offsetHeight || 0;
    const offset = navHeight + 18;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    return true;
}

function getLeadMessage(intent = 'consultation') {
    const copy = leadMessages[currentLang] || leadMessages.ar;
    return copy[intent] || copy.consultation;
}

function openWhatsApp(message) {
    const encodedMsg = encodeURIComponent(message || getLeadMessage('consultation'));
    const url = `https://wa.me/201123824979?text=${encodedMsg}`;
    const opened = window.open(url, '_blank', 'noopener');
    if (!opened) window.location.href = url;
}

function sendWhatsApp() {
    updatePlanner();
    openWhatsApp(plannerMessage);
}

function copyPlannerMessage(triggerButton) {
    updatePlanner();
    const preview = document.getElementById('whatsappPreview');
    const markCopied = () => {
        if (!triggerButton) return;
        const label = triggerButton.querySelector('span');
        if (!label) return;
        const original = label.textContent;
        label.textContent = plannerText('تم النسخ', 'Copied');
        setTimeout(() => { label.textContent = original; }, 1400);
    };
    if (navigator.clipboard) {
        navigator.clipboard.writeText(plannerMessage).then(markCopied).catch(() => {});
    }
    if (preview) {
        preview.focus();
        preview.select();
        try {
            document.execCommand('copy');
            markCopied();
        } catch (error) {}
    }
}

function selectPackage(pkgName) {
    if (!pkgName) return;
    if (!plannerBound) bindPlanner();
    applyPackagePreset(pkgName);
    showPlannerStep(8);
    if (window.location.hash !== '#wizard') {
        history.replaceState(null, '', '#wizard');
    }
    requestAnimationFrame(() => scrollToSection('#wizard'));
}

onReady(() => {
    bindCurrencySelectors();
    updateCurrencyDisplay();
    loadLiveCurrencyRates();
});

onReady(bindPlanner);

function handlePlanButtonClick(event) {
    const planButton = event.target.closest('[data-plan]');
    if (!planButton) return;
    event.preventDefault();
    event.stopPropagation();
    selectPackage(planButton.dataset.plan);
}

function bindGlobalActions() {
    if (document.documentElement.dataset.planDelegationBound !== 'true') {
        document.documentElement.dataset.planDelegationBound = 'true';
        document.addEventListener('click', handlePlanButtonClick, true);
    }

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        if (anchor.dataset.boundScroll === 'true') return;
        anchor.dataset.boundScroll = 'true';
        anchor.addEventListener('click', event => {
            if (anchor.dataset.plan) return;
            const hash = anchor.getAttribute('href');
            if (!hash || hash === '#') return;
            const target = document.querySelector(hash);
            if (!target) return;
            event.preventDefault();
            history.replaceState(null, '', hash);
            scrollToSection(hash);
        });
    });

    document.querySelectorAll('[data-plan]').forEach(button => {
        if (button.dataset.boundPlan === 'true') return;
        button.dataset.boundPlan = 'true';
        button.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            selectPackage(button.dataset.plan);
        });
        button.addEventListener('pointerup', event => {
            if (event.pointerType === 'mouse' && event.button !== 0) return;
            event.preventDefault();
            event.stopPropagation();
            selectPackage(button.dataset.plan);
        });
        button.addEventListener('keydown', event => {
            if (!['Enter', ' '].includes(event.key)) return;
            event.preventDefault();
            selectPackage(button.dataset.plan);
        });
    });

    document.querySelectorAll('[data-whatsapp-lead]').forEach(link => {
        if (link.dataset.boundWhatsapp === 'true') return;
        link.dataset.boundWhatsapp = 'true';
        link.addEventListener('click', event => {
            event.preventDefault();
            openWhatsApp(getLeadMessage(link.dataset.whatsappLead));
        });
    });

    document.querySelectorAll('[data-action="send-planner-whatsapp"]').forEach(button => {
        if (button.dataset.boundAction === 'true') return;
        button.dataset.boundAction = 'true';
        button.addEventListener('click', sendWhatsApp);
    });

    document.querySelectorAll('[data-action="copy-planner-message"]').forEach(button => {
        if (button.dataset.boundAction === 'true') return;
        button.dataset.boundAction = 'true';
        button.addEventListener('click', () => copyPlannerMessage(button));
    });

    document.querySelectorAll('[data-action="scroll-top"]').forEach(button => {
        if (button.dataset.boundAction === 'true') return;
        button.dataset.boundAction = 'true';
        button.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    });
}

onReady(bindGlobalActions);

window.selectPackage = selectPackage;
window.sendWhatsApp = sendWhatsApp;
window.copyPlannerMessage = copyPlannerMessage;

// --- Custom Cursor Logic ---
const cursor = document.querySelector('.custom-cursor');
const follower = document.querySelector('.custom-cursor-follower');
let mouseX = 0, mouseY = 0, followerX = 0, followerY = 0;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (cursor) {
        cursor.style.left = mouseX + 'px';
        cursor.style.top = mouseY + 'px';
    }
});

function animateFollower() {
    if (follower) {
        let dx = mouseX - followerX;
        let dy = mouseY - followerY;
        followerX += dx * 0.15;
        followerY += dy * 0.15;
        follower.style.left = followerX + 'px';
        follower.style.top = followerY + 'px';
    }
    requestAnimationFrame(animateFollower);
}
animateFollower();

const interactives = document.querySelectorAll('a, button, .icon-btn, .tilt-card, .terminal-option, .site-logo, .footer-logo');
interactives.forEach(el => {
    el.addEventListener('mouseenter', () => { if(follower) follower.classList.add('hover-active'); });
    el.addEventListener('mouseleave', () => { if(follower) follower.classList.remove('hover-active'); });
});

// --- Scroll Reveal Animations ---
function revealElements() {
    var reveals = document.querySelectorAll('.reveal');
    for (var i = 0; i < reveals.length; i++) {
        var windowHeight = window.innerHeight;
        var elementTop = reveals[i].getBoundingClientRect().top;
        var elementVisible = 150;
        
        if (elementTop < windowHeight - elementVisible) {
            if(!reveals[i].classList.contains('active')) {
                reveals[i].classList.add('active');
                
                // Keep revealed titles immediately readable.
                const title = reveals[i].querySelector('.section-title');
                if(title && !title.classList.contains('scrambled')) {
                    title.classList.add('scrambled');
                    title.innerText = document.documentElement.dir === 'ltr' ? (title.getAttribute('data-lang-en') || title.innerText) : (title.getAttribute('data-lang-ar') || title.innerText);
                }

                // Trigger Impact Counters
                if(reveals[i].classList.contains('impact-stats') && !reveals[i].classList.contains('counted')) {
                    reveals[i].classList.add('counted');
                    const counters = reveals[i].querySelectorAll('.counter');
                    counters.forEach(counter => {
                        const target = +counter.getAttribute('data-target');
                        const suffix = counter.getAttribute('data-suffix') || '';
                        let current = 0;
                        const increment = target / 50; // speed
                        const updateCount = () => {
                            current += increment;
                            if (current < target) {
                                counter.innerText = Math.ceil(current) + suffix;
                                setTimeout(updateCount, 25);
                            } else {
                                counter.innerText = target + suffix;
                            }
                        };
                        updateCount();
                    });
                }
            }
        }
    }
}
window.addEventListener('scroll', revealElements);
// Trigger once on load
setTimeout(revealElements, 100);

// --- Scroll Progress Bar ---
const scrollProgress = document.getElementById('scrollProgress');
window.addEventListener('scroll', () => {
    const totalHeight = document.body.scrollHeight - window.innerHeight;
    const progress = (window.scrollY / totalHeight) * 100;
    if(scrollProgress) scrollProgress.style.width = progress + '%';
});

// --- Preloader & Boot Logic ---
function initializeSplash() {
    const splash = document.getElementById('splashScreen');
    const bootSequence = document.getElementById('bootSequence');
    
    document.querySelectorAll('.site-logo, .footer-logo, .splash-logo').forEach(el => {
        el.style.opacity = "1";
    });
    
    // Boot sequence messages
    const msgs = [
        "AETHER SYSTEM KERNEL v4.0.1",
        "ESTABLISHING SECURE HANDSHAKE...",
        "MOUNTING 3D RENDER ENGINE...",
        "SYNCHRONIZING NEURAL GRID...",
        "ACCESS GRANTED."
    ];
    
    let delay = 0;
    msgs.forEach((msg, idx) => {
        setTimeout(() => {
            if(bootSequence) {
                const p = document.createElement('p');
                p.innerText = msg;
                bootSequence.appendChild(p);
            }
        }, delay);
        delay += 350; // Delay between lines
    });

    // Hide Splash Screen after sequence
    setTimeout(() => {
        if(splash) {
            splash.style.opacity = '0';
            splash.style.pointerEvents = 'none';
            splash.querySelectorAll('*').forEach(el => {
                el.style.pointerEvents = 'none';
            });
            setTimeout(() => {
                splash.classList.add('is-hidden');
                splash.style.display = 'none';
            }, 450);
        }
    }, 1800);
}

// Call instantly
initializeSplash();

// --- Cyber Text Scramble Effect ---
class TextScrambler {
    constructor(el) {
        this.el = el;
        this.chars = '!<>-_\\/[]{}—=+*^?#________';
        // Grab original text or data-lang-ar to preserve it
        this.originalText = el.getAttribute('data-lang-ar') || el.innerText;
    }
    scramble() {
        let iterations = 0;
        const interval = setInterval(() => {
            this.el.innerText = this.originalText.split('').map((char, index) => {
                if(char === ' ') return ' ';
                if (index < iterations) return char;
                return this.chars[Math.floor(Math.random() * this.chars.length)];
            }).join('');
            
            if (iterations >= this.originalText.length) {
                clearInterval(interval);
                this.el.innerText = document.documentElement.dir === 'ltr' ? (this.el.getAttribute('data-lang-en') || this.originalText) : this.originalText;
            }
            iterations += 1/4; 
        }, 40);
    }
}

// --- Advanced Magnetic Hover Physics ---
const magneticObjects = document.querySelectorAll('.btn-primary, .mode-3d-toggle');
magneticObjects.forEach(magnet => {
    magnet.addEventListener('mousemove', (e) => {
        const position = magnet.getBoundingClientRect();
        const x = e.clientX - position.left - position.width / 2;
        const y = e.clientY - position.top - position.height / 2;
        // Subtle magnetic pull towards cursor (multiplier dictates strength)
        magnet.style.transform = "translate(" + (x * 0.25) + "px, " + (y * 0.25) + "px) scale(1.05)";
    });
    magnet.addEventListener('mouseleave', () => {
        magnet.style.transform = "translate(0px, 0px) scale(1)";
    });
});

// --- Dynamic Parallax on Scroll ---
const bgOrbPurple = document.querySelector('.orb-purple');
const bgOrbIndigo = document.querySelector('.orb-indigo');

window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    if(bgOrbPurple) bgOrbPurple.style.transform = "translateY(" + (scrolled * -0.3) + "px)";
    if(bgOrbIndigo) bgOrbIndigo.style.transform = "translateY(" + (scrolled * -0.15) + "px)";
});

// --- Interactive Cursor Text on Portfolio ---
const portfolioCards = document.querySelectorAll('.portfolio .tilt-card');
const cursorTextSpan = document.querySelector('.cursor-text');

portfolioCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
        if(follower) {
            follower.classList.remove('hover-active');
            follower.classList.add('view-active');
        }
        if(cursorTextSpan) cursorTextSpan.innerText = currentLang === 'ar' ? 'عرض' : 'View';
    });
    card.addEventListener('mouseleave', () => {
        if(follower) follower.classList.remove('view-active');
        if(cursorTextSpan) cursorTextSpan.innerText = '';
    });
});

// --- Service Card Spotlight Glow ---
const serviceCards = document.querySelectorAll('.service-card');
serviceCards.forEach(card => {
    card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
    });
});

/* Countdown Logic */
function startCountdown() { let totalSeconds = 23 * 3600 + 45 * 60 + 30; if (localStorage.getItem('aether_countdown')) { totalSeconds = parseInt(localStorage.getItem('aether_countdown')); } setInterval(() => { if(totalSeconds <= 0) totalSeconds = 24 * 3600; totalSeconds--; localStorage.setItem('aether_countdown', totalSeconds); const h = Math.floor(totalSeconds / 3600); const m = Math.floor((totalSeconds % 3600) / 60); const s = totalSeconds % 60; const hEl = document.getElementById('cd-hours'); const mEl = document.getElementById('cd-minutes'); const sEl = document.getElementById('cd-seconds'); if(hEl) hEl.innerText = h.toString().padStart(2, '0'); if(mEl) mEl.innerText = m.toString().padStart(2, '0'); if(sEl) sEl.innerText = s.toString().padStart(2, '0'); }, 1000); } document.addEventListener('DOMContentLoaded', startCountdown);

/* --- Interactive 3D Showroom Logic --- */
document.addEventListener('DOMContentLoaded', () => {
    const projectBtns = document.querySelectorAll('.project-btn');
    const liveFrame = document.getElementById('liveFrame');
    const browserUrl = document.getElementById('browserUrl');
    const monitor3D = document.getElementById('monitor3D');
    const frameOverlay = document.getElementById('frameOverlay');

    if(projectBtns.length > 0 && liveFrame) {
        projectBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                // Update active state
                projectBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                // Update iframe and URL
                const url = this.getAttribute('data-url');
                // Only reload if different to prevent flashing
                if(liveFrame.src !== url) {
                    liveFrame.src = url;
                    browserUrl.textContent = url;
                }
                
                // Reset monitor state
                if(monitor3D) monitor3D.classList.remove('faces-user');
            });
        });

        // Click to interact logic
        if(frameOverlay && monitor3D) {
            frameOverlay.addEventListener('click', function() {
                monitor3D.classList.add('faces-user');
            });
        }
        
        // Optional: click outside reset
        document.addEventListener('click', function(e) {
            if(monitor3D && monitor3D.classList.contains('faces-user')) {
                // if clicked outside of the monitor wrapper
                if(!monitor3D.contains(e.target) && !e.target.closest('.project-btn')) {
                    monitor3D.classList.remove('faces-user');
                }
            }
        });
    }
});
