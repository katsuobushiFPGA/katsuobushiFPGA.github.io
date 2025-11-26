const resultEl = document.getElementById('result');
const lengthEl = document.getElementById('length');
const lengthRangeEl = document.getElementById('length-range');
const uppercaseEl = document.getElementById('uppercase');
const lowercaseEl = document.getElementById('lowercase');
const numbersEl = document.getElementById('numbers');
const symbolsEl = document.getElementById('symbols');
const generateEl = document.getElementById('generate');
const clipboardEl = document.getElementById('clipboard');
const strengthBar = document.getElementById('strength-bar');
const strengthText = document.getElementById('strength-text');

const randomFunc = {
    lower: getRandomLower,
    upper: getRandomUpper,
    number: getRandomNumber,
    symbol: getRandomSymbol
};

// Sync number and range inputs
lengthEl.addEventListener('input', (e) => {
    lengthRangeEl.value = e.target.value;
    generatePasswordAndUpdate();
});

lengthRangeEl.addEventListener('input', (e) => {
    lengthEl.value = e.target.value;
    generatePasswordAndUpdate();
});

clipboardEl.addEventListener('click', () => {
    const password = resultEl.innerText;
    if (!password) {
        return;
    }
    navigator.clipboard.writeText(password);

    // Visual feedback
    const originalIcon = clipboardEl.innerHTML;
    clipboardEl.innerHTML = '<i class="fas fa-check"></i>';
    setTimeout(() => {
        clipboardEl.innerHTML = originalIcon;
    }, 1500);
});

generateEl.addEventListener('click', generatePasswordAndUpdate);

// Also update on checkbox change
[uppercaseEl, lowercaseEl, numbersEl, symbolsEl].forEach(el => {
    el.addEventListener('change', generatePasswordAndUpdate);
});

// Initial generation
generatePasswordAndUpdate();

function generatePasswordAndUpdate() {
    const length = +lengthEl.value;
    const hasLower = lowercaseEl.checked;
    const hasUpper = uppercaseEl.checked;
    const hasNumber = numbersEl.checked;
    const hasSymbol = symbolsEl.checked;

    const password = generatePassword(hasLower, hasUpper, hasNumber, hasSymbol, length);
    resultEl.innerText = password;
    updateStrength(password);
}

function generatePassword(lower, upper, number, symbol, length) {
    let generatedPassword = '';
    const typesCount = lower + upper + number + symbol;
    const typesArr = [{ lower }, { upper }, { number }, { symbol }].filter(
        item => Object.values(item)[0]
    );

    if (typesCount === 0) {
        return '';
    }

    for (let i = 0; i < length; i += typesCount) {
        typesArr.forEach(type => {
            const funcName = Object.keys(type)[0];
            generatedPassword += randomFunc[funcName]();
        });
    }

    const finalPassword = generatedPassword.slice(0, length);

    // Shuffle the password to ensure randomness in order
    return shuffleString(finalPassword);
}

function shuffleString(str) {
    const arr = str.split('');
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
}

function getRandomLower() {
    return String.fromCharCode(Math.floor(Math.random() * 26) + 97);
}

function getRandomUpper() {
    return String.fromCharCode(Math.floor(Math.random() * 26) + 65);
}

function getRandomNumber() {
    return String.fromCharCode(Math.floor(Math.random() * 10) + 48);
}

function getRandomSymbol() {
    const symbols = '!@#$%^&*(){}[]=<>/,.';
    return symbols[Math.floor(Math.random() * symbols.length)];
}

function updateStrength(password) {
    let strength = 0;

    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    strengthBar.className = 'strength-bar';

    if (strength <= 2) {
        strengthBar.classList.add('weak');
        strengthText.innerText = 'Weak';
        strengthText.style.color = 'var(--danger-color)';
    } else if (strength <= 4) {
        strengthBar.classList.add('medium');
        strengthText.innerText = 'Medium';
        strengthText.style.color = 'var(--warning-color)';
    } else {
        strengthBar.classList.add('strong');
        strengthText.innerText = 'Strong';
        strengthText.style.color = 'var(--success-color)';
    }
}
