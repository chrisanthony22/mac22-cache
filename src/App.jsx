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

  // 2. HANDLE SUBMIT (Handles both creating and editing updates)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!title || !code) return alert("SYS_ERR // Title and Code lines cannot be empty.");

    try {
      if (editingId) {
        // We are updating an existing entry
        const docRef = doc(db, "snippets", editingId);
        await updateDoc(docRef, {
          title,
          code,
          category,
          notes: notes || 'No extra descriptive context logged.'
        });
        setEditingId(null); // Clear editing state
      } else {
        // We are creating a brand new entry
        await addDoc(collection(db, "snippets"), {
          title,
          code,
          category,
          notes: notes || 'No extra descriptive context logged.'
        });
      }
      
      // Reset inputs after data operation
      setTitle('');
      setCode('');
      setNotes('');
      setShowForm(false);
    } catch (error) {
      console.error("Operation failed: ", error);
    }
  };

  // 3. WIPE OUT DATA ELEMENT (DELETE)
  const handleDeleteSnippet = async (id) => {
    if (window.confirm("SYS_WARN // Execute delete sequence on this data block?")) {
      try {
        await deleteDoc(doc(db, "snippets", id));
        // If we were editing the card we just deleted, reset the form
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

  // 4. LOAD CARD DATA INTO FORM FOR EDITING
  const handleEditClick = (item) => {
    setEditingId(item.id);
    setTitle(item.title);
    setCode(item.code);
    setCategory(item.category);
    setNotes(item.notes === 'No extra descriptive context logged.' ? '' : item.notes);
    setShowForm(true); // Open the input panel
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll up to the form
  };

  // 5. CANCEL EDITING MODE
  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setCode('');
    setNotes('');
    setShowForm(false);
  };

  // 6. COMPUTED DYNAMIC FILTERS
  const categories = ['All', ...new Set(cacheData.map(item => item.category))];
  
  const filteredCache = cacheData.filter(item => {
    const matchesSearch = 
      (item.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
      (item.notes?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (item.code?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="app-container">
      {/* TERMINAL NAVIGATION SIDEBAR */}
      <aside className="sidebar">
        <h2>📁 mac22_cache</h2>
        
        {/* Toggle Form View Panel */}
        <button 
          onClick={editingId ? handleCancelEdit : () => setShowForm(!showForm)} 
          style={{
            width: '100%', padding: '10px', background: 'transparent',
            border: '1px solid var(--neon-green-bright)', color: 'var(--neon-green-bright)',
            fontFamily: 'var(--mono-font)', cursor: 'pointer', marginBottom: '20px',
            boxShadow: '0 0 5px rgba(0,255,65,0.3)'
          }}
        >
          {editingId ? '❌ CANCEL_EDIT' : showForm ? '❌ CLOSE_PANEL' : '➕ INJECT_DATA'}
        </button>

        <ul className="category-list">
          {categories.map(cat => (
            <li 
              key={cat} 
              className={`category-item ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === 'All' ? '📡 SYSTEM_ALL' : `🏷️ ${cat.toUpperCase()}`}
            </li>
          ))}
        </ul>
      </aside>

      {/* CORE DISPLAY WINDOW */}
      <main className="main-content">
        
        {/* DYNAMIC FORM TO INPUT / MODIFY DATA */}
        {showForm && (
          <form onSubmit={handleFormSubmit} style={{
            background: '#040404', border: '1px solid var(--neon-green-bright)',
            padding: '20px', marginBottom: '30px', display: 'flex', flexDirection: 'column', gap: '12px'
          }}>
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

            <textarea placeholder="Paste text script or code fragment here..." value={code} onChange={e => setCode(e.target.value)} className="search-input" style={{ marginBottom: 0, height: '70px', resize: 'vertical' }} />
            
            {/* MULTI-LINE EXPLANATION LOG AREA */}
            <textarea 
              placeholder="// Optional explanation logs, reminders, or bullet points... (Press Enter for new lines)" 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
              className="search-input" 
              style={{ marginBottom: 0, height: '80px', resize: 'vertical' }} 
            />
            
            <button type="submit" style={{
              background: 'var(--glitch-blocks)', color: 'var(--neon-green-bright)',
              border: '1px solid var(--neon-green-bright)', padding: '12px',
              fontFamily: 'var(--mono-font)', fontWeight: 'bold', cursor: 'pointer'
            }}>
              {editingId ? 'UPDATE_CLOUD_LOG' : 'COMMIT_TO_CLOUD'}
            </button>
          </form>
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
          
          {/* FALLBACK INFO PANEL */}
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