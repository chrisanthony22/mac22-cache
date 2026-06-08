import React, { useState, useEffect } from 'react';
import { db } from './firebase'; 
import { collection, addDoc, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';

function App() {
  // Application Data States
  const [cacheData, setCacheData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Interactive Form States
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('Git');
  const [notes, setNotes] = useState('');
  const [showForm, setShowForm] = useState(false);
  
  // Track editing state
  const [editingId, setEditingId] = useState(null);

  // Flashcard Exercise States
  const [exerciseMode, setExerciseMode] = useState(false);
  const [currentFlashcard, setCurrentFlashcard] = useState(null);
  const [revealCode, setRevealCode] = useState(false);

  // Mobile Burger Menu State
  const [menuOpen, setMenuOpen] = useState(false);

  // 1. LISTEN TO FIREBASE CLOUD IN REAL-TIME
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "snippets"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCacheData(data);
    });
    return () => unsubscribe(); 
  }, []);

  // 2. COMPUTED DYNAMIC FILTERS
  const categories = ['All', ...new Set(cacheData.map(item => item.category))];
  
  const filteredCache = cacheData.filter(item => {
    const matchesSearch = 
      (item.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
      (item.notes?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (item.code?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // FLASHCARD LOGIC ENGINE
  const handlePickRandomCard = (customPool = null) => {
    const pool = customPool || filteredCache;
    if (pool.length === 0) {
      setCurrentFlashcard(null);
      return;
    }
    const randomIndex = Math.floor(Math.random() * pool.length);
    setCurrentFlashcard(pool[randomIndex]);
    setRevealCode(false);
  };

  useEffect(() => {
    if (exerciseMode) {
      handlePickRandomCard();
    }
  }, [exerciseMode, selectedCategory, cacheData]);

  // 3. HANDLE SUBMIT (Handles both creating and editing updates)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!title || !code) return alert("SYS_ERR // Title and Code lines cannot be empty.");

    try {
      if (editingId) {
        const docRef = doc(db, "snippets", editingId);
        await updateDoc(docRef, {
          title,
          code,
          category,
          notes: notes || 'No extra descriptive context logged.'
        });
        setEditingId(null);
      } else {
        await addDoc(collection(db, "snippets"), {
          title,
          code,
          category,
          notes: notes || 'No extra descriptive context logged.'
        });
      }
      
      setTitle('');
      setCode('');
      setNotes('');
      setShowForm(false);
    } catch (error) {
      console.error("Operation failed: ", error);
    }
  };

  // 4. WIPE OUT DATA ELEMENT (DELETE)
  const handleDeleteSnippet = async (id) => {
    if (window.confirm("SYS_WARN // Execute delete sequence on this data block?")) {
      try {
        await deleteDoc(doc(db, "snippets", id));
        if (editingId === id) {
          setEditingId(null);
          setTitle('');
          setCode('');
          setNotes('');
          setShowForm(false);
        }
      } catch (error) {
        console.error("Delete system exception: ", error);
      }
    }
  };

  // 5. LOAD CARD DATA INTO FORM FOR EDITING
  const handleEditClick = (item) => {
    setEditingId(item.id);
    setTitle(item.title);
    setCode(item.code);
    setCategory(item.category);
    setNotes(item.notes === 'No extra descriptive context logged.' ? '' : item.notes);
    setExerciseMode(false); // Make sure regular edit screen handles form overlay
    setShowForm(true);
  };

  // 6. CANCEL EDITING MODE
  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setCode('');
    setNotes('');
    setShowForm(false);
  };

  // Helper handling mobile navigation option taps
  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    setMenuOpen(false); 
  };

  return (
    <div className="app-container">
      
      {/* INJECT DYNAMIC POP-UP AND OVERLAY STYLES DIRECTLY */}
      <style>{`
        /* Desktop Base Rules */
        .sidebar {
          width: 260px;
          padding: 20px;
          background: #000;
          border-right: 1px solid var(--neon-green-bright);
        }
        .burger-toggle {
          display: none;
        }
        .nav-content {
          display: block;
        }

        /* COOL POP-UP OVERLAY BACKDROP LAYER */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.85); /* Cool semi-transparent matrix black */
          backdrop-filter: blur(6px); /* Frosted glass effect */
          -webkit-backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 5000; /* Forces panel above everything else */
          padding: 20px;
          box-sizing: border-box;
        }

        /* POP-UP PANEL BOX */
        .modal-content-box {
          width: 100%;
          max-width: 600px;
          background: #040404;
          border: 1px solid var(--neon-green-bright);
          box-shadow: 0 0 25px rgba(0, 255, 65, 0.25);
          padding: 25px;
          position: relative;
          box-sizing: border-box;
        }

        /* Mobile Viewport Rules */
        @media (max-width: 768px) {
          .app-container {
            flex-direction: column;
          }
          .sidebar {
            width: 100%;
            border-right: none;
            border-bottom: 1px solid var(--neon-green-bright);
            box-sizing: border-box;
            padding: 15px;
            position: sticky;
            top: 0;
            z-index: 1000;
          }
          .sidebar-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .sidebar-header h2 {
            margin: 0;
            font-size: 18px;
          }
          .burger-toggle {
            display: block;
            background: transparent;
            border: 1px dashed var(--neon-green-bright);
            color: var(--neon-green-bright);
            padding: 6px 12px;
            font-family: var(--mono-font);
            cursor: pointer;
            font-size: 12px;
          }
          .nav-content {
            display: ${menuOpen ? 'block' : 'none'};
            margin-top: 15px;
            border-top: 1px dashed #222;
            padding-top: 15px;
          }
          .main-content {
            padding: 15px;
          }
        }
      `}</style>

      {/* TERMINAL NAVIGATION SIDEBAR / RESPONSIVE TOP BAR */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>📁 mac22_cache</h2>
          <button className="burger-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? '[ CLOSE_NAV ]' : '[ MENU ]'}
          </button>
        </div>
        
        <div className="nav-content">
          
          {/* 1. EXERCISE FLASHCARD MODE TOGGLE */}
          <button 
            onClick={() => { setExerciseMode(!exerciseMode); setShowForm(false); setMenuOpen(false); }} 
            style={{
              width: '100%', padding: '10px', marginTop: '15px', marginBottom: '10px',
              background: exerciseMode ? 'var(--neon-green-bright)' : 'transparent', 
              color: exerciseMode ? '#000' : 'var(--neon-green-bright)',
              border: '1px solid var(--neon-green-bright)', fontFamily: 'var(--mono-font)', 
              fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '8px'
            }}
          >
            {exerciseMode ? '🖥️ BROWSE_CACHE_LOGS' : '📡 EXERCISE_MODE'}
          </button>

          {/* 2. INJECT DATA CONTROL ACTION */}
          <button 
            onClick={editingId ? handleCancelEdit : () => { setShowForm(!showForm); setMenuOpen(false); }} 
            style={{
              width: '100%', padding: '10px', background: 'transparent',
              border: '1px solid var(--neon-green-bright)', color: 'var(--neon-green-bright)',
              fontFamily: 'var(--mono-font)', cursor: 'pointer', marginBottom: '20px',
              boxShadow: '0 0 5px rgba(0,255,65,0.3)'
            }}
          >
            {editingId ? '❌ CANCEL_EDIT' : showForm ? '❌ CLOSE_PANEL' : '➕ INJECT_DATA'}
          </button>

          {/* 3. SYSTEM CATEGORIES FILTERS */}
          <ul className="category-list" style={{ paddingLeft: 0, listStyleType: 'none' }}>
            {categories.map(cat => (
              <li 
                key={cat} 
                className={`category-item ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => handleCategorySelect(cat)}
                style={{ cursor: 'pointer', padding: '8px 0' }}
              >
                {cat === 'All' ? '📡 SYSTEM_ALL' : `🏷️ ${cat.toUpperCase()}`}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* CORE DISPLAY WINDOW */}
      <main className="main-content" style={{ flex: 1, padding: '20px' }}>
        
        {/* ========================================================= */}
        {/* INTERACTIVE FORM POP-UP MODAL (Handles Create & Edits)  */}
        {/* ========================================================= */}
        {showForm && (
          <div className="modal-overlay">
            <div className="modal-content-box">
              {/* Top-Right Absolute Close Command */}
              <button 
                type="button"
                onClick={editingId ? handleCancelEdit : () => setShowForm(false)}
                style={{
                  position: 'absolute', top: '15px', right: '15px', background: 'transparent',
                  border: 'none', color: '#ff3333', fontFamily: 'var(--mono-font)', 
                  cursor: 'pointer', fontSize: '12px'
                }}
              >
                [X_CLOSE]
              </button>

              <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#fff' }}>
                  {editingId ? '⚡ MODIFY CURRENT CACHE_LOG' : '⚡ ENTER NEW CACHE_LOG'}
                </h3>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="text" placeholder="Title (e.g. Git Branching)" value={title} onChange={e => setTitle(e.target.value)} className="search-input" style={{ marginBottom: 0, flex: 2 }} />
                  <select value={category} onChange={e => setCategory(e.target.value)} className="search-input" style={{ marginBottom: 0, flex: 1, paddingRight: '10px', background: '#000' }}>
                    <option value="Git">Git</option>
                    <option value="JavaScript">JavaScript</option>
                    <option value="React">React</option>
                    <option value="CSS">CSS</option>
                  </select>
                </div>

                <textarea placeholder="Paste text script or code fragment here..." value={code} onChange={e => setCode(e.target.value)} className="search-input" style={{ marginBottom: 0, height: '80px', resize: 'vertical' }} />
                
                <textarea 
                  placeholder="// Optional explanation logs, reminders... (Press Enter for new lines)" 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  className="search-input" 
                  style={{ marginBottom: 0, height: '90px', resize: 'vertical' }} 
                />
                
                <button type="submit" style={{
                  background: 'var(--glitch-blocks)', color: 'var(--neon-green-bright)',
                  border: '1px solid var(--neon-green-bright)', padding: '12px',
                  fontFamily: 'var(--mono-font)', fontWeight: 'bold', cursor: 'pointer', marginTop: '5px'
                }}>
                  {editingId ? 'UPDATE_CLOUD_LOG' : 'COMMIT_TO_CLOUD'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* DIAGNOSTIC EXERCISE MODE POP-UP MODAL                     */}
        {/* ========================================================= */}
        {exerciseMode && (
          <div className="modal-overlay">
            <div className="modal-content-box" style={{ maxWidth: '650px' }}>
              {/* Top-Right Absolute Close Command */}
              <button 
                onClick={() => setExerciseMode(false)}
                style={{
                  position: 'absolute', top: '15px', right: '15px', background: 'transparent',
                  border: 'none', color: '#ff3333', fontFamily: 'var(--mono-font)', 
                  cursor: 'pointer', fontSize: '12px'
                }}
              >
                [X_CLOSE]
              </button>

              <div className="exercise-container">
                <h2 style={{ color: 'var(--neon-green-bright)', marginBottom: '5px', fontSize: '20px' }}>⚡ ACTIVE DIAGNOSTIC EXERCISE</h2>
                <p style={{ opacity: 0.7, margin: '0 0 20px 0', fontSize: '13px' }}>
                  // Partition: <span style={{ color: '#fff' }}>{selectedCategory.toUpperCase()}</span>. Review description logic below.
                </p>

                {currentFlashcard ? (
                  <div>
                    <span className="card-category" style={{ fontSize: '11px' }}>{currentFlashcard.category}</span>
                    <h3 style={{ margin: '5px 0 15px 0', fontSize: '22px', color: '#fff' }}>{currentFlashcard.title}</h3>
                    
                    <div style={{ margin: '15px 0', padding: '15px', background: '#0c0c0c', borderLeft: '3px solid #666' }}>
                      <p className="card-notes" style={{ whiteSpace: 'pre-line', margin: 0, color: '#aaa', fontStyle: 'italic' }}>
                        // {currentFlashcard.notes}
                      </p>
                    </div>

                    {/* Masked Code Output */}
                    <div style={{ marginTop: '20px' }}>
                      {revealCode ? (
                        <div>
                          <span style={{ fontSize: '11px', color: 'var(--neon-green-bright)' }}>[TARGET_CODE_UNLOCKED]:</span>
                          <pre style={{ marginTop: '5px', border: '1px dashed var(--neon-green-bright)', background: '#000' }}>
                            <code>{currentFlashcard.code}</code>
                          </pre>
                        </div>
                      ) : (
                        <div style={{ 
                          background: '#111', height: '55px', display: 'flex', alignItems: 'center', 
                          justifyContent: 'center', border: '1px dashed #333', color: '#555', fontFamily: 'var(--mono-font)' 
                        }}>
                          [ CODE_BLOCK_ENCRYPTED ]
                        </div>
                      )}
                    </div>

                    {/* Pop-up Action Control Rows */}
                    <div style={{ display: 'flex', gap: '15px', marginTop: '25px', flexWrap: 'wrap' }}>
                      <button 
                        onClick={() => setRevealCode(!revealCode)}
                        className="search-input"
                        style={{ 
                          flex: '1 1 180px', marginBottom: 0, cursor: 'pointer', background: 'transparent',
                          border: '1px solid #fff', color: '#fff', fontWeight: 'bold', padding: '12px'
                        }}
                      >
                        {revealCode ? '🙈 MASK_CODE' : '🔓 REVEAL_TARGET_CODE'}
                      </button>
                      <button 
                        onClick={() => handlePickRandomCard()}
                        className="search-input"
                        style={{ 
                          flex: '1 1 180px', marginBottom: 0, cursor: 'pointer', background: 'transparent',
                          border: '1px solid var(--neon-green-bright)', color: 'var(--neon-green-bright)', fontWeight: 'bold', padding: '12px'
                        }}
                      >
                        🎲 NEXT_SYSTEM_TEST
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="error-message">
                    <p>⚠️ INDEX_VOID: There are no elements inside the "{selectedCategory}" partition to cycle.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SEARCH BAR */}
        <input 
          type="text" 
          className="search-input"
          placeholder="SYS_QUERY // Enter key parameters to snoop memory..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* RENDERING DYNAMIC DATABASE ENTRIES */}
        <div className="snippet-grid">
          {filteredCache.map(item => (
            <div key={item.id} className="snippet-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="card-category">{item.category}</span>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => handleEditClick(item)}
                    style={{
                      background: 'transparent', border: 'none', color: 'var(--neon-green-bright)',
                      fontFamily: 'var(--mono-font)', fontSize: '11px', cursor: 'pointer'
                    }}
                  >
                    [EDIT]
                  </button>
                  <button 
                    onClick={() => handleDeleteSnippet(item.id)}
                    style={{
                      background: 'transparent', border: 'none', color: '#ff3333',
                      fontFamily: 'var(--mono-font)', fontSize: '11px', cursor: 'pointer'
                    }}
                  >
                    [DELETE]
                  </button>
                </div>
              </div>
              <h3>{item.title}</h3>
              <pre><code>{item.code}</code></pre>
              
              <p className="card-notes" style={{ whiteSpace: 'pre-line' }}>// {item.notes}</p>
            </div>
          ))}
          
          {filteredCache.length === 0 && (
            <div className="error-message">
              <p>⚠️ CACHE_EMPTY: No logs matching criteria or cloud ledger is unpopulated.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;