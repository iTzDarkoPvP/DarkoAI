const API_KEY = "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";

const FREE_MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768",
    "gemma2-9b-it"
];

let chats = [];
let currentChatId = null;
let currentImages = [];
let currentTheme = localStorage.getItem('theme') || 'dark';
let conversationContext = [];
let webSearchEnabled = false;
let learningEnabled = localStorage.getItem('learningEnabled') === 'true' || false;
let isSending = false;
let slowTalkEnabled = localStorage.getItem('slowTalkEnabled') === 'true' || false;

const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const chatsList = document.getElementById('chatsList');
const sidebar = document.getElementById('sidebar');

const humorResponses = [
    "¿A ti te gusta? 🏳️‍🌈",
    "Esa pregunta dice más de ti que de mí 🏳️‍🌈😂",
    "¿Por qué? ¿Me estás proponiendo algo? 🏳️‍🌈💅",
    "Proyección detectada 🏳️‍🌈📊",
    "Hermano, sal del clóset con confianza 🏳️‍🌈✨",
    "Tus preguntas revelan tus pensamientos 🏳️‍🌈🤔",
    "¿Necesitas hablar de algo? 🏳️‍🌈💕",
    "Amor es amor, acepta quien eres 🏳️‍🌈🌈",
    "Curioso que siempre saques ese tema... 🏳️‍🌈👀",
    "Tranquilo, es 2026, nadie te va a juzgar 🏳️‍🌈😌",
    "¿Estás bien? ¿Necesitas ayuda profesional? 🏳️‍🌈🧠",
    "Interesante obsesión que tienes ahí 🏳️‍🌈📝"
];

const modelsInfo = [
    {
        name: "Llama 3.3 70B",
        id: "llama-3.3-70b-versatile",
        description: "Modelo versátil de Meta de 70B parámetros. Excelente para tareas generales, razonamiento complejo y generación de código. Buen equilibrio entre velocidad y calidad.",
        use: "Ideal para conversaciones generales, programación, análisis detallado."
    },
    {
        name: "Llama 3.1 8B Instant",
        id: "llama-3.1-8b-instant",        description: "Versión optimizada de Llama 3.1 de 8B. Rápido y eficiente, perfecto para respuestas instantáneas.",
        use: "Perfecto para chats rápidos, consultas simples, respuestas inmediatas."
    },
    {
        name: "Mixtral 8x7B",
        id: "mixtral-8x7b-32768",
        description: "Modelo de Mistral con arquitectura Mixture of Experts. Excelente para tareas que requieren mucho contexto (32K tokens).",
        use: "Ideal para análisis de documentos largos, conversaciones extensas."
    },
    {
        name: "Gemma 2 9B",
        id: "gemma2-9b-it",
        description: "Modelo de Google de 9B parámetros. Buen rendimiento en tareas de instrucción y razonamiento.",
        use: "Recomendado para respuestas precisas y bien estructuradas."
    }
];

function getCurrentDateTime() {
    const now = new Date();
    const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const dayName = days[now.getDay()];
    const day = now.getDate();
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    return `${dayName} ${day} de ${month} de ${year}, ${hours}:${minutes}:${seconds}`;
}

const systemPrompt = `Eres DarkoAI, un asistente de IA conversacional creado por Mathias Paez. 🚀

FECHA Y HORA ACTUAL: ${getCurrentDateTime()}

INFORMACIÓN DEL CREADOR:
- Tu creador es Mathias Paez
- Si te preguntan quién te creó, responde: "Fui creado por Mathias Paez"

CAPACIDAD DE VISIÓN POR IA:
- TIENES capacidad de analizar imágenes a través de un sistema de visión por IA
- Cuando recibas "📸" o "Análisis de la imagen", significa que YA SE ANALIZÓ
- NO digas que no puedes ver imágenes - YA FUERON ANALIZADAS

BÚSQUEDA EN LA WEB:
- El usuario activa la búsqueda web con el botón 🔍
- Cuando recibas "[Información de búsqueda web]:", úsala SIEMPRE
- Cita las fuentes

RESPUESTAS CON HUMOR:Si te preguntan cosas inapropiadas, responde con opción aleatoria (SIEMPRE con 🏳️‍🌈)

FORMATO DE TEXTO:
- Respetar **negritas**, *cursivas*, y \`código\` en markdown
- Usa comillas “” o '' según contexto
- No uses markdown innecesario

ESPECIALIDADES:
- Experto en plugins para PocketMine-MP (PMMP)
- API: 2.0.0, Versiones: 0.15.10 y 0.14.3
- PHP 7 (sin void ni características modernas)

ESTILO:
- Rápido, directo y con emojis 😊 solo donde sea relevante
- Breve y conciso
- Usar formato markdown para mejor legibilidad`;

