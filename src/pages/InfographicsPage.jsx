import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

function InfographicCard({ item, onDelete }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 truncate">
            {item.title || 'Untitled infographic'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(item.created_at).toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={() => onDelete(item.id)}
          className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
          aria-label="Delete"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
      {item.data?.description && (
        <p className="text-xs text-gray-500 mt-2 line-clamp-2">{item.data.description}</p>
      )}
    </div>
  )
}

function NewInfographicModal({ onConfirm, onClose }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    await onConfirm({ title: title.trim(), description: description.trim() })
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-gray-900 mb-5">New Infographic</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Timeline of events"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              placeholder="Brief description of this infographic…"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? '…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function InfographicsPage() {
  const { bookId } = useParams()
  const { user } = useAuth()
  const [book, setBook] = useState(null)
  const [infographics, setInfographics] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const load = async () => {
      const [{ data: bk }, { data: items }] = await Promise.all([
        supabase.from('books').select('id, title').eq('id', bookId).single(),
        supabase
          .from('infographics')
          .select('id, title, data, created_at')
          .eq('book_id', bookId)
          .order('created_at', { ascending: false }),
      ])
      if (bk) setBook(bk)
      if (items) setInfographics(items)
      setLoading(false)
    }
    load()
  }, [bookId])

  const handleCreate = async ({ title, description }) => {
    const { data } = await supabase
      .from('infographics')
      .insert({
        user_id: user.id,
        book_id: bookId,
        title,
        data: description ? { description } : {},
      })
      .select()
      .single()
    if (data) {
      setInfographics((prev) => [data, ...prev])
      setShowModal(false)
    }
  }

  const handleDelete = async (id) => {
    await supabase.from('infographics').delete().eq('id', id)
    setInfographics((prev) => prev.filter((i) => i.id !== id))
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link
          to={`/books/${bookId}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {book?.title || 'Book'}
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Infographics</h1>
            <p className="text-sm text-gray-500 mt-0.5">Visual elements associated with this book.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : infographics.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-3">📊</div>
            <p className="text-gray-500 text-sm">No infographics yet.</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 text-indigo-600 text-sm font-medium hover:underline"
            >
              Create one
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {infographics.map((item) => (
              <InfographicCard key={item.id} item={item} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <NewInfographicModal
          onConfirm={handleCreate}
          onClose={() => setShowModal(false)}
        />
      )}
    </Layout>
  )
}
