const conversionFactors = {
    length: {
        mm: 0.001,
        cm: 0.01,
        m: 1,
        km: 1000,
        in: 0.0254,
        ft: 0.3048,
        yd: 0.9144,
        mi: 1609.34
    },
    area: {
        'mm²': 0.000001,
        'cm²': 0.0001,
        'm²': 1,
        'km²': 1000000,
        'in²': 0.00064516,
        'ft²': 0.092903,
        'yd²': 0.836127,
        'ac': 4046.86
    },
    volume: {
        ml: 0.001,
        l: 1,
        'mm³': 0.000001,
        'cm³': 0.001,
        'm³': 1000,
        'in³': 0.0163871,
        'ft³': 28.3168,
        'gal': 3.78541
    },
    mass: {
        mg: 0.001,
        g: 1,
        kg: 1000,
        oz: 28.3495,
        lb: 453.592,
        t: 1000000
    }
};

const exchangeRates = {
    USD: 1,
    EUR: 0.85,
    GBP: 0.73,
    JPY: 110.42,
    CAD: 1.25,
    AUD: 1.35
};

function performConversion(type, value, fromUnit, toUnit) {
    if (isNaN(value)) {
        throw new Error('Please enter a valid number');
    }

    switch (type) {
        case 'temperature':
            return convertTemperature(value, fromUnit, toUnit);
        case 'currency':
            return convertCurrency(value, fromUnit, toUnit);
        default:
            return convertStandard(type, value, fromUnit, toUnit);
    }
}

function convertStandard(type, value, fromUnit, toUnit) {
    const factors = conversionFactors[type];
    if (!factors) {
        throw new Error('Invalid conversion type');
    }

    if (!factors[fromUnit] || !factors[toUnit]) {
        throw new Error('Invalid units for conversion');
    }

    const baseValue = value * factors[fromUnit];
    const result = baseValue / factors[toUnit];
    
    return formatResult(result);
}

function convertTemperature(value, fromUnit, toUnit) {
    let celsius;

    switch (fromUnit) {
        case '°C':
            celsius = value;
            break;
        case '°F':
            celsius = (value - 32) * 5/9;
            break;
        case 'K':
            celsius = value - 273.15;
            break;
        default:
            throw new Error('Invalid temperature unit');
    }

    switch (toUnit) {
        case '°C':
            return formatResult(celsius);
        case '°F':
            return formatResult((celsius * 9/5) + 32);
        case 'K':
            return formatResult(celsius + 273.15);
        default:
            throw new Error('Invalid temperature unit');
    }
}

function convertCurrency(value, fromCurrency, toCurrency) {
    if (!exchangeRates[fromCurrency] || !exchangeRates[toCurrency]) {
        throw new Error('Invalid currency');
    }

    const usdAmount = value / exchangeRates[fromCurrency];
    const result = usdAmount * exchangeRates[toCurrency];
    
    return formatResult(result, 2);
}

function formatResult(value, decimals = 4) {
    return Number(value.toFixed(decimals)).toString();
}

window.performConversion = performConversion; 