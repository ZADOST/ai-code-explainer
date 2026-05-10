document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const generateBtn = document.getElementById('generateBtn');
    const clearBtn = document.getElementById('clearBtn');
    const copyBtn = document.getElementById('copyBtn');
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    
    const codeInput = document.getElementById('codeInput');
    const explainStyle = document.getElementById('explainStyle');
    const resultContainer = document.getElementById('resultContainer');
    const resultArea = document.getElementById('resultArea');
    const loadingState = document.getElementById('loadingState');
    const errorArea = document.getElementById('errorArea');
    const errorText = document.getElementById('errorText');
    const historyList = document.getElementById('historyList');

    // Initialize Theme
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        themeIcon.classList.replace('fa-moon', 'fa-sun');
    }
    
    // Theme Toggle Logic
    themeToggle.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        if (document.documentElement.classList.contains('dark')) {
            localStorage.setItem('theme', 'dark');
            themeIcon.classList.replace('fa-moon', 'fa-sun');
        } else {
            localStorage.setItem('theme', 'light');
            themeIcon.classList.replace('fa-sun', 'fa-moon');
        }
    });

    // Initialize History from Local Storage
    loadHistory();

    // Clear Button Logic
    clearBtn.addEventListener('click', () => {
        codeInput.value = '';
        resultContainer.classList.add('hidden');
        errorArea.classList.add('hidden');
        codeInput.focus();
    });

    // Copy Button Logic
    copyBtn.addEventListener('click', () => {
        const textToCopy = resultArea.textContent;
        navigator.clipboard.writeText(textToCopy).then(() => {
            const originalHTML = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fa-solid fa-check text-green-500"></i> Copied!';
            setTimeout(() => { copyBtn.innerHTML = originalHTML; }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    });

    // Main Generate Logic
    generateBtn.addEventListener('click', async () => {
        const code = codeInput.value.trim();
        const style = explainStyle.value;

        if (!code) {
            showError("Please paste a code snippet first.");
            return;
        }

        // UI Updates for Loading
        errorArea.classList.add('hidden');
        resultContainer.classList.add('hidden');
        loadingState.classList.remove('hidden');
        generateBtn.disabled = true;
        generateBtn.classList.add('opacity-70', 'cursor-not-allowed');
        generateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';

        try {
            const response = await fetch('api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code, style: style })
            });

            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.error || 'Failed to connect to the AI service.');
            }

            // Display Result
            resultArea.textContent = data.message;
            resultContainer.classList.remove('hidden');
            
            // Save to Local Storage History
            saveToHistory(code, data.message);

        } catch (error) {
            showError(error.message);
        } finally {
            // Restore UI
            loadingState.classList.add('hidden');
            generateBtn.disabled = false;
            generateBtn.classList.remove('opacity-70', 'cursor-not-allowed');
            generateBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Explain Code';
        }
    });

    function showError(message) {
        errorText.textContent = message;
        errorArea.classList.remove('hidden');
    }

    function saveToHistory(codeSnippet, explanation) {
        let history = JSON.parse(localStorage.getItem('codeHistory')) || [];
        // Keep code preview short
        const preview = codeSnippet.substring(0, 50).replace(/\n/g, ' ') + (codeSnippet.length > 50 ? '...' : '');
        history.unshift({ code: preview, timestamp: new Date().toLocaleString() });
        
        if (history.length > 5) history.pop(); // Keep only last 5 items
        localStorage.setItem('codeHistory', JSON.stringify(history));
        loadHistory();
    }

    function loadHistory() {
        let history = JSON.parse(localStorage.getItem('codeHistory')) || [];
        if (history.length === 0) return;
        
        historyList.innerHTML = '';
        history.forEach(item => {
            const li = document.createElement('li');
            li.className = 'p-3 bg-gray-50 dark:bg-gray-700/50 rounded border border-gray-200 dark:border-gray-700 flex justify-between items-center';
            li.innerHTML = `
                <span class="font-mono truncate mr-4 block w-2/3">${item.code}</span>
                <span class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">${item.timestamp}</span>
            `;
            historyList.appendChild(li);
        });
    }
});