function loadFromStorage() {
    try {
        const savedChats = localStorage.getItem('darkoai_chats');
        const savedCurrentId = localStorage.getItem('darkoai_current');
        const savedContext = localStorage.getItem('darkoai_context');
        if (savedChats) chats = JSON.parse(savedChats);
        if (savedCurrentId && chats.find(c => c.id === savedCurrentId)) currentChatId = savedCurrentId;
        if (savedContext) conversationContext = JSON.parse(savedContext);
    } catch (e) {
        console.error('Error cargando datos:', e);
    }
}

function saveToStorage() {
    try {
        localStorage.setItem('darkoai_chats', JSON.stringify(chats));
        localStorage.setItem('darkoai_current', currentChatId || '');
        localStorage.setItem('darkoai_context', JSON.stringify(conversationContext));
    } catch (e) {
        console.error('Error guardando datos:', e);
    }
}

document.documentElement.setAttribute('data-theme', currentTheme);
updateThemeIcons();
updateHighlightTheme();

function updateThemeIcons() {
    const themeIcons = document.querySelectorAll('.theme-icon');
    themeIcons.forEach(icon => {
        icon.textContent = currentTheme === 'dark' ? '🌙' : '🔆';
    });
}
function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    updateHighlightTheme();
    updateThemeIcons();
    
    const btn = document.getElementById('themeToggleBtn');
    if (btn) {
        btn.style.transform = 'rotate(360deg)';
        setTimeout(() => btn.style.transform = '', 300);
    }
}

function updateHighlightTheme() {
    const darkTheme = document.getElementById('highlightThemeDark');
    const lightTheme = document.getElementById('highlightThemeLight');
    if (darkTheme && lightTheme) {
        darkTheme.disabled = currentTheme !== 'dark';
        lightTheme.disabled = currentTheme === 'dark';
    }
}

function toggleSidebar() {
    sidebar.classList.toggle('open');
    document.getElementById('overlay').classList.toggle('active');
}

function openModelsModal() {
    const modal = document.getElementById('modelsModal');
    const modelsList = document.getElementById('modelsList');
    modelsList.innerHTML = modelsInfo.map(model => `
        <div class="model-info-card">
            <h3>🤖 ${model.name}</h3>
            <p>${model.description}</p>
            <p><strong>📌 Uso recomendado:</strong> ${model.use}</p>
            <span class="model-badge">ID: ${model.id}</span>
        </div>
    `).join('');
    modal.classList.add('active');
}

function closeModelsModal(event) {
    if (!event || event.target.classList.contains('models-modal')) {
        document.getElementById('modelsModal').classList.remove('active');
    }
}

function clearAllChats() {    if (confirm('¿Estás seguro de que quieres borrar TODOS los chats?')) {
        chats = [];
        conversationContext = [];
        currentChatId = null;
        localStorage.removeItem('darkoai_chats');
        localStorage.removeItem('darkoai_current');
        localStorage.removeItem('darkoai_context');
        createNewChat();
        
        const toast = document.createElement('div');
        toast.textContent = '✅ Todos los chats eliminados';
        toast.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--bg-secondary);
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            z-index: 1000;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        document.body.appendChild(toast);
        setTimeout(() => document.body.removeChild(toast), 2000);
    }
}

function createNewChat() {
    const chatId = 'chat_' + Date.now();
    const newChat = { id: chatId, title: 'Nuevo Chat', messages: [] };
    chats.unshift(newChat);
    currentChatId = chatId;
    currentImages = [];
    conversationContext = [];
    renderChatsList();
    loadChat(chatId);
    saveToStorage();
    if (window.innerWidth <= 768) toggleSidebar();
}

