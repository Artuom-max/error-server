import socket
import json
import time
import os
import sys

class AdminController:
    """Контроллер для админа (отправка команд)"""
    
    def __init__(self, admin_ip='127.0.0.1', admin_port=7778):
        self.admin_ip = admin_ip
        self.admin_port = admin_port
        self.clients = {}
    
    def start_admin_listener(self):
        """Запускает слушатель для админа"""
        server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server.bind(('0.0.0.0', self.admin_port))
        server.listen(5)
        server.settimeout(1)
        
        print(f"👑 Админ слушает порт {self.admin_port}")
        
        while True:
            try:
                client_socket, address = server.accept()
                print(f"📥 Подключение от {address[0]}")
                
                data = client_socket.recv(4096).decode('utf-8')
                
                try:
                    message = json.loads(data)
                    self.handle_admin_message(message, address[0])
                except:
                    print(f"📥 Данные от {address[0]}: {data[:100]}")
                
                client_socket.close()
                
            except socket.timeout:
                continue
            except KeyboardInterrupt:
                break
            except Exception as e:
                print(f"❌ Ошибка: {e}")
        
        server.close()
    
    def handle_admin_message(self, message, sender_ip):
        """Обрабатывает сообщение от админа"""
        msg_type = message.get('type')
        
        if msg_type == 'execute_vbs':
            print(f"👑 Админ команда от {sender_ip}: выполнить VBS")
            
            vbs_path = message.get('vbs_path')
            target_ip = message.get('target_ip')
            from_name = message.get('from_name', 'Неизвестно')
            
            print(f"📤 От: {from_name} ({sender_ip})")
            print(f"🎯 Цель: {target_ip}")
            
            if os.path.exists(vbs_path):
                if target_ip == 'self' or target_ip == self.admin_ip:
                    print("▶️ Выполняю VBS локально...")
                    if os.name == 'nt':
                        os.startfile(vbs_path)
                else:
                    print(f"🔄 Перенаправляю VBS клиенту {target_ip}")
                    self.forward_vbs_to_client(target_ip, vbs_path)
            else:
                print("❌ VBS файл не найден")
        
        elif msg_type == 'broadcast_vbs':
            print(f"👑 Широковещательная рассылка от {sender_ip}")
            # Реализация широковещательной рассылки
    
    def forward_vbs_to_client(self, client_ip, vbs_path):
        """Перенаправляет VBS клиенту"""
        try:
            with open(vbs_path, 'r', encoding='utf-8') as f:
                vbs_code = f.read()
            
            # Создаём новый временный файл
            import tempfile
            with tempfile.NamedTemporaryFile(mode='w', suffix='.vbs', delete=False, encoding='utf-8') as f:
                f.write(vbs_code)
                new_vbs_path = f.name
            
            # Отправляем клиенту
            client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            client_socket.settimeout(5)
            client_socket.connect((client_ip, 7777))
            
            data = {
                'type': 'execute_vbs',
                'vbs_path': new_vbs_path,
                'timestamp': time.time()
            }
            
            client_socket.send(json.dumps(data).encode('utf-8'))
            client_socket.close()
            
            print(f"✅ VBS отправлен клиенту {client_ip}")
            
            # Удаляем файл через время
            import threading
            threading.Timer(10, lambda: os.remove(new_vbs_path) if os.path.exists(new_vbs_path) else None).start()
            
        except Exception as e:
            print(f"❌ Ошибка перенаправления: {e}")
    
    def send_vbs_to_client(self, client_ip, vbs_code):
        """Отправляет VBS код клиенту"""
        try:
            # Создаём временный файл
            import tempfile
            with tempfile.NamedTemporaryFile(mode='w', suffix='.vbs', delete=False, encoding='utf-8') as f:
                f.write(vbs_code)
                vbs_path = f.name
            
            # Отправляем
            client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            client_socket.settimeout(5)
            client_socket.connect((client_ip, 7777))
            
            data = {
                'type': 'execute_vbs',
                'vbs_path': vbs_path,
                'timestamp': time.time()
            }
            
            client_socket.send(json.dumps(data).encode('utf-8'))
            client_socket.close()
            
            print(f"✅ VBS отправлен клиенту {client_ip}")
            return True
            
        except Exception as e:
            print(f"❌ Ошибка отправки: {e}")
            return False

def main():
    print("="*60)
    print("     АДМИН КОНТРОЛЛЕР")
    print("="*60)
    
    controller = AdminController()
    
    # Запускаем слушатель в отдельном потоке
    import threading
    listener_thread = threading.Thread(target=controller.start_admin_listener, daemon=True)
    listener_thread.start()
    
    print("\n👑 Админ контроллер запущен")
    print(f"📡 Прослушивает порт: {controller.admin_port}")
    print("="*60)
    
    # Интерфейс управления
    while True:
        print("\nМеню админа:")
        print("1. 📤 Отправить VBS клиенту")
        print("2. 👥 Показать подключенных клиентов")
        print("3. ⚙️ Тестовая команда")
        print("4. 🚪 Выйти")
        
        try:
            choice = input("\nВыберите действие: ").strip()
            
            if choice == "1":
                client_ip = input("IP клиента: ").strip()
                title = input("Заголовок: ").strip() or "Сообщение от админа"
                message = input("Текст: ").strip() or "Админское сообщение"
                
                vbs_code = f'MsgBox "{message}", vbInformation, "{title}"'
                
                if controller.send_vbs_to_client(client_ip, vbs_code):
                    print("✅ Команда отправлена")
                else:
                    print("❌ Ошибка отправки")
                    
            elif choice == "2":
                print("👥 Список клиентов будет отображаться в веб-интерфейсе")
                print("🌐 Откройте http://localhost:8080/admin для управления")
                
            elif choice == "3":
                # Тестовая команда
                test_ip = input("Тестовый IP (оставьте пустым для localhost): ").strip() or "127.0.0.1"
                test_vbs = 'MsgBox "Тестовое сообщение от админа", vbInformation, "Тест"'
                controller.send_vbs_to_client(test_ip, test_vbs)
                
            elif choice == "4":
                print("\n👋 Завершение работы...")
                break
            else:
                print("❌ Неверный выбор")
                
        except KeyboardInterrupt:
            print("\n👋 Завершение работы...")
            break

if __name__ == "__main__":
    main()