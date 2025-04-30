function initializeFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        
        question.addEventListener('click', () => {
            const isOpen = item.classList.contains('active');
            
            faqItems.forEach(i => {
                if (i !== item) {
                    i.classList.remove('active');
                    i.querySelector('.faq-answer').style.maxHeight = null;
                }
            });
            
            item.classList.toggle('active');
            if (!isOpen) {
                answer.style.maxHeight = answer.scrollHeight + 'px';
            } else {
                answer.style.maxHeight = null;
            }
        });
    });

    const searchInput = document.querySelector('.faq-search input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            const searchTerm = this.value.toLowerCase();
            searchFAQ(searchTerm);
        }, 300));
    }
}

function initializeArticles() {
    const searchInput = document.querySelector('.article-search input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            const searchTerm = this.value.toLowerCase();
            searchArticles(searchTerm);
        }, 300));
    }

    const categoryButtons = document.querySelectorAll('.article-category');
    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            const category = this.dataset.category;
            filterArticles(category);
            
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function populateRatesTable() {
    const tableBody = document.getElementById('ratesTableBody');
    if (tableBody) {
        for (const [currency, rate] of Object.entries(exchangeRates)) {
            if (currency !== 'USD') {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${currency}</td>
                    <td>${rate.toFixed(2)}</td>
                `;
                tableBody.appendChild(row);
            }
        }
    }
}

function initializeCurrency() {
    updateCurrencyRates().catch(error => {
        showToast('Using offline exchange rates', 'warning');
    });

    setInterval(() => {
        updateCurrencyRates().catch(console.error);
    }, 3600000);

    setupCurrencyConverter();

    const ratesTable = document.getElementById('ratesTableBody');
    if (ratesTable) {
        updateRatesTable();
    }
}

function setupCurrencyConverter() {
    const fromAmount = document.getElementById('fromValue');
    const fromCurrency = document.getElementById('fromUnit');
    const toCurrency = document.getElementById('toUnit');
    const convertBtn = document.querySelector('button[onclick="convert()"]');
    const resultBox = document.getElementById('result');

    if (fromAmount && fromCurrency && toCurrency) {
        fromAmount.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9.]/g, '');
        });

        const currencies = Object.keys(exchangeRates);
        [fromCurrency, toCurrency].forEach(select => {
            select.innerHTML = '';
            currencies.forEach(currency => {
                const option = new Option(
                    `${currency} - ${getCurrencyName(currency)}`,
                    currency
                );
                select.add(option);
            });
        });

        fromCurrency.value = 'USD';
        toCurrency.value = 'EUR';

        fromAmount.addEventListener('input', debounce(function() {
            if (this.value) convert();
        }, 500));

        const swapBtn = document.createElement('button');
        swapBtn.className = 'swap-currency-btn';
        swapBtn.innerHTML = '<i class="fas fa-exchange-alt"></i>';
        swapBtn.onclick = function() {
            const tempCurrency = fromCurrency.value;
            fromCurrency.value = toCurrency.value;
            toCurrency.value = tempCurrency;
            if (fromAmount.value) convert();
        };
        fromCurrency.parentNode.insertBefore(swapBtn, toCurrency);
    }
}

async function convertCurrency() {
    const fromAmount = document.getElementById('fromValue');
    const fromCurrency = document.getElementById('fromUnit');
    const toCurrency = document.getElementById('toUnit');
    const resultBox = document.getElementById('result');

    if (!fromAmount || !fromCurrency || !toCurrency || !resultBox) return;

    try {
        const amount = parseFloat(fromAmount.value);
        if (isNaN(amount)) {
            throw new Error('Please enter a valid amount');
        }

        const result = await performConversion(
            amount,
            fromCurrency.value,
            toCurrency.value,
            'currency'
        );

        displayCurrencyResult(
            amount,
            fromCurrency.value,
            result,
            toCurrency.value
        );
    } catch (error) {
        showError(error.message);
    }
}

function displayCurrencyResult(fromAmount, fromCurrency, result, toCurrency) {
    const resultBox = document.getElementById('result');
    if (!resultBox) return;

    resultBox.innerHTML = `
        <div class="result-content">
            <span class="from-value">${fromAmount.toFixed(2)} ${fromCurrency}</span>
            <span class="equals">=</span>
            <span class="to-value">${result} ${toCurrency}</span>
            <button class="copy-btn" onclick="copyToClipboard('${result} ${toCurrency}')">
                <i class="fas fa-copy"></i>
            </button>
        </div>
    `;
    resultBox.classList.add('has-result');

    const timestamp = document.createElement('div');
    timestamp.className = 'rate-timestamp';
    timestamp.textContent = `Last updated: ${new Date().toLocaleString()}`;
    resultBox.appendChild(timestamp);
}

function convert() {
    const fromValue = document.getElementById('fromValue').value;
    const fromUnit = document.getElementById('fromUnit').value;
    const toUnit = document.getElementById('toUnit').value;
    const type = document.getElementById('conversionType').value;

    if (!fromValue) {
        showToast('Please enter a value to convert', 'error');
        return;
    }

    try {
        const result = performConversion(type, parseFloat(fromValue), fromUnit, toUnit);
        document.getElementById('result').textContent = `${fromValue} ${fromUnit} = ${result} ${toUnit}`;
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function displayResult(fromValue, fromUnit, result, toUnit) {
    const resultBox = document.getElementById('result');
    if (!resultBox) return;

    const fromSymbol = getUnitSymbol(fromUnit);
    const toSymbol = getUnitSymbol(toUnit);

    resultBox.innerHTML = `
        <div class="result-content">
            <span class="from-value">${fromValue} ${fromSymbol}</span>
            <span class="equals">=</span>
            <span class="to-value">${result} ${toSymbol}</span>
            <button class="copy-btn" onclick="copyToClipboard('${result} ${toSymbol}')">
                <i class="fas fa-copy"></i>
            </button>
        </div>
    `;
    resultBox.classList.add('has-result');
}

function setupConverter(type) {
    const units = getAvailableUnits(type);
    const fromUnit = document.getElementById('fromUnit');
    const toUnit = document.getElementById('toUnit');
    
    if (fromUnit && toUnit) {
        fromUnit.innerHTML = '';
        toUnit.innerHTML = '';
        
        units.forEach(unit => {
            fromUnit.add(new Option(unit, unit));
            toUnit.add(new Option(unit, unit));
        });
        
        if (units.length > 1) {
            toUnit.selectedIndex = 1;
        }
        
        setupCommonConversions(type);

        const fromValue = document.getElementById('fromValue');
        if (fromValue) {
            fromValue.addEventListener('input', function() {
                if (type === 'currency') {
                    this.value = this.value.replace(/[^0-9.]/g, '');
                } else {
                    this.value = this.value.replace(/[^0-9.-]/g, '');
                }
            });

            fromValue.addEventListener('input', debounce(function() {
                if (this.value) convert();
            }, 300));
        }

        const swapBtn = document.createElement('button');
        swapBtn.className = 'swap-units-btn';
        swapBtn.innerHTML = '<i class="fas fa-exchange-alt"></i>';
        swapBtn.onclick = function() {
            const tempUnit = fromUnit.value;
            fromUnit.value = toUnit.value;
            toUnit.value = tempUnit;
            if (fromValue.value) convert();
        };
        fromUnit.parentNode.insertBefore(swapBtn, toUnit);
    }
}

function initializeUI() {
    const conversionType = document.getElementById('conversionType');
    updateUnitOptions(conversionType.value);
    setupCommonConversions(conversionType.value);
    initializeTheme();
}

document.addEventListener('DOMContentLoaded', () => {
    initializeUI();
    setupEventListeners();
});

function initializeConverters() {
    const conversionType = document.getElementById('conversionType');
    if (conversionType) {
        conversionType.addEventListener('change', updateUnitOptions);
        updateUnitOptions(); 
    }
}

function updateUnitOptions(type) {
    const fromUnit = document.getElementById('fromUnit');
    const toUnit = document.getElementById('toUnit');
    const units = getUnitsForType(type);

    fromUnit.innerHTML = '';
    toUnit.innerHTML = '';

    units.forEach(unit => {
        fromUnit.add(new Option(unit, unit));
        toUnit.add(new Option(unit, unit));
    });

    if (units.length > 1) {
        toUnit.selectedIndex = 1;
    }
}

function setupCommonConversions(type) {
    const table = document.getElementById('commonConversions');
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';

    const commonValues = getCommonConversions(type);
    commonValues.forEach(conv => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${conv.from} ${conv.fromUnit}</td>
            <td>=</td>
            <td>${conv.to} ${conv.toUnit}</td>
        `;
    });
}

function setupEventListeners() {
    const conversionType = document.getElementById('conversionType');
    const fromValue = document.getElementById('fromValue');
    const convertBtn = document.querySelector('.convert-btn');
    const themeToggle = document.getElementById('themeToggle');

    conversionType.addEventListener('change', (e) => {
        updateUnitOptions(e.target.value);
        setupCommonConversions(e.target.value);
    });

    fromValue.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            convert();
        }
    });

    convertBtn.addEventListener('click', convert);
    themeToggle.addEventListener('click', toggleTheme);

    const faqSection = document.querySelector('.faq-section');
    if (faqSection) {
        initializeFAQ();
    }

    const articlesSection = document.querySelector('.articles-section');
    if (articlesSection) {
        initializeArticles();
    }

    const historySection = document.querySelector('.history-section');
    if (historySection) {
        initializeHistory();
    }

    const chartSection = document.querySelector('.chart-section');
    if (chartSection) {
        initializeCharts();
    }

    setupScrollToTop();
}

