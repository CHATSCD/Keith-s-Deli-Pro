import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { countWords } from '../lib/utils'

const FORMATS = [
  {
    id: 'pdf',
    name: 'PDF',
    ext: '.pdf',
    icon: '📄',
    desc: 'Portable document. Best for printing and sharing.',
  },
  {
    id: 'epub',
    name: 'EPUB',
    ext: '.epub',
    icon: '📱',
    desc: 'E-book format. Compatible with Kindle, Kobo, and most readers.',
  },
  {
    id: 'docx',
    name: 'Word (DOCX)',
    ext: '.docx',
    icon: '📝',
    desc: 'Microsoft Word document. Easy to edit further.',
  },
  {
    id: 'txt',
    name: 'Plain Text',
    ext: '.txt',
    icon: '🔤',
    desc: 'Simple text file with no formatting.',
  },
]

export default function ExportPage() {
  const { bookId } = useParams()
  const [book, setBook] = useState(null)
  const [chapters, setChapters] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFormat, setSelectedFormat] = useState('pdf')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const load = async () => {
      const [{ data: bk }, { data: chs }] = await Promise.all([
        supabase.from('books').select('id, title, author, style').eq('id', bookId).single(),
        supabase
          .from('chapters')
          .select('id, title, content, position')
          .eq('book_id', bookId)
          .order('position', { ascending: true }),
      ])
      if (bk) setBook(bk)
      if (chs) setChapters(chs)
      setLoading(false)
    }
    load()
  }, [bookId])

  const totalWords = chapters.reduce((sum, c) => sum + countWords(c.content), 0)

  const handleExport = () => {
    setExporting(true)
    // Simulate export — real implementation would call a server function
    setTimeout(() => {
      setExporting(false)
      alert(`Export as ${selectedFormat.toUpperCase()} coming soon! Your manuscript has ${totalWords.toLocaleString()} words across ${chapters.length} chapters.`)
    }, 1200)
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          to={`/books/${bookId}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {book?.title || 'Book'}
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Export</h1>
          <p className="text-sm text-gray-500 mt-0.5">Download your manuscript in your preferred format.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="bg-indigo-50 rounded-2xl p-4 mb-6 flex gap-6">
              <div>
                <p className="text-2xl font-bold text-indigo-700">{totalWords.toLocaleString()}</p>
                <p className="text-xs text-indigo-500">total words</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-indigo-700">{chapters.length}</p>
                <p className="text-xs text-indigo-500">chapters</p>
              </div>
              <div>
                <p className="text-base font-semibold text-indigo-700 capitalize">{book?.style || 'classic'}</p>
                <p className="text-xs text-indigo-500">style</p>
              </div>
            </div>

            {/* Format selector */}
            <div className="space-y-3 mb-6">
              {FORMATS.map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setSelectedFormat(fmt.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                    selectedFormat === fmt.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl">{fmt.icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-900">{fmt.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{fmt.desc}</p>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                      selectedFormat === fmt.id ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            <button
              onClick={handleExport}
              disabled={exporting || chapters.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {exporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Preparing export…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export as {FORMATS.find((f) => f.id === selectedFormat)?.name}
                </>
              )}
            </button>
            {chapters.length === 0 && (
              <p className="text-xs text-gray-400 text-center mt-2">Add chapters before exporting.</p>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
