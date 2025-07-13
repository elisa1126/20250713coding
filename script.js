class TodoApp {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('todos')) || [];
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateDate();
        this.renderTodos();
        this.updateStats();
    }

    setupEventListeners() {
        // 할일 추가
        const addBtn = document.getElementById('addBtn');
        const todoInput = document.getElementById('todoInput');

        addBtn.addEventListener('click', () => this.addTodo());
        todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTodo();
            }
        });

        // 필터 버튼들
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // 액션 버튼들
        document.getElementById('clearCompleted').addEventListener('click', () => this.clearCompleted());
        document.getElementById('clearAll').addEventListener('click', () => this.clearAll());
    }

    addTodo() {
        const todoInput = document.getElementById('todoInput');
        const text = todoInput.value.trim();

        if (text === '') {
            this.showSweetAlert('할일을 입력해주세요!', 'warning', '입력 오류');
            return;
        }

        const todo = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.todos.unshift(todo);
        this.saveTodos();
        this.renderTodos();
        this.updateStats();

        todoInput.value = '';
        this.showSweetAlert('할일이 성공적으로 추가되었습니다! 🎉', 'success', '추가 완료');
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            const wasCompleted = todo.completed;
            todo.completed = !todo.completed;
            this.saveTodos();
            this.renderTodos();
            this.updateStats();
            
            // 할일을 완료했을 때 축하 애니메이션
            if (!wasCompleted && todo.completed) {
                this.celebrateCompletion();
                this.showSweetAlert('할일을 완료했습니다! 🎉', 'success', '축하합니다!');
            }
        }
    }

    deleteTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            this.showSweetAlert(
                `"${todo.text}" 할일을 삭제하시겠습니까?`,
                'question',
                '삭제 확인',
                () => {
                    this.todos = this.todos.filter(t => t.id !== id);
                    this.saveTodos();
                    this.renderTodos();
                    this.updateStats();
                    this.showSweetAlert('할일이 삭제되었습니다! 🗑️', 'success', '삭제 완료');
                }
            );
        }
    }

    clearCompleted() {
        const completedCount = this.todos.filter(t => t.completed).length;
        if (completedCount === 0) {
            this.showSweetAlert('완료된 할일이 없습니다!', 'info', '알림');
            return;
        }

        this.showSweetAlert(
            `${completedCount}개의 완료된 할일을 모두 삭제하시겠습니까?`,
            'question',
            '일괄 삭제 확인',
            () => {
                this.todos = this.todos.filter(t => !t.completed);
                this.saveTodos();
                this.renderTodos();
                this.updateStats();
                this.showSweetAlert(`${completedCount}개의 완료된 할일이 삭제되었습니다! 🧹`, 'success', '삭제 완료');
            }
        );
    }

    clearAll() {
        if (this.todos.length === 0) {
            this.showSweetAlert('삭제할 할일이 없습니다!', 'info', '알림');
            return;
        }

        this.showSweetAlert(
            `정말로 모든 할일(${this.todos.length}개)을 삭제하시겠습니까?<br><small class="text-muted">이 작업은 되돌릴 수 없습니다.</small>`,
            'warning',
            '전체 삭제 확인',
            () => {
                const deletedCount = this.todos.length;
                this.todos = [];
                this.saveTodos();
                this.renderTodos();
                this.updateStats();
                this.showSweetAlert(`${deletedCount}개의 할일이 모두 삭제되었습니다! 🗑️`, 'success', '삭제 완료');
            }
        );
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // 필터 버튼 활성화 상태 업데이트
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        this.renderTodos();
    }

    getFilteredTodos() {
        switch (this.currentFilter) {
            case 'completed':
                return this.todos.filter(t => t.completed);
            case 'pending':
                return this.todos.filter(t => !t.completed);
            default:
                return this.todos;
        }
    }

    renderTodos() {
        const todoList = document.getElementById('todoList');
        const filteredTodos = this.getFilteredTodos();

        if (filteredTodos.length === 0) {
            todoList.innerHTML = this.getEmptyStateHTML();
            return;
        }

        todoList.innerHTML = filteredTodos.map(todo => this.getTodoItemHTML(todo)).join('');
        
        // 이벤트 리스너 추가
        filteredTodos.forEach(todo => {
            const checkbox = document.querySelector(`#todo-${todo.id}`);
            const deleteBtn = document.querySelector(`#delete-${todo.id}`);
            
            if (checkbox) {
                checkbox.addEventListener('change', () => this.toggleTodo(todo.id));
            }
            
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => this.deleteTodo(todo.id));
            }
        });
    }

    getTodoItemHTML(todo) {
        const completedClass = todo.completed ? 'completed' : '';
        const checked = todo.completed ? 'checked' : '';
        
        return `
            <div class="todo-item ${completedClass}" data-id="${todo.id}">
                <input type="checkbox" 
                       id="todo-${todo.id}" 
                       class="todo-checkbox" 
                       ${checked}>
                <span class="todo-text">${this.escapeHtml(todo.text)}</span>
                <button class="delete-btn" id="delete-${todo.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }

    getEmptyStateHTML() {
        const messages = {
            all: { icon: 'fas fa-clipboard-list', text: '할일이 없습니다', subtext: '새로운 할일을 추가해보세요!' },
            pending: { icon: 'fas fa-clock', text: '대기중인 할일이 없습니다', subtext: '모든 할일이 완료되었습니다!' },
            completed: { icon: 'fas fa-check-circle', text: '완료된 할일이 없습니다', subtext: '할일을 완료해보세요!' }
        };

        const message = messages[this.currentFilter];
        
        return `
            <div class="empty-state">
                <i class="${message.icon}"></i>
                <h3>${message.text}</h3>
                <p>${message.subtext}</p>
            </div>
        `;
    }

    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(t => t.completed).length;
        const pending = total - completed;

        document.getElementById('totalTasks').textContent = total;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('pendingTasks').textContent = pending;
    }

    updateDate() {
        const now = new Date();
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            weekday: 'long' 
        };
        const dateString = now.toLocaleDateString('ko-KR', options);
        document.getElementById('currentDate').textContent = dateString;
    }

    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    showSweetAlert(message, icon = 'info', title = '알림', callback = null) {
        const options = {
            title: title,
            text: message,
            icon: icon,
            confirmButtonText: '확인',
            cancelButtonText: '취소',
            showCancelButton: icon === 'question' || icon === 'warning',
            confirmButtonColor: '#667eea',
            cancelButtonColor: '#6c757d',
            customClass: {
                popup: 'swal2-custom-popup',
                title: 'swal2-custom-title',
                confirmButton: 'swal2-custom-confirm',
                cancelButton: 'swal2-custom-cancel'
            },
            buttonsStyling: true,
            reverseButtons: true
        };

        if (callback && (icon === 'question' || icon === 'warning')) {
            Swal.fire(options).then((result) => {
                if (result.isConfirmed) {
                    callback();
                }
            });
        } else {
            Swal.fire(options);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 할일 완료 시 축하 애니메이션
    celebrateCompletion() {
        const confetti = document.createElement('div');
        confetti.innerHTML = '🎉';
        confetti.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 4rem;
            z-index: 9999;
            animation: celebrate 1s ease-out forwards;
        `;
        document.body.appendChild(confetti);
        
        setTimeout(() => {
            if (confetti.parentNode) {
                confetti.parentNode.removeChild(confetti);
            }
        }, 1000);
    }

    // 통계 업데이트 시 애니메이션
    animateStats() {
        const statNumbers = document.querySelectorAll('.display-6');
        statNumbers.forEach(stat => {
            stat.style.animation = 'pulse 0.5s ease-in-out';
            setTimeout(() => {
                stat.style.animation = '';
            }, 500);
        });
    }
}

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes celebrate {
        0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
        }
        50% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 1;
        }
        100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0;
        }
    }
    
    @keyframes pulse {
        0%, 100% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.1);
        }
    }
`;
document.head.appendChild(style);

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});
