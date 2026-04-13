import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'

const STYLES = [
  {
    id: 'classic',
    name: 'Classic',
    desc: 'Elegant serif typography with traditional chapter headings.',
    preview: { font: 'Georgia, serif', heading: '#1a1a1a', body: '#2d2d2d', bg: '#fffef9' },
  },
  {
    id: 'modern',
    name: 'Modern',
    desc: 'Clean sans-serif with generous spacing and sharp contrast.',
    preview: { font: 'system-ui, sans-serif', heading: '#111827', body: '#374151', bg: '#ffffff' },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    desc: 'Stripped-back layout letting the words take centre stage.',
    preview: { font: 'system-ui, sans-serif', heading: '#000000', body: '#555555', bg: '#fafafa' },
  },
  {
    id: 'elegant',
    name: 'Elegant',
    desc: 'Luxurious serif with refined spacing for literary fiction.',
    preview: { font: '"Palatino Linotype", Palatino, serif', heading: '#2c1810', body: '#3d2b1f', bg: '#fdf8f0' },
  },
]

export default function StylePage() {
  const { bookId } = useParams()
  const [book, setBook] = useState(null)
  const [selected, setSelected] = useState('classic')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase
      .from('books')
      .select('id, title, style')
      .eq('id', bookId)
      .single()
      .then(({ data }) => {
        if (data) { setBook(data); setSelected(data.style || 'classic') }
        setLoading(false)
      })
  }, [bookId])

  const handleSave = async () => {
    setSaving(true)
    await supabase
      .from('books')
      .update({ style: selected, updated_at: new Date().toISOString() })
      .eq('id', bookId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
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
            <h1 className="text-2xl font-bold text-gray-900">Style</h1>
            <p className="text-sm text-gray-500 mt-0.5">Choose how your book looks when exported.</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save'}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => setSelected(style.id)}
                className={`text-left p-4 rounded-2xl border-2 transition-all ${
                  selected === style.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {/* Mini preview */}
                <div
                  className="h-24 rounded-lg mb-3 flex flex-col justify-center px-4 overflow-hidden"
                  style={{ backgroundColor: style.preview.bg, fontFamily: style.preview.font }}
                >
                  <div
                    className="text-base font-bold mb-1 truncate"
                    style={{ color: style.preview.heading }}
                  >
                    Chapter One
                  </div>
                  <div
                    className="text-xs leading-relaxed line-clamp-2"
                    style={{ color: style.preview.body }}
                  >
                    The story begins on a quiet morning, the kind that settles over a town like a familiar blanket…
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                      selected === style.id ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'
                    }`}
                  />
                  <span className="font-semibold text-sm text-gray-900">{style.name}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1 ml-6">{style.desc}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
