// Modelli dei dati
class TaskModel {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.completedTasks = JSON.parse(localStorage.getItem('completedTasks')) || [];
    }

    // Metodi per gestire le attività attive
    addTask(text, quadrant) {
        const newTask = {
            id: Date.now(),
            text: text,
            quadrant: quadrant,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        this.tasks.push(newTask);
        this.saveTasks();
        return newTask;
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(task => task.id !== taskId);
        this.saveTasks();
    }

    moveTask(taskId, newQuadrant) {
        const task = this.tasks.find(task => task.id === taskId);
        if (task) {
            task.quadrant = newQuadrant;
            this.saveTasks();
        }
    }
    
    editTask(taskId, newText) {
        const task = this.tasks.find(task => task.id === taskId);
        if (task) {
            task.text = newText;
            task.editedAt = new Date().toISOString();
            this.saveTasks();
            return task;
        }
        return null;
    }

    completeTask(taskId) {
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        
        if (taskIndex !== -1) {
            const task = {...this.tasks[taskIndex]};
            task.completed = true;
            task.completedAt = new Date().toISOString();
            
            this.completedTasks.unshift(task);
            this.tasks.splice(taskIndex, 1);
            
            this.saveCompletedTasks();
            this.saveTasks();
            return task;
        }
        return null;
    }

    // Nuovo metodo per ripristinare un'attività completata
    restoreTask(taskId) {
        const taskIndex = this.completedTasks.findIndex(task => task.id === taskId);
        
        if (taskIndex !== -1) {
            const task = {...this.completedTasks[taskIndex]};
            task.completed = false;
            delete task.completedAt; // Rimuove la data di completamento
            
            this.tasks.push(task);
            this.completedTasks.splice(taskIndex, 1);
            
            this.saveCompletedTasks();
            this.saveTasks();
            return task;
        }
        return null;
    }

    // Nuovo metodo per eliminare un'attività completata
    deleteCompletedTask(taskId) {
        this.completedTasks = this.completedTasks.filter(task => task.id !== taskId);
        this.saveCompletedTasks();
    }

    // Metodi per salvare i dati
    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    saveCompletedTasks() {
        localStorage.setItem('completedTasks', JSON.stringify(this.completedTasks));
    }

    // Metodi per ottenere i dati
    getTasksByQuadrant(quadrant) {
        return this.tasks.filter(task => task.quadrant === String(quadrant));
    }

    getRecentCompletedTasks(limit = 3) {
        return this.completedTasks.slice(0, limit);
    }

    getAllCompletedTasks() {
        return this.completedTasks;
    }
}

// Vista dell'applicazione
class TaskView {
    constructor() {
        // Elementi del DOM
        this.taskInput = document.getElementById('taskInput');
        this.quadrantSelect = document.getElementById('quadrantSelect');
        this.addTaskButton = document.getElementById('addTask');
        this.viewAllCompletedButton = document.getElementById('viewAllCompleted');
        this.closeModalButton = document.getElementById('closeModal');
        this.completedTasksModal = document.getElementById('completedTasksModal');
        this.recentCompletedTasksContainer = document.getElementById('recentCompletedTasks');
        this.allCompletedTasksContainer = document.getElementById('allCompletedTasks');
        
        // Quadranti
        this.taskLists = {
            1: document.getElementById('taskList1'),
            2: document.getElementById('taskList2'),
            3: document.getElementById('taskList3'),
            4: document.getElementById('taskList4')
        };
        
        // Elementi quadranti per drag and drop
        this.quadrants = {
            1: document.getElementById('quadrant1'),
            2: document.getElementById('quadrant2'),
            3: document.getElementById('quadrant3'),
            4: document.getElementById('quadrant4')
        };
    }
    
