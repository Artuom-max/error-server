import socket
import json
import threading
import time
import os
import sys
import requests
import subprocess
import tempfile
from getpass import getpass

class MultiUserClient:
    """Клиент с поддержкой разных пользователей"""
    
    def __init__(self, server_url="http://localhost:8080"):
        self.server_url = server_url.rstrip('/')
        self.local_ip = self.get_local_ip()
        self.username = None
        self.role = None
        self.session_token = None
        self.running = True
        
        print("="*60)
        print("     КЛИЕНТ С МНОГОПОЛЬЗОВАТЕЛЬСКОЙ СИСТЕМОЙ")
        print("="*60)
    
    def get_local_ip(self):
        """Получает локальный IP"""
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except:
            return "127.0.0.1"
    
    def authenticate_user(self):
        """Аутентификация пользователя"""
        print("\n🔐 АВТОРИЗАЦИЯ")
        print("="*40)
        
        while True:
            print("\nВарианты входа:")
            print("1. 👤 Войти как пользователь (логин без пароля)")
            print("2. 👑 Войти как администратор (логин + пароль)")
            print("3. 🚪 Выйти")
            
            choice = input("\nВыберите вариант [1-3]: ").strip()
            
            if choice == "1":
                # Пользовательский вход (без пароля)
                username = input("Введите логин: ").strip()
                if not username:
                    print("❌ Логин обязателен")
                    continue
                
                # Пробуем войти без пароля
                if self.try_login(username, ""):
                    return True
                else:
                    print("❌ Не удалось войти. Попробуйте другой логин.")
            
            elif choice == "2":
                # Админский вход
                username = input("Логин админа: ").strip()
                password = getpass("Пароль админа: ")
                
                if self.try_login(username, password):
                    return True
                else:
                    print("❌ Неверный логин или пароль")
            
            elif choice == "3":
                print("\n👋 До свидания!")
                return False
            else:
                print("❌ Неверный выбор")
    
    def try_login(self, username, password):
        """Пробует войти на сервер"""
        try:
            response = requests.post(
                f"{self.server_url}/api/login",
                json={'username': username, 'password': password},
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.username = data['username']
                    self.role = data['role']
                    self.session_token = data.get('session')
                    
                    print(f"\n✅ Успешный вход!")
                    print(f"👤 Пользователь: {self.username}")
                    print(f"🎭 Роль: {'Администратор' if self.role == 'admin' else 'Пользователь'}")
                    print(f"📍 IP: {self.local_ip}")
                    
                    return True
        except Exception as e:
            print(f"❌ Ошибка подключения к серверу: {e}")
            print("⚠️  Продолжаю в автономном режиме")
            
            # Автономный режим
            self.username = username or "Гость"
            self.role = "admin" if username == "Artuom_SS-Owner" else "user"
            print(f"👤 Автономный режим: {self.username}")
            
            return True
        
        return False
    
    def listen_for_vbs(self, port=7777):
        """Слушает входящие VBS скрипты"""
        server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server.bind(('0.0.0.0', port))
        server.listen(5)
        server.settimeout(1)
        
        print(f"\n📡 Слушаю VBS сообщения на порту {port}")
        
        while self.running:
            try:
                client_socket, address = server.accept()
                
                data = client_socket.recv(4096).decode('utf-8')
                
                try:
                    message = json.loads(data)
                    
                    if message.get('type') == 'execute_vbs':
                        vbs_path = message.get('vbs_path')
                        
                        if vbs_path and os.path.exists(vbs_path):
                            print(f"\n📩 Получен VBS скрипт от {address[0]}")
                            
                            # Показываем код
                            with open(vbs_path, 'r', encoding='utf-8') as f:
                                vbs_code = f.read()
                                print(f"📝 Код VBS:\n{vbs_code}")
                            
                            # Запускаем
                            if os.name == 'nt':
                                print("▶️ Запускаю VBS...")
                                os.startfile(vbs_path)
                            else:
                                print("⚠️ VBS работает только на Windows")
                            
                            # Удаляем файл
                            threading.Timer(3, lambda: os.remove(vbs_path) if os.path.exists(vbs_path) else None).start()
                
                except json.JSONDecodeError:
                    print(f"📩 Данные от {address[0]}: {data[:100]}...")
                
                client_socket.close()
                
            except socket.timeout:
                continue
            except Exception as e:
                print(f"❌ Ошибка: {e}")
                break
        
        server.close()
    
    def send_vbs_to_ip(self, target_ip, vbs_code):
        """Отправляет VBS на указанный IP"""
        try:
            # Создаем временный файл
            with tempfile.NamedTemporaryFile(mode='w', suffix='.vbs', delete=False, encoding='utf-8') as f:
                f.write(vbs_code)
                vbs_path = f.name
            
            # Отправляем
            client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            client_socket.settimeout(5)
            client_socket.connect((target_ip, 7777))
            
            data = {
                'type': 'execute_vbs',
                'vbs_path': vbs_path,
                'timestamp': time.time()
            }
            
            client_socket.send(json.dumps(data).encode('utf-8'))
            client_socket.close()
            
            print(f"✅ VBS отправлен на {target_ip}")
            
            # Удаляем файл
            threading.Timer(10, lambda: os.remove(vbs_path) if os.path.exists(vbs_path) else None).start()
            
            return True
            
        except Exception as e:
            print(f"❌ Ошибка отправки: {e}")
            return False
    
    def create_vbs_from_template(self):
        """Создает VBS из шаблона"""
        templates = {
            '1': {
                'name': 'Простое сообщение',
                'code': 'MsgBox "Привет от {}!", vbInformation, "Сообщение"',
                'desc': 'Базовое информационное сообщение'
            },
            '2': {
                'name': 'Ошибка системы',
                'code': 'MsgBox "КРИТИЧЕСКАЯ ОШИБКА СИСТЕМЫ!", vbCritical, "СИСТЕМНАЯ ОШИБКА"',
                'desc': 'Сообщение об ошибке с красной иконкой'
            },
            '3': {
                'name': 'Предупреждение',
                'code': 'MsgBox "Внимание! Проверьте настройки", vbExclamation, "ПРЕДУПРЕЖДЕНИЕ"',
                'desc': 'Предупреждение с жёлтой иконкой'
            },
            '4': {
                'name': 'Вопрос',
                'code': '''response = MsgBox("Вы уверены?", vbYesNo + vbQuestion, "Вопрос")
If response = vbYes Then
    MsgBox "Вы согласились", vbInformation, "Результат"
Else
    MsgBox "Вы отказались", vbInformation, "Результат"
End If''',
                'desc': 'Диалог с выбором ответа'
            },
            '5': {
                'name': 'Таймер',
                'code': '''MsgBox "Сообщение 1", vbInformation, "Таймер"
WScript.Sleep 3000
MsgBox "Сообщение 2", vbInformation, "Таймер"''',
                'desc': 'Несколько сообщений с задержкой'
            }
        }
        
        print("\n📋 ВЫБЕРИТЕ ШАБЛОН VBS:")
        for key, template in templates.items():
            print(f"{key}. {template['name']} - {template['desc']}")
        
        choice = input("\nВыберите шаблон [1-5]: ").strip()
        
        if choice in templates:
            template = templates[choice]
            
            # Подставляем имя пользователя
            vbs_code = template['code'].format(self.username)
            
            print(f"\n📝 Выбран шаблон: {template['name']}")
            print(f"📋 Код VBS:\n{vbs_code}")
            
            return vbs_code
        else:
            print("❌ Неверный выбор")
            return None
    
    def show_main_menu(self):
        """Показывает главное меню"""
        while self.running:
            role_display = "👑 АДМИН" if self.role == "admin" else "👤 ПОЛЬЗОВАТЕЛЬ"
            
            print("\n" + "="*60)
            print(f"     ГЛАВНОЕ МЕНЮ [{role_display}]")
            print("="*60)
            print(f"👤 Пользователь: {self.username}")
            print(f"📍 IP адрес: {self.local_ip}")
            print(f"🌐 Сервер: {self.server_url}")
            print("="*60)
            
            print("\n📋 Основные действия:")
            print("1. 📤 Отправить VBS сообщение")
            print("2. 📝 Создать VBS из шаблона")
            print("3. 💾 Запустить VBS локально")
            
            if self.role == "admin":
                print("\n⚙️ Административные действия:")
                print("4. 👥 Управление пользователями")
                print("5. 📊 Просмотр статистики")
                print("6. 🛡️ Блокировки и муты")
            
            print("\n0. 🚪 Выйти из системы")
            
            try:
                choice = input("\nВыберите действие: ").strip()
                
                if choice == "1":
                    self.send_vbs_menu()
                elif choice == "2":
                    self.create_vbs_menu()
                elif choice == "3":
                    self.run_local_vbs()
                elif choice == "4" and self.role == "admin":
                    self.manage_users()
                elif choice == "5" and self.role == "admin":
                    self.show_stats()
                elif choice == "6" and self.role == "admin":
                    self.manage_blocks()
                elif choice == "0":
                    print("\n👋 Выход из системы...")
                    self.running = False
                else:
                    print("❌ Неверный выбор или недостаточно прав")
                    
            except KeyboardInterrupt:
                print("\n\n👋 Завершение работы...")
                self.running = False
            except Exception as e:
                print(f"❌ Ошибка: {e}")
    
    def send_vbs_menu(self):
        """Меню отправки VBS"""
        print("\n📤 ОТПРАВКА VBS СООБЩЕНИЯ")
        print("="*40)
        
        # Выбор получателя
        target_ip = input("IP получателя (оставьте пустым для себя): ").strip()
        
        # Выбор типа сообщения
        print("\n📝 Создание VBS кода:")
        print("1. Использовать шаблон")
        print("2. Ввести вручную")
        
        code_choice = input("Выберите вариант [1-2]: ").strip()
        
        vbs_code = None
        if code_choice == "1":
            vbs_code = self.create_vbs_from_template()
        elif code_choice == "2":
            print("\n✍️ Введите код VBS (Ctrl+Z затем Enter для завершения):")
            print("Пример: MsgBox \"Привет\", vbInformation, \"Сообщение\"")
            print("="*40)
            
            lines = []
            while True:
                try:
                    line = input()
                    lines.append(line)
                except EOFError:
                    break
            
            vbs_code = "\n".join(lines)
        else:
            print("❌ Неверный выбор")
            return
        
        if not vbs_code or not vbs_code.strip():
            print("❌ Код VBS не может быть пустым")
            return
        
        # Отправка
        if not target_ip:
            # Запускаем локально
            print("\n▶️ Запускаю VBS локально...")
            
            with tempfile.NamedTemporaryFile(mode='w', suffix='.vbs', delete=False, encoding='utf-8') as f:
                f.write(vbs_code)
                vbs_path = f.name
            
            if os.name == 'nt':
                os.startfile(vbs_path)
                print("✅ VBS запущен на вашем компьютере")
            else:
                print("⚠️ VBS работает только на Windows")
            
            # Удаляем файл
            threading.Timer(3, lambda: os.remove(vbs_path) if os.path.exists(vbs_path) else None).start()
        else:
            # Отправляем другому
            if self.send_vbs_to_ip(target_ip, vbs_code):
                print(f"✅ VBS отправлен на {target_ip}")
            else:
                print(f"❌ Не удалось отправить на {target_ip}")
    
    def create_vbs_menu(self):
        """Меню создания VBS"""
        vbs_code = self.create_vbs_from_template()
        
        if vbs_code:
            print("\n💾 Что делать с VBS кодом?")
            print("1. Запустить локально")
            print("2. Отправить другому")
            print("3. Сохранить в файл")
            print("4. Назад")
            
            choice = input("\nВыберите действие [1-4]: ").strip()
            
            if choice == "1":
                with tempfile.NamedTemporaryFile(mode='w', suffix='.vbs', delete=False, encoding='utf-8') as f:
                    f.write(vbs_code)
                    vbs_path = f.name
                
                if os.name == 'nt':
                    os.startfile(vbs_path)
                    print("✅ VBS запущен")
                else:
                    print("⚠️ VBS работает только на Windows")
            
            elif choice == "2":
                target_ip = input("IP получателя: ").strip()
                if target_ip:
                    self.send_vbs_to_ip(target_ip, vbs_code)
                else:
                    print("❌ IP обязателен")
            
            elif choice == "3":
                filename = input("Имя файла (без расширения): ").strip()
                if not filename:
                    filename = "vbs_script"
                
                filename += ".vbs"
                
                with open(filename, 'w', encoding='utf-8') as f:
                    f.write(vbs_code)
                
                print(f"✅ Файл сохранён: {os.path.abspath(filename)}")
    
    def run_local_vbs(self):
        """Запуск локального VBS файла"""
        print("\n💾 ЗАПУСК ЛОКАЛЬНОГО VBS ФАЙЛА")
        print("="*40)
        
        print("Варианты:")
        print("1. Создать новый VBS")
        print("2. Запустить существующий файл")
        
        choice = input("\nВыберите вариант [1-2]: ").strip()
        
        if choice == "1":
            self.create_vbs_menu()
        elif choice == "2":
            filename = input("Путь к VBS файлу: ").strip()
            
            if os.path.exists(filename) and filename.lower().endswith('.vbs'):
                if os.name == 'nt':
                    os.startfile(filename)
                    print("✅ VBS файл запущен")
                else:
                    print("⚠️ VBS работает только на Windows")
            else:
                print("❌ Файл не найден или не является VBS")
        else:
            print("❌ Неверный выбор")
    
    def manage_users(self):
        """Управление пользователями (админ)"""
        print("\n👥 УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ")
        print("="*40)
        print("Функционал доступен через веб-интерфейс.")
        print(f"🌐 Откройте в браузере: {self.server_url}/admin")
        print("\nНажмите Enter для продолжения...")
        input()
    
    def show_stats(self):
        """Показать статистику (админ)"""
        print("\n📊 СТАТИСТИКА СИСТЕМЫ")
        print("="*40)
        print(f"👤 Текущий пользователь: {self.username}")
        print(f"🎭 Роль: {'Администратор' if self.role == 'admin' else 'Пользователь'}")
        print(f"📍 Ваш IP: {self.local_ip}")
        print(f"⏰ Время: {time.strftime('%H:%M:%S')}")
        print("\nДля подробной статистики используйте веб-интерфейс.")
        print("Нажмите Enter для продолжения...")
        input()
    
    def manage_blocks(self):
        """Управление блокировками (админ)"""
        print("\n🛡️ УПРАВЛЕНИЕ БЛОКИРОВКАМИ")
        print("="*40)
        print("Доступные действия:")
        print("1. 🚫 Заблокировать IP")
        print("2. ✅ Разблокировать IP")
        print("3. 🔇 Замутить пользователя")
        print("4. 🔊 Размутить пользователя")
        print("5. 📜 Список блокировок")
        
        choice = input("\nВыберите действие [1-5]: ").strip()
        
        if choice == "1":
            ip = input("IP для блокировки: ").strip()
            reason = input("Причина: ").strip() or "Нарушение правил"
            print(f"🚫 IP {ip} будет заблокирован по причине: {reason}")
        
        elif choice == "2":
            ip = input("IP для разблокировки: ").strip()
            print(f"✅ IP {ip} будет разблокирован")
        
        elif choice == "3":
            user = input("Имя пользователя: ").strip()
            duration = input("Длительность (минуты): ").strip() or "30"
            print(f"🔇 Пользователь {user} будет замучен на {duration} минут")
        
        elif choice == "4":
            user = input("Имя пользователя: ").strip()
            print(f"🔊 Пользователь {user} будет размучен")
        
        elif choice == "5":
            print("📜 Список блокировок будет отображаться в веб-интерфейсе")
        
        else:
            print("❌ Неверный выбор")
        
        print("\nПримечание: Для реального управления используйте веб-интерфейс.")
        print("Нажмите Enter для продолжения...")
        input()
    
    def start(self):
        """Запускает клиент"""
        # Аутентификация
        if not self.authenticate_user():
            return
        
        # Запускаем слушатель VBS в отдельном потоке
        listener_thread = threading.Thread(target=self.listen_for_vbs, daemon=True)
        listener_thread.start()
        
        # Запускаем heartbeat (если подключены к серверу)
        if self.session_token:
            heartbeat_thread = threading.Thread(target=self.send_heartbeat, daemon=True)
            heartbeat_thread.start()
        
        print("\n✅ Клиент успешно запущен!")
        print("📡 Ожидаю сообщения на порту 7777")
        print("⚡ Используйте главное меню для действий")
        
        # Показываем главное меню
        self.show_main_menu()
    
    def send_heartbeat(self):
        """Отправляет heartbeat на сервер"""
        while self.running and self.session_token:
            try:
                # Просто проверяем соединение
                requests.get(f"{self.server_url}/dashboard", timeout=3)
                time.sleep(30)
            except:
                time.sleep(30)

def main():
    client = MultiUserClient()
    
    try:
        client.start()
    except KeyboardInterrupt:
        print("\n\n👋 Программа завершена")
    except Exception as e:
        print(f"\n❌ Критическая ошибка: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
