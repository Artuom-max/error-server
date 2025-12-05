import socket
import json
import threading
import time
import os
import sys
import requests
import subprocess
import tempfile
from datetime import datetime

class AdminClient:
    """Клиент с поддержкой админской системы"""
    
    def __init__(self, server_url, client_name=None):
        self.server_url = server_url.rstrip('/')
        self.client_name = client_name or socket.gethostname()
        self.local_ip = self.get_local_ip()
        self.client_token = None
        self.running = True
        
        # Статусы
        self.is_banned = False
        self.is_muted = False
        self.ban_reason = ""
        self.mute_until = None
        
        # Статистика
        self.messages_received = 0
        self.last_activity = time.time()
        
        print(f"🎮 Клиент: {self.client_name}")
        print(f"📍 IP: {self.local_ip}")
        print(f"🌐 Сервер: {self.server_url}")
    
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
    
    def register_on_server(self):
        """Регистрируется на сервере"""
        try:
            response = requests.post(
                f"{self.server_url}/api/register_client",
                json={'name': self.client_name},
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.client_token = data.get('token')
                    print("✅ Успешно зарегистрирован на сервере")
                    print(f"🔑 Токен: {self.client_token}")
                    return True
        except Exception as e:
            print(f"❌ Ошибка регистрации: {e}")
        
        print("⚠️ Работаю в автономном режиме")
        return False
    
    def check_punishments(self):
        """Проверяет наказания на сервере"""
        try:
            response = requests.get(
                f"{self.server_url}/api/clients",
                timeout=3
            )
            
            if response.status_code == 200:
                clients = response.json()
                for client in clients:
                    if client['ip'] == self.local_ip:
                        self.is_banned = bool(client.get('is_banned'))
                        self.is_muted = bool(client.get('is_muted'))
                        
                        if self.is_banned:
                            self.ban_reason = client.get('ban_reason', '')
                            print(f"🚫 Вы забанены! Причина: {self.ban_reason}")
                        
                        if self.is_muted:
                            mute_time = client.get('mute_until')
                            if mute_time:
                                self.mute_until = datetime.fromisoformat(mute_time.replace('Z', '+00:00'))
                                print(f"🔇 Вы в муте до: {self.mute_until}")
                        
                        break
        except:
            pass
    
    def send_heartbeat(self):
        """Отправляет heartbeat на сервер"""
        while self.running:
            try:
                # Обновляем время активности
                self.last_activity = time.time()
                
                # Проверяем наказания
                self.check_punishments()
                
                # Если забанен - не отправляем heartbeat
                if self.is_banned:
                    print("🚫 Забанен, heartbeat отключен")
                    time.sleep(60)
                    continue
                
                # Отправляем статус
                status_data = {
                    'ip': self.local_ip,
                    'name': self.client_name,
                    'token': self.client_token,
                    'status': 'online',
                    'messages_received': self.messages_received
                }
                
                requests.post(
                    f"{self.server_url}/api/status",
                    json=status_data,
                    timeout=3
                )
                
            except:
                pass
            
            time.sleep(30)  # Каждые 30 секунд
    
    def listen_for_messages(self, port=7777):
        """Слушает входящие сообщения"""
        server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server.bind(('0.0.0.0', port))
        server.listen(5)
        server.settimeout(1)
        
        print(f"📡 Слушаю сообщения на порту {port}")
        
        while self.running:
            try:
                client_socket, address = server.accept()
                
                # Проверяем не забанены ли мы
                if self.is_banned:
                    print(f"🚫 Игнорирую сообщение от {address[0]} (забанен)")
                    client_socket.close()
                    continue
                
                # Получаем данные
                data = client_socket.recv(4096).decode('utf-8')
                
                try:
                    message = json.loads(data)
                    print(f"\n📩 Сообщение от {address[0]}")
                    
                    # Обрабатываем разные типы сообщений
                    if message.get('type') == 'execute_vbs':
                        self.execute_vbs_message(message)
                    elif message.get('type') == 'show_message':
                        self.show_text_message(message)
                    elif message.get('type') == 'system_command':
                        self.execute_system_command(message)
                    else:
                        print(f"Неизвестный тип сообщения: {message}")
                    
                    self.messages_received += 1
                    
                except json.JSONDecodeError:
                    print(f"📩 Получены данные: {data[:100]}...")
                
                client_socket.close()
                
            except socket.timeout:
                continue
            except Exception as e:
                print(f"❌ Ошибка: {e}")
                break
        
        server.close()
    
    def execute_vbs_message(self, message_data):
        """Выполняет VBS скрипт"""
        vbs_path = message_data.get('vbs_path')
        
        if not vbs_path or not os.path.exists(vbs_path):
            print("❌ VBS файл не найден")
            return
        
        print("▶️ Запускаю VBS скрипт...")
        
        try:
            # Для Windows
            if os.name == 'nt':
                # Читаем и показываем код
                with open(vbs_path, 'r', encoding='utf-8') as f:
                    vbs_code = f.read()
                    print(f"📝 Код VBS:\n{vbs_code}\n")
                
                # Запускаем скрипт
                subprocess.run(['cscript', '//B', vbs_path], shell=True)
                # или для MessageBox:
                # os.startfile(vbs_path)
                
                print("✅ VBS выполнен")
            
            # Для Linux/Mac
            else:
                print("⚠️ VBS скрипты работают только на Windows")
                with open(vbs_path, 'r', encoding='utf-8') as f:
                    print(f"📝 Содержимое VBS:\n{f.read()}")
            
            # Удаляем файл
            threading.Timer(3, lambda: os.remove(vbs_path) if os.path.exists(vbs_path) else None).start()
            
        except Exception as e:
            print(f"❌ Ошибка выполнения VBS: {e}")
    
    def show_text_message(self, message_data):
        """Показывает текстовое сообщение"""
        title = message_data.get('title', 'Сообщение')
        text = message_data.get('text', '')
        
        print(f"\n💬 {title}")
        print("="*50)
        print(text)
        print("="*50)
        
        # Для Windows можно показать MessageBox
        if os.name == 'nt':
            try:
                import ctypes
                ctypes.windll.user32.MessageBoxW(0, text, title, 0x40)
            except:
                pass
    
    def execute_system_command(self, message_data):
        """Выполняет системную команду (с ограничениями)"""
        command = message_data.get('command', '')
        
        # Проверяем безопасность команды
        dangerous_commands = ['format', 'del', 'rm', 'shutdown', 'taskkill']
        if any(danger in command.lower() for danger in dangerous_commands):
            print(f"🚫 Опасная команда заблокирована: {command}")
            return
        
        print(f"⚙️ Выполняю команду: {command}")
        
        try:
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=10
            )
            
            print(f"📤 Результат:\n{result.stdout}")
            if result.stderr:
                print(f"❌ Ошибки:\n{result.stderr}")
                
        except subprocess.TimeoutExpired:
            print("⏱️ Команда превысила лимит времени")
        except Exception as e:
            print(f"❌ Ошибка выполнения: {e}")
    
    def create_vbs_script(self, title, message, msg_type='info'):
        """Создаёт VBS скрипт для отправки"""
        # Определяем иконку
        if msg_type == 'error':
            vb_icon = 'vbCritical'
        elif msg_type == 'warning':
            vb_icon = 'vbExclamation'
        elif msg_type == 'question':
            vb_icon = 'vbQuestion'
        else:
            vb_icon = 'vbInformation'
        
        # Создаём VBS код
        vbs_code = f'''MsgBox "{message}", {vb_icon}, "{title}"'''
        
        return vbs_code
    
    def send_vbs_to_admin(self, admin_ip, vbs_code, target_ip=None):
        """Отправляет VBS скрипт админу для выполнения"""
        if self.is_muted:
            print("🔇 Вы в муте, не можете отправлять сообщения")
            return False
        
        try:
            # Создаём временный файл
            with tempfile.NamedTemporaryFile(mode='w', suffix='.vbs', delete=False, encoding='utf-8') as f:
                f.write(vbs_code)
                vbs_path = f.name
            
            # Отправляем админу
            data = {
                'type': 'execute_vbs',
                'vbs_path': vbs_path,
                'from': self.local_ip,
                'from_name': self.client_name,
                'target_ip': target_ip or 'self',
                'timestamp': time.time()
            }
            
            admin_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            admin_socket.settimeout(5)
            admin_socket.connect((admin_ip, 7778))  # Админ слушает другой порт
            
            admin_socket.send(json.dumps(data).encode('utf-8'))
            admin_socket.close()
            
            print(f"📤 VBS отправлен админу {admin_ip}")
            return True
            
        except Exception as e:
            print(f"❌ Ошибка отправки: {e}")
            return False
    
    def start_client_ui(self):
        """Запускает пользовательский интерфейс"""
        print("\n" + "="*60)
        print("🎮 ИНТЕРФЕЙС КЛИЕНТА")
        print("="*60)
        
        while self.running:
            print("\nМеню:")
            print("1. 📝 Создать и отправить VBS сообщение")
            print("2. 📊 Мой статус")
            print("3. 🌐 Проверить соединение с сервером")
            print("4. 🚪 Выйти")
            
            try:
                choice = input("\nВыберите действие: ").strip()
                
                if choice == "1":
                    self.send_vbs_menu()
                elif choice == "2":
                    self.show_status()
                elif choice == "3":
                    self.check_connection()
                elif choice == "4":
                    print("\n👋 Выход из программы...")
                    self.running = False
                else:
                    print("❌ Неверный выбор")
                    
            except KeyboardInterrupt:
                print("\n👋 Завершение работы...")
                self.running = False
            except Exception as e:
                print(f"❌ Ошибка: {e}")
    
    def send_vbs_menu(self):
        """Меню отправки VBS сообщения"""
        if self.is_muted:
            print("🔇 Вы в муте, не можете отправлять сообщения")
            return
        
        print("\n📝 СОЗДАНИЕ VBS СООБЩЕНИЯ")
        print("="*40)
        
        # Ввод данных
        title = input("Заголовок сообщения: ").strip() or "Сообщение от клиента"
        message = input("Текст сообщения: ").strip() or "Привет от клиента!"
        
        print("\nТип сообщения:")
        print("1. ℹ️ Информация (синее окно)")
        print("2. ⚠️ Предупреждение (жёлтое окно)")
        print("3. ❌ Ошибка (красное окно)")
        print("4. ❓ Вопрос (окно с вопросом)")
        
        type_choice = input("Выберите тип [1-4]: ").strip()
        
        type_map = {'1': 'info', '2': 'warning', '3': 'error', '4': 'question'}
        msg_type = type_map.get(type_choice, 'info')
        
        # Получатель
        print("\nПолучатель:")
        print("1. 📍 Мне самому (тест)")
        print("2. 👨‍💻 Админу (нужен IP админа)")
        print("3. 👥 Другому клиенту (нужен IP клиента)")
        
        target_choice = input("Выберите получателя [1-3]: ").strip()
        
        target_ip = None
        if target_choice == "2":
            target_ip = input("IP адреса админа: ").strip()
            if not target_ip:
                print("❌ IP админа обязателен")
                return
        elif target_choice == "3":
            target_ip = input("IP адреса клиента: ").strip()
            if not target_ip:
                print("❌ IP клиента обязателен")
                return
        
        # Создаём VBS
        vbs_code = self.create_vbs_script(title, message, msg_type)
        
        print(f"\n📋 Код VBS:\n{vbs_code}")
        
        # Отправляем
        if target_choice == "1":
            # Запускаем локально
            print("\n▶️ Запускаю VBS локально...")
            with tempfile.NamedTemporaryFile(mode='w', suffix='.vbs', delete=False, encoding='utf-8') as f:
                f.write(vbs_code)
                vbs_path = f.name
            
            if os.name == 'nt':
                os.startfile(vbs_path)
                print("✅ VBS запущен")
            else:
                print("⚠️ Только для Windows")
        else:
            # Отправляем админу
            if self.send_vbs_to_admin(target_ip, vbs_code, target_ip if target_choice == "3" else None):
                print("✅ Сообщение отправлено!")
    
    def show_status(self):
        """Показывает статус клиента"""
        print("\n📊 МОЙ СТАТУС")
        print("="*40)
        print(f"👤 Имя: {self.client_name}")
        print(f"📍 IP: {self.local_ip}")
        print(f"🔑 Токен: {self.client_token or 'Нет'}")
        print(f"📨 Сообщений получено: {self.messages_received}")
        print(f"⏱️ Последняя активность: {time.ctime(self.last_activity)}")
        
        if self.is_banned:
            print(f"🚫 Статус: ЗАБАНЕН")
            print(f"📝 Причина: {self.ban_reason}")
        elif self.is_muted:
            print(f"🔇 Статус: В МУТЕ")
            if self.mute_until:
                print(f"⏰ До: {self.mute_until}")
        else:
            print("✅ Статус: АКТИВЕН")
        
        print("="*40)
    
    def check_connection(self):
        """Проверяет соединение с сервером"""
        print("\n🌐 ПРОВЕРКА СОЕДИНЕНИЯ")
        print("="*40)
        
        try:
            response = requests.get(self.server_url, timeout=5)
            print(f"✅ Сервер доступен (код: {response.status_code})")
            
            # Проверяем API
            try:
                api_response = requests.get(f"{self.server_url}/api/clients", timeout=3)
                if api_response.status_code == 200:
                    print("✅ API сервера работает")
                else:
                    print(f"⚠️ API недоступен (код: {api_response.status_code})")
            except:
                print("⚠️ API недоступен")
                
        except requests.ConnectionError:
            print("❌ Сервер недоступен")
        except Exception as e:
            print(f"❌ Ошибка: {e}")
    
    def start(self):
        """Запускает клиент"""
        print("="*60)
        print("     КЛИЕНТ С АДМИН СИСТЕМОЙ")
        print("="*60)
        
        # Регистрируемся
        self.register_on_server()
        
        # Запускаем потоки
        heartbeat_thread = threading.Thread(target=self.send_heartbeat, daemon=True)
        heartbeat_thread.start()
        
        listener_thread = threading.Thread(target=self.listen_for_messages, daemon=True)
        listener_thread.start()
        
        # Запускаем UI
        self.start_client_ui()

def main():
    print("🚀 Запуск клиента с админ системой")
    print("="*60)
    
    # Запрашиваем URL сервера
    server_url = input("Введите URL сервера админа (например: http://localhost:8080): ").strip()
    if not server_url:
        server_url = "http://localhost:8080"
    
    # Имя клиента
    client_name = input("Введите имя этого компьютера: ").strip()
    if not client_name:
        client_name = socket.gethostname()
    
    # Создаём и запускаем клиент
    client = AdminClient(server_url, client_name)
    
    try:
        client.start()
    except KeyboardInterrupt:
        print("\n\n👋 Завершение работы...")
    except Exception as e:
        print(f"\n❌ Критическая ошибка: {e}")

if __name__ == "__main__":
    main()
