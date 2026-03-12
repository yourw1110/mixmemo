import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Merge, 
  Trash2, 
  GripVertical, 
  Calendar
} from 'lucide-react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import EditMemo from './pages/EditMemo';

// --- Types ---

interface Memo {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

// --- Utils ---

const formatDate = (timestamp: number) => {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
};

// --- Sortable Component ---

function SortableMemoCard({ 
  memo, 
  isSelected, 
  onToggleSelect,
  onClick
}: { 
  memo: Memo, 
  isSelected: boolean, 
  onToggleSelect: (id: string) => void,
  onClick: (memo: Memo) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: memo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 2 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`memo-card ${isSelected ? 'selected' : ''}`}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('.checkbox-container') || (e.target as HTMLElement).closest('.drag-handle')) {
          return;
        }
        onClick(memo);
      }}
    >
      <div className="checkbox-container">
        <input 
          type="checkbox" 
          checked={isSelected} 
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelect(memo.id);
          }}
        />
      </div>
      
      <div 
        className="drag-handle" 
        {...attributes} 
        {...listeners}
        style={{ cursor: 'grab', display: 'inline-block', marginBottom: '8px', touchAction: 'none' }}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={16} color="#666" />
      </div>

      <div className="memo-card-date" style={{ fontSize: '0.65rem', gap: '4px', flexWrap: 'wrap' }}>
        <span>作: {formatDate(memo.createdAt)}</span>
        <span style={{ color: '#888' }}>更: {formatDate(memo.updatedAt || memo.createdAt)}</span>
        <span className="memo-card-count">{memo.content.length} 文字</span>
      </div>
      <div className="memo-card-title">{memo.title}</div>
      <div className="memo-card-content">{memo.content}</div>
    </div>
  );
}

// --- Memo List View ---

function MemoList({ 
  memos, 
  setMemos, 
  selectedIds, 
  setSelectedIds, 
  setIsMergeModalOpen 
}: any) {
  const navigate = useNavigate();
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = memos.findIndex((i: Memo) => i.id === active.id);
      const newIndex = memos.findIndex((i: Memo) => i.id === over.id);
      const newMemos = arrayMove(memos, oldIndex, newIndex);
      
      setMemos(newMemos);

      try {
        await fetch('/api/memos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newMemos),
        });
      } catch (error) {
        console.error('Failed to sync order:', error);
      }
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev: string[]) => 
      prev.includes(id) 
        ? prev.filter(i => i !== id) 
        : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    if (confirm(`${selectedIds.length} 個のメモを削除しますか？`)) {
      try {
        const response = await fetch('/api/memos', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedIds }),
        });
        if (response.ok) {
          setMemos(memos.filter((m: any) => !selectedIds.includes(m.id)));
          setSelectedIds([]);
        }
      } catch (error) {
        console.error('Failed to delete memos:', error);
      }
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ 
        padding: '24px 40px', 
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>MEMO</h1>
        <button 
          onClick={() => navigate('/edit/new')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}
        >
          <Plus size={18} />
          新しいメモ
        </button>
      </header>

      <main style={{ flex: 1, position: 'relative' }}>
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="memo-grid">
            <SortableContext 
              items={memos.map((m: any) => m.id)}
              strategy={rectSortingStrategy}
            >
              {memos.map((memo: any) => (
                <SortableMemoCard 
                  key={memo.id} 
                  memo={memo} 
                  isSelected={selectedIds.includes(memo.id)}
                  onToggleSelect={toggleSelect}
                  onClick={(m) => navigate(`/edit/${m.id}`)}
                />
              ))}
            </SortableContext>
          </div>
        </DndContext>

        {memos.length === 0 && (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '60vh',
            color: '#444'
          }}>
            <p>メモがありません。右上のボタンから作成してください。</p>
          </div>
        )}
      </main>

      <AnimatePresence>
        {selectedIds.length >= 1 && (
          <motion.div 
            initial={{ y: 100, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: 100, opacity: 0, x: '-50%' }}
            style={{
              position: 'fixed',
              bottom: '40px',
              left: '50%',
              background: '#fff',
              color: '#000',
              padding: '12px 24px',
              borderRadius: '999px',
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
              zIndex: 1000,
              width: 'max-content'
            }}
          >
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{selectedIds.length} 個選択中</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {selectedIds.length >= 2 && (
                <button 
                  onClick={() => setIsMergeModalOpen(true)}
                  style={{ 
                    background: '#000', 
                    color: '#fff', 
                    border: 'none',
                    borderRadius: '999px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 16px',
                    fontSize: '0.85rem'
                  }}
                >
                  <Merge size={14} />
                  合体
                </button>
              )}
              <button 
                onClick={handleDeleteSelected}
                style={{ 
                  background: 'none', 
                  color: '#666', 
                  border: '1px solid #ddd',
                  borderRadius: '999px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  fontSize: '0.8rem'
                }}
              >
                <Trash2 size={12} />
                削除
              </button>
              <button 
                onClick={() => setSelectedIds([])}
                style={{ 
                  background: 'none', 
                  color: '#aaa', 
                  border: 'none',
                  fontSize: '0.8rem',
                  padding: '6px 8px'
                }}
              >
                解除
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Main App Component ---

export default function App() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [mergeTitle, setMergeTitle] = useState('');

  const fetchMemos = async () => {
    try {
      const response = await fetch('/api/memos');
      if (response.ok) {
        const data = await response.json();
        setMemos(data);
      }
    } catch (error) {
      console.error('Failed to fetch memos:', error);
    }
  };

  useEffect(() => {
    fetchMemos();
  }, []);

  const handleMerge = async () => {
    if (!mergeTitle.trim()) {
      alert('タイトルを入力してください。');
      return;
    }
    
    const selectedMemos = memos.filter(m => selectedIds.includes(m.id));
    const mergedContent = selectedMemos.map(m => `> ${m.title}\n${m.content}`).join('\n\n');
    
    const newMemoData = {
      id: crypto.randomUUID(),
      title: mergeTitle,
      content: mergedContent,
      createdAt: Date.now(),
    };

    try {
      const response = await fetch('/api/memos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMemoData),
      });
      if (response.ok) {
        await fetchMemos();
        setSelectedIds([]);
        setMergeTitle('');
        setIsMergeModalOpen(false);
      }
    } catch (error) {
      console.error('Failed to merge memos:', error);
    }
  };

  return (
    <>
      <Routes>
        <Route 
          path="/" 
          element={
            <MemoList 
              memos={memos} 
              setMemos={setMemos} 
              selectedIds={selectedIds} 
              setSelectedIds={setSelectedIds} 
              setIsMergeModalOpen={setIsMergeModalOpen}
            />
          } 
        />
        <Route path="/edit/:id" element={<EditMemo />} />
      </Routes>

      {/* Merge Modal - kept as modal as it's a simple multi-select action */}
      <AnimatePresence>
        {isMergeModalOpen && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="modal-content"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <h2 style={{ margin: '0 0 20px 0', fontSize: '1.2rem' }}>メモを合体</h2>
              <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '16px' }}>
                {selectedIds.length} 個のメモを合体して新しいメモを作成します。
              </p>
              <input 
                type="text" 
                placeholder="新しいメモのタイトル" 
                value={mergeTitle}
                onChange={(e) => setMergeTitle(e.target.value)}
                autoFocus
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button onClick={() => setIsMergeModalOpen(false)} style={{ border: 'none' }}>キャンセル</button>
                <button onClick={handleMerge} style={{ background: '#fff', color: '#000', fontWeight: 600 }}>合体して保存</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