    // Metodi di binding degli eventi
    bindAddTask(handler) {
        this.addTaskButton.addEventListener('click', () => {
            handler(this.taskInput.value, this.quadrantSelect.value);
        });
        
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handler(this.taskInput.value, this.quadrantSelect.value);
            }
        });
    }
    
    bindMarkTaskCompleted(handler) {
        for (let i = 1; i <= 4; i++) {
            this.taskLists[i].addEventListener('change', (e) => {
                if (e.target.classList.contains('task-checkbox')) {
                    const taskId = parseInt(e.target.closest('.task-item').dataset.id);
                    handler(taskId);
                }
            });
        }
    }
    
    bindDeleteTask(handler) {
        for (let i = 1; i <= 4; i++) {
            this.taskLists[i].addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-btn') || e.target.closest('.delete-btn')) {
                    const taskId = parseInt(e.target.closest('.task-item').dataset.id);
                    
                    // Conferma prima di eliminare
                    const confirmDelete = confirm('Sei sicuro di voler eliminare questa attività?');
                    if (confirmDelete) {
                        handler(taskId);
                        this.showToast('info', 'Attività eliminata', 'L\'attività è stata eliminata.');
                    }
                }
            });
        }
    }
    
    bindEditTask(handler) {
        for (let i = 1; i <= 4; i++) {
            // Gestione click su pulsante modifica
            this.taskLists[i].addEventListener('click', (e) => {
                if (e.target.classList.contains('edit-btn') || e.target.closest('.edit-btn')) {
                    const taskItem = e.target.closest('.task-item');
                    const taskId = parseInt(taskItem.dataset.id);
                    const taskText = taskItem.querySelector('.task-text').textContent;
                    
                    this.startEditing(taskItem, taskText);
                }
            });
            
            // Gestione submit al termine modifica
            this.taskLists[i].addEventListener('keydown', (e) => {
                if (e.target.classList.contains('task-edit-input') && e.key === 'Enter') {
                    const taskItem = e.target.closest('.task-item');
                    const taskId = parseInt(taskItem.dataset.id);
                    const newText = e.target.value.trim();
                    
                    if (newText) {
                        this.stopEditing(taskItem);
                        handler(taskId, newText);
                    }
                }
            });
            
            // Gestione annullamento modifica
            this.taskLists[i].addEventListener('keydown', (e) => {
                if (e.target.classList.contains('task-edit-input') && e.key === 'Escape') {
                    const taskItem = e.target.closest('.task-item');
                    this.cancelEditing(taskItem);
                }
            });
            
            // Gestione click pulsanti di salvataggio o annullamento
            this.taskLists[i].addEventListener('click', (e) => {
                const taskItem = e.target.closest('.task-item');
                if (!taskItem) return;
                
                if (e.target.classList.contains('save-edit-btn') || e.target.closest('.save-edit-btn')) {
                    const taskId = parseInt(taskItem.dataset.id);
                    const inputEl = taskItem.querySelector('.task-edit-input');
                    const newText = inputEl ? inputEl.value.trim() : '';
                    
                    if (newText) {
                        this.stopEditing(taskItem);
                        handler(taskId, newText);
                    }
                } else if (e.target.classList.contains('cancel-edit-btn') || e.target.closest('.cancel-edit-btn')) {
                    this.cancelEditing(taskItem);
                }
            });
            
            // Gestione perso focus
            this.taskLists[i].addEventListener('focusout', (e) => {
                if (e.target.classList.contains('task-edit-input')) {
                    // Aspetta un momento per vedere se l'utente ha cliccato sui pulsanti save/cancel
                    setTimeout(() => {
                        const activeElement = document.activeElement;
                        const taskItem = e.target.closest('.task-item');
                        
                        // Non annullare se i pulsanti save/cancel hanno ottenuto il focus
                        if (activeElement && (
                            activeElement.classList.contains('save-edit-btn') || 
                            activeElement.closest('.save-edit-btn') ||
                            activeElement.classList.contains('cancel-edit-btn') || 
                            activeElement.closest('.cancel-edit-btn'))) {
                            return;
                        }
                        
                        this.cancelEditing(taskItem);
                    }, 100);
                }
            });
        }
    }
    
    bindViewAllCompleted(handler) {
        this.viewAllCompletedButton.addEventListener('click', handler);
    }
    
    bindCloseModal() {
        this.closeModalButton.addEventListener('click', () => {
            this.hideCompletedTasksModal();
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === this.completedTasksModal) {
                this.hideCompletedTasksModal();
            }
        });
    }
    
    bindDragAndDrop(handler) {
        // Configura i quadranti come drop target
        for (let i = 1; i <= 4; i++) {
            const quadrant = this.quadrants[i];
            
            // Previeni comportamento predefinito per consentire il drop
            quadrant.addEventListener('dragover', (e) => {
                e.preventDefault();
                quadrant.classList.add('dragover');
            });
            
            quadrant.addEventListener('dragleave', () => {
                quadrant.classList.remove('dragover');
            });
            
            quadrant.addEventListener('dragenter', (e) => {
                e.preventDefault();
            });
            
            quadrant.addEventListener('drop', (e) => {
                e.preventDefault();
                quadrant.classList.remove('dragover');
                
                const taskId = parseInt(e.dataTransfer.getData('text/plain'));
                const newQuadrant = i.toString();
                
                // Trova il quadrante originale
                const taskElement = document.querySelector(`.task-item[data-id="${taskId}"]`);
                if (taskElement) {
                    const currentQuadrant = taskElement.dataset.quadrant;
                    
                    // Sposta solo se il quadrante è cambiato
                    if (currentQuadrant !== newQuadrant) {
                        handler(taskId, newQuadrant);
                    }
                }
            });
        }
    }
    
    bindRestoreCompletedTask(handler) {
        // Gestione pulsante ripristina nelle attività recenti
        this.recentCompletedTasksContainer.addEventListener('click', (e) => {
            if (e.target.closest('.restore-btn')) {
                const taskItem = e.target.closest('.completed-task-item');
                const taskId = parseInt(taskItem.dataset.id);
                
                // Aggiungi animazione prima di ripristinare
                taskItem.classList.add('restoring');
                
                // Breve delay per l'animazione
                setTimeout(() => {
                    handler(taskId);
                    this.showToast('success', 'Attività ripristinata', 'L\'attività è stata riportata nel quadrante originale.');
                }, 300);
            }
        });
        
        // Gestione pulsante ripristina nella modale con tutte le attività
        this.allCompletedTasksContainer.addEventListener('click', (e) => {
            if (e.target.closest('.restore-btn')) {
                const taskItem = e.target.closest('.completed-task-item');
                const taskId = parseInt(taskItem.dataset.id);
                
                // Aggiungi animazione prima di ripristinare
                taskItem.classList.add('restoring');
                
                // Breve delay per l'animazione
                setTimeout(() => {
                    handler(taskId);
                    this.showToast('success', 'Attività ripristinata', 'L\'attività è stata riportata nel quadrante originale.');
                }, 300);
            }
        });
    }
    
    bindDeleteCompletedTask(handler) {
        // Solo nella modale con tutte le attività
        this.allCompletedTasksContainer.addEventListener('click', (e) => {
            if (e.target.closest('.delete-btn')) {
                const taskItem = e.target.closest('.completed-task-item');
                const taskId = parseInt(taskItem.dataset.id);
                
                // Conferma eliminazione
                const confirmDelete = confirm('Sei sicuro di voler eliminare definitivamente questa attività completata?');
                if (confirmDelete) {
                    // Aggiungi animazione prima di eliminare
                    taskItem.classList.add('deleting');
                    
                    // Breve delay per l'animazione
                    setTimeout(() => {
                        handler(taskId);
                        this.showToast('info', 'Attività eliminata', 'L\'attività completata è stata eliminata definitivamente.');
                    }, 300);
                }
            }
        });
    }
    
    // Metodi per la modifica delle attività
    startEditing(taskItem, currentText) {
        // Se già in modalità modifica, non fare nulla
        if (taskItem.classList.contains('editing')) {
            return;
        }
        
        // Aggiungi classe per lo stile in modifica
        taskItem.classList.add('editing');
        
        // Nasconde il testo esistente
        const textContainer = taskItem.querySelector('.task-text-container');
        if (textContainer) {
            textContainer.style.display = 'none';
        }
        
        // Crea l'input di modifica
        const editContainer = document.createElement('div');
        editContainer.className = 'task-edit-container';
        
        const editInput = document.createElement('input');
        editInput.type = 'text';
        editInput.className = 'task-edit-input';
        editInput.value = currentText;
        
        const editActions = document.createElement('div');
        editActions.className = 'edit-actions';
        
        const saveButton = document.createElement('button');
        saveButton.className = 'save-edit-btn';
        saveButton.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        saveButton.title = 'Salva';
        
        const cancelButton = document.createElement('button');
        cancelButton.className = 'cancel-edit-btn';
        cancelButton.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
        cancelButton.title = 'Annulla';
        
        editActions.appendChild(saveButton);
        editActions.appendChild(cancelButton);
        
        editContainer.appendChild(editInput);
        editContainer.appendChild(editActions);
        
        // Inserisci dopo il checkbox ma prima delle azioni
        const checkbox = taskItem.querySelector('.task-checkbox');
        taskItem.insertBefore(editContainer, checkbox.nextSibling);
        
        // Focus sull'input con il cursore alla fine del testo
        editInput.focus();
        editInput.setSelectionRange(editInput.value.length, editInput.value.length);
        
        // Nascondi i pulsanti di azione normali durante la modifica
        const taskActions = taskItem.querySelector('.task-actions');
        if (taskActions) {
            taskActions.style.display = 'none';
        }
    }
    
    stopEditing(taskItem) {
        // Rimuovi la classe di editing
        taskItem.classList.remove('editing');
        
        // Rimuovi l'input di modifica
        const editContainer = taskItem.querySelector('.task-edit-container');
        if (editContainer) {
            editContainer.remove();
        }
        
        // Mostra di nuovo il testo
        const textContainer = taskItem.querySelector('.task-text-container');
        if (textContainer) {
            textContainer.style.display = '';
        }
        
        // Mostra di nuovo i pulsanti di azione
        const taskActions = taskItem.querySelector('.task-actions');
        if (taskActions) {
            taskActions.style.display = '';
        }
    }
    
    cancelEditing(taskItem) {
        // Ripristina lo stato precedente senza salvare le modifiche
        this.stopEditing(taskItem);
    }
    
    // Metodi di rendering
    renderTasks(tasksMap) {
        for (let i = 1; i <= 4; i++) {
            const tasks = tasksMap[i];
            const taskList = this.taskLists[i];
            taskList.innerHTML = '';
            
            if (tasks.length === 0) {
                this.renderEmptyState(taskList, i);
                continue;
            }
            
            tasks.forEach(task => {
                const taskItem = this.createTaskElement(task);
                taskList.appendChild(taskItem);
            });
        }
    }
    
    renderEmptyState(container, quadrant) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        
        let message = '';
        switch(quadrant) {
            case 1:
                message = 'Nessuna attività urgente e importante.';
                break;
            case 2:
                message = 'Nessuna attività importante ma non urgente.';
                break;
            case 3:
                message = 'Nessuna attività urgente ma non importante.';
                break;
            case 4:
                message = 'Nessuna attività non urgente e non importante.';
                break;
            default:
                message = 'Nessuna attività.';
        }
        
        emptyState.textContent = message;
        container.appendChild(emptyState);
    }
    
    createTaskElement(task) {
        const taskItem = document.createElement('div');
        taskItem.className = 'task-item';
        taskItem.dataset.id = task.id;
        taskItem.dataset.quadrant = task.quadrant;
        
        // Attributi per drag and drop
        taskItem.draggable = true;
        
        // Eventi drag
        taskItem.addEventListener('dragstart', (e) => {
            // Previeni il drag quando si è in modalità modifica
            if (taskItem.classList.contains('editing')) {
                e.preventDefault();
                return false;
            }
            
            e.dataTransfer.setData('text/plain', task.id);
            taskItem.classList.add('dragging');
            setTimeout(() => {
                // Aggiungiamo un timeout piccolo per evitare problemi di visualizzazione durante il drag
                taskItem.classList.add('task-being-dragged');
            }, 0);
        });
        
        taskItem.addEventListener('dragend', (e) => {
            taskItem.classList.remove('dragging');
            taskItem.classList.remove('task-being-dragged');
        });
        
        // Aggiungiamo un'impugnatura per il drag
        const dragHandle = document.createElement('div');
        dragHandle.className = 'drag-handle';
        dragHandle.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="8" cy="18" r="2"/><circle cx="16" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="16" cy="18" r="2"/></svg>';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task-checkbox';
        checkbox.checked = task.completed;
        
        // Container per il testo con doppio click per modifica
        const taskTextContainer = document.createElement('div');
        taskTextContainer.className = 'task-text-container';
        
        const taskText = document.createElement('div');
        taskText.className = 'task-text';
        taskText.textContent = task.text;
        
        // Abilita la modifica con doppio click
        taskTextContainer.addEventListener('dblclick', () => {
            this.startEditing(taskItem, task.text);
        });
        
        taskTextContainer.appendChild(taskText);
        
        // Aggiungi indicatore di modifica se la task è stata modificata
        if (task.editedAt) {
            const editedIndicator = document.createElement('span');
            editedIndicator.className = 'edited-indicator';
            editedIndicator.title = `Modificato il ${this.formatDate(new Date(task.editedAt))}`;
            editedIndicator.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34"></path><polygon points="18 2 22 6 12 16 8 16 8 12 18 2"></polygon></svg>';
            taskTextContainer.appendChild(editedIndicator);
        }
        
        const taskActions = document.createElement('div');
        taskActions.className = 'task-actions';
        
        // Bottone di modifica
        const editButton = document.createElement('button');
        editButton.className = 'edit-btn';
        editButton.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';
        editButton.title = 'Modifica';
        
        // Bottone di eliminazione
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-btn';
        deleteButton.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
        deleteButton.title = 'Elimina';
        
        taskActions.appendChild(editButton);
        taskActions.appendChild(deleteButton);
        
        taskItem.appendChild(dragHandle);
        taskItem.appendChild(checkbox);
        taskItem.appendChild(taskTextContainer);
        taskItem.appendChild(taskActions);
        
        return taskItem;
    }
    
    renderRecentCompletedTasks(completedTasks) {
        this.recentCompletedTasksContainer.innerHTML = '';
        
        if (completedTasks.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-state';
            emptyMessage.textContent = 'Nessuna attività completata.';
            this.recentCompletedTasksContainer.appendChild(emptyMessage);
            return;
        }
        
        completedTasks.forEach(task => {
            const taskItem = document.createElement('div');
            taskItem.className = 'completed-task-item';
            taskItem.dataset.id = task.id;
            
            const checkIcon = document.createElement('span');
            checkIcon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#28a745" stroke-width="2"><path d="M20 6L9 17l-5-5"></path></svg>';
            checkIcon.style.marginRight = '10px';
            
            const taskText = document.createElement('span');
            taskText.className = 'completed-task-text';
            taskText.textContent = task.text;
            
            const completedTime = document.createElement('span');
            completedTime.className = 'completed-time';
            completedTime.textContent = this.formatDate(new Date(task.completedAt));

            const taskActions = document.createElement('div');
            taskActions.className = 'completed-task-actions';
            
            const restoreButton = document.createElement('button');
            restoreButton.className = 'restore-btn';
            restoreButton.title = 'Ripristina';
            restoreButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>';
            
            taskActions.appendChild(restoreButton);
            
            taskItem.appendChild(checkIcon);
            taskItem.appendChild(taskText);
            taskItem.appendChild(completedTime);
            taskItem.appendChild(taskActions);
            
            this.recentCompletedTasksContainer.appendChild(taskItem);
        });
    }
    
    renderAllCompletedTasks(completedTasks) {
        this.allCompletedTasksContainer.innerHTML = '';
        
        if (completedTasks.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-state';
            emptyMessage.textContent = 'Nessuna attività completata.';
            this.allCompletedTasksContainer.appendChild(emptyMessage);
            return;
        }
        
        completedTasks.forEach(task => {
            const taskItem = document.createElement('div');
            taskItem.className = 'completed-task-item';
            taskItem.dataset.id = task.id;
            
            const checkIcon = document.createElement('span');
            checkIcon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#28a745" stroke-width="2"><path d="M20 6L9 17l-5-5"></path></svg>';
            checkIcon.style.marginRight = '10px';
            
            const taskText = document.createElement('span');
            taskText.className = 'completed-task-text';
            taskText.textContent = task.text;
            
            const quadrantInfo = document.createElement('span');
            quadrantInfo.textContent = ` (Q${task.quadrant})`;
            quadrantInfo.style.marginLeft = '5px';
            quadrantInfo.style.color = '#6c757d';
            
            const completedTime = document.createElement('span');
            completedTime.className = 'completed-time';
            completedTime.textContent = this.formatDate(new Date(task.completedAt));
            
            const taskActions = document.createElement('div');
            taskActions.className = 'completed-task-actions';
            
            const restoreButton = document.createElement('button');
            restoreButton.className = 'restore-btn';
            restoreButton.title = 'Ripristina';
            restoreButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>';
            
            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-btn';
            deleteButton.title = 'Elimina';
            deleteButton.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
            
            taskActions.appendChild(restoreButton);
            taskActions.appendChild(deleteButton);
            
            taskItem.appendChild(checkIcon);
            taskItem.appendChild(taskText);
            taskItem.appendChild(quadrantInfo);
            taskItem.appendChild(completedTime);
            taskItem.appendChild(taskActions);
            
            this.allCompletedTasksContainer.appendChild(taskItem);
        });
    }
    
    showCompletedTasksModal() {
        this.completedTasksModal.style.display = 'block';
    }
    
    hideCompletedTasksModal() {
        this.completedTasksModal.style.display = 'none';
    }
    
    clearTaskInput() {
        this.taskInput.value = '';
        this.taskInput.focus();
    }
    
    formatDate(date) {
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    }
    
    showToast(type, title, message, duration = 3000) {
        // Crea contenitore toast se non esiste
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        
        // Crea elemento toast
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let iconSvg = '';
        switch(type) {
            case 'success':
                iconSvg = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
                break;
            case 'info':
                iconSvg = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
                break;
            case 'warning':
                iconSvg = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
                break;
            default:
                iconSvg = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
        }
        
        toast.innerHTML = `
            <div class="toast-icon">${iconSvg}</div>
            <div class="toast-message">
                <div class="toast-title">${title}</div>
                <div>${message}</div>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        // Mostra il toast con un piccolo ritardo per l'animazione
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Rimuovi il toast dopo la durata specificata
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300); // Attendi che l'animazione di uscita finisca
        }, duration);
    }
}

// Controller dell'applicazione
class TaskController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        
        // Inizializza la vista
        this.initialize();
        
        // Collega gli event listener
        this.bindEvents();
    }
    
    initialize() {
        this.view.renderTasks(this.getTasksForAllQuadrants());
        this.view.renderRecentCompletedTasks(this.model.getRecentCompletedTasks());
        
        // Verifica se c'è un parametro nell'URL per mostrare le attività completate
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('action') === 'completed') {
            this.view.renderAllCompletedTasks(this.model.getAllCompletedTasks());
            this.view.showCompletedTasksModal();
        }
    }
    
    getTasksForAllQuadrants() {
        return {
            1: this.model.getTasksByQuadrant(1),
            2: this.model.getTasksByQuadrant(2),
            3: this.model.getTasksByQuadrant(3),
            4: this.model.getTasksByQuadrant(4)
        };
    }
    
    bindEvents() {
        // Event handler per aggiungere una nuova attività
        this.view.bindAddTask((taskText, quadrant) => {
            if (taskText.trim() === '') return;
            
            this.model.addTask(taskText, quadrant);
            this.view.renderTasks(this.getTasksForAllQuadrants());
            this.view.clearTaskInput();
            this.view.showToast('success', 'Attività aggiunta', 'Nuova attività aggiunta con successo.');
        });
        
        // Event handler per completare un'attività
        this.view.bindMarkTaskCompleted(taskId => {
            this.model.completeTask(taskId);
            this.view.renderTasks(this.getTasksForAllQuadrants());
            this.view.renderRecentCompletedTasks(this.model.getRecentCompletedTasks());
            this.view.showToast('success', 'Attività completata', 'L\'attività è stata spostata tra le completate.');
        });
        
        // Event handler per eliminare un'attività
        this.view.bindDeleteTask(taskId => {
            this.model.deleteTask(taskId);
            this.view.renderTasks(this.getTasksForAllQuadrants());
        });
        
        // Event handler per modificare un'attività
        this.view.bindEditTask((taskId, newText) => {
            this.model.editTask(taskId, newText);
            this.view.renderTasks(this.getTasksForAllQuadrants());
            this.view.showToast('success', 'Attività modificata', 'L\'attività è stata aggiornata con successo.');
        });
        
        // Event handler per visualizzare tutte le attività completate
        this.view.bindViewAllCompleted(() => {
            this.view.renderAllCompletedTasks(this.model.getAllCompletedTasks());
            this.view.showCompletedTasksModal();
        });
        
        // Event handler per chiudere la finestra modale
        this.view.bindCloseModal();
        
        // Event handler per drag and drop
        this.view.bindDragAndDrop((taskId, newQuadrant) => {
            this.model.moveTask(taskId, newQuadrant);
            this.view.renderTasks(this.getTasksForAllQuadrants());
            this.view.showToast('info', 'Attività spostata', `L'attività è stata spostata nel quadrante Q${newQuadrant}.`);
        });
        
        // Event handler per ripristinare un'attività completata
        this.view.bindRestoreCompletedTask(taskId => {
            this.model.restoreTask(taskId);
            this.view.renderTasks(this.getTasksForAllQuadrants());
            this.view.renderRecentCompletedTasks(this.model.getRecentCompletedTasks());
            this.view.renderAllCompletedTasks(this.model.getAllCompletedTasks());
        });
        
        // Event handler per eliminare un'attività completata
        this.view.bindDeleteCompletedTask(taskId => {
            this.model.deleteCompletedTask(taskId);
            this.view.renderRecentCompletedTasks(this.model.getRecentCompletedTasks());
            this.view.renderAllCompletedTasks(this.model.getAllCompletedTasks());
        });
    }
}

// PWA setup
class PWAManager {
    constructor() {
        this.installButton = document.getElementById('installApp');
        this.deferredPrompt = null;
        
        this.initialize();
    }
    
    initialize() {
        // Registra il service worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('sw.js').then(registration => {
                    console.log('ServiceWorker registrato con successo:', registration.scope);
                }).catch(error => {
                    console.log('Registrazione ServiceWorker fallita:', error);
                });
            });
        }
        
        // Gestisce l'installazione dell'app
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.installButton.style.display = 'block';
        });
        
        this.installButton.addEventListener('click', async () => {
            if (this.deferredPrompt) {
                this.deferredPrompt.prompt();
                const { outcome } = await this.deferredPrompt.userChoice;
                console.log(`Risposta utente al prompt di installazione: ${outcome}`);
                this.deferredPrompt = null;
                this.installButton.style.display = 'none';
            }
        });
    }
}

// Inizializzazione dell'applicazione
document.addEventListener('DOMContentLoaded', () => {
    const app = new TaskController(new TaskModel(), new TaskView());
    const pwa = new PWAManager();
});
