'use strict';

const STORAGE_KEY = 'wrongbooks_list';

let books = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let currentFilter = 'all';

const bookForm = document.getElementById('bookForm');
const bookList = document.getElementById('bookList');
const filterBtns = document.querySelectorAll('.filter-btn');

const STATUS_LABELS = {
  wrong: '踩雷',
  surprise: '惊喜',
  reading: '在读',
};

function saveBooks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}

function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function renderBooks() {
  const filtered = currentFilter === 'all'
    ? books
    : books.filter(b => b.status === currentFilter);

  if (filtered.length === 0) {
    bookList.innerHTML = `
      <div class="empty-state">
        <div class="icon">📚</div>
        <p>还没有书单记录</p>
      </div>`;
    return;
  }

  bookList.innerHTML = filtered.map(book => `
    <div class="book-card" data-id="${book.id}">
      <span class="status-badge ${book.status}">${STATUS_LABELS[book.status]}</span>
      <div class="book-info">
        <div class="book-title">${escapeHtml(book.title)}</div>
        ${book.author ? `<div class="book-author">${escapeHtml(book.author)}</div>` : ''}
        ${book.note ? `<div class="book-note">${escapeHtml(book.note)}</div>` : ''}
        <div class="book-date">${formatDate(book.createdAt)}</div>
      </div>
      <button class="btn-delete" data-id="${book.id}" title="删除">✕</button>
    </div>
  `).join('');
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

bookForm.addEventListener('submit', e => {
  e.preventDefault();
  const title = document.getElementById('bookTitle').value.trim();
  const author = document.getElementById('bookAuthor').value.trim();
  const status = document.getElementById('bookStatus').value;
  const note = document.getElementById('bookNote').value.trim();

  if (!title) return;

  books.unshift({
    id: Date.now().toString(),
    title,
    author,
    status,
    note,
    createdAt: new Date().toISOString(),
  });

  saveBooks();
  renderBooks();
  bookForm.reset();
});

bookList.addEventListener('click', e => {
  const btn = e.target.closest('.btn-delete');
  if (!btn) return;
  const id = btn.dataset.id;
  books = books.filter(b => b.id !== id);
  saveBooks();
  renderBooks();
});

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderBooks();
  });
});

renderBooks();
