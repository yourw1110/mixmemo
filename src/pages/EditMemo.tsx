import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Calendar, Check, Undo, Redo, Search, Replace } from 'lucide-react';
import { motion } from 'framer-motion';
import Toast from '../components/Toast';

interface Memo {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export default function EditMemo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = id !== 'new';
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [createdAt, setCreatedAt] = useState(Date.now());
  const [updatedAt, setUpdatedAt] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ isVisible: false, message: '' });

  // Search and Replace state
  const [searchText, setSearchText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Sync scroll
  const handleScroll = () => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  useEffect(() => {
    if (isEditing) {
      setIsLoading(true);
      fetch(`/api/memos`)
        .then(res => res.json())
        .then((memos: Memo[]) => {
          const memo = memos.find(m => m.id === id);
          if (memo) {
            setTitle(memo.title);
            setContent(memo.content);
            setCreatedAt(memo.createdAt);
            setUpdatedAt(memo.updatedAt || memo.createdAt);
          }
          setIsLoading(false);
        })
        .catch(err => {
          console.error(err);
          setIsLoading(false);
        });
    }
  }, [id, isEditing]);

  const handleSave = async () => {
    if (!title.trim()) {
      alert('タイトルを入力してください。');
      return;
    }

    if (isSaving) return;
    setIsSaving(true);

    try {
      const url = '/api/memos';
      const method = isEditing ? 'PUT' : 'POST';
      const newId = isEditing ? id : crypto.randomUUID();
      const now = Date.now();
      
      const body = isEditing 
        ? { id, title, content, updatedAt: now } 
        : { id: newId, title, content, createdAt: now, updatedAt: now };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        if (isEditing) {
          setUpdatedAt(now);
          setToast({ isVisible: true, message: '更新しました' });
        } else {
          setToast({ isVisible: true, message: '保存しました' });
          // Navigate to the edit page for the new memo
          setTimeout(() => {
            navigate(`/edit/${newId}`, { replace: true });
          }, 100);
        }
      } else {
        alert('保存に失敗しました。');
      }
    } catch (error) {
      console.error(error);
      alert('エラーが発生しました。');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReplaceAll = () => {
    if (!searchText) return;
    
    // Create a regex to match all occurrences (global, case-insensitive if desired, but here we do plain string replacement globally)
    // Escaping regex special characters in searchText to ensure exact string match
    const escapeRegExp = (string: string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
    }
    
    const regex = new RegExp(escapeRegExp(searchText), 'g');
    const newContent = content.replace(regex, replaceText);
    
    setContent(newContent);
    setToast({ isVisible: true, message: 'すべて置換しました' });
  };

  if (isLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
        読み込み中...
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp));
  };
  
  const renderHighlightedContent = () => {
    if (!searchText) {
      return content;
    }

    const escapeRegExp = (string: string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
    }
    
    const regex = new RegExp(`(${escapeRegExp(searchText)})`, 'gi');
    const parts = content.split(regex);

    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i} style={{ backgroundColor: '#fff', color: '#000', borderRadius: '2px', padding: '0 2px' }}>
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        background: '#0a0a0a',
        color: '#fff'
      }}
    >
      <header style={{ 
        padding: '16px 20px', 
        borderBottom: '1px solid #222',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(10px)'
      }}>
        <button 
          onClick={() => navigate('/')}
          style={{ 
            background: 'none', 
            border: 'none', 
            padding: '8px', 
            display: 'flex', 
            alignItems: 'center',
            color: '#666'
          }}
        >
          <X size={24} />
        </button>
        <h1 style={{ fontSize: '1.1rem', margin: 0 }}>
          {isEditing ? 'メモを編集' : '新規メモ'}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onMouseDown={(e) => { 
              e.preventDefault(); 
              document.execCommand('undo'); 
              setTimeout(() => {
                const el = document.activeElement as HTMLTextAreaElement | HTMLInputElement;
                if (el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT')) {
                  if (el.tagName === 'TEXTAREA') setContent(el.value);
                  if (el.tagName === 'INPUT') setTitle(el.value);
                }
              }, 10);
            }}
            style={{ 
              background: '#222', 
              border: '1px solid #444', 
              color: '#fff', 
              fontSize: '1.2rem', 
              cursor: 'pointer',
              padding: '4px 10px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="元に戻す"
          >
            <Undo size={18} />
          </button>
          <button
            onMouseDown={(e) => { 
              e.preventDefault(); 
              document.execCommand('redo'); 
              setTimeout(() => {
                const el = document.activeElement as HTMLTextAreaElement | HTMLInputElement;
                if (el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT')) {
                  if (el.tagName === 'TEXTAREA') setContent(el.value);
                  if (el.tagName === 'INPUT') setTitle(el.value);
                }
              }, 10);
            }}
            style={{ 
              background: '#222', 
              border: '1px solid #444', 
              color: '#fff', 
              fontSize: '1.2rem', 
              cursor: 'pointer',
              padding: '4px 10px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '8px'
            }}
            title="やり直し"
          >
            <Redo size={18} />
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            style={{ 
              background: isSaving ? '#666' : '#fff', 
              color: '#000', 
              border: 'none', 
              borderRadius: '999px',
              padding: '6px 16px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: isSaving ? 'not-allowed' : 'pointer'
            }}
          >
            <Check size={18} />
            {isSaving ? '保存中...' : (isEditing ? '更新' : '保存')}
          </button>
        </div>
      </header>

      <main style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {isEditing && (
          <div style={{ fontSize: '0.8rem', color: '#666', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} />
              作成日時: {formatDate(createdAt)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} />
              最終更新: {formatDate(updatedAt)}
            </div>
          </div>
        )}
        
        <input 
          type="text" 
          placeholder="タイトル（必須）" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ 
            background: 'none', 
            border: 'none', 
            fontSize: '1.8rem', 
            fontWeight: 700,
            width: '100%',
            padding: 0,
            outline: 'none',
            color: '#fff'
          }}
          autoFocus={!isEditing}
        />

        {/* Search & Replace Tools */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          background: '#111', 
          padding: '12px', 
          borderRadius: '8px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: '200px', background: '#222', borderRadius: '6px', padding: '0 8px' }}>
            <Search size={16} color="#888" />
            <input 
              type="text" 
              placeholder="検索" 
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ background: 'none', border: 'none', padding: '8px', flex: 1, marginBottom: 0, outline: 'none', color: '#fff' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: '200px', background: '#222', borderRadius: '6px', padding: '0 8px' }}>
            <Replace size={16} color="#888" />
            <input 
              type="text" 
              placeholder="置換" 
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              style={{ background: 'none', border: 'none', padding: '8px', flex: 1, marginBottom: 0, outline: 'none', color: '#fff' }}
            />
          </div>
          <button 
            onClick={handleReplaceAll}
            disabled={!searchText}
            style={{ 
              background: searchText ? '#fff' : '#333', 
              color: searchText ? '#000' : '#888', 
              fontWeight: 600, 
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: searchText ? 'pointer' : 'not-allowed',
              whiteSpace: 'nowrap'
            }}
          >
            すべて置換
          </button>
        </div>
        
        <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Backdrop for highlights */}
          <div 
            ref={backdropRef}
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              padding: 0,
              fontSize: '1.1rem',
              lineHeight: 1.6,
              fontFamily: 'inherit',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              color: '#aaa',
              overflow: 'hidden',
              zIndex: 1,
              pointerEvents: 'none',
              // Add a transparent border to perfectly match texarea's padding/box-sizing if any
              border: '1px solid transparent'
            }}
          >
            {renderHighlightedContent()}
            {/* Adding extra space to match textarea scrolling behavior at the end */}
            <br/><br/><br/>
          </div>

          <textarea 
            ref={textareaRef}
            placeholder="内容を入力" 
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              handleScroll();
            }}
            onScroll={handleScroll}
            style={{ 
              position: 'relative',
              zIndex: 2,
              background: 'transparent', 
              border: 'none', 
              fontSize: '1.1rem', 
              width: '100%',
              flex: 1,
              padding: 0,
              margin: 0,
              outline: 'none',
              resize: 'none',
              // Use transparent text color when searching to see highlights, otherwise use normal color
              color: searchText ? 'transparent' : '#aaa',
              caretColor: '#fff',
              lineHeight: 1.6,
              fontFamily: 'inherit'
            }}
          />
        </div>
      </main>

      <Toast 
        message={toast.message} 
        isVisible={toast.isVisible} 
        onClose={() => setToast({ ...toast, isVisible: false })} 
      />
    </motion.div>
  );
}
