let snippets = JSON.parse(localStorage.getItem('codeSnippets')) || [];
let currentEditId = null;
let currentTags = [];
let activeFilters = {
    language: null,
    topic: null,
    difficulty: null,
    search: ''
};

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function saveToLocalStorage() {
    localStorage.setItem('codeSnippets', JSON.stringify(snippets));
    updateStatistics();
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'error' : ''}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard! 📋');
    }).catch(() => {
        showToast('Failed to copy', true);
    });
}

document.getElementById('tagInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const value = e.target.value.trim();
        if (value && !currentTags.includes(value)) {
            currentTags.push(value);
            renderTags();
            e.target.value = '';
        }
    }
});

function renderTags() {
    const container = document.getElementById('tagContainer');
    const input = document.getElementById('tagInput');
    container.innerHTML = '';

    currentTags.forEach(tag => {
        const tagEl = document.createElement('div');
        tagEl.className = 'tag';
        tagEl.innerHTML = `
                    ${tag}
                    <button type="button" class="tag-close">&times;</button>
                `;
        tagEl.querySelector('.tag-close').addEventListener('click', () => {
            currentTags = currentTags.filter(t => t !== tag);
            renderTags();
        });
        container.appendChild(tagEl);
    });

    container.appendChild(input);
}

function initializeFilters() {
    const languages = ['Java', 'Python', 'C++', 'JavaScript', 'C#'];
    const topics = ['DSA', 'Web', 'OOP', 'Database', 'Algorithms'];
    const difficulties = ['Easy', 'Medium', 'Hard'];

    const createFilterBtn = (value, type) => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.textContent = value;
        btn.addEventListener('click', () => {
            document.querySelectorAll(`#${type}Filters .filter-btn`).forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilters[type] = value;
            renderSnippets();
        });
        return btn;
    };

    const allBtn = document.createElement('button');
    allBtn.className = 'filter-btn active';
    allBtn.textContent = 'All';
    allBtn.addEventListener('click', () => {
        document.querySelectorAll('#languageFilters .filter-btn').forEach(b => b.classList.remove('active'));
        allBtn.classList.add('active');
        activeFilters.language = null;
        renderSnippets();
    });

    document.getElementById('languageFilters').appendChild(allBtn);
    languages.forEach(lang => {
        document.getElementById('languageFilters').appendChild(createFilterBtn(lang, 'language'));
    });

    const topicAllBtn = document.createElement('button');
    topicAllBtn.className = 'filter-btn active';
    topicAllBtn.textContent = 'All';
    topicAllBtn.addEventListener('click', () => {
        document.querySelectorAll('#topicFilters .filter-btn').forEach(b => b.classList.remove('active'));
        topicAllBtn.classList.add('active');
        activeFilters.topic = null;
        renderSnippets();
    });

    document.getElementById('topicFilters').appendChild(topicAllBtn);
    topics.forEach(topic => {
        document.getElementById('topicFilters').appendChild(createFilterBtn(topic, 'topic'));
    });

    const diffAllBtn = document.createElement('button');
    diffAllBtn.className = 'filter-btn active';
    diffAllBtn.textContent = 'All';
    diffAllBtn.addEventListener('click', () => {
        document.querySelectorAll('#difficultyFilters .filter-btn').forEach(b => b.classList.remove('active'));
        diffAllBtn.classList.add('active');
        activeFilters.difficulty = null;
        renderSnippets();
    });

    document.getElementById('difficultyFilters').appendChild(diffAllBtn);
    difficulties.forEach(diff => {
        document.getElementById('difficultyFilters').appendChild(createFilterBtn(diff, 'difficulty'));
    });
}

document.getElementById('searchInput').addEventListener('input', (e) => {
    activeFilters.search = e.target.value.toLowerCase();
    renderSnippets();
});

function filterSnippets() {
    return snippets.filter(snippet => {
        const matchLanguage = !activeFilters.language || snippet.language === activeFilters.language;
        const matchTopic = !activeFilters.topic || snippet.topic === activeFilters.topic;
        const matchDifficulty = !activeFilters.difficulty || snippet.difficulty === activeFilters.difficulty;
        const searchLower = activeFilters.search.toLowerCase();
        const matchSearch = !searchLower ||
            snippet.title.toLowerCase().includes(searchLower) ||
            snippet.description.toLowerCase().includes(searchLower) ||
            snippet.code.toLowerCase().includes(searchLower) ||
            snippet.tags.some(tag => tag.toLowerCase().includes(searchLower));

        return matchLanguage && matchTopic && matchDifficulty && matchSearch;
    });
}

