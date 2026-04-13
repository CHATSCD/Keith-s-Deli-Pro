import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#0ea5e9', '#1e293b', '#374151',
]

function ColorSwatch({ color, selected, onClick }) {
  return (
    <button
      onClick={() => onClick(color)}
      className={`w-8 h-8 rounded-lg transition-all ${
        selected ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-105'
      }`}
      style={{ backgroundColor: color }}
      title={color}
    />
  )
}

export default function CoverDesignerPage() {
  const { bookId } = useParams()
  const [book, setBook] = useState(null)
  const [bgColor, setBgColor] = useState('#6366f1')
  const [textColor, setTextColor] = useState('#ffffff')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase
      .from('books')
      .select('id, title, author, cover')
      .eq('id', bookId)
      .single()
      .then(({ data }) => {
        if (data) {
          setBook(data)
          if (data.cover?.backgroundColor) setBgColor(data.cover.backgroundColor)
          if (data.cover?.textColor) setTextColor(data.cover.textColor)
        }
        setLoading(false)
      })
  }, [bookId])

  const handleSave = async () => {
    setSaving(true)
    await supabase
      .from('books')
      .update({
        cover: { backgroundColor: bgColor, textColor },
        updated_at: new Date().toISOString(),
      })
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
            <h1 className="text-2xl font-bold text-gray-900">Cover Designer</h1>
            <p className="text-sm text-gray-500 mt-0.5">Design your book's cover appearance.</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save cover'}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-8">
            {/* Controls */}
            <div className="space-y-6">
              {/* Background color */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Background color
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {PRESET_COLORS.map((c) => (
                    <ColorSwatch
                      key={c}
                      color={c}
                      selected={bgColor === c}
                      onClick={setBgColor}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200"
                  />
                  <span className="text-sm font-mono text-gray-600">{bgColor}</span>
                </div>
              </div>

              {/* Text color */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Text color
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {['#ffffff', '#f8fafc', '#1e293b', '#000000', '#fef3c7', '#fce7f3'].map((c) => (
                    <ColorSwatch
                      key={c}
                      color={c}
                      selected={textColor === c}
                      onClick={setTextColor}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200"
                  />
                  <span className="text-sm font-mono text-gray-600">{textColor}</span>
                </div>
              </div>
            </div>

            {/* Live preview */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Preview</p>
              <div
                className="w-48 h-64 mx-auto rounded-xl shadow-lg flex flex-col justify-end p-5 relative overflow-hidden"
                style={{ backgroundColor: bgColor }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)',
                  }}
                />
                <div className="relative z-10">
                  <p
                    className="font-bold text-lg leading-tight"
                    style={{ color: textColor }}
                  >
                    {book?.title || 'Book Title'}
                  </p>
                  {book?.author && (
                    <p
                      className="text-sm mt-1"
                      style={{ color: textColor + 'bb' }}
                    >
                      {book.author}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