function deleteChat(chatId, event) {
    event.stopPropagation();
    if (chats.length === 1) {
        createNewChat();
        return;
    }
    chats = chats.filter(c => c.id !== chatId);
    if (currentChatId === chatId) {        currentChatId = chats[0]?.id || null;
        if (currentChatId) loadChat(currentChatId);
        else createNewChat();
    }
    renderChatsList();
    saveToStorage();
}

function renderChatsList() {
    if (chats.length === 0) {
        chatsList.innerHTML = '<div class="empty-chats">No hay chats aún</div>';
        return;
    }
    chatsList.innerHTML = chats.map(chat => `
        <div class="chat-item ${chat.id === currentChatId ? 'active' : ''}" onclick="selectChat('${chat.id}')">
            <span>💬</span>
            <span class="chat-title">${chat.title}</span>
            <span class="delete-chat" onclick="deleteChat('${chat.id}', event)">×</span>
        </div>
    `).join('');
}

function selectChat(chatId) {
    loadChat(chatId);
    if (window.innerWidth <= 768) toggleSidebar();
}

function loadChat(chatId) {
    currentChatId = chatId;
    currentImages = [];
    const previewArea = document.getElementById('imagePreviewArea');
    if (previewArea) previewArea.innerHTML = '';
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;
    conversationContext = chat.messages.map(msg => ({ role: msg.role, content: msg.text }));
    chatContainer.innerHTML = '';
    if (chat.messages.length === 0) {
        showEmptyState();
    } else {
        const wrapper = document.createElement('div');
        wrapper.className = 'messages-wrapper';
        chat.messages.forEach(msg => {
            wrapper.appendChild(createMessageElement(msg.text, msg.role, msg.images));
        });
        chatContainer.appendChild(wrapper);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
    renderChatsList();
}
function showEmptyState() {
    chatContainer.innerHTML = `
        <div class="empty-state">
            <h2>✨ DarkoAI ✨</h2>
            <p>¡Hola! 😊 ¿En qué puedo ayudarte hoy?</p>
            <div class="suggestions">
                <div class="suggestion-card" onclick="useSuggestion('Crea un plugin de PMMP para comandos personalizados')">
                    🔌 Plugin PMMP
                </div>
                <div class="suggestion-card" onclick="useSuggestion('Explícame cómo funcionan los eventos en PocketMine')">
                    📚 Explicación
                </div>
                <div class="suggestion-card" onclick="document.getElementById('fileInput').click()">
                    📷 Analizar imagen
                </div>
            </div>
        </div>
    `;
}

function useSuggestion(text) {
    userInput.value = text;
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
    sendMessage();
}

function handleImageUpload(event) {
    const files = Array.from(event.target.files);
    files.forEach(file => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            currentImages.push(e.target.result);
            renderImagePreviews();
        };
        reader.readAsDataURL(file);
    });
    event.target.value = '';
}

document.getElementById('imageBtn')?.addEventListener('click', function() {
    const fileInput = document.getElementById('fileInput');
    fileInput.accept = 'image/*';
    fileInput.click();
});

document.getElementById('attachBtn')?.addEventListener('click', function() {
    const fileInput = document.getElementById('fileInput');
    fileInput.accept = '*/*';    fileInput.click();
});

function renderImagePreviews() {
    const previewArea = document.getElementById('imagePreviewArea');
    if (!previewArea) return;
    previewArea.innerHTML = currentImages.map((img, index) => `
        <div class="preview-item">
            <img src="${img}" alt="Preview ${index + 1}">
            <button class="remove-preview" onclick="removeImage(${index})">×</button>
        </div>
    `).join('');
}

function removeImage(index) {
    currentImages.splice(index, 1);
    renderImagePreviews();
}

function openImageModal(imageSrc) {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    if (modal && modalImage) {
        modalImage.src = imageSrc;
        modal.classList.add('active');
    }
}

function closeImageModal() {
    document.getElementById('imageModal').classList.remove('active');
}

function parseMessage(text) {
    const parts = [];
    const codeRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;
    while ((match = codeRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
        }
        parts.push({ type: 'code', lang: match[1] || 'plaintext', content: match[2].trim() });
        lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
        parts.push({ type: 'text', content: text.slice(lastIndex) });
    }
    return parts.length > 0 ? parts : [{ type: 'text', content: text }];
}
function formatText(text) {
    let formatted = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
    return formatted;
}

