/**
 * Book List Application
 * Client-side only - Data persisted using browser's localStorage
 */

(function () {
  'use strict';

  // Constants
  const STORAGE_KEY = 'book_list_app_books';

  // DOM Elements
  const bookForm = document.getElementById('book-form');
  const editBookIdInput = document.getElementById('edit-book-id');
  const titleInput = document.getElementById('book-title');
  const authorInput = document.getElementById('book-author');
  const statusCheckbox = document.getElementById('book-status');
  const formHeading = document.getElementById('form-heading');
  const saveBtn = document.getElementById('save-btn');
  const saveBtnText = document.getElementById('save-btn-text');
  const saveBtnIcon = document.getElementById('save-btn-icon');
  const cancelEditBtn = document.getElementById('cancel-edit-btn');
  const editBadge = document.getElementById('edit-badge');

  const titleError = document.getElementById('title-error');
  const authorError = document.getElementById('author-error');

  const ratingInput = document.getElementById('book-rating');
  const ratingTextPreview = document.getElementById('rating-text-preview');
  const starPicker = document.getElementById('star-picker');
  const starBtns = document.querySelectorAll('.star-rating-select .star-btn');

  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');

  const booksListContainer = document.getElementById('books-list');
  const emptyState = document.getElementById('empty-state');
  const emptyTitle = document.getElementById('empty-title');
  const emptyDescription = document.getElementById('empty-description');
  const emptyIcon = document.getElementById('empty-icon');

  const totalBooksCountEl = document.getElementById('total-books-count');
  const readBooksCountEl = document.getElementById('read-books-count');
  const unreadBooksCountEl = document.getElementById('unread-books-count');
  const visibleBooksCountEl = document.getElementById('visible-books-count');

  // State
  let books = [];
  let currentSearchQuery = '';

  /**
   * Load books from localStorage
   */
  function loadBooks() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        books = JSON.parse(stored);
        if (!Array.isArray(books)) {
          books = [];
        } else {
          // Ensure all books have a valid rating (1 to 5)
          books.forEach((book) => {
            if (typeof book.rating !== 'number' || book.rating < 1 || book.rating > 5) {
              book.rating = 5;
            }
          });
        }
      } else {
        books = [];
      }
    } catch (err) {
      console.error('Failed to load books from localStorage:', err);
      books = [];
    }
  }

  /**
   * Save books to localStorage
   */
  function saveBooks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    } catch (err) {
      console.error('Failed to save books to localStorage:', err);
      alert('Unable to save changes. Your browser storage might be full or restricted.');
    }
  }

  /**
   * Update top statistics summary
   */
  function updateStats() {
    const total = books.length;
    const read = books.filter((b) => b.isRead).length;
    const unread = total - read;

    totalBooksCountEl.textContent = total;
    readBooksCountEl.textContent = read;
    unreadBooksCountEl.textContent = unread;
  }

  /**
   * Set rating value in form and update visual star display
   */
  function setFormRating(value) {
    const numericVal = Math.min(Math.max(parseInt(value, 10) || 5, 1), 5);
    if (ratingInput) {
      ratingInput.value = numericVal;
    }
    if (ratingTextPreview) {
      ratingTextPreview.textContent = `${numericVal} of 5 stars`;
    }
    starBtns.forEach((btn) => {
      const btnVal = parseInt(btn.dataset.value, 10);
      if (btnVal <= numericVal) {
        btn.classList.add('selected');
      } else {
        btn.classList.remove('selected');
      }
      btn.classList.remove('hovered');
    });
  }

  /**
   * Temporary preview on hover for star rating in form
   */
  function previewFormRating(hoverValue) {
    starBtns.forEach((btn) => {
      const btnVal = parseInt(btn.dataset.value, 10);
      if (btnVal <= hoverValue) {
        btn.classList.add('hovered');
      } else {
        btn.classList.remove('hovered');
      }
    });
    if (ratingTextPreview) {
      ratingTextPreview.textContent = `${hoverValue} of 5 stars`;
    }
  }

  /**
   * Reset form and clear edit state
   */
  function resetForm() {
    bookForm.reset();
    editBookIdInput.value = '';
    setFormRating(5);
    formHeading.textContent = 'Add a New Book';
    saveBtnText.textContent = 'Add Book';
    saveBtnIcon.textContent = '➕';
    cancelEditBtn.classList.add('hidden');
    editBadge.classList.add('hidden');

    clearValidationErrors();

    // Remove editing highlight class from cards
    document.querySelectorAll('.book-card.is-editing').forEach((card) => {
      card.classList.remove('is-editing');
    });
  }

  /**
   * Set up form for editing a specific book
   */
  function enterEditMode(bookId) {
    const book = books.find((b) => b.id === bookId);
    if (!book) return;

    editBookIdInput.value = book.id;
    titleInput.value = book.title;
    authorInput.value = book.author;
    statusCheckbox.checked = Boolean(book.isRead);
    setFormRating(book.rating || 5);

    formHeading.textContent = 'Edit Book';
    saveBtnText.textContent = 'Update Book';
    saveBtnIcon.textContent = '💾';
    cancelEditBtn.classList.remove('hidden');
    editBadge.classList.remove('hidden');

    clearValidationErrors();

    // Highlight the card being edited
    document.querySelectorAll('.book-card').forEach((card) => {
      if (card.dataset.id === bookId) {
        card.classList.add('is-editing');
      } else {
        card.classList.remove('is-editing');
      }
    });

    // Smooth scroll to form on mobile/desktop
    bookForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    titleInput.focus();
  }

  /**
   * Validate form inputs
   */
  function validateForm() {
    let isValid = true;
    const titleVal = titleInput.value.trim();
    const authorVal = authorInput.value.trim();

    if (!titleVal) {
      titleInput.classList.add('input-invalid');
      titleError.classList.add('visible');
      isValid = false;
    } else {
      titleInput.classList.remove('input-invalid');
      titleError.classList.remove('visible');
    }

    if (!authorVal) {
      authorInput.classList.add('input-invalid');
      authorError.classList.add('visible');
      isValid = false;
    } else {
      authorInput.classList.remove('input-invalid');
      authorError.classList.remove('visible');
    }

    return isValid;
  }

  function clearValidationErrors() {
    titleInput.classList.remove('input-invalid');
    titleError.classList.remove('visible');
    authorInput.classList.remove('input-invalid');
    authorError.classList.remove('visible');
  }

  /**
   * Handle form submission (Add or Update)
   */
  function handleFormSubmit(e) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const title = titleInput.value.trim();
    const author = authorInput.value.trim();
    const isRead = statusCheckbox.checked;
    const rating = Math.min(Math.max(parseInt(ratingInput.value, 10) || 5, 1), 5);
    const editId = editBookIdInput.value;

    if (editId) {
      // Update existing book
      const index = books.findIndex((b) => b.id === editId);
      if (index !== -1) {
        books[index].title = title;
        books[index].author = author;
        books[index].isRead = isRead;
        books[index].rating = rating;
        books[index].updatedAt = Date.now();
      }
    } else {
      // Add new book
      const newBook = {
        id: 'book_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        title,
        author,
        isRead,
        rating,
        createdAt: Date.now()
      };
      books.unshift(newBook); // Put new books at the top of the list
    }

    saveBooks();
    resetForm();
    render();
  }

  /**
   * Delete a book with confirmation prompt
   */
  function deleteBook(bookId) {
    const book = books.find((b) => b.id === bookId);
    if (!book) return;

    const confirmed = window.confirm(`Are you sure you want to delete "${book.title}"?`);
    if (!confirmed) return;

    // If currently editing this book, cancel edit mode
    if (editBookIdInput.value === bookId) {
      resetForm();
    }

    books = books.filter((b) => b.id !== bookId);
    saveBooks();
    render();
  }

  /**
   * Toggle read status of a book
   */
  function toggleReadStatus(bookId) {
    const book = books.find((b) => b.id === bookId);
    if (!book) return;

    book.isRead = !book.isRead;
    book.updatedAt = Date.now();

    // If this book is currently populated in the edit form, update the checkbox too
    if (editBookIdInput.value === bookId) {
      statusCheckbox.checked = book.isRead;
    }

    saveBooks();
    render();
  }

  /**
   * Update rating for a book directly (e.g. from card star click)
   */
  function updateBookRating(bookId, newRating) {
    const book = books.find((b) => b.id === bookId);
    if (!book) return;

    book.rating = Math.min(Math.max(parseInt(newRating, 10) || 5, 1), 5);
    book.updatedAt = Date.now();

    // If this book is currently populated in the edit form, sync form rating
    if (editBookIdInput.value === bookId) {
      setFormRating(book.rating);
    }

    saveBooks();
    render();
  }

  /**
   * Create HTML element for a book card safely
   */
  function createBookCardElement(book) {
    const card = document.createElement('div');
    card.className = 'book-card';
    card.dataset.id = book.id;

    if (editBookIdInput.value === book.id) {
      card.classList.add('is-editing');
    }

    // Top Content (Title, Author, Status Badge)
    const content = document.createElement('div');
    content.className = 'book-content';

    const details = document.createElement('div');
    details.className = 'book-details';

    const titleEl = document.createElement('h3');
    titleEl.className = 'book-title';
    titleEl.textContent = book.title;

    const authorEl = document.createElement('p');
    authorEl.className = 'book-author';
    authorEl.innerHTML = `by <span></span>`;
    authorEl.querySelector('span').textContent = book.author;

    // Star Rating on Card
    const ratingContainer = document.createElement('div');
    ratingContainer.className = 'book-rating';
    ratingContainer.setAttribute('aria-label', `Rating: ${book.rating} of 5 stars`);

    const starsDiv = document.createElement('div');
    starsDiv.className = 'card-stars';

    for (let i = 1; i <= 5; i++) {
      const starBtn = document.createElement('button');
      starBtn.type = 'button';
      starBtn.className = `card-star-btn ${i <= book.rating ? 'filled' : ''}`;
      starBtn.innerHTML = '★';
      starBtn.title = `Rate ${i} of 5 stars`;
      starBtn.setAttribute('aria-label', `${i} star${i > 1 ? 's' : ''}`);
      starBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        updateBookRating(book.id, i);
      });
      starsDiv.appendChild(starBtn);
    }

    const scoreSpan = document.createElement('span');
    scoreSpan.className = 'rating-score';
    scoreSpan.textContent = `${book.rating}/5`;

    ratingContainer.appendChild(starsDiv);
    ratingContainer.appendChild(scoreSpan);

    details.appendChild(titleEl);
    details.appendChild(authorEl);
    details.appendChild(ratingContainer);

    // Status Badge (click toggles read/unread)
    const statusBadge = document.createElement('button');
    statusBadge.type = 'button';
    statusBadge.className = `status-badge ${book.isRead ? 'status-read' : 'status-unread'}`;
    statusBadge.setAttribute('title', 'Click to toggle read status');
    statusBadge.innerHTML = book.isRead
      ? '<span>✓</span> Read'
      : '<span>○</span> Not Read';

    statusBadge.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleReadStatus(book.id);
    });

    content.appendChild(details);
    content.appendChild(statusBadge);

    // Bottom Actions (Toggle, Edit, Delete)
    const actions = document.createElement('div');
    actions.className = 'book-actions';

    // Quick toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'btn-action btn-action-toggle';
    toggleBtn.textContent = book.isRead ? 'Mark as Unread' : 'Mark as Read';
    toggleBtn.addEventListener('click', () => toggleReadStatus(book.id));

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn-action btn-action-edit';
    editBtn.innerHTML = '✏️ Edit';
    editBtn.addEventListener('click', () => enterEditMode(book.id));

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn-action btn-action-delete';
    deleteBtn.innerHTML = '🗑️ Delete';
    deleteBtn.addEventListener('click', () => deleteBook(book.id));

    actions.appendChild(toggleBtn);
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    card.appendChild(content);
    card.appendChild(actions);

    return card;
  }

  /**
   * Filter and render books
   */
  function render() {
    updateStats();

    const query = currentSearchQuery.trim().toLowerCase();

    // Filter books based on search query
    const filteredBooks = books.filter((book) => {
      if (!query) return true;
      const titleMatch = book.title.toLowerCase().includes(query);
      const authorMatch = book.author.toLowerCase().includes(query);
      return titleMatch || authorMatch;
    });

    visibleBooksCountEl.textContent = filteredBooks.length;

    // Clear previous list
    booksListContainer.innerHTML = '';

    // Handle Empty State
    if (filteredBooks.length === 0) {
      emptyState.classList.remove('hidden');

      if (books.length === 0) {
        // Entire book list is empty
        emptyIcon.textContent = '📖';
        emptyTitle.textContent = 'Your book list is empty';
        emptyDescription.textContent =
          'Add your first book using the form above to begin building your personal library!';
      } else {
        // Search yielded no results
        emptyIcon.textContent = '🔍';
        emptyTitle.textContent = 'No matching books found';
        emptyDescription.textContent = `No books matched "${currentSearchQuery}". Try another title or author.`;
      }
    } else {
      emptyState.classList.add('hidden');
      const fragment = document.createDocumentFragment();
      filteredBooks.forEach((book) => {
        fragment.appendChild(createBookCardElement(book));
      });
      booksListContainer.appendChild(fragment);
    }
  }

  /**
   * Event Listeners
   */
  function setupEventListeners() {
    // Form submit
    bookForm.addEventListener('submit', handleFormSubmit);

    // Cancel edit
    cancelEditBtn.addEventListener('click', resetForm);

    // Star rating picker in form
    starBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const val = parseInt(btn.dataset.value, 10);
        setFormRating(val);
      });

      btn.addEventListener('mouseenter', () => {
        const val = parseInt(btn.dataset.value, 10);
        previewFormRating(val);
      });
    });

    if (starPicker) {
      starPicker.addEventListener('mouseleave', () => {
        const currentVal = parseInt(ratingInput.value, 10) || 5;
        setFormRating(currentVal);
      });
    }

    // Input validation clearing as user types
    titleInput.addEventListener('input', () => {
      if (titleInput.value.trim()) {
        titleInput.classList.remove('input-invalid');
        titleError.classList.remove('visible');
      }
    });

    authorInput.addEventListener('input', () => {
      if (authorInput.value.trim()) {
        authorInput.classList.remove('input-invalid');
        authorError.classList.remove('visible');
      }
    });

    // Search input
    searchInput.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value;
      if (currentSearchQuery) {
        clearSearchBtn.classList.remove('hidden');
      } else {
        clearSearchBtn.classList.add('hidden');
      }
      render();
    });

    // Clear search button
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      currentSearchQuery = '';
      clearSearchBtn.classList.add('hidden');
      searchInput.focus();
      render();
    });

    // Keyboard shortcuts: Escape cancels edit or clears search
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (editBookIdInput.value) {
          resetForm();
        } else if (searchInput.value) {
          searchInput.value = '';
          currentSearchQuery = '';
          clearSearchBtn.classList.add('hidden');
          render();
        }
      }
    });
  }

  /**
   * Initialization
   */
  function init() {
    loadBooks();
    setFormRating(5);
    setupEventListeners();
    render();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

