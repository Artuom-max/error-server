// Модуль для работы с пользователями
class UserManager {
    constructor() {
        this.currentUser = null;
        this.users = [];
        this.loadUsers();
    }
    
    loadUsers() {
        const savedUsers = localStorage.getItem('vbsUsers');
        if (savedUsers) {
            this.users = JSON.parse(savedUsers);
        } else {
            // Демо пользователи
            this.users = [
                { id: 1, username: 'Гость', role: 'user', avatar: '👤' },
                { id: 2, username: 'Админ', role: 'admin', avatar: '👑' },
                { id: 3, username: 'Разработчик', role: 'admin', avatar: '💻' }
            ];
            this.saveUsers();
        }
    }
    
    saveUsers() {
        localStorage.setItem('vbsUsers', JSON.stringify(this.users));
    }
    
    login(username, role = 'user') {
        let user = this.users.find(u => u.username === username);
        
        if (!user) {
            user = {
                id: Date.now(),
                username,
                role,
                avatar: this.getAvatarForRole(role),
                createdAt: new Date().toISOString()
            };
            this.users.push(user);
            this.saveUsers();
        }
        
        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        return user;
    }
    
    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
    }
    
    getCurrentUser() {
        if (!this.currentUser) {
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                this.currentUser = JSON.parse(savedUser);
            } else {
                this.currentUser = this.login('Гость', 'user');
            }
        }
        return this.currentUser;
    }
    
    getAvatarForRole(role) {
        const avatars = {
            admin: '👑',
            user: '👤',
            developer: '💻',
            moderator: '⚡'
        };
        return avatars[role] || '👤';
    }
}

// Модуль для работы с VBS скриптами
class VBSManager {
    constructor() {
        this.templates = [];
        this.history = [];
        this.loadTemplates();
        this.loadHistory();
    }
    
    loadTemplates() {
        const saved = localStorage.getItem('vbsTemplates');
        if (saved) {
            this.templates = JSON.parse(saved);
        } else {
            this.templates = this.getDefaultTemplates();
            this.saveTemplates();
        }
    }
    
    loadHistory() {
        const saved = localStorage.getItem('vbsHistory');
        if (saved) {
            this.history = JSON.parse(saved);
        }
    }
    
    getDefaultTemplates() {
        return [
            {
                id: 1,
                name: "Приветствие",
                description: "Простое информационное сообщение",
                code: 'MsgBox "Добро пожаловать в систему!", vbInformation, "Приветствие"',
                type: "info",
                buttons: "ok",
                category: "basic",
                author: "system",
                createdAt: new Date().toISOString(),
                usageCount: 0
            },
            {
                id: 2,
                name: "Ошибка загрузки",
                description: "Сообщение об ошибке загрузки файла",
                code: 'MsgBox "Не удалось загрузить файл: доступ запрещен", vbCritical, "ОШИБКА ЗАГРУЗКИ"',
                type: "error",
                buttons: "ok",
                category: "error",
                author: "system",
                createdAt: new Date().toISOString(),
                usageCount: 0
            },
            {
                id: 3,
                name: "Предупреждение о перезагрузке",
                description: "Предупреждение о скорой перезагрузке системы",
                code: 'MsgBox "Система будет перезагружена через 60 секунд. Сохраните ваши данные.", vbExclamation, "ПРЕДУПРЕЖДЕНИЕ"',
                type: "warning",
                buttons: "okcancel",
                category: "warning",
                author: "system",
                createdAt: new Date().toISOString(),
                usageCount: 0
            },
            {
                id: 4,
                name: "Диалог подтверждения",
                description: "Вопрос с выбором Да/Нет и обработкой ответа",
                code: `response = MsgBox("Вы уверены что хотите удалить этот файл?", vbYesNo + vbQuestion, "Подтверждение удаления")

If response = vbYes Then
    MsgBox "Файл удален", vbInformation, "Результат"
Else
    MsgBox "Удаление отменено", vbInformation, "Результат"
End If`,
                type: "question",
                buttons: "yesno",
                category: "interactive",
                author: "system",
                createdAt: new Date().toISOString(),
                usageCount: 0
            },
            {
                id: 5,
                name: "Таймер с уведомлениями",
                description: "Несколько сообщений с задержкой между ними",
                code: `MsgBox "Запуск процесса...", vbInformation, "Таймер"
WScript.Sleep 2000
MsgBox "Обработка данных...", vbInformation, "Таймер"
WScript.Sleep 2000
MsgBox "Процесс завершен!", vbInformation, "Таймер"`,
                type: "info",
                buttons: "ok",
                category: "advanced",
                author: "system",
                createdAt: new Date().toISOString(),
                usageCount: 0
            }
        ];
    }
    