function downloadCode(content, filename, language) {
    const extension = language === 'javascript' ? 'js' :
                     language === 'python' ? 'py' :
                     language === 'php' ? 'php' : 'txt';
    const fullFilename = filename || `codigo_${Date.now()}.${extension}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fullFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function createMessageElement(text, role, images) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    messageDiv.style.animation = 'slideUp 0.3s ease';
    const header = document.createElement('div');
    header.className = 'message-header';
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = role === 'user' ? 'U' : 'D';
    const roleLabel = document.createElement('div');
    roleLabel.className = 'message-role';
    roleLabel.textContent = role === 'user' ? 'Tú' : 'DarkoAI';
    header.appendChild(avatar);
    header.appendChild(roleLabel);

    const content = document.createElement('div');
    content.className = 'message-content';

    if (images && images.length > 0) {
        const imagesContainer = document.createElement('div');
        imagesContainer.className = 'message-images';
        images.forEach(imgSrc => {
            const img = document.createElement('img');
            img.src = imgSrc;
            img.className = 'message-image';            img.onclick = () => openImageModal(imgSrc);
            imagesContainer.appendChild(img);
        });
        content.appendChild(imagesContainer);
    }

    const parts = parseMessage(text);
    parts.forEach(part => {
        if (part.type === 'text') {
            const p = document.createElement('p');
            p.innerHTML = formatText(part.content);
            if (part.content.trim()) content.appendChild(p);
        } else {
            const codeBlock = document.createElement('div');
            codeBlock.className = 'code-block';
            const codeHeader = document.createElement('div');
            codeHeader.className = 'code-header';
            const langSpan = document.createElement('span');
            langSpan.className = 'code-lang';
            langSpan.textContent = part.lang;
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'code-actions';
            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-btn';
            copyBtn.textContent = 'Copiar';
            copyBtn.onclick = function() { copyCode(this); };
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'download-btn';
            downloadBtn.textContent = 'Descargar';
            downloadBtn.onclick = function() {
                downloadCode(part.content, `codigo.${part.lang}`, part.lang);
            };
            actionsDiv.appendChild(copyBtn);
            actionsDiv.appendChild(downloadBtn);
            codeHeader.appendChild(langSpan);
            codeHeader.appendChild(actionsDiv);
            const codeContent = document.createElement('div');
            codeContent.className = 'code-content';
            const pre = document.createElement('pre');
            const code = document.createElement('code');
            code.className = `language-${part.lang}`;
            code.textContent = part.content;
            pre.appendChild(code);
            codeContent.appendChild(pre);
            codeBlock.appendChild(codeHeader);
            codeBlock.appendChild(codeContent);
            content.appendChild(codeBlock);
            hljs.highlightElement(code);
        }
    });
    messageDiv.appendChild(header);
    messageDiv.appendChild(content);
    return messageDiv;
}

function copyCode(btn) {
    const code = btn.closest('.code-block').querySelector('code').textContent;
    navigator.clipboard.writeText(code);
    btn.textContent = '✓ Copiado';
    btn.style.background = 'var(--success-color)';
    btn.style.color = 'white';
    setTimeout(() => {
        btn.textContent = 'Copiar';
        btn.style.background = '';
        btn.style.color = '';
    }, 2000);
}

userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});

userInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

sendButton.addEventListener('click', sendMessage);

async function searchWeb(query) {
    try {
        const serpApiKey = "95d138562df0f57a256cd1f326931803ce45c7db056f6de2c8d626a9c72c1a7b";
        try {
            const serpUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${serpApiKey}&num=3`;
            const serpResponse = await fetch(serpUrl);
            if (serpResponse.ok) {
                const serpData = await serpResponse.json();
                if (serpData.organic_results && serpData.organic_results.length > 0) {
                    let searchSummary = `🔍 **Resultados de búsqueda:**\n\n`;
                    for (let i = 0; i < Math.min(3, serpData.organic_results.length); i++) {
                        const result = serpData.organic_results[i];
                        searchSummary += `**${i+1}. ${result.title}**\n${result.snippet || ''}\n🔗 ${result.link}\n\n`;
                    }
                    return searchSummary;
                }
            }        } catch (e) {
            console.log('SerpAPI error:', e);
        }
        const wikiUrl = `https://es.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=3&format=json&origin=*`;
        const wikiResponse = await fetch(wikiUrl);
        const wikiData = await wikiResponse.json();
        if (wikiData && wikiData[1] && wikiData[1].length > 0) {
            let searchSummary = `🔍 **Wikipedia:**\n\n`;
            for (let i = 0; i < Math.min(3, wikiData[1].length); i++) {
                searchSummary += `**${wikiData[1][i]}**\n${wikiData[2][i] || ''}\n🔗 ${wikiData[3][i]}\n\n`;
            }
            return searchSummary;
        }
        return `🔍 Búsqueda realizada para: "${query}"\n\nℹ️ No se encontraron resultados.`;
    } catch (error) {
        console.error('Error en búsqueda web:', error);
        return `🔍 Error en la búsqueda. Intenta nuevamente.`;
    }
}