function initializeActivePage() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });
}

function searchFAQ(searchTerm) {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question').textContent.toLowerCase();
        const answer = item.querySelector('.faq-answer').textContent.toLowerCase();
        
        if (question.includes(searchTerm) || answer.includes(searchTerm)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

function filterArticles(category) {
    const articles = document.querySelectorAll('.article-card');
    
    articles.forEach(article => {
        if (category === 'all' || article.dataset.category === category) {
            article.style.display = '';
        } else {
            article.style.display = 'none';
        }
    });
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!');
    }).catch(err => {
        showToast('Failed to copy text', 'error');
    });
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

let lastCurrencyUpdate = 0;
const CURRENCY_UPDATE_INTERVAL = 3600000;

async function updateCurrencyRates() {
    if (Date.now() - lastCurrencyUpdate < CURRENCY_UPDATE_INTERVAL) return;
    
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        
        Object.keys(currencyConversions).forEach(currency => {
            if (data.rates[currency]) {
                currencyConversions[currency] = data.rates[currency];
            }
        });
        
        lastCurrencyUpdate = Date.now();
        showToast('Currency rates updated');
    } catch (error) {
        console.error('Failed to update currency rates:', error);
        showToast('Failed to update currency rates');
    }
}

document.getElementById('conversionType')?.addEventListener('change', function(e) {
    if (e.target.value === 'currency') {
        updateCurrencyRates();
    }
});

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('#themeToggle i');
    icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}

