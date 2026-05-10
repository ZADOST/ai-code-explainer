document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const generateBtn = document.getElementById('generateBtn');
    const clearBtn = document.getElementById('clearBtn');
    const copyBtn = document.getElementById('copyBtn');
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    
    // Sidebar Elements
    const menuBtn = document.getElementById('menuBtn');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    
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

    // Sidebar Toggle Logic
    function openSidebar() {
        sidebar.classList.remove('-translate-x-full');
        overlay.classList.remove('hidden');
    }
    function closeSidebar() {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
    }
    menuBtn.addEventListener('click', openSidebar);
    closeSidebarBtn.addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);

    // Initialize History from Local Storage
    loadHistory();

    // Clear Button Logic
    clearBtn.addEventListener('click', () => {
        codeInput.value = '';
        resultContainer.classList.add('hidden');
        errorArea.classList.add('hidden');
        codeInput.focus();
    });

    // Copy Button Logic (Strip HTML to only copy raw text for the user's clipboard)
    copyBtn.addEventListener('click', () => {
        const textToCopy = resultArea.innerText; // Grabs the clean rendered text
        navigator.clipboard.writeText(textToCopy).then(() => {
            const originalHTML = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fa-solid fa-check text-green-500"></i> Copied!';
            setTimeout(() => { copyBtn.innerHTML = originalHTML; }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    });

    // Format Markdown to Clean HTML
    function formatMarkdown(text) {
        if (!text) return '';
        
        let html = text.replace(/</g, '&lt;').replace(/>/g, '&gt;'); // Basic XSS protection
        
        // Code Blocks
        html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-gray-800 text-gray-100 p-4 rounded-lg my-6 overflow-x-auto text-base font-mono shadow-md border border-gray-700">$2</pre>');
        html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-800 text-gray-100 p-4 rounded-lg my-6 overflow-x-auto text-base font-mono shadow-md border border-gray-700">$1</pre>');
        
        // Inline Code
        html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-pink-600 dark:text-pink-400 font-mono text-base">$1</code>');
        
        // Headers
        html = html.replace(/^### (.*$)/gim, '<h3 class="text-2xl font-bold mt-8 mb-3 text-indigo-700 dark:text-indigo-400">$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2 class="text-3xl font-bold mt-10 mb-4 text-indigo-800 dark:text-indigo-300 border-b border-gray-200 dark:border-gray-700 pb-2">$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1 class="text-4xl font-extrabold mt-10 mb-6 text-gray-900 dark:text-white">$1</h1>');
        
        // Bold
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>');
        
        // Italic
        html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
        
        // Horizontal Rule
        html = html.replace(/^---$/gim, '<hr class="my-8 border-gray-300 dark:border-gray-600">');
        
        // Convert double line breaks to paragraphs
        html = html.split('\n\n').map(p => {
            if (p.trim().startsWith('<pre') || p.trim().startsWith('<h') || p.trim().startsWith('<hr')) {
                return p;
            }
            return `<p class="mb-5 text-gray-700 dark:text-gray-300">${p.replace(/\n/g, '<br>')}</p>`;
        }).join('');
        
        return html;
    }

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
        generateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Analyzing Code...';

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

            // Display Result parsed with HTML
            resultArea.innerHTML = formatMarkdown(data.message);
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
        const preview = codeSnippet.substring(0, 40).replace(/\n/g, ' ') + (codeSnippet.length > 40 ? '...' : '');
        
        // Save both the code preview AND the full explanation
        history.unshift({ 
            id: Date.now(),
            code: codeSnippet, 
            preview: preview,
            explanation: explanation,
            timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) + ' - ' + new Date().toLocaleDateString()
        });
        
        if (history.length > 15) history.pop(); // Keep up to 15 items in sidebar
        localStorage.setItem('codeHistory', JSON.stringify(history));
        loadHistory();
    }

    function loadHistory() {
        let history = JSON.parse(localStorage.getItem('codeHistory')) || [];
        historyList.innerHTML = '';
        
        if (history.length === 0) {
            historyList.innerHTML = '<li class="text-gray-400 italic text-center mt-4">No history yet.</li>';
            return;
        }
        
        history.forEach(item => {
            const li = document.createElement('li');
            li.className = 'p-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer transition-colors shadow-sm';
            li.innerHTML = `
                <div class="font-mono text-xs text-indigo-600 dark:text-indigo-400 truncate mb-1 border-b border-gray-100 dark:border-gray-700 pb-1">${item.preview}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                    <span><i class="fa-solid fa-clock mr-1"></i>${item.timestamp}</span>
                </div>
            `;
            
            // Make history item clickable!
            li.addEventListener('click', () => {
                codeInput.value = item.code;
                resultArea.innerHTML = formatMarkdown(item.explanation);
                resultContainer.classList.remove('hidden');
                errorArea.classList.add('hidden');
                closeSidebar(); // Automatically close drawer to show result
                // Scroll to result smoothly
                resultContainer.scrollIntoView({ behavior: 'smooth' });
            });
            
            historyList.appendChild(li);
        });
    }
});