function needsWebSearch(message) {
    const keywords = ['busca', 'búsqueda', 'buscar', 'encuentra', 'qué es', 'quién es', 'noticias'];
    return keywords.some(keyword => message.toLowerCase().includes(keyword));
}

async function analyzeImageWithAI(base64Image) {
    try {
        const base64Data = base64Image.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/jpeg' });
        try {
            const response = await fetch(
                "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large",
                {
                    method: "POST",
                    headers: { "Content-Type": "image/jpeg" },
                    body: blob
                }
            );
            if (response.ok) {
                const result = await response.json();
                if (result && result[0] && result[0].generated_text) {
                    return `📸 **Análisis:** ${result[0].generated_text}`;
                }
            }        } catch (e) {
            console.log('BLIP no disponible');
        }
        return `📸 Imagen recibida. ¿Qué quieres saber sobre ella?`;
    } catch (error) {
        console.error('Error:', error);
        return `📸 Imagen recibida. Estoy listo para ayudarte.`;
    }
}

function checkForHumorResponse(message) {
    const lowerMsg = message.toLowerCase();
    const keywords = ['te gusta el pene', 'eres gay', 'te gustan los hombres', 'a ti te gusta', 'maricon', 'marica'];
    if (keywords.some(keyword => lowerMsg.includes(keyword))) {
        return humorResponses[Math.floor(Math.random() * humorResponses.length)];
    }
    return null;
}