function renderSnippets() {
    const filtered = filterSnippets();
    const content = document.getElementById('content');

    if (filtered.length === 0) {
        content.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">🔍</div>
                        <h3>No snippets found</h3>
                        <p>Try adjusting your filters or create a new snippet</p>
                    </div>
                `;
        return;
    }

    content.innerHTML = filtered.map(snippet => {
        const languageMap = {
            'Java': '☕',
            'Python': '🐍',
            'cCpp': '⚙️',
            'Javascript': '📜',
            'Csharp': '🔷',
            'Go': '🐹',
            'Rust': '🦀'
        };

        const difficultyColor = {
            'Easy': 'green',
            'Medium': 'orange',
            'Hard': 'red'
        };

        return `
                    <div class="snippet-card">
                        <div class="snippet-header">
                            <div class="snippet-meta">
                                <div class="snippet-title">${escapeHtml(snippet.title)}</div>
                                <div class="snippet-badges">
                                    <span class="badge badge-language">${languageMap[snippet.language] || '💻'} ${snippet.language}</span>
                                    <span class="badge badge-topic">${snippet.topic}</span>
                                    <span class="badge badge-difficulty" style="border-color: var(--accent-${difficultyColor[snippet.difficulty]}); color: var(--accent-${difficultyColor[snippet.difficulty]});">${snippet.difficulty}</span>
                                </div>
                            </div>
                            <div class="snippet-actions">
                                <button class="action-btn favorite ${snippet.favorite ? 'active' : ''}" data-id="${snippet.id}" title="Favorite">⭐</button>
                                <button class="action-btn edit" data-id="${snippet.id}" title="Edit">✏️</button>
                                <button class="action-btn delete" data-id="${snippet.id}" title="Delete">🗑️</button>
                            </div>
                        </div>

                        <div class="snippet-code">
                            <div class="code-container">
                                <pre><code class="language-${snippet.language}">${escapeHtml(snippet.code)}</code></pre>
                            </div>
                            <div class="code-fade"></div>
                        </div>

                        <div class="snippet-footer">
                            <div style="flex: 1;">
                                <div class="description-text">${escapeHtml(snippet.description)}</div>
                                ${snippet.tags.length > 0 ? `<div style="margin-top: 6px; display: flex; gap: 4px; flex-wrap: wrap;">${snippet.tags.map(t => `<span class="badge" style="font-size: 10px; padding: 2px 6px;">#${escapeHtml(t)}</span>`).join('')}</div>` : ''}
                            </div>
                            <button class="btn btn-small btn-secondary" data-copy="${snippet.id}" title="Copy code">📋</button>
                        </div>
                    </div>
                `;
    }).join('');

    content.addEventListener('click', (e) => {
        if (e.target.classList.contains('favorite')) {
            const id = e.target.dataset.id;
            snippets = snippets.map(s => s.id === id ? { ...s, favorite: !s.favorite } : s);
            saveToLocalStorage();
            renderSnippets();
        } else if (e.target.classList.contains('edit')) {
            const id = e.target.dataset.id;
            openEditModal(id);
        } else if (e.target.classList.contains('delete')) {
            const id = e.target.dataset.id;
            if (confirm('Are you sure you want to delete this snippet?')) {
                snippets = snippets.filter(s => s.id !== id);
                saveToLocalStorage();
                renderSnippets();
                showToast('Snippet deleted 🗑️');
            }
        } else if (e.target.dataset.copy) {
            const id = e.target.dataset.copy;
            const snippet = snippets.find(s => s.id === id);
            if (snippet) copyToClipboard(snippet.code);
        }
    });

    document.querySelectorAll('pre code').forEach(el => {
        hljs.highlightElement(el);
    });
}

function updateStatistics() {
    const total = snippets.length;
    const favorites = snippets.filter(s => s.favorite).length;
    const languages = new Set(snippets.map(s => s.language)).size;

    document.getElementById('statTotal').textContent = total;
    document.getElementById('statFavorites').textContent = favorites;
    document.getElementById('statLanguages').textContent = languages;
}

function openAddModal() {
    currentEditId = null;
    currentTags = [];
    document.getElementById('modalTitle').textContent = 'Add New Snippet';
    document.getElementById('titleInput').value = '';
    document.getElementById('languageSelect').value = '';
    document.getElementById('topicSelect').value = '';
    document.getElementById('difficultySelect').value = '';
    document.getElementById('codeInput').value = '';
    document.getElementById('descriptionInput').value = '';
    renderTags();
    document.getElementById('modalOverlay').classList.add('active');
}

function openEditModal(id) {
    const snippet = snippets.find(s => s.id === id);
    if (!snippet) return;

    currentEditId = id;
    currentTags = [...snippet.tags];
    document.getElementById('modalTitle').textContent = 'Edit Snippet';
    document.getElementById('titleInput').value = snippet.title;
    document.getElementById('languageSelect').value = snippet.language;
    document.getElementById('topicSelect').value = snippet.topic;
    document.getElementById('difficultySelect').value = snippet.difficulty;
    document.getElementById('codeInput').value = snippet.code;
    document.getElementById('descriptionInput').value = snippet.description;
    renderTags();
    document.getElementById('modalOverlay').classList.add('active');
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
    currentEditId = null;
    currentTags = [];
}

function saveSnippet() {
    const title = document.getElementById('titleInput').value.trim();
    const language = document.getElementById('languageSelect').value;
    const topic = document.getElementById('topicSelect').value;
    const difficulty = document.getElementById('difficultySelect').value;
    const code = document.getElementById('codeInput').value.trim();
    const description = document.getElementById('descriptionInput').value.trim();

    if (!title || !language || !topic || !difficulty || !code) {
        showToast('Please fill in all required fields', true);
        return;
    }

    if (currentEditId) {
        snippets = snippets.map(s => s.id === currentEditId ? {
            ...s,
            title,
            language,
            topic,
            difficulty,
            code,
            description,
            tags: currentTags,
            updatedAt: new Date().toISOString()
        } : s);
        showToast('Snippet updated ✏️');
    } else {
        snippets.push({
            id: generateId(),
            title,
            language,
            topic,
            difficulty,
            code,
            description,
            tags: currentTags,
            favorite: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        showToast('Snippet created 🎉');
    }

    saveToLocalStorage();
    renderSnippets();
    closeModal();
}

document.getElementById('addBtn').addEventListener('click', openAddModal);
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalCancelBtn').addEventListener('click', closeModal);
document.getElementById('modalSaveBtn').addEventListener('click', saveSnippet);

document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
});

document.getElementById('titleInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') saveSnippet();
});

document.getElementById('exportBtn').addEventListener('click', () => {
    const selected = snippets.filter(s => s.favorite);
    if (selected.length === 0) {
        showToast('Please mark snippets as favorite to export', true);
        return;
    }

    let content = 'CODE SNIPPET EXPORT\n';
    content += '='.repeat(50) + '\n\n';

    selected.forEach(snippet => {
        content += `TITLE: ${snippet.title}\n`;
        content += `LANGUAGE: ${snippet.language}\n`;
        content += `TOPIC: ${snippet.topic}\n`;
        content += `DIFFICULTY: ${snippet.difficulty}\n`;
        content += `TAGS: ${snippet.tags.join(', ')}\n`;
        content += `DESCRIPTION: ${snippet.description}\n`;
        content += `CODE:\n${snippet.code}\n`;
        content += '-'.repeat(50) + '\n\n';
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `snippets-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${selected.length} snippets 📥`);
});

initializeFilters();
renderSnippets();
updateStatistics();

if (snippets.length === 0) {
    const samples = [
        {
            id: generateId(),
            title: 'Binary Search',
            language: 'Java',
            topic: 'DSA',
            difficulty: 'Easy',
            code: `public class BinarySearch {
    public static int binarySearch(int[] arr, int target) {
        int left = 0, right = arr.length - 1;
        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (arr[mid] == target) return mid;
            if (arr[mid] < target) left = mid + 1;
            else right = mid - 1;
        }
        return -1;
    }
}`,
            description: 'Classic binary search implementation for sorted arrays',
            tags: ['searching', 'efficient', 'log(n)'],
            favorite: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ];
    snippets = samples;
    saveToLocalStorage();
    renderSnippets();
}
