document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const noteForm = document.getElementById('note-form');
    const editNoteForm = document.getElementById('edit-note-form');
    const notesContainer = document.getElementById('notes-container');
    const searchInput = document.getElementById('search-notes');
    const clearSearchBtn = document.getElementById('clear-search');
    const priorityFilter = document.getElementById('priority-filter');
    const categoryFilter = document.getElementById('category-filter');
    const protectionFilter = document.getElementById('protection-filter');
    const sortByDateBtn = document.getElementById('sort-by-date');
    const sortByPriorityBtn = document.getElementById('sort-by-priority');
    const clearAllBtn = document.getElementById('clear-all-btn');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const notesCountSpan = document.getElementById('notes-count');
    const saveEditBtn = document.getElementById('save-edit-btn');
    const protectToggle = document.getElementById('note-protect-toggle');
    const passwordFields = document.getElementById('password-fields');
    const togglePassword = document.getElementById('toggle-password');
    const toggleConfirmPassword = document.getElementById('toggle-confirm-password');
    const toggleViewPassword = document.getElementById('toggle-view-password');
    const viewNotePasswordInput = document.getElementById('view-note-password');
    const submitPasswordBtn = document.getElementById('submit-password');
    const fab = document.getElementById('fab');
    const colorPreview = document.getElementById('color-preview');
    const editColorPreview = document.getElementById('edit-color-preview');
    const noteColorInput = document.getElementById('note-color');
    const editNoteColorInput = document.getElementById('edit-note-color');
    const toast = new bootstrap.Toast(document.getElementById('confirmationToast'));
    
    // Modals
    const editNoteModal = new bootstrap.Modal(document.getElementById('editNoteModal'));
    const passwordPromptModal = new bootstrap.Modal(document.getElementById('passwordPromptModal'));

    // Initialize notes from localStorage or empty array
    let notes = JSON.parse(localStorage.getItem('notes')) || [];
    let currentSort = 'date-desc'; // Default sort by date (newest first)
    let currentEditId = null;

    // Check if we need to open a protected note
    const urlParams = new URLSearchParams(window.location.search);
    const protectedNoteId = urlParams.get('protectedNote');
    if (protectedNoteId) {
        const note = notes.find(n => n.id === parseInt(protectedNoteId));
        if (note && note.isProtected) {
            submitPasswordBtn.setAttribute('data-note-id', note.id);
            viewNotePasswordInput.value = '';
            document.getElementById('password-error').textContent = '';
            viewNotePasswordInput.classList.remove('is-invalid');
            passwordPromptModal.show();
        }
    }

    // Initialize the app
    initApp();

    // Event Listeners
    noteForm.addEventListener('submit', handleNoteSubmit);
    searchInput.addEventListener('input', filterNotes);
    clearSearchBtn.addEventListener('click', clearSearch);
    priorityFilter.addEventListener('change', filterNotes);
    categoryFilter.addEventListener('change', filterNotes);
    protectionFilter.addEventListener('change', filterNotes);
    sortByDateBtn.addEventListener('click', () => sortNotes('date'));
    sortByPriorityBtn.addEventListener('click', () => sortNotes('priority'));
    clearAllBtn.addEventListener('click', confirmClearAll);
    darkModeToggle.addEventListener('click', toggleDarkMode);
    saveEditBtn.addEventListener('click', saveEditedNote);
    protectToggle.addEventListener('change', togglePasswordFields);
    togglePassword.addEventListener('click', () => togglePasswordVisibility('note-password', 'toggle-password'));
    toggleConfirmPassword.addEventListener('click', () => togglePasswordVisibility('note-confirm-password', 'toggle-confirm-password'));
    toggleViewPassword.addEventListener('click', () => togglePasswordVisibility('view-note-password', 'toggle-view-password'));
    submitPasswordBtn.addEventListener('click', handlePasswordSubmit);
    fab.addEventListener('click', scrollToNoteForm);
    noteColorInput.addEventListener('input', updateColorPreview);
    editNoteColorInput.addEventListener('input', updateEditColorPreview);

    // Initialize app function
    function initApp() {
        // Load dark mode preference
        if (localStorage.getItem('darkMode') === 'enabled') {
            document.body.setAttribute('data-theme', 'dark');
            darkModeToggle.classList.add('active');
            darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
        
        // Set initial color preview
        colorPreview.style.backgroundColor = noteColorInput.value;
        
        // Initialize color palette selection
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', function() {
                const color = this.getAttribute('data-color');
                const isEdit = this.closest('#editNoteModal');
                
                if (isEdit) {
                    document.getElementById('edit-note-color').value = color;
                    document.getElementById('edit-color-preview').style.backgroundColor = color;
                } else {
                    document.getElementById('note-color').value = color;
                    document.getElementById('color-preview').style.backgroundColor = color;
                }
                
                // Animate selection
                document.querySelectorAll('.color-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                this.classList.add('selected');
                animateCSS(this, 'pulse');
            });
        });
        
        // Display notes
        displayNotes(notes);
        updateNotesCount();
        
        // Add animation to empty state if no notes
        if (notes.length === 0) {
            const emptyState = document.querySelector('.empty-state');
            if (emptyState) {
                emptyState.classList.add('animate__animated', 'animate__pulse');
            }
        }
        
        // Initialize 3D hover effects for cards
        init3DHoverEffects();
    }

    // Initialize 3D hover effects
    function init3DHoverEffects() {
        document.querySelectorAll('.note-card-3d').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const angleX = (y - centerY) / 20;
                const angleY = (centerX - x) / 20;
                
                card.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg)`;
            });
            
            card.addEventListener('mouseenter', () => {
                card.style.transition = 'all 0.3s ease';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transition = 'all 0.6s ease';
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
            });
        });
    }

    // Update color preview
    function updateColorPreview() {
        colorPreview.style.backgroundColor = noteColorInput.value;
        animateCSS(colorPreview, 'pulse');
    }

    // Update edit color preview
    function updateEditColorPreview() {
        editColorPreview.style.backgroundColor = editNoteColorInput.value;
        animateCSS(editColorPreview, 'pulse');
    }

    // Helper function for animations
    function animateCSS(element, animation, prefix = 'animate__') {
        return new Promise((resolve) => {
            const animationName = `${prefix}${animation}`;
            element.classList.add(`${prefix}animated`, animationName);

            function handleAnimationEnd() {
                element.classList.remove(`${prefix}animated`, animationName);
                element.removeEventListener('animationend', handleAnimationEnd);
                resolve();
            }

            element.addEventListener('animationend', handleAnimationEnd);
        });
    }

    // Scroll to note form
    function scrollToNoteForm() {
        document.getElementById('note-title').scrollIntoView({ 
            behavior: 'smooth',
            block: 'center'
        });
        document.getElementById('note-title').focus();
        
        // Add pulse animation to form
        const formCard = document.querySelector('.card');
        animateCSS(formCard, 'pulse');
    }

    // Toggle password fields visibility
    function togglePasswordFields() {
        if (this.checked) {
            passwordFields.style.display = 'block';
            animateCSS(passwordFields, 'fadeIn');
        } else {
            animateCSS(passwordFields, 'fadeOut').then(() => {
                passwordFields.style.display = 'none';
                document.getElementById('note-password').value = '';
                document.getElementById('note-confirm-password').value = '';
            });
        }
    }

    // Toggle password visibility
    function togglePasswordVisibility(inputId, iconId) {
        const input = document.getElementById(inputId);
        const icon = document.getElementById(iconId);
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.replace('fa-eye', 'fa-eye-slash');
            animateCSS(icon, 'tada');
        } else {
            input.type = 'password';
            icon.classList.replace('fa-eye-slash', 'fa-eye');
            animateCSS(icon, 'tada');
        }
    }

    // Handle new note submission
    function handleNoteSubmit(e) {
        e.preventDefault();
        
        const title = document.getElementById('note-title').value.trim();
        const content = document.getElementById('note-content').value.trim();
        const color = document.getElementById('note-color').value;
        const priority = document.querySelector('input[name="priority"]:checked').value;
        const category = document.getElementById('note-category').value;
        const readOnly = document.getElementById('note-readonly').checked;
        const isProtected = document.getElementById('note-protect-toggle').checked;
        const password = document.getElementById('note-password').value;
        const confirmPassword = document.getElementById('note-confirm-password').value;
        
        if (!title || !content) {
            showAlert('Please fill in both title and content', 'danger');
            return;
        }
        
        if (isProtected) {
            if (!password || !confirmPassword) {
                showAlert('Please enter and confirm password', 'danger');
                return;
            }
            
            if (password !== confirmPassword) {
                showAlert('Passwords do not match', 'danger');
                return;
            }
            
            if (password.length < 4) {
                showAlert('Password must be at least 4 characters', 'danger');
                return;
            }
        }
        
        const newNote = {
            id: Date.now(),
            title,
            content,
            color,
            priority,
            category,
            readOnly,
            isProtected,
            passwordHash: isProtected ? hashPassword(password) : null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isUnlocked: false
        };
        
        notes.push(newNote);
        saveNotes();
        displayNotes(notes);
        resetNoteForm();
        
        showToast('Note added successfully!');
        animateCSS(fab, 'tada');
    }

    function resetNoteForm() {
        noteForm.reset();
        document.getElementById('note-color').value = '#fff8e1';
        colorPreview.style.backgroundColor = '#fff8e1';
        document.getElementById('note-readonly').checked = false;
        document.getElementById('note-protect-toggle').checked = false;
        passwordFields.style.display = 'none';
        document.getElementById('note-category').value = 'general';
    }

    // Simple password hashing
    function hashPassword(password) {
        return btoa(unescape(encodeURIComponent(password)));
    }

    function verifyPassword(inputPassword, storedHash) {
        return hashPassword(inputPassword) === storedHash;
    }

    // Handle password submission
    function handlePasswordSubmit() {
        const password = viewNotePasswordInput.value;
        const noteId = parseInt(this.getAttribute('data-note-id'));
        const note = notes.find(n => n.id === noteId);
        
        if (!note || !verifyPassword(password, note.passwordHash)) {
            document.getElementById('password-error').textContent = 'Incorrect password';
            viewNotePasswordInput.classList.add('is-invalid');
            animateCSS(viewNotePasswordInput, 'shakeX');
            return;
        }
        
        // Unlock the note
        note.isUnlocked = true;
        saveNotes();
        
        // Close modal
        passwordPromptModal.hide();
        
        // Open the note in new page
        window.open(`note.html?id=${noteId}`, '_blank');
        
        // Refresh notes view
        displayNotes(notes);
    }

    // Display notes in the UI
    function displayNotes(notesToDisplay) {
        notesContainer.innerHTML = '';
        
        if (notesToDisplay.length === 0) {
            notesContainer.innerHTML = `
                <div class="col-12 text-center py-5 empty-state animate__animated animate__pulse">
                    <i class="fas fa-book-open fa-3x text-muted mb-3 floating-3d"></i>
                    <p class="text-muted">No notes found. Create your first note!</p>
                </div>
            `;
            return;
        }
        
        notesToDisplay.forEach((note, index) => {
            const priorityClass = `${note.priority}-priority`;
            const priorityBadgeClass = `badge-${note.priority}`;
            const priorityLabel = note.priority.charAt(0).toUpperCase() + note.priority.slice(1);
            
            const isProtected = note.isProtected && !note.isUnlocked;
            
            const noteElement = document.createElement('div');
            noteElement.className = 'col-md-6 col-lg-4';
            noteElement.setAttribute('data-note-id', note.id);
            noteElement.innerHTML = `
                <div class="card note-card note-card-3d ${priorityClass}" style="background-color: ${isProtected ? 'var(--card-bg)' : note.color}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start">
                            <h5 class="card-title">${isProtected ? '🔒 Protected Note' : note.title}</h5>
                            <div>
                                ${note.readOnly ? '<span class="badge bg-secondary me-1">Read-Only</span>' : ''}
                                ${note.isProtected ? '<span class="badge bg-dark">🔒</span>' : ''}
                                <span class="badge bg-info">${note.category}</span>
                            </div>
                        </div>
                        
                        ${isProtected ? `
                            <div class="protected-note-content text-center py-4">
                                <i class="fas fa-lock fa-3x text-muted mb-3"></i>
                                <p class="text-muted">This note is password protected</p>
                                <button class="btn btn-sm btn-outline-primary unlock-note" data-note-id="${note.id}">
                                    <i class="fas fa-key me-1"></i>Unlock
                                </button>
                            </div>
                        ` : `
                            <span class="priority-badge ${priorityBadgeClass}">${priorityLabel}</span>
                            <p class="card-text mt-2">${note.content.substring(0, 100)}${note.content.length > 100 ? '...' : ''}</p>
                            <div class="note-meta">
                                <small>${formatDate(note.updatedAt)}</small>
                            </div>
                            <div class="note-actions">
                                <button class="btn btn-sm btn-outline-danger delete-note" data-id="${note.id}">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-primary edit-note" data-id="${note.id}" 
                                    ${note.readOnly ? 'disabled' : ''}>
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-secondary pin-note" data-id="${note.id}">
                                    <i class="fas fa-thumbtack"></i>
                                </button>
                            </div>
                        `}
                    </div>
                </div>
            `;
            
            notesContainer.appendChild(noteElement);
            
            // Add staggered animation
            setTimeout(() => {
                noteElement.classList.add('animate__animated', 'animate__fadeInUp');
                noteElement.style.setProperty('--animate-duration', '0.5s');
            }, index * 100);
            
            // Make the note clickable if not protected or already unlocked
            if (!isProtected) {
                makeNoteClickable(noteElement.querySelector('.note-card'), note);
            }
        });
        
        // Add event listeners
        addNoteActionListeners();
    }

    // Make note cards clickable to open in separate page
    function makeNoteClickable(noteElement, note) {
        noteElement.style.cursor = 'pointer';
        noteElement.addEventListener('click', function(e) {
            // Don't open if clicking on action buttons
            if (e.target.closest('.note-actions') || e.target.closest('.unlock-note')) {
                return;
            }
            
            // Add click animation
            animateCSS(noteElement, 'pulse').then(() => {
                // Open note in new page
                window.open(`note.html?id=${note.id}`, '_blank');
            });
        });
    }

    // Add event listeners to note action buttons
    function addNoteActionListeners() {
        // Delete note listeners
        document.querySelectorAll('.delete-note').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const noteId = parseInt(this.getAttribute('data-id'));
                confirmDeleteNote(noteId);
            });
        });
        
        // Edit note listeners
        document.querySelectorAll('.edit-note').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const noteId = parseInt(this.getAttribute('data-id'));
                const note = notes.find(n => n.id === noteId);
                
                if (note.readOnly) {
                    showAlert('This note is read-only and cannot be edited', 'warning');
                    return;
                }
                
                animateCSS(btn, 'rubberBand');
                openEditModal(noteId);
            });
        });
        
        // Unlock note listeners
        document.querySelectorAll('.unlock-note').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const noteId = parseInt(this.getAttribute('data-note-id'));
                const note = notes.find(n => n.id === noteId);
                
                if (note && note.isProtected) {
                    animateCSS(btn, 'rubberBand');
                    submitPasswordBtn.setAttribute('data-note-id', noteId);
                    viewNotePasswordInput.value = '';
                    document.getElementById('password-error').textContent = '';
                    viewNotePasswordInput.classList.remove('is-invalid');
                    passwordPromptModal.show();
                }
            });
        });
        
        // Pin note listeners
        document.querySelectorAll('.pin-note').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const noteId = parseInt(this.getAttribute('data-id'));
                animateCSS(btn, 'rubberBand');
                togglePinNote(noteId);
            });
        });
    }

    // Filter notes based on search, priority, category and protection
    function filterNotes() {
        const searchTerm = searchInput.value.toLowerCase();
        const priority = priorityFilter.value;
        const category = categoryFilter.value;
        const protection = protectionFilter.value;
        
        let filteredNotes = notes.filter(note => {
            const matchesSearch = note.title.toLowerCase().includes(searchTerm) || 
                                note.content.toLowerCase().includes(searchTerm);
            const matchesPriority = priority === 'all' || note.priority === priority;
            const matchesCategory = category === 'all' || note.category === category;
            const matchesProtection = protection === 'all' || 
                                     (protection === 'protected' && note.isProtected) || 
                                     (protection === 'unprotected' && !note.isProtected);
            return matchesSearch && matchesPriority && matchesCategory && matchesProtection;
        });
        
        // Apply current sort
        if (currentSort.includes('date')) {
            sortNotes('date', filteredNotes);
        } else {
            sortNotes('priority', filteredNotes);
        }
    }

    // Sort notes by date or priority
    function sortNotes(type, notesToSort = notes) {
        let sortedNotes = [...notesToSort];
        
        if (type === 'date') {
            if (currentSort === 'date-asc') {
                sortedNotes.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
                currentSort = 'date-desc';
                sortByDateBtn.innerHTML = '<i class="fas fa-sort me-1"></i>Newest First';
            } else {
                sortedNotes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                currentSort = 'date-asc';
                sortByDateBtn.innerHTML = '<i class="fas fa-sort me-1"></i>Oldest First';
            }
            animateCSS(sortByDateBtn, 'flip');
        } else if (type === 'priority') {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            
            if (currentSort === 'priority-asc') {
                sortedNotes.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
                currentSort = 'priority-desc';
                sortByPriorityBtn.innerHTML = '<i class="fas fa-sort me-1"></i>High Priority First';
            } else {
                sortedNotes.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
                currentSort = 'priority-asc';
                sortByPriorityBtn.innerHTML = '<i class="fas fa-sort me-1"></i>Low Priority First';
            }
            animateCSS(sortByPriorityBtn, 'flip');
        }
        
        displayNotes(sortedNotes);
    }

    // Clear search input
    function clearSearch() {
        searchInput.value = '';
        animateCSS(clearSearchBtn, 'rubberBand');
        filterNotes();
    }

    // Open edit modal with note data
    function openEditModal(noteId) {
        const note = notes.find(n => n.id === noteId);
        if (!note) return;
        
        currentEditId = noteId;
        document.getElementById('edit-note-id').value = noteId;
        document.getElementById('edit-note-title').value = note.title;
        document.getElementById('edit-note-content').value = note.content;
        document.getElementById('edit-note-color').value = note.color;
        editColorPreview.style.backgroundColor = note.color;
        document.getElementById('edit-note-category').value = note.category;
        document.querySelector(`#edit-priority-${note.priority}`).checked = true;
        document.getElementById('edit-note-readonly').checked = note.readOnly;
        document.getElementById('edit-note-protect-toggle').checked = note.isProtected;
        
        // Select the color in the palette
        document.querySelectorAll('#editNoteModal .color-option').forEach(option => {
            option.classList.remove('selected');
            if (option.getAttribute('data-color') === note.color) {
                option.classList.add('selected');
            }
        });
        
        editNoteModal.show();
    }

    // Save edited note
    function saveEditedNote() {
        const title = document.getElementById('edit-note-title').value.trim();
        const content = document.getElementById('edit-note-content').value.trim();
        const color = document.getElementById('edit-note-color').value;
        const category = document.getElementById('edit-note-category').value;
        const priority = document.querySelector('input[name="edit-priority"]:checked').value;
        
        if (!title || !content) {
            showAlert('Please fill in both title and content', 'danger');
            return;
        }
        
        const noteIndex = notes.findIndex(n => n.id === currentEditId);
        if (noteIndex !== -1) {
            notes[noteIndex] = {
                ...notes[noteIndex],
                title,
                content,
                color,
                category,
                priority,
                updatedAt: new Date().toISOString()
            };
            
            saveNotes();
            displayNotes(notes);
            editNoteModal.hide();
            showToast('Note updated successfully!');
        }
    }

    // Confirm note deletion
    function confirmDeleteNote(noteId) {
        const noteElement = document.querySelector(`[data-note-id="${noteId}"]`);
        animateCSS(noteElement, 'hinge').then(() => {
            if (confirm('Are you sure you want to delete this note?')) {
                deleteNote(noteId);
            } else {
                noteElement.classList.remove('animate__hinge');
                animateCSS(noteElement, 'fadeInUp');
            }
        });
    }

    // Delete a note
    function deleteNote(noteId) {
        notes = notes.filter(note => note.id !== noteId);
        saveNotes();
        displayNotes(notes);
        showToast('Note deleted successfully!');
    }

    // Toggle pin status of a note
    function togglePinNote(noteId) {
        const note = notes.find(n => n.id === noteId);
        notes = notes.map(n => {
            if (n.id === noteId) {
                return { ...n, pinned: !n.pinned };
            }
            return n;
        });
        
        saveNotes();
        displayNotes(notes);
        showToast(note.pinned ? 'Note pinned!' : 'Note unpinned!');
    }

    // Confirm clearing all notes
    function confirmClearAll() {
        animateCSS(clearAllBtn, 'shakeX');
        if (notes.length === 0) {
            showAlert('There are no notes to clear', 'info');
            return;
        }
        
        if (confirm('Are you sure you want to delete ALL notes? This cannot be undone.')) {
            clearAllNotes();
        }
    }

    // Clear all notes
    function clearAllNotes() {
        animateCSS(notesContainer, 'fadeOut').then(() => {
            notes = [];
            saveNotes();
            displayNotes(notes);
            showToast('All notes have been cleared');
        });
    }

    // Toggle dark mode
    function toggleDarkMode() {
        if (document.body.getAttribute('data-theme') === 'dark') {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('darkMode', 'disabled');
            darkModeToggle.classList.remove('active');
            darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        } else {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('darkMode', 'enabled');
            darkModeToggle.classList.add('active');
            darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
        animateCSS(document.body, 'fadeIn');
    }

    // Save notes to localStorage
    function saveNotes() {
        localStorage.setItem('notes', JSON.stringify(notes));
        updateNotesCount();
    }

    // Update notes count display
    function updateNotesCount() {
        animateCSS(notesCountSpan, 'rubberBand');
        notesCountSpan.textContent = notes.length;
    }

    // Show alert message
    function showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show floating-alert`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        const notesStatus = document.getElementById('notes-status');
        notesStatus.innerHTML = '';
        notesStatus.appendChild(alertDiv);
        
        setTimeout(() => {
            const alert = bootstrap.Alert.getOrCreateInstance(alertDiv);
            alert.close();
        }, 3000);
    }

    // Show toast message
    function showToast(message) {
        document.getElementById('toast-message').textContent = message;
        toast.show();
    }

    // Format date for display
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
});

// Initialize Three.js gradient background
function initGradientBackground() {
    const canvas = document.getElementById('gradient-canvas');
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    
    const geometry = new THREE.PlaneGeometry(10, 10, 32);
    const material = new THREE.MeshBasicMaterial({
        vertexColors: true,
        side: THREE.DoubleSide
    });
    
    // Get colors from CSS variables
    const rootStyles = getComputedStyle(document.documentElement);
    const color1 = new THREE.Color(rootStyles.getPropertyValue('--gradient-start').trim());
    const color2 = new THREE.Color(rootStyles.getPropertyValue('--gradient-end').trim());
    
    const colors = [];
    const positions = geometry.attributes.position;
    
    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const t = (x + 5) / 10;
        const color = color1.clone().lerp(color2, t);
        colors.push(color.r, color.g, color.b);
    }
    
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    
    function animate() {
        requestAnimationFrame(animate);
        mesh.rotation.x += 0.0005;
        mesh.rotation.y += 0.0005;
        renderer.render(scene, camera);
    }
    
    animate();
    
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initGradientBackground);