function setupScrollToTop() {
    const scrollButton = document.createElement('button');
    scrollButton.className = 'scroll-to-top';
    scrollButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
    document.body.appendChild(scrollButton);

    window.addEventListener('scroll', debounce(() => {
        scrollButton.classList.toggle('visible', window.scrollY > 300);
    }, 150));

    scrollButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

function initializeHistory() {
    const timelineItems = document.querySelectorAll('.timeline-item');
    const contentSections = document.querySelectorAll('.history-content');

    timelineItems.forEach(item => {
        item.addEventListener('click', function() {
            const period = this.dataset.period;
            
            timelineItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            contentSections.forEach(section => {
                if (section.dataset.period === period) {
                    fadeIn(section);
                } else {
                    fadeOut(section);
                }
            });
        });
    });
}

function initializeCharts() {
    const chartTabs = document.querySelectorAll('.chart-tab');
    const chartContents = document.querySelectorAll('.chart-content');

    chartTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const type = this.dataset.type;
            
            chartTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            chartContents.forEach(content => {
                if (content.dataset.type === type) {
                    fadeIn(content);
                } else {
                    fadeOut(content);
                }
            });
        });
    });

    const chartCells = document.querySelectorAll('.conversion-chart td');
    chartCells.forEach(cell => {
        cell.addEventListener('click', function() {
            copyToClipboard(this.textContent);
            showToast('Value copied to clipboard!');
        });
    });
}

function initializeTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', theme);
    updateThemeIcon(theme);
}

function fadeIn(element) {
    element.style.display = 'block';
    element.style.opacity = 0;
    requestAnimationFrame(() => {
        element.style.transition = 'opacity 0.3s ease-in-out';
        element.style.opacity = 1;
    });
}

function fadeOut(element) {
    element.style.opacity = 0;
    setTimeout(() => {
        element.style.display = 'none';
    }, 300);
}

function searchArticles(searchTerm) {
    const articles = document.querySelectorAll('.article-card');
    
    articles.forEach(article => {
        const title = article.querySelector('h3').textContent.toLowerCase();
        const content = article.querySelector('p').textContent.toLowerCase();
        
        if (title.includes(searchTerm) || content.includes(searchTerm)) {
            fadeIn(article);
        } else {
            fadeOut(article);
        }
    });
}

function setupPageFunctionality(currentPage) {
    switch(currentPage) {
        case 'currency.html':
            setupCurrencyPage();
            break;
        case 'length.html':
        case 'area.html':
        case 'volume.html':
        case 'mass.html':
        case 'temperature.html':
            setupConverterPage(currentPage.split('.')[0]);
            break;
        case 'faq.html':
            setupFAQPage();
            break;
        case 'articles.html':
            setupArticlesPage();
            break;
        case 'history.html':
            setupHistoryPage();
            break;
        case 'chart.html':
            setupChartPage();
            break;
    }
}

function setupConverterPage(type) {
    const units = getAvailableUnits(type);
    const fromUnit = document.getElementById('fromUnit');
    const toUnit = document.getElementById('toUnit');
    
    if (fromUnit && toUnit) {
        fromUnit.innerHTML = '';
        toUnit.innerHTML = '';
        units.forEach(unit => {
            fromUnit.add(new Option(unit, unit));
            toUnit.add(new Option(unit, unit));
        });
        if (units.length > 1) {
            toUnit.selectedIndex = 1;
        }

        const fromValue = document.getElementById('fromValue');
        if (fromValue) {
            fromValue.addEventListener('input', function() {
                this.value = this.value.replace(/[^0-9.-]/g, '');
                if (this.value) convert();
            });
        }

        addSwapButton(fromUnit, toUnit, fromValue);
    }
}

function setupCurrencyPage() {
    const fromAmount = document.getElementById('fromValue');
    const fromCurrency = document.getElementById('fromUnit');
    const toCurrency = document.getElementById('toUnit');

    if (fromAmount && fromCurrency && toCurrency) {
        fromAmount.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9.]/g, '');
            if (this.value) convert();
        });

        const currencies = Object.keys(exchangeRates);
        [fromCurrency, toCurrency].forEach(select => {
            select.innerHTML = '';
            currencies.forEach(currency => {
                select.add(new Option(currency, currency));
            });
        });

        fromCurrency.value = 'USD';
        toCurrency.value = 'EUR';

        addSwapButton(fromCurrency, toCurrency, fromAmount);
    }
}

function addSwapButton(fromSelect, toSelect, valueInput) {
    const swapBtn = document.createElement('button');
    swapBtn.className = 'swap-btn';
    swapBtn.innerHTML = '<i class="fas fa-exchange-alt"></i>';
    swapBtn.onclick = function() {
        const temp = fromSelect.value;
        fromSelect.value = toSelect.value;
        toSelect.value = temp;
        if (valueInput.value) convert();
    };
    fromSelect.parentNode.insertBefore(swapBtn, toSelect);
}

