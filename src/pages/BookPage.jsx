import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { countWords, getSpineColor } from '../lib/utils'

// ─── Drag handle icon ─────────────────────────────────────────────────────────

function GripIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
    </svg>
  )
}

// ─── Sortable chapter row ─────────────────────────────────────────────────────

function SortableChapterRow({ chapter, index, bookId, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chapter.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  const words = countWords(chapter.content)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 group hover:bg-gray-50 transition-colors ${isDragging ? 'shadow-md rounded-xl' : ''}`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
        aria-label="Drag to reorder"
      >
        <GripIcon />
      </button>

      {/* Position */}
      <span className="w-6 text-center text-xs font-mono text-gray-400 flex-shrink-0">
        {index + 1}
      </span>

      {/* Title */}
      <span className="flex-1 text-sm font-medium text-gray-800 truncate">
        {chapter.title || <span className="text-gray-400 italic">Untitled chapter</span>}
      </span>

      {/* Word count */}
      <span className="text-xs text-gray-400 flex-shrink-0 hidden sm:block">
        {words.toLocaleString()} w
      </span>

      {/* Edit link */}
      <Link
        to={`/books/${bookId}/chapters/${chapter.id}`}
        className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex-shrink-0 px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        Edit
      </Link>

      {/* Delete */}
      <button
        onClick={() => onDelete(chapter)}
        className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
        aria-label="Delete chapter"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

// ─── Book Page ────────────────────────────────────────────────────────────────

export default function BookPage() {
  const { bookId } = useParams()
  const navigate = useNavigate()
  const [book, setBook] = useState(null)
  const [chapters, setChapters] = useState([])
  const [loading, setLoading] = useState(true)
  const [chapterToDelete, setChapterToDelete] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const fetchBook = async () => {
    const { data, error } = await supabase
      .from('books')
      .select('id, title, author, style, cover')
      .eq('id', bookId)
      .single()
    if (error) { setError(error.message); setLoading(false); return }
    setBook(data)
  }

  const fetchChapters = async () => {
    const { data, error } = await supabase
      .from('chapters')
      .select('id, title, content, position')
      .eq('book_id', bookId)
      .order('position', { ascending: true })
    if (!error) setChapters(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchBook()
    fetchChapters()
  }, [bookId])

  const handleAddChapter = async () => {
    const position = chapters.length
    const { data, error } = await supabase
      .from('chapters')
      .insert({ book_id: bookId, title: 'New Chapter', content: '', position })
      .select()
      .single()
    if (!error && data) {
      navigate(`/books/${bookId}/chapters/${data.id}`)
    }
  }

  const handleDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return
    const oldIndex = chapters.findIndex((c) => c.id === active.id)
    const newIndex = chapters.findIndex((c) => c.id === over.id)
    const reordered = arrayMove(chapters, oldIndex, newIndex).map((c, i) => ({ ...c, position: i }))
    setChapters(reordered)
    setSaving(true)
    await Promise.all(
      reordered.map((c) =>
        supabase.from('chapters').update({ position: c.position }).eq('id', c.id)
      )
    )
    setSaving(false)
  }

  const handleDeleteChapter = async (chapter) => {
    const { error } = await supabase.from('chapters').delete().eq('id', chapter.id)
    if (!error) {
      setChapters((prev) => prev.filter((c) => c.id !== chapter.id))
      setChapterToDelete(null)
    }
  }

  const spineColor = book ? getSpineColor(book.id) : 'bg-indigo-500'
  const coverBg = book?.cover?.backgroundColor

  const navLinks = [
    { to: `/books/${bookId}/style`, label: 'Style' },
    { to: `/books/${bookId}/cover`, label: 'Cover Designer' },
    { to: `/books/${bookId}/infographics`, label: 'Infographics' },
    { to: `/books/${bookId}/export`, label: 'Export' },
  ]

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Back */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          All Books
        </Link>

        {loading && (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        )}

        {!loading && book && (
          <>
            {/* Book header */}
            <div className="flex items-start gap-4 mb-6">
              {/* Mini cover */}
              <div
                className={`w-12 h-16 rounded-md flex-shrink-0 shadow-sm ${!coverBg ? spineColor : ''}`}
                style={coverBg ? { backgroundColor: coverBg } : {}}
              />
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 leading-tight truncate">{book.title}</h1>
                {book.author && <p className="text-gray-500 text-sm mt-0.5">{book.author}</p>}
              </div>
            </div>

            {/* Nav buttons */}
            <div className="flex flex-wrap gap-2 mb-6">
              {navLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors bg-white"
                >
                  {l.label}
                </Link>
              ))}
            </div>

            {/* Chapters section */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Chapters
                  {saving && <span className="ml-2 text-gray-400 font-normal normal-case">Saving…</span>}
                </h2>
                <button
                  onClick={handleAddChapter}
                  className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Chapter
                </button>
              </div>

              {chapters.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <p className="text-gray-400 text-sm mb-3">No chapters yet.</p>
                  <button
                    onClick={handleAddChapter}
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                  >
                    Add your first chapter
                  </button>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={chapters.map((c) => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {chapters.map((chapter, index) => (
                      <SortableChapterRow
                        key={chapter.id}
                        chapter={chapter}
                        index={index}
                        bookId={bookId}
                        onDelete={(c) => setChapterToDelete(c)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </>
        )}

        {!loading && !book && (
          <div className="text-center py-16">
            <p className="text-gray-400">Book not found.</p>
            <Link to="/dashboard" className="text-indigo-600 text-sm mt-3 inline-block">
              Back to dashboard
            </Link>
          </div>
        )}
      </div>

      {/* Delete chapter confirm */}
      {chapterToDelete && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
          onClick={() => setChapterToDelete(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Delete chapter?</h2>
            <p className="text-sm text-gray-500 mb-5">
              <strong>"{chapterToDelete.title || 'Untitled chapter'}"</strong> will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setChapterToDelete(null)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteChapter(chapterToDelete)}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
