import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Calendar, Check } from 'lucide-react';
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
            ↩
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
            ↪
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
        
        <textarea 
          placeholder="内容を入力" 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ 
            background: 'none', 
            border: 'none', 
            fontSize: '1.1rem', 
            width: '100%',
            flex: 1,
            padding: 0,
            outline: 'none',
            resize: 'none',
            color: '#aaa',
            lineHeight: 1.6
          }}
        />
      </main>

      <Toast 
        message={toast.message} 
        isVisible={toast.isVisible} 
        onClose={() => setToast({ ...toast, isVisible: false })} 
      />
    </motion.div>
  );
}
