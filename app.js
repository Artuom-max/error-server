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