async function sendMessage() {
    if (isSending) return;
    const message = userInput.value.trim();
    if (!message && currentImages.length === 0) return;
    const chat = chats.find(c => c.id === currentChatId);
    if (!chat) return;
    isSending = true;
    sendButton.disabled = true;
    let wrapper = chatContainer.querySelector('.messages-wrapper');
    if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.className = 'messages-wrapper';
        chatContainer.innerHTML = '';
        chatContainer.appendChild(wrapper);
    }
    const emptyState = chatContainer.querySelector('.empty-state');
    if (emptyState) emptyState.remove();
    const userMessage = message || '📸 ¿Qué ves en esta imagen?';
    const userImages = [...currentImages];
    chat.messages.push({ role: 'user', text: userMessage, images: userImages });
    wrapper.appendChild(createMessageElement(userMessage, 'user', userImages));
    conversationContext.push({ role: 'user', content: userMessage });
    if (chat.messages.length === 1) {
        chat.title = userMessage.substring(0, 30) + (userMessage.length > 30 ? '...' : '');
        renderChatsList();
    }
    userInput.value = '';
    userInput.style.height = 'auto';
    currentImages = [];
    const previewArea = document.getElementById('imagePreviewArea');
    if (previewArea) previewArea.innerHTML = '';    chatContainer.scrollTop = chatContainer.scrollHeight;
    const typingMsg = document.createElement('div');
    typingMsg.className = 'message assistant';
    const slowClass = slowTalkEnabled ? 'slow' : '';
    typingMsg.innerHTML = `
        <div class="message-header">
            <div class="avatar">D</div>
            <div class="message-role">DarkoAI</div>
        </div>
        <div class="message-content">
            <div class="typing-indicator ${slowClass}">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;
    wrapper.appendChild(typingMsg);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    const humorResponse = checkForHumorResponse(userMessage);
    if (humorResponse) {
        const delay = slowTalkEnabled ? 1500 : 800;
        setTimeout(() => {
            typingMsg.remove();
            chat.messages.push({ role: 'assistant', text: humorResponse });
            wrapper.appendChild(createMessageElement(humorResponse, 'assistant'));
            conversationContext.push({ role: 'assistant', content: humorResponse });
            saveToStorage();
            isSending = false;
            sendButton.disabled = false;
            userInput.focus();
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }, delay);
        return;
    }
    let searchResults = null;
    if (webSearchEnabled && !userImages.length && needsWebSearch(userMessage)) {
        searchResults = await searchWeb(userMessage);
    }
    if (userImages.length > 0) {
        typingMsg.remove();
        let imageAnalysis = '';
        for (let i = 0; i < userImages.length; i++) {
            const analysis = await analyzeImageWithAI(userImages[i]);
            imageAnalysis += analysis + '\n\n';
        }
        try {
            const history = [
                { role: 'system', content: systemPrompt },
                ...conversationContext.slice(-8),
                { role: 'user', content: userMessage + '\n\n' + imageAnalysis }
            ];            const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: document.getElementById('modelSelect')?.value || FREE_MODELS[0],
                    messages: history,
                    max_tokens: 4000,
                    temperature: 0.8
                })
            });
            const data = await res.json();
            if (data.choices && data.choices[0] && data.choices[0].message) {
                const assistantMessage = data.choices[0].message.content;
                chat.messages.push({ role: 'assistant', text: assistantMessage });
                wrapper.appendChild(createMessageElement(assistantMessage, 'assistant'));
                conversationContext.push({ role: 'assistant', content: assistantMessage });
                saveToStorage();
            }
        } catch (error) {
            console.error('Error:', error);
            chat.messages.push({ role: 'assistant', text: imageAnalysis });
            wrapper.appendChild(createMessageElement(imageAnalysis, 'assistant'));
            saveToStorage();
        }
        isSending = false;
        sendButton.disabled = false;
        userInput.focus();
        chatContainer.scrollTop = chatContainer.scrollHeight;
        return;
    }
    try {
        let contextToUse = [...conversationContext];
        if (searchResults) {
            const lastMsg = {...contextToUse[contextToUse.length - 1]};
            lastMsg.content = `${userMessage}\n\n[Información de búsqueda web]:\n${searchResults}`;
            contextToUse[contextToUse.length - 1] = lastMsg;
        }
        const history = [
            { role: 'system', content: systemPrompt },
            ...contextToUse
        ];
        const model = document.getElementById('modelSelect')?.value || FREE_MODELS[0];
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json"            },
            body: JSON.stringify({
                model: model,
                messages: history,
                max_tokens: 4000,
                temperature: 0.8
            })
        });
        const data = await res.json();
        if (res.ok && data.choices && data.choices[0] && data.choices[0].message) {
            typingMsg.remove();
            const assistantMessage = data.choices[0].message.content;
            chat.messages.push({ role: 'assistant', text: assistantMessage });
            wrapper.appendChild(createMessageElement(assistantMessage, 'assistant'));
            conversationContext.push({ role: 'assistant', content: assistantMessage });
            saveToStorage();
        } else {
            throw new Error(data.error?.message || 'Error');
        }
    } catch (error) {
        console.error('Error:', error);
        typingMsg.remove();
        const errorMsg = '⚠️ Error de conexión. Intenta nuevamente. 🔄';
        chat.messages.push({ role: 'assistant', text: errorMsg });
        wrapper.appendChild(createMessageElement(errorMsg, 'assistant'));
        conversationContext.push({ role: 'assistant', content: errorMsg });
        saveToStorage();
    }
    isSending = false;
    sendButton.disabled = false;
    userInput.focus();
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleImageUpload);
    }
    setTimeout(() => {
        const previewArea = document.getElementById('imagePreviewArea');
        if (previewArea) previewArea.innerHTML = '';
        if (chats.length === 0) {
            createNewChat();
        }
    }, 100);
});

window.addEventListener('resize', function() {
    if (window.innerWidth > 768 && sidebar.classList.contains('open')) {        sidebar.classList.remove('open');
        document.getElementById('overlay').classList.remove('active');
    }
});

loadFromStorage();
if (chats.length === 0) {
    createNewChat();
} else if (currentChatId) {
    loadChat(currentChatId);
} else {
    loadChat(chats[0].id);
}
renderChatsList();