import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { getSpineColor } from '../lib/utils'

// ─── Book Card ────────────────────────────────────────────────────────────────

function BookCard({ book, onRename, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const navigate = useNavigate()
  const chapterCount = book.chapters?.[0]?.count ?? 0
  const spineColor = getSpineColor(book.id)

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const coverBg = book.cover?.backgroundColor
  const coverText = book.cover?.textColor || '#ffffff'

  return (
    <div
      className="group relative bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all cursor-pointer flex flex-col"
      onClick={() => navigate(`/books/${book.id}`)}
    >
      {/* Cover area */}
      <div
        className={`h-44 relative flex-shrink-0 ${!coverBg ? spineColor : ''}`}
        style={coverBg ? { backgroundColor: coverBg } : {}}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="font-bold text-base leading-tight text-white line-clamp-2">
            {book.title}
          </p>
          {book.author && (
            <p className="text-sm mt-0.5" style={{ color: coverText + 'cc' }}>
              {book.author}
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 flex items-center justify-between bg-white">
        <span className="text-xs text-gray-400 font-medium">
          {chapterCount} chapter{chapterCount !== 1 ? 's' : ''}
        </span>

        {/* Three-dot menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o) }}
            className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-lg leading-none"
            aria-label="Book options"
          >
            ···
          </button>

          {menuOpen && (
            <div className="absolute right-0 bottom-9 w-36 bg-white rounded-xl shadow-lg border border-gray-200 z-20 py-1 overflow-hidden">
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onRename(book) }}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Rename
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(book) }}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── New / Rename Modal ───────────────────────────────────────────────────────

function BookModal({ mode, initial, onConfirm, onClose }) {
  const [title, setTitle] = useState(initial?.title || '')
  const [author, setAuthor] = useState(initial?.author || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required.'); return }
    setLoading(true)
    await onConfirm({ title: title.trim(), author: author.trim() })
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-5">
          {mode === 'new' ? 'New Book' : 'Rename Book'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2 border border-red-100">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError('') }}
              required
              autoFocus
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="My Great Novel"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Author <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Your name"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {loading ? '…' : mode === 'new' ? 'Create' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteModal({ book, onConfirm, onClose }) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    await onConfirm(book.id)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Delete book?</h2>
        <p className="text-sm text-gray-500 mb-5">
          <strong>"{book.title}"</strong> and all its chapters will be permanently deleted.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition-colors"
          >
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth()
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showNewModal, setShowNewModal] = useState(false)
  const [renameBook, setRenameBook] = useState(null)
  const [deleteBook, setDeleteBook] = useState(null)

  const fetchBooks = async () => {
    const { data, error } = await supabase
      .from('books')
      .select('id, title, author, style, cover, created_at, chapters(count)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setBooks(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchBooks()
  }, [])

  const handleCreate = async ({ title, author }) => {
    const { error } = await supabase
      .from('books')
      .insert({ user_id: user.id, title, author: author || null })
    if (!error) {
      setShowNewModal(false)
      fetchBooks()
    }
  }

  const handleRename = async ({ title, author }) => {
    const { error } = await supabase
      .from('books')
      .update({ title, author: author || null, updated_at: new Date().toISOString() })
      .eq('id', renameBook.id)
    if (!error) {
      setRenameBook(null)
      fetchBooks()
    }
  }

  const handleDelete = async (bookId) => {
    const { error } = await supabase.from('books').delete().eq('id', bookId)
    if (!error) {
      setDeleteBook(null)
      setBooks((prev) => prev.filter((b) => b.id !== bookId))
    }
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Books</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {books.length} book{books.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Book
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm border border-red-100 mb-6">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        )}

        {/* Empty state */}
        {!loading && books.length === 0 && (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No books yet</h2>
            <p className="text-gray-400 text-sm mb-6">Create your first book to get started.</p>
            <button
              onClick={() => setShowNewModal(true)}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Create a book
            </button>
          </div>
        )}

        {/* Book grid */}
        {!loading && books.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onRename={(b) => setRenameBook(b)}
                onDelete={(b) => setDeleteBook(b)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showNewModal && (
        <BookModal
          mode="new"
          onConfirm={handleCreate}
          onClose={() => setShowNewModal(false)}
        />
      )}
      {renameBook && (
        <BookModal
          mode="rename"
          initial={renameBook}
          onConfirm={handleRename}
          onClose={() => setRenameBook(null)}
        />
      )}
      {deleteBook && (
        <DeleteModal
          book={deleteBook}
          onConfirm={handleDelete}
          onClose={() => setDeleteBook(null)}
        />
      )}
    </Layout>
  )
}