    saveTemplates() {
        localStorage.setItem('vbsTemplates', JSON.stringify(this.templates));
    }
    
    saveHistory() {
        localStorage.setItem('vbsHistory', JSON.stringify(this.history));
    }
    
    addTemplate(template) {
        template.id = Date.now();
        template.createdAt = new Date().toISOString();
        template.usageCount = 0;
        this.templates.unshift(template);
        this.saveTemplates();
        return template;
    }
    
    updateTemplate(id, updates) {
        const index = this.templates.findIndex(t => t.id === id);
        if (index !== -1) {
            this.templates[index] = { ...this.templates[index], ...updates };
            this.saveTemplates();
        }
    }
    
    deleteTemplate(id) {
        this.templates = this.templates.filter(t => t.id !== id);
        this.saveTemplates();
    }
    
    incrementUsage(templateId) {
        const template = this.templates.find(t => t.id === templateId);
        if (template) {
            template.usageCount = (template.usageCount || 0) + 1;
            this.saveTemplates();
        }
    }
    
    addToHistory(message) {
        message.id = Date.now();
        message.timestamp = new Date().toISOString();
        this.history.unshift(message);
        
        // Ограничиваем историю 100 записями
        if (this.history.length > 100) {
            this.history.pop();
        }
        
        this.saveHistory();
    }
    
    clearHistory() {
        this.history = [];
        this.saveHistory();
    }
    
    getTemplatesByCategory(category) {
        if (category === 'all') return this.templates;
        return this.templates.filter(t => t.category === category);
    }
    
    getMostUsedTemplates(limit = 5) {
        return [...this.templates]
            .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
            .slice(0, limit);
    }
    
    getRecentTemplates(limit = 5) {
        return [...this.templates]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, limit);
    }
}

// Модуль для эмуляции VBS
class VBSInterpreter {
    constructor() {
        this.icons = {
            info: { emoji: 'ℹ️', color: '#3498db', vb: 'vbInformation' },
            error: { emoji: '❌', color: '#e74c3c', vb: 'vbCritical' },
            warning: { emoji: '⚠️', color: '#f39c12', vb: 'vbExclamation' },
            question: { emoji: '❓', color: '#4a6fa5', vb: 'vbQuestion' }
        };
        
        this.buttons = {
            ok: { vb: 'vbOKOnly', labels: ['OK'] },
            okcancel: { vb: 'vbOKCancel', labels: ['OK', 'Отмена'] },
            yesno: { vb: 'vbYesNo', labels: ['Да', 'Нет'] },
            yesnocancel: { vb: 'vbYesNoCancel', labels: ['Да', 'Нет', 'Отмена'] }
        };
    }
    
    parseVBS(vbsCode) {
        const result = {
            title: 'Сообщение',
            text: 'Сообщение',
            type: 'info',
            buttons: 'ok',
            rawCode: vbsCode
        };
        
        try {
            // Простой парсинг VBS кода
            const msgBoxMatch = vbsCode.match(/MsgBox\s+"([^"]+)"\s*,\s*([^,]+)\s*,\s*"([^"]+)"/i);
            
            if (msgBoxMatch) {
                result.text = msgBoxMatch[1];
                result.type = this.getTypeFromVBConstant(msgBoxMatch[2]);
                result.title = msgBoxMatch[3];
                
                // Определяем кнопки
                if (msgBoxMatch[2].includes('YesNoCancel')) {
                    result.buttons = 'yesnocancel';
                } else if (msgBoxMatch[2].includes('YesNo')) {
                    result.buttons = 'yesno';
                } else if (msgBoxMatch[2].includes('OKCancel')) {
                    result.buttons = 'okcancel';
                }
            }
        } catch (e) {
            console.error('Error parsing VBS:', e);
        }
        
        return result;
    }
    
    getTypeFromVBConstant(vbConstant) {
        if (vbConstant.includes('Information')) return 'info';
        if (vbConstant.includes('Critical')) return 'error';
        if (vbConstant.includes('Exclamation')) return 'warning';
        if (vbConstant.includes('Question')) return 'question';
        return 'info';
    }
    
    generateVBS(title, text, type, buttons) {
        const icon = this.icons[type] || this.icons.info;
        const button = this.buttons[buttons] || this.buttons.ok;
        
        return `MsgBox "${text}", ${icon.vb} + ${button.vb}, "${title}"`;
    }
    
    generateInteractiveVBS(title, text, type, buttons) {
        const icon = this.icons[type] || this.icons.info;
        const button = this.buttons[buttons] || this.buttons.ok;
        
        if (type === 'question' && buttons === 'yesno') {
            return `response = MsgBox("${text}", ${icon.vb} + ${button.vb}, "${title}")

If response = vbYes Then
    MsgBox "Вы выбрали ДА", vbInformation, "Результат"
Else
    MsgBox "Вы выбрали НЕТ", vbInformation, "Результат"
End If`;
        }
        
        return this.generateVBS(title, text, type, buttons);
    }
}

// Модуль для UI компонентов
class UIComponents {
    static createMessageBox(title, text, type, buttons, onButtonClick) {
        const icons = {
            info: { emoji: 'ℹ️', color: '#3498db' },
            error: { emoji: '❌', color: '#e74c3c' },
            warning: { emoji: '⚠️', color: '#f39c12' },
            question: { emoji: '❓', color: '#4a6fa5' }
        };
        
        const buttonConfigs = {
            ok: [{ text: 'OK', value: 'ok' }],
            okcancel: [
                { text: 'OK', value: 'ok' },
                { text: 'Отмена', value: 'cancel' }
            ],
            yesno: [
                { text: 'Да', value: 'yes' },
                { text: 'Нет', value: 'no' }
            ],
            yesnocancel: [
                { text: 'Да', value: 'yes' },
                { text: 'Нет', value: 'no' },
                { text: 'Отмена', value: 'cancel' }
            ]
        };
        
        const icon = icons[type] || icons.info;
        const buttonList = buttonConfigs[buttons] || buttonConfigs.ok;
        
        const messagebox = document.createElement('div');
        messagebox.className = 'messagebox';
        messagebox.innerHTML = `
            <div class="messagebox-header" style="background: linear-gradient(to bottom, #f0f0f0, ${icon.color}20);">
                <div class="messagebox-icon">${icon.emoji}</div>
                <span>${title}</span>
            </div>
            <div class="messagebox-content">
                <div class="messagebox-icon" style="color: ${icon.color};">${icon.emoji}</div>
                <div style="flex: 1;">${text}</div>
            </div>
            <div class="messagebox-buttons">
                ${buttonList.map(btn => `
                    <button class="win-button" data-value="${btn.value}">
                        ${btn.text}
                    </button>
                `).join('')}
            </div>
        `;
        
        // Добавляем обработчики кнопок
        messagebox.querySelectorAll('.win-button').forEach(button => {
            button.addEventListener('click', () => {
                if (onButtonClick) {
                    onButtonClick(button.dataset.value);
                }
            });
        });
        
        return messagebox;
    }
    
    static showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: white;
            padding: 15px 25px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            gap: 15px;
            z-index: 1001;
            transform: translateX(100%);
            transition: transform 0.3s;
            border-left: 5px solid ${this.getNotificationColor(type)};
        `;
        
        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️',
            warning: '⚠️'
        };
        
        notification.innerHTML = `
            <div style="font-size: 1.5em;">${icons[type] || icons.info}</div>
            <div>${message}</div>
        `;
        
        document.body.appendChild(notification);
        
        // Анимация появления
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Автоматическое скрытие
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, duration);
    }
    
    static getNotificationColor(type) {
        const colors = {
            success: '#27ae60',
            error: '#e74c3c',
            info: '#3498db',
            warning: '#f39c12'
        };
        return colors[type] || colors.info;
    }
    
    static createTemplateCard(template, onClick, onUse, onTest) {
        const card = document.createElement('div');
        card.className = 'vbs-item';
        card.innerHTML = `
            <div class="vbs-title">
                <i class="fas fa-${this.getTemplateIcon(template.type)}"
                   style="color: ${this.getTemplateColor(template.type)};">
                </i>
                ${template.name}
            </div>
            <div class="vbs-description">${template.description}</div>
            <div class="vbs-code">${template.code.substring(0, 100)}${template.code.length > 100 ? '...' : ''}</div>
            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <button class="win-button use-btn" style="flex: 1;">
                    <i class="fas fa-play"></i> Использовать
                </button>
                <button class="win-button test-btn" style="flex: 1; background: #27ae60; color: white;">
                    <i class="fas fa-vial"></i> Тест
                </button>
            </div>
        `;
        
        card.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                onClick(template);
            }
        });
        
        card.querySelector('.use-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            onUse(template);
        });
        
        card.querySelector('.test-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            onTest(template);
        });
        
        return card;
    }
    
    static getTemplateIcon(type) {
        const icons = {
            info: 'info-circle',
            error: 'times-circle',
            warning: 'exclamation-triangle',
            question: 'question-circle'
        };
        return icons[type] || 'info-circle';
    }
    
    static getTemplateColor(type) {
        const colors = {
            info: '#3498db',
            error: '#e74c3c',
            warning: '#f39c12',
            question: '#4a6fa5'
        };
        return colors[type] || '#3498db';
    }
}

// Инициализация приложения
class VBSApp {
    constructor() {
        this.userManager = new UserManager();
        this.vbsManager = new VBSManager();
        this.interpreter = new VBSInterpreter();
        
        this.init();
    }
    
    init() {
        this.loadUser();
        this.setupEventListeners();
        this.updateUI();
    }
    
    loadUser() {
        this.currentUser = this.userManager.getCurrentUser();
    }
    
    setupEventListeners() {
        // Здесь будут обработчики событий для всего приложения
    }
    
    updateUI() {
        // Обновление интерфейса на основе состояния приложения
    }
    
    showMessage(title, text, type, buttons) {
        const messagebox = UIComponents.createMessageBox(
            title, text, type, buttons,
            (buttonValue) => this.handleMessageButton(buttonValue, type)
        );
        
        // Показываем модальное окно
        this.showModal(messagebox);
        
        // Добавляем в историю
        this.vbsManager.addToHistory({
            title,
            text,
            type,
            buttons,
            timestamp: new Date().toLocaleString()
        });
    }
    
    handleMessageButton(buttonValue, messageType) {
        const responses = {
            ok: "Нажата кнопка OK",
            cancel: "Действие отменено",
            yes: "Выбрано ДА",
            no: "Выбрано НЕТ"
        };
        
        UIComponents.showNotification(
            responses[buttonValue] || "Кнопка нажата",
            "info"
        );
        
        // Если это был вопрос с выбором Да/Нет
        if (messageType === 'question' && (buttonValue === 'yes' || buttonValue === 'no')) {
            setTimeout(() => {
                const result = buttonValue === 'yes' ? "Вы выбрали ДА" : "Вы выбрали НЕТ";
                this.showMessage(
                    "Результат",
                    result,
                    'info',
                    'ok'
                );
            }, 500);
        }
    }
    
    showModal(content) {
        // Реализация модального окна
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;
        
        overlay.appendChild(content);
        document.body.appendChild(overlay);
        
        // Закрытие по клику на оверлей
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });
        
        // Закрытие по ESC
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                overlay.remove();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
        
        return overlay;
    }
}

// Запуск приложения
window.addEventListener('DOMContentLoaded', () => {
    window.vbsApp = new VBSApp();
});

// ============================================
// ФУНКЦИИ ДЛЯ ОБУЧЕНИЯ
// ============================================

function showLearnTab(tabName) {
    // Скрываем все вкладки обучения
    document.querySelectorAll('.learn-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.learn-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Показываем выбранную вкладку
    document.getElementById(tabName + '-tab').classList.add('active');
    event.target.classList.add('active');
    
    // Прокручиваем к началу
    document.getElementById(tabName + '-tab').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

function testLearnCode(vbsCode) {
    try {
        // Парсим VBS код
        const msgBoxMatch = vbsCode.match(/MsgBox\s+"([^"]+)"\s*,\s*([^,]+)\s*,\s*"([^"]+)"/i);
        
        if (msgBoxMatch) {
            const text = msgBoxMatch[1];
            const vbConstant = msgBoxMatch[2];
            const title = msgBoxMatch[3];
            
            // Определяем тип
            let type = 'info';
            if (vbConstant.includes('Critical')) type = 'error';
            else if (vbConstant.includes('Exclamation')) type = 'warning';
            else if (vbConstant.includes('Question')) type = 'question';
            
            // Определяем кнопки
            let buttons = 'ok';
            if (vbConstant.includes('YesNoCancel')) buttons = 'yesnocancel';
            else if (vbConstant.includes('YesNo')) buttons = 'yesno';
            else if (vbConstant.includes('OKCancel')) buttons = 'okcancel';
            
            // Показываем сообщение
            showModalMessage(title, text, type, buttons);
        } else {
            showNotification("Не удалось распознать VBS код", "error");
        }
    } catch (error) {
        showNotification("Ошибка: " + error.message, "error");
    }
}

function loadLearnExample(exampleNumber) {
    const examples = [
        {
            title: "Приветствие",
            text: "Добро пожаловать в мир VBS!",
            type: "info",
            buttons: "ok"
        },
        {
            title: "ОШИБКА",
            text: "Не удалось выполнить операцию!",
            type: "error",
            buttons: "ok"
        },
        {
            title: "ПРЕДУПРЕЖДЕНИЕ",
            text: "Система будет перезагружена через 60 секунд.",
            type: "warning",
            buttons: "okcancel"
        },
        {
            title: "Вопрос",
            text: "Вы уверены что хотите продолжить?",
            type: "question",
            buttons: "yesno"
        },
        {
            title: "Таймер",
            text: "Сообщение 1: Ждите 2 секунды...",
            type: "info",
            buttons: "ok"
        },
        {
            title: "Обработка ответа",
            text: "Какой цвет вы предпочитаете?",
            type: "question",
            buttons: "yesno"
        }
    ];
    
    const example = examples[exampleNumber - 1];
    if (example) {
        // Загружаем в конструктор
        document.getElementById('msgTitle').value = example.title;
        document.getElementById('msgText').value = example.text;
        
        // Выбираем иконку
        document.querySelectorAll('.icon-option').forEach(option => {
            option.classList.remove('selected');
            if (option.dataset.type === example.type) {
                option.classList.add('selected');
            }
        });
        
        // Выбираем кнопки
        document.getElementById('msgButtons').value = example.buttons;
        
        // Обновляем предпросмотр
        updatePreview();
        
        // Переключаемся на вкладку создания
        showSection('create');
        
        // Прокручиваем к верху
        document.getElementById('createSection').scrollIntoView({ behavior: 'smooth' });
        
        showNotification(`Загружен пример: ${example.title}`, "success");
    }
}

function testTimerExample() {
    showModalMessage("Таймер", "Сообщение 1: Ждите 2 секунды...", "info", "ok");
    
    // Имитация задержки
    setTimeout(() => {
        showModalMessage("Таймер", "Сообщение 2: Прошло 2 секунды!", "info", "ok");
    }, 2000);
}

function testResponseExample() {
    showModalMessage(
        "Обработка ответа",
        "Какой цвет вы предпочитаете?",
        "question",
        "yesno"
    );
}

function testInteractiveExample() {
    const text = document.getElementById('learnText').value || "Моё тестовое сообщение";
    const type = document.getElementById('learnType').value;
    
    showModalMessage(
        "Моё сообщение",
        text,
        type,
        "ok"
    );
}

function testSleepExample() {
    showModalMessage("Таймер", "Сообщение 1: Ждите 3 секунды...", "info", "ok");
    
    // Показываем имитацию загрузки
    setTimeout(() => {
        showModalMessage("Таймер", "Сообщение 2: Прошло 3 секунды!", "info", "ok");
        setTimeout(() => {
            showModalMessage("Таймер", "Сообщение 3: Готово!", "info", "ok");
        }, 1000);
    }, 3000);
}

function testAdvancedResponse() {
    showModalMessage(
        "Сохранение",
        "Сохранить изменения в файле?",
        "question",
        "yesnocancel"
    );
}

function testLoopExample() {
    let count = 0;
    
    function showNextMessage() {
        count++;
        if (count <= 3) {
            showModalMessage(
                "Цикл",
                `Сообщение номер ${count}`,
                "info",
                "ok"
            );
            
            if (count < 3) {
                setTimeout(showNextMessage, 1000);
            }
        }
    }
    
    showNextMessage();
}

function copyQuickCode(vbsCode) {
    navigator.clipboard.writeText(vbsCode).then(() => {
        showNotification("Код скопирован в буфер обмена!", "success");
    }).catch(err => {
        showNotification("Не удалось скопировать код", "error");
    });
}

// ============================================
// ФУНКЦИИ ДЛЯ НАСТРОЕК
// ============================================

function showSettingsTab(tabName) {
    // Скрываем все вкладки настроек
    document.querySelectorAll('.settings-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Показываем выбранную вкладку
    document.getElementById(tabName + '-tab').classList.add('active');
    event.target.classList.add('active');
    
    // Загружаем данные для вкладки
    if (tabName === 'account') {
        loadAccountData();
    } else if (tabName === 'appearance') {
        loadAppearanceSettings();
    } else if (tabName === 'notifications') {
        loadNotificationSettings();
    }
}

function selectTheme(theme) {
    // Убираем выделение со всех тем
    document.querySelectorAll('.theme-option').forEach(option => {
        option.classList.remove('active');
    });
    
    // Выделяем выбранную тему
    event.target.classList.add('active');
    
    // Обновляем предпросмотр темы
    updateThemePreview(theme);
}

function updateThemePreview(theme) {
    const preview = document.getElementById('themePreview');
    
    // Сбрасываем стили
    preview.style.cssText = '';
    
    // Применяем стили темы
    switch(theme) {
        case 'dark':
            preview.style.background = '#2c3e50';
            preview.style.color = '#ecf0f1';
            preview.querySelector('.preview-header').style.background = '#34495e';
            preview.querySelector('.preview-buttons').style.background = '#2c3e50';
            break;
        case 'blue':
            preview.style.background = 'linear-gradient(135deg, #4a6fa5, #166088)';
            preview.style.color = 'white';
            preview.querySelector('.preview-header').style.background = 'rgba(255,255,255,0.2)';
            preview.querySelector('.preview-buttons').style.background = 'rgba(255,255,255,0.1)';
            break;
        case 'purple':
            preview.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
            preview.style.color = 'white';
            preview.querySelector('.preview-header').style.background = 'rgba(255,255,255,0.2)';
            preview.querySelector('.preview-buttons').style.background = 'rgba(255,255,255,0.1)';
            break;
        default: // light
            preview.style.background = 'white';
            preview.style.color = '#333';
            preview.querySelector('.preview-header').style.background = 'linear-gradient(to bottom, #f0f0f0, #e0e0e0)';
            preview.querySelector('.preview-buttons').style.background = '#f8f8f8';
    }
}

function loadAccountData() {
    // Загружаем данные пользователя
    const user = JSON.parse(localStorage.getItem('currentUser') || '{"username":"Гость","role":"user","avatar":"👤"}');
    
    document.getElementById('username').value = user.username;
    document.getElementById('userRole').value = user.role;
    document.getElementById('currentRole').textContent = 
        user.role === 'admin' ? 'Администратор' : 
        user.role === 'developer' ? 'Разработчик' : 'Пользователь';
    document.getElementById('settingsAvatar').textContent = user.avatar;
    
    // Загружаем статистику
    const history = JSON.parse(localStorage.getItem('vbsHistory') || '[]');
    const templates = JSON.parse(localStorage.getItem('vbsTemplates') || '[]');
    const messages = history.length;
    
    document.getElementById('messagesCount').textContent = messages;
    document.getElementById('templatesCount').textContent = templates.length;
    document.getElementById('historyCount').textContent = messages;
}

function loadAppearanceSettings() {
    // Загружаем сохранённые настройки внешнего вида
    const settings = JSON.parse(localStorage.getItem('appearanceSettings') || '{}');
    
    if (settings.theme) {
        document.querySelector(`.theme-option[data-theme="${settings.theme}"]`)?.classList.add('active');
        updateThemePreview(settings.theme);
    }
    
    if (settings.fontSize) {
        document.getElementById('fontSize').value = settings.fontSize;
    }
    
    if (settings.animations !== undefined) {
        document.getElementById('animations').checked = settings.animations;
    }
    
    if (settings.compactMode !== undefined) {
        document.getElementById('compactMode').checked = settings.compactMode;
    }
}

function loadNotificationSettings() {
    // Загружаем сохранённые настройки уведомлений
    const settings = JSON.parse(localStorage.getItem('notificationSettings') || '{}');
    
    if (settings.showNotifications !== undefined) {
        document.getElementById('showNotifications').checked = settings.showNotifications;
    }
    
    if (settings.position) {
        document.getElementById('notificationPosition').value = settings.position;
    }
    
    if (settings.duration) {
        document.getElementById('notificationDuration').value = settings.duration;
        document.getElementById('durationValue').textContent = settings.duration + ' секунд';
    }
    
    if (settings.notifySuccess !== undefined) {
        document.getElementById('notifySuccess').checked = settings.notifySuccess;
    }
    
    if (settings.notifyError !== undefined) {
        document.getElementById('notifyError').checked = settings.notifyError;
    }
    
    if (settings.notifyInfo !== undefined) {
        document.getElementById('notifyInfo').checked = settings.notifyInfo;
    }
    
    if (settings.notifyWarning !== undefined) {
        document.getElementById('notifyWarning').checked = settings.notifyWarning;
    }
}

// Обновление значения длительности уведомлений
document.getElementById('notificationDuration').addEventListener('input', function() {
    document.getElementById('durationValue').textContent = this.value + ' секунд';
});

function testNotification(type) {
    const messages = {
        success: "✅ Операция выполнена успешно!",
        error: "❌ Произошла ошибка при выполнении",
        info: "ℹ️ Это информационное сообщение",
        warning: "⚠️ Внимание! Проверьте настройки"
    };
    
    showNotification(messages[type], type);
}

function saveSettings() {
    // Сохраняем основные настройки
    const generalSettings = {
        autoSave: document.getElementById('autoSave').checked,
        soundNotifications: document.getElementById('soundNotifications').checked,
        autoScroll: document.getElementById('autoScroll').checked,
        historyLimit: document.getElementById('historyLimit').value
    };
    
    // Сохраняем настройки внешнего вида
    const appearanceSettings = {
        theme: document.querySelector('.theme-option.active')?.dataset.theme || 'light',
        fontSize: document.getElementById('fontSize').value,
        animations: document.getElementById('animations').checked,
        compactMode: document.getElementById('compactMode').checked
    };
    
    // Сохраняем настройки уведомлений
    const notificationSettings = {
        showNotifications: document.getElementById('showNotifications').checked,
        position: document.getElementById('notificationPosition').value,
        duration: document.getElementById('notificationDuration').value,
        notifySuccess: document.getElementById('notifySuccess').checked,
        notifyError: document.getElementById('notifyError').checked,
        notifyInfo: document.getElementById('notifyInfo').checked,
        notifyWarning: document.getElementById('notifyWarning').checked
    };
    
    // Сохраняем настройки аккаунта
    const user = {
        username: document.getElementById('username').value,
        role: document.getElementById('userRole').value,
        avatar: document.getElementById('settingsAvatar').textContent
    };
    
    // Сохраняем в localStorage
    localStorage.setItem('generalSettings', JSON.stringify(generalSettings));
    localStorage.setItem('appearanceSettings', JSON.stringify(appearanceSettings));
    localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    // Применяем настройки
    applySettings(generalSettings, appearanceSettings, notificationSettings, user);
    
    showNotification("Настройки успешно сохранены!", "success");
}

function applySettings(general, appearance, notifications, user) {
    // Применяем настройки внешнего вида
    document.body.className = appearance.theme + '-mode';
    
    // Применяем размер шрифта
    document.body.style.fontSize = 
        appearance.fontSize === 'small' ? '14px' :
        appearance.fontSize === 'large' ? '18px' :
        appearance.fontSize === 'xlarge' ? '20px' : '16px';
    
    // Применяем компактный режим
    if (appearance.compactMode) {
        document.body.classList.add('compact-mode');
    } else {
        document.body.classList.remove('compact-mode');
    }
    
    // Обновляем пользователя
    document.getElementById('userName').textContent = user.username;
    document.getElementById('userRole').textContent = 
        user.role === 'admin' ? 'Администратор' : 
        user.role === 'developer' ? 'Разработчик' : 'Пользователь';
    document.getElementById('userAvatar').textContent = user.avatar;
    
    // Обновляем бейдж роли
    const badge = document.getElementById('userRole');
    if (user.role === 'admin') {
        badge.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
    } else if (user.role === 'developer') {
        badge.style.background = 'linear-gradient(135deg, #9b59b6, #8e44ad)';
    } else {
        badge.style.background = 'linear-gradient(135deg, var(--accent), #3ab08d)';
    }
}

function resetSettings() {
    if (confirm("Вы уверены что хотите сбросить все настройки к значениям по умолчанию?")) {
        // Сбрасываем чекбоксы
        document.getElementById('autoSave').checked = true;
        document.getElementById('soundNotifications').checked = false;
        document.getElementById('autoScroll').checked = true;
        document.getElementById('historyLimit').value = '100';
        
        // Сбрасываем внешний вид
        document.querySelectorAll('.theme-option').forEach(option => {
            option.classList.remove('active');
        });
        document.querySelector('.theme-option[data-theme="light"]').classList.add('active');
        document.getElementById('fontSize').value = 'normal';
        document.getElementById('animations').checked = true;
        document.getElementById('compactMode').checked = false;
        
        // Сбрасываем уведомления
        document.getElementById('showNotifications').checked = true;
        document.getElementById('notificationPosition').value = 'top-left';
        document.getElementById('notificationDuration').value = 3;
        document.getElementById('durationValue').textContent = '3 секунды';
        document.getElementById('notifySuccess').checked = true;
        document.getElementById('notifyError').checked = true;
        document.getElementById('notifyInfo').checked = true;
        document.getElementById('notifyWarning').checked = false;
        
        // Сбрасываем аккаунт
        document.getElementById('username').value = 'Гость';
        document.getElementById('userRole').value = 'user';
        
        showNotification("Настройки сброшены к значениям по умолчанию", "info");
    }
}

function changeAvatar() {
    const avatars = ['👤', '👨', '👩', '👨‍💻', '👩‍💻', '👑', '🎩', '🦸', '🦸‍♂️', '🦸‍♀️', '🧙', '🧙‍♂️', '🧙‍♀️'];
    const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
    
    document.getElementById('settingsAvatar').textContent = randomAvatar;
    showNotification("Аватар изменён на: " + randomAvatar, "success");
}

function exportData() {
    const data = {
        user: JSON.parse(localStorage.getItem('currentUser') || '{}'),
        history: JSON.parse(localStorage.getItem('vbsHistory') || '[]'),
        templates: JSON.parse(localStorage.getItem('vbsTemplates') || '[]'),
        settings: {
            general: JSON.parse(localStorage.getItem('generalSettings') || '{}'),
            appearance: JSON.parse(localStorage.getItem('appearanceSettings') || '{}'),
            notifications: JSON.parse(localStorage.getItem('notificationSettings') || '{}')
        },
        exportDate: new Date().toISOString(),
        version: '2.0.0'
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'vbs-simulator-backup.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showNotification("Данные успешно экспортированы", "success");
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = function(event) {
            try {
                const data = JSON.parse(event.target.result);
                
                // Проверяем версию
                if (data.version !== '2.0.0') {
                    showNotification("Версия файла не поддерживается", "error");
                    return;
                }
                
                // Импортируем данные
                if (data.user) localStorage.setItem('currentUser', JSON.stringify(data.user));
                if (data.history) localStorage.setItem('vbsHistory', JSON.stringify(data.history));
                if (data.templates) localStorage.setItem('vbsTemplates', JSON.stringify(data.templates));
                
                if (data.settings?.general) {
                    localStorage.setItem('generalSettings', JSON.stringify(data.settings.general));
                }
                if (data.settings?.appearance) {
                    localStorage.setItem('appearanceSettings', JSON.stringify(data.settings.appearance));
                }
                if (data.settings?.notifications) {
                    localStorage.setItem('notificationSettings', JSON.stringify(data.settings.notifications));
                }
                
                showNotification("Данные успешно импортированы", "success");
                
                // Перезагружаем страницу для применения настроек
                setTimeout(() => {
                    location.reload();
                }, 1000);
                
            } catch (error) {
                showNotification("Ошибка при импорте данных: " + error.message, "error");
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

function clearData() {
    if (confirm("Вы уверены что хотите удалить ВСЕ данные? Это действие нельзя отменить!")) {
        if (confirm("Точно? Будут удалены все сообщения, шаблоны и настройки!")) {
            localStorage.clear();
            showNotification("Все данные удалены", "success");
            setTimeout(() => {
                location.reload();
            }, 1000);
        }
    }
}

function checkForUpdates() {
    showNotification("Проверка обновлений...", "info");
    
    setTimeout(() => {
        showNotification("У вас установлена последняя версия", "success");
    }, 1500);
}

function showChangelog() {
    const changelog = `
<h4>Версия 2.0.0</h4>
<ul>
    <li>Полностью переработанный интерфейс</li>
    <li>Добавлена система обучения VBS</li>
    <li>Расширенные настройки</li>
    <li>Экспорт/импорт данных</li>
    <li>Тёмная тема</li>
</ul>

<h4>Версия 1.5.0</h4>
<ul>
    <li>Добавлена галерея шаблонов</li>
    <li>История сообщений</li>
    <li>Улучшенный конструктор</li>
</ul>

<h4>Версия 1.0.0</h4>
<ul>
    <li>Первоначальный выпуск</li>
    <li>Базовый конструктор VBS</li>
    <li>Эмуляция MessageBox</li>
</ul>
`;
    
    showModalMessage("История изменений", changelog, "info", "ok");
}

function reportBug() {
    const bugReport = `
Для сообщения об ошибке:
1. Опишите что произошло
2. Что вы ожидали получить
3. Шаги для воспроизведения

Отправьте описание на email:
support@vbs-simulator.example.com

Или создайте issue на GitHub:
github.com/username/vbs-simulator/issues
`;
    
    showModalMessage("Сообщить об ошибке", bugReport, "info", "ok");
}

// Загрузка настроек при старте
window.addEventListener('DOMContentLoaded', function() {
    // Загружаем сохранённые настройки
    const generalSettings = JSON.parse(localStorage.getItem('generalSettings') || '{}');
    const appearanceSettings = JSON.parse(localStorage.getItem('appearanceSettings') || '{}');
    const notificationSettings = JSON.parse(localStorage.getItem('notificationSettings') || '{}');
    const user = JSON.parse(localStorage.getItem('currentUser') || '{"username":"Гость","role":"user","avatar":"👤"}');
    
    // Применяем настройки если они есть
    if (Object.keys(appearanceSettings).length > 0) {
        applySettings(generalSettings, appearanceSettings, notificationSettings, user);
    }
});
