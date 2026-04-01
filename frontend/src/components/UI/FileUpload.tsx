import { useState, useRef, useCallback } from 'react'
import { Upload, X, FileText, CheckCircle2 } from 'lucide-react'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  accept?: string
  maxSizeMB?: number
  uploading?: boolean
}

export default function FileUpload({ onFileSelect, accept = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx', maxSizeMB = 25, uploading }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const validate = useCallback((f: File): boolean => {
    if (f.size > maxSizeMB * 1024 * 1024) {
      setError(`Fichier trop volumineux (max ${maxSizeMB} MB)`)
      return false
    }
    setError(null)
    return true
  }, [maxSizeMB])

  const handleFile = useCallback((f: File) => {
    if (validate(f)) {
      setFile(f)
      onFileSelect(f)
    }
  }, [validate, onFileSelect])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }, [handleFile])

  const clear = () => {
    setFile(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const formatSize = (bytes: number) => {
    if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / 1024).toFixed(0)} KB`
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept={accept} onChange={handleInput} style={{ display: 'none' }} />

      {!file ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragOver ? 'var(--color-primary)' : error ? 'var(--color-danger)' : 'var(--color-border)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-2xl)',
            textAlign: 'center',
            cursor: uploading ? 'wait' : 'pointer',
            background: dragOver ? 'var(--color-primary-soft)' : 'var(--color-surface)',
            transition: 'all 0.2s ease'
          }}
        >
          <Upload size={32} style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-md)' }} />
          <p style={{ fontWeight: 600, marginBottom: 4 }}>Glisser-déposer ou cliquer pour sélectionner</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>PDF, Word, Excel, PowerPoint — max {maxSizeMB} MB</p>
        </div>
      ) : (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
          padding: 'var(--space-md)', background: 'var(--color-surface)',
          borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)'
        }}>
          {uploading ? (
            <div className="spin" style={{ width: 20, height: 20, border: '2px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
          ) : (
            <CheckCircle2 size={20} style={{ color: 'var(--color-success)' }} />
          )}
          <FileText size={20} style={{ color: 'var(--color-text-muted)' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{formatSize(file.size)}</div>
          </div>
          {!uploading && (
            <button className="btn btn-sm btn-ghost" onClick={(e) => { e.stopPropagation(); clear() }}>
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {error && <p style={{ color: 'var(--color-danger)', fontSize: '0.8rem', marginTop: 'var(--space-sm)' }}>{error}</p>}
    </div>
  )
}