function setupFAQPage() {
}

function setupArticlesPage() {
}

function setupHistoryPage() {
}

function setupChartPage() {
}

window.convert = convert;
window.copyToClipboard = copyToClipboard;
window.showToast = showToast;

function getUnitsForType(type) {
    const units = {
        length: ['mm', 'cm', 'm', 'km', 'in', 'ft', 'yd', 'mi'],
        area: ['mm²', 'cm²', 'm²', 'km²', 'in²', 'ft²', 'yd²', 'ac'],
        volume: ['ml', 'l', 'mm³', 'cm³', 'm³', 'in³', 'ft³', 'gal'],
        mass: ['mg', 'g', 'kg', 'oz', 'lb', 't'],
        temperature: ['°C', '°F', 'K'],
        currency: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD']
    };
    return units[type] || [];
}

function getCommonConversions(type) {
    const common = {
        length: [
            { from: 1, fromUnit: 'm', to: 3.28084, toUnit: 'ft' },
            { from: 1, fromUnit: 'km', to: 0.621371, toUnit: 'mi' },
            { from: 1, fromUnit: 'cm', to: 0.393701, toUnit: 'in' }
        ],
        area: [
            { from: 1, fromUnit: 'm²', to: 10.7639, toUnit: 'ft²' },
            { from: 1, fromUnit: 'km²', to: 0.386102, toUnit: 'mi²' }
        ],
        volume: [
            { from: 1, fromUnit: 'l', to: 0.264172, toUnit: 'gal' },
            { from: 1, fromUnit: 'm³', to: 35.3147, toUnit: 'ft³' }
        ],
        mass: [
            { from: 1, fromUnit: 'kg', to: 2.20462, toUnit: 'lb' },
            { from: 1, fromUnit: 'g', to: 0.035274, toUnit: 'oz' }
        ],
        temperature: [
            { from: 0, fromUnit: '°C', to: 32, toUnit: '°F' },
            { from: 100, fromUnit: '°C', to: 212, toUnit: '°F' }
        ],
        currency: [
            { from: 1, fromUnit: 'USD', to: 0.85, toUnit: 'EUR' },
            { from: 1, fromUnit: 'EUR', to: 1.18, toUnit: 'USD' }
        ]
    };
    return common[type] || [];
}

document.querySelector('.menu-toggle').addEventListener('click', function() {
    const nav = document.querySelector('nav');
    nav.classList.toggle('active');
    this.setAttribute('aria-expanded', nav.classList.contains('active'));
});

document.addEventListener('click', function(event) {
    const nav = document.querySelector('nav');
    const menuToggle = document.querySelector('.menu-toggle');
    
    if (!nav.contains(event.target) && !menuToggle.contains(event.target) && nav.classList.contains('active')) {
        nav.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
    }
});

const themeToggle = document.getElementById('themeToggle');
const icon = themeToggle.querySelector('i');

function initializeTheme() {
    const isDark = localStorage.getItem('darkTheme') === 'true';
    document.body.classList.toggle('light-theme', !isDark);
    icon.className = isDark ? 'fas fa-moon' : 'fas fa-sun';
}

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const isDark = !document.body.classList.contains('light-theme');
    localStorage.setItem('darkTheme', isDark);
    icon.className = isDark ? 'fas fa-moon' : 'fas fa-sun';
});

initializeTheme();

function initializeConversion() {
    const conversionType = document.getElementById('conversionType');
    const fromUnit = document.getElementById('fromUnit');
    const toUnit = document.getElementById('toUnit');
    
    if (conversionType && fromUnit && toUnit) {
        updateUnitOptions();
        setupCommonConversions();
    }
}

function updateUnitOptions() {
    const type = document.getElementById('conversionType').value;
    const fromUnit = document.getElementById('fromUnit');
    const toUnit = document.getElementById('toUnit');
    
    fromUnit.innerHTML = '';
    toUnit.innerHTML = '';
    
    const units = getUnitsForType(type);
    
    units.forEach(unit => {
        fromUnit.add(new Option(unit, unit));
        toUnit.add(new Option(unit, unit));
    });
    
    if (toUnit.options.length > 1) {
        toUnit.selectedIndex = 1;
    }
    
    setupCommonConversions();
}

function getUnitsForType(type) {
    switch(type) {
        case 'length':
            return ['mm', 'cm', 'm', 'km', 'in', 'ft', 'yd', 'mi'];
        case 'area':
            return ['mm²', 'cm²', 'm²', 'km²', 'in²', 'ft²', 'yd²', 'ac'];
        case 'volume':
            return ['ml', 'l', 'mm³', 'cm³', 'm³', 'in³', 'ft³', 'gal'];
        case 'mass':
            return ['mg', 'g', 'kg', 't', 'oz', 'lb'];
        case 'temperature':
            return ['°C', '°F', 'K'];
        case 'currency':
            return ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];
        default:
            return [];
    }
}

function swapUnits() {
    const fromUnit = document.getElementById('fromUnit');
    const toUnit = document.getElementById('toUnit');
    const fromValue = document.getElementById('fromValue');
    const resultBox = document.getElementById('result');
    
    [fromUnit.value, toUnit.value] = [toUnit.value, fromUnit.value];
    
    if (resultBox.classList.contains('has-result')) {
        convert();
    }
}

function convert() {
    const fromValue = parseFloat(document.getElementById('fromValue').value);
    const fromUnit = document.getElementById('fromUnit').value;
    const toUnit = document.getElementById('toUnit').value;
    const type = document.getElementById('conversionType').value;
    const resultBox = document.getElementById('result');
    
    if (isNaN(fromValue)) {
        showToast('Please enter a valid number', 'error');
        return;
    }
    
    try {
        const result = performConversion(type, fromValue, fromUnit, toUnit);
        displayResult(fromValue, fromUnit, result, toUnit);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function displayResult(fromValue, fromUnit, result, toUnit) {
    const resultBox = document.getElementById('result');
    resultBox.innerHTML = `
        <div class="result-content">
            <span class="from-value">${fromValue} ${fromUnit}</span>
            <i class="fas fa-equals"></i>
            <span class="to-value">${result} ${toUnit}</span>
            <button onclick="copyResult()" class="copy-btn" title="Copy result">
                <i class="fas fa-copy"></i>
            </button>
        </div>
    `;
    resultBox.classList.add('has-result');
}

function copyResult() {
    const resultContent = document.querySelector('.result-content').textContent.trim();
    navigator.clipboard.writeText(resultContent)
        .then(() => showToast('Result copied to clipboard', 'success'))
        .catch(() => showToast('Failed to copy result', 'error'));
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function setupCommonConversions() {
    const type = document.getElementById('conversionType').value;
    const tableBody = document.querySelector('#commonConversions tbody');
    const commonValues = getCommonValues(type);
    
    tableBody.innerHTML = '';
    
    commonValues.forEach(conv => {
        const row = document.createElement('tr');
        const result = performConversion(type, conv.value, conv.from, conv.to);
        row.innerHTML = `
            <td>${conv.value} ${conv.from}</td>
            <td>=</td>
            <td>${result} ${conv.to}</td>
        `;
        tableBody.appendChild(row);
    });
}

function getCommonValues(type) {
    switch(type) {
        case 'length':
            return [
                { value: 1, from: 'm', to: 'ft' },
                { value: 1, from: 'km', to: 'mi' },
                { value: 1, from: 'cm', to: 'in' }
            ];
        case 'area':
            return [
                { value: 1, from: 'm²', to: 'ft²' },
                { value: 1, from: 'km²', to: 'mi²' },
                { value: 1, from: 'cm²', to: 'in²' }
            ];
        default:
            return [];
    }
}

document.getElementById('conversionType')?.addEventListener('change', updateUnitOptions);
document.getElementById('fromValue')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') convert();
});

document.addEventListener('DOMContentLoaded', initializeConversion); 