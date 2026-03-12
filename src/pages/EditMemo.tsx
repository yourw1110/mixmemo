import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Calendar, Check } from 'lucide-react';
import { motion } from 'framer-motion';

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

  useEffect(() => {
    if (isEditing) {
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

    try {
      const url = '/api/memos';
      const method = isEditing ? 'PUT' : 'POST';
      const body = isEditing 
        ? { id, title, content } 
        : { id: crypto.randomUUID(), title, content, createdAt: Date.now() };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEditing 
          ? { id, title, content, updatedAt: Date.now() } 
          : body),
      });

      if (response.ok) {
        if (isEditing) {
          setUpdatedAt(Date.now());
          // Optional: Show a brief success message or visual indicator
        } else {
          navigate('/');
        }
      } else {
        alert('保存に失敗しました。');
      }
    } catch (error) {
      console.error(error);
      alert('エラーが発生しました。');
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
        <button 
          onClick={handleSave}
          style={{ 
            background: '#fff', 
            color: '#000', 
            border: 'none', 
            borderRadius: '999px',
            padding: '6px 16px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Check size={18} />
          {isEditing ? '更新' : '保存'}
        </button>
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
    </motion.div>
  );
}
