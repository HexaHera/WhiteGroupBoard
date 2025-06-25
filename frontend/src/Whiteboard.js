import React, { useEffect, useRef, useState } from 'react';
import { db, auth } from './firebase';
import { doc, onSnapshot, updateDoc, arrayUnion, collection, setDoc } from 'firebase/firestore';
import styled, { useTheme } from 'styled-components';
import { FiEdit2, FiSquare, FiCircle, FiType, FiRotateCcw, FiRotateCw, FiTrash2, FiDownload, FiImage, FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import { MdOutlineAutoFixOff } from 'react-icons/md'; // for eraser
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const API_BASE = 'http://localhost:5000';

// Styled toolbar
const LeftSidebar = styled(motion.div)`
  position: relative;
  height: 400px;
  min-width: 60px;
  max-width: 70px;
  width: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: ${({ theme }) => theme.colors.toolbar};
  box-shadow: ${({ theme }) => theme.colors.shadow};
  border-radius: 20px;
  padding: 12px 0;
  gap: 16px;
  z-index: 20;
  backdrop-filter: blur(12px);
  margin-left: 8px;
  margin-right: 18px;
`;

const ToolBtn = styled.button`
  background: ${({ active, theme }) => active ? theme.colors.accent : 'transparent'};
  color: ${({ active, theme }) => active ? theme.colors.text : theme.colors.text + '99'};
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 20px;
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
  box-shadow: ${({ active }) => active ? '0 2px 8px rgba(0,0,0,0.10)' : 'none'};
  &:hover {
    background: ${({ theme }) => theme.colors.accent + 'cc'};
    color: ${({ theme }) => theme.colors.text};
  }
`;

const Picker = styled.input`
  margin: 0 8px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  padding: 2px 4px;
  background: ${({ theme }) => theme.colors.card};
`;

const CanvasWrapper = styled.div`
  position: relative;
  margin: 0 auto;
  width: 700px;
  height: 400px;
  box-shadow: ${({ theme }) => theme.colors.shadow};
  border-radius: ${({ theme }) => theme.borderRadius};
  background: ${({ bg }) => bg || '#FDF6E3'};
  overflow: hidden;
`;

const WhiteboardLayout = styled.div`
  display: flex;
  align-items: flex-start;
  width: 100%;
  min-height: 400px;
  margin-top: 32px;
  overflow: hidden;
`;

const FullscreenOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  width: 100vw;
  height: 100vh;
  background: ${({ theme }) => theme.colors.background};
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const FullscreenCanvasWrapper = styled(CanvasWrapper)`
  width: 80vw;
  height: 80vh;
  min-width: 900px;
  min-height: 600px;
`;

const MaximizeBtn = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 100;
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.text};
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.10);
  transition: background 0.2s;
  &:hover { background: #ffe066; }
`;

function Whiteboard({ user, roomId }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [actions, setActions] = useState([]);
  const [undoStack, setUndoStack] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(2);
  const [eraser, setEraser] = useState(false);
  const [tool, setTool] = useState('pen'); // 'pen', 'rect', 'circle', 'text'
  const [startPoint, setStartPoint] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [textPos, setTextPos] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [lastPoint, setLastPoint] = useState(null);
  const [currentStroke, setCurrentStroke] = useState([]);
  const [canvasBgColor, setCanvasBgColor] = useState('#FDF6E3');
  const [cursorPos, setCursorPos] = useState(null);
  const [cursors, setCursors] = useState({});
  const [previewShape, setPreviewShape] = useState(null);

  // Load existing drawing actions
  useEffect(() => {
    if (!roomId) return;
    const unsub = onSnapshot(doc(db, 'rooms', roomId), (docSnap) => {
      const data = docSnap.data();
      setActions(data?.whiteboardData || []);
      setLoading(false);
    });
    return () => unsub();
  }, [roomId]);

  // Redraw canvas when actions change
  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    actions.forEach(action => {
      if (action.type === 'draw') {
        ctx.strokeStyle = action.color || 'black';
        ctx.lineWidth = action.size || 2;
        ctx.beginPath();
        ctx.moveTo(action.from.x, action.from.y);
        ctx.lineTo(action.to.x, action.to.y);
        ctx.stroke();
      } else if (action.type === 'stroke') {
        ctx.strokeStyle = action.color || 'black';
        ctx.lineWidth = action.size || 2;
        ctx.beginPath();
        action.points.forEach((pt, i) => {
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();
      } else if (action.type === 'rect') {
        ctx.strokeStyle = action.color || 'black';
        ctx.lineWidth = action.size || 2;
        const { x, y, w, h } = action;
        ctx.strokeRect(x, y, w, h);
      } else if (action.type === 'circle') {
        ctx.strokeStyle = action.color || 'black';
        ctx.lineWidth = action.size || 2;
        const { x, y, r } = action;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (action.type === 'text') {
        ctx.fillStyle = action.color || 'black';
        ctx.font = `${action.size * 6 + 12}px Arial`;
        ctx.fillText(action.text, action.x, action.y);
      }
    });
  }, [actions]);

  // Helper to get name before @
  const getName = (user) => {
    if (!user?.email) return 'User';
    return user.email.split('@')[0];
  };

  // Update cursor/tool in Firestore
  const updateCursor = async (x, y, tool) => {
    if (!user || !roomId) return;
    await setDoc(
      doc(db, 'rooms', roomId, 'cursors', user.uid),
      {
        x, y, tool,
        name: getName(user),
        updated: Date.now(),
      },
      { merge: true }
    );
  };

  // Listen for all cursors in this room
  useEffect(() => {
    if (!roomId) return;
    const q = collection(db, 'rooms', roomId, 'cursors');
    const unsub = onSnapshot(q, (snapshot) => {
      const all = {};
      snapshot.forEach(doc => {
        all[doc.id] = doc.data();
      });
      setCursors(all);
    });
    return () => unsub();
  }, [roomId]);

  // Drawing logic for pen, rect, circle
  const handlePointerDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (tool === 'pen') {
      setDrawing(true);
      setUndoStack([]);
      setLastPoint({ x, y });
      setCurrentStroke([{ x, y }]);
      // Start a new path on the canvas
      const ctx = canvasRef.current.getContext('2d');
      ctx.strokeStyle = eraser ? canvasBgColor : color;
      ctx.lineWidth = eraser ? 16 : size;
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else if (tool === 'rect' || tool === 'circle') {
      setStartPoint({ x, y });
    }
  };

  const handlePointerMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (tool === 'pen' && drawing) {
      if (!lastPoint) return;
      // Draw directly to canvas
      const ctx = canvasRef.current.getContext('2d');
      ctx.strokeStyle = eraser ? canvasBgColor : color;
      ctx.lineWidth = eraser ? 16 : size;
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(x, y);
      ctx.stroke();
      setLastPoint({ x, y });
      setCurrentStroke(stroke => [...stroke, { x, y }]);
    } else if ((tool === 'rect' || tool === 'circle') && startPoint) {
      setPreviewShape({ x1: startPoint.x, y1: startPoint.y, x2: x, y2: y, tool });
    }
  };

  const handlePointerUp = () => {
    setDrawing(false);
    setLastPoint(null);
    if (tool === 'pen' && currentStroke.length > 1) {
      // Save the stroke as a single action
      const action = {
        type: 'stroke',
        points: currentStroke,
        color: eraser ? canvasBgColor : color,
        size: eraser ? 16 : size,
      };
      setActions([...actions, action]);
      saveAction(action);
    } else if ((tool === 'rect' || tool === 'circle') && startPoint && previewShape) {
      const { x1, y1, x2, y2 } = previewShape;
      if (tool === 'rect') {
        const action = {
          type: 'rect',
          x: Math.min(x1, x2),
          y: Math.min(y1, y2),
          w: Math.abs(x2 - x1),
          h: Math.abs(y2 - y1),
          color,
          size,
        };
        setActions([...actions, action]);
        saveAction(action);
      } else if (tool === 'circle') {
        const r = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)) / 2;
        const cx = (x1 + x2) / 2;
        const cy = (y1 + y2) / 2;
        const action = {
          type: 'circle',
          x: cx,
          y: cy,
          r,
          color,
          size,
        };
        setActions([...actions, action]);
        saveAction(action);
      }
      setStartPoint(null);
      setPreviewShape(null);
    }
    setCurrentStroke([]);
  };

  // Undo
  const handleUndo = () => {
    if (actions.length === 0) return;
    setUndoStack([actions[actions.length - 1], ...undoStack]);
    setActions(actions.slice(0, -1));
  };

  // Redo
  const handleRedo = () => {
    if (undoStack.length === 0) return;
    setActions([...actions, undoStack[0]]);
    setUndoStack(undoStack.slice(1));
  };

  // Clear
  const handleClear = async () => {
    setActions([]);
    setUndoStack([]);
    try {
      const token = await user.getIdToken();
      await fetch(`${API_BASE}/rooms/${roomId}/clear`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      setError('Failed to clear whiteboard');
    }
  };

  // Handle text tool
  const handleCanvasClick = (e) => {
    if (tool !== 'text') return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setTextPos({ x, y });
    setTextInput('');
  };

  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!textInput.trim() || !textPos) return;
    const action = {
      type: 'text',
      text: textInput,
      x: textPos.x,
      y: textPos.y,
      color: color,
      size: size,
    };
    setActions([...actions, action]);
    setTextInput('');
    setTextPos(null);
    // Save to Firestore (real-time)
    saveAction(action);
  };

  // Save to Firestore (real-time)
  const saveAction = async (action) => {
    try {
      await updateDoc(doc(db, 'rooms', roomId), {
        whiteboardData: arrayUnion(action),
      });
    } catch (err) {
      setError('Failed to sync drawing');
    }
  };

  // Export as image
  const handleExportImage = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'whiteboard.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  // Export as PDF
  const handleExportPDF = async () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save('whiteboard.pdf');
  };

  // On pointer move, update cursor in Firestore
  const handleMouseMove = (e) => {
    if (!eraser) {
      setCursorPos(null);
    }
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (eraser) setCursorPos({ x, y });
    updateCursor(x, y, eraser ? 'Eraser' : tool.charAt(0).toUpperCase() + tool.slice(1));
  };

  // On tool change, update Firestore
  useEffect(() => {
    if (!canvasRef.current) return;
    // Use center of canvas as default
    const x = canvasRef.current.width / 2;
    const y = canvasRef.current.height / 2;
    updateCursor(x, y, eraser ? 'Eraser' : tool.charAt(0).toUpperCase() + tool.slice(1));
    // eslint-disable-next-line
  }, [tool, eraser]);

  const handleMouseLeave = () => setCursorPos(null);

  if (loading) return <div>Loading whiteboard...</div>;
  return (
    fullscreen ? (
      <FullscreenOverlay>
        <WhiteboardLayout style={{ width: '100vw', height: '100vh', margin: 0 }}>
          <LeftSidebar
            initial={{ x: -80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{ height: '80vh', minWidth: 60, maxWidth: 70 }}
          >
            <ToolBtn active={tool === 'pen'} onClick={() => { setTool('pen'); setEraser(false); }} title="Pen">
              <FiEdit2 size={28} />
            </ToolBtn>
            <ToolBtn active={tool === 'rect'} onClick={() => { setTool('rect'); setEraser(false); }} title="Rectangle">
              <FiSquare size={28} />
            </ToolBtn>
            <ToolBtn active={tool === 'circle'} onClick={() => { setTool('circle'); setEraser(false); }} title="Circle">
              <FiCircle size={28} />
            </ToolBtn>
            <ToolBtn active={tool === 'text'} onClick={() => { setTool('text'); setEraser(false); }} title="Text">
              <FiType size={28} />
            </ToolBtn>
            <ToolBtn active={eraser} onClick={() => setEraser(e => !e)} title="Eraser">
              <MdOutlineAutoFixOff size={28} />
            </ToolBtn>
            <ToolBtn onClick={handleUndo} title="Undo">
              <FiRotateCcw size={28} />
            </ToolBtn>
            <ToolBtn onClick={handleRedo} title="Redo">
              <FiRotateCw size={28} />
            </ToolBtn>
            <ToolBtn onClick={handleClear} title="Clear">
              <FiTrash2 size={28} />
            </ToolBtn>
            <ToolBtn onClick={handleExportImage} title="Export as Image">
              <FiImage size={28} />
            </ToolBtn>
            <ToolBtn onClick={handleExportPDF} title="Export as PDF">
              <FiDownload size={28} />
            </ToolBtn>
            <div style={{ marginTop: 24, textAlign: 'center' }} title="Pen Color">
              <label style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>Pen Color</label>
              <Picker
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                disabled={eraser}
                title="Pen Color"
              />
            </div>
            <div style={{ marginTop: 12, textAlign: 'center' }} title="Canvas Color">
              <label style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>Canvas Color</label>
              <Picker
                type="color"
                value={canvasBgColor}
                onChange={e => setCanvasBgColor(e.target.value)}
                title="Canvas Background Color"
              />
            </div>
            <div style={{ marginTop: 12, textAlign: 'center' }} title="Pen Size">
              <label style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>Pen Size</label>
              <Picker
                type="range"
                min={1}
                max={10}
                value={size}
                onChange={e => setSize(Number(e.target.value))}
                disabled={eraser}
                title="Pen Size"
              />
            </div>
          </LeftSidebar>
          <FullscreenCanvasWrapper bg={canvasBgColor}>
            <MaximizeBtn onClick={() => setFullscreen(false)} title="Minimize">
              <FiMinimize2 size={22} />
            </MaximizeBtn>
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <canvas
                ref={canvasRef}
                width={window.innerWidth * 0.7}
                height={window.innerHeight * 0.7}
                style={{ border: '1px solid #ccc', background: 'transparent', cursor: eraser ? 'none' : 'crosshair' }}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerLeave={e => { handlePointerUp(); handleMouseLeave(); }}
                onPointerMove={e => { handlePointerMove(e); handleMouseMove(e); }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onClick={handleCanvasClick}
              />
              {eraser && cursorPos && (
                <div
                  style={{
                    position: 'absolute',
                    left: cursorPos.x - (8 * size),
                    top: cursorPos.y - (8 * size),
                    width: 16 * size,
                    height: 16 * size,
                    border: '2px dotted #888',
                    borderRadius: '50%',
                    pointerEvents: 'none',
                    zIndex: 1000,
                  }}
                />
              )}
              {/* Render other users' cursors */}
              {Object.entries(cursors).map(([uid, c]) => (
                uid !== user.uid && c.x != null && c.y != null ? (
                  <div key={uid} style={{
                    position: 'absolute',
                    left: c.x - 12,
                    top: c.y - 36,
                    pointerEvents: 'none',
                    zIndex: 1001,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}>
                    <div style={{
                      background: '#222',
                      color: '#fff',
                      fontSize: 13,
                      borderRadius: 8,
                      padding: '2px 8px',
                      marginBottom: 2,
                      opacity: 0.92,
                      fontWeight: 500,
                    }}>{c.name}: {c.tool}</div>
                    <div style={{
                      width: 24,
                      height: 24,
                      border: '2px solid #222',
                      borderRadius: '50%',
                      background: '#fff',
                      opacity: 0.8,
                    }} />
                  </div>
                ) : null
              ))}
              {previewShape && (
                <svg
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    pointerEvents: 'none',
                    width: window.innerWidth * 0.7,
                    height: window.innerHeight * 0.7,
                    zIndex: 10,
                  }}
                  width={window.innerWidth * 0.7}
                  height={window.innerHeight * 0.7}
                >
                  {previewShape.tool === 'rect' ? (
                    <rect
                      x={Math.min(previewShape.x1, previewShape.x2)}
                      y={Math.min(previewShape.y1, previewShape.y2)}
                      width={Math.abs(previewShape.x2 - previewShape.x1)}
                      height={Math.abs(previewShape.y2 - previewShape.y1)}
                      fill="none"
                      stroke={color}
                      strokeWidth={size}
                    />
                  ) : previewShape.tool === 'circle' ? (
                    <ellipse
                      cx={(previewShape.x1 + previewShape.x2) / 2}
                      cy={(previewShape.y1 + previewShape.y2) / 2}
                      rx={Math.abs(previewShape.x2 - previewShape.x1) / 2}
                      ry={Math.abs(previewShape.y2 - previewShape.y1) / 2}
                      fill="none"
                      stroke={color}
                      strokeWidth={size}
                    />
                  ) : null}
                </svg>
              )}
            </div>
          </FullscreenCanvasWrapper>
          {textPos && tool === 'text' && (
            <form onSubmit={handleTextSubmit} style={{ position: 'absolute', left: textPos.x + 40, top: textPos.y + 120, zIndex: 10 }}>
              <input
                autoFocus
                type="text"
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                style={{ fontSize: size * 6 + 12, color, border: '1px solid #888', background: '#fff' }}
              />
              <button type="submit">Add</button>
            </form>
          )}
          {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
        </WhiteboardLayout>
      </FullscreenOverlay>
    ) : (
      <WhiteboardLayout>
        <LeftSidebar
          initial={{ x: -80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <ToolBtn active={tool === 'pen'} onClick={() => { setTool('pen'); setEraser(false); }} title="Pen">
            <FiEdit2 size={28} />
          </ToolBtn>
          <ToolBtn active={tool === 'rect'} onClick={() => { setTool('rect'); setEraser(false); }} title="Rectangle">
            <FiSquare size={28} />
          </ToolBtn>
          <ToolBtn active={tool === 'circle'} onClick={() => { setTool('circle'); setEraser(false); }} title="Circle">
            <FiCircle size={28} />
          </ToolBtn>
          <ToolBtn active={tool === 'text'} onClick={() => { setTool('text'); setEraser(false); }} title="Text">
            <FiType size={28} />
          </ToolBtn>
          <ToolBtn active={eraser} onClick={() => setEraser(e => !e)} title="Eraser">
            <MdOutlineAutoFixOff size={28} />
          </ToolBtn>
          <ToolBtn onClick={handleUndo} title="Undo">
            <FiRotateCcw size={28} />
          </ToolBtn>
          <ToolBtn onClick={handleRedo} title="Redo">
            <FiRotateCw size={28} />
          </ToolBtn>
          <ToolBtn onClick={handleClear} title="Clear">
            <FiTrash2 size={28} />
          </ToolBtn>
          <ToolBtn onClick={handleExportImage} title="Export as Image">
            <FiImage size={28} />
          </ToolBtn>
          <ToolBtn onClick={handleExportPDF} title="Export as PDF">
            <FiDownload size={28} />
          </ToolBtn>
          <div style={{ marginTop: 24, textAlign: 'center' }} title="Pen Color">
            <label style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>Pen Color</label>
            <Picker
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              disabled={eraser}
              title="Pen Color"
            />
          </div>
          <div style={{ marginTop: 12, textAlign: 'center' }} title="Canvas Color">
            <label style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>Canvas Color</label>
            <Picker
              type="color"
              value={canvasBgColor}
              onChange={e => setCanvasBgColor(e.target.value)}
              title="Canvas Background Color"
            />
          </div>
          <div style={{ marginTop: 12, textAlign: 'center' }} title="Pen Size">
            <label style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>Pen Size</label>
            <Picker
              type="range"
              min={1}
              max={10}
              value={size}
              onChange={e => setSize(Number(e.target.value))}
              disabled={eraser}
              title="Pen Size"
            />
          </div>
        </LeftSidebar>
        <CanvasWrapper bg={canvasBgColor}>
          <MaximizeBtn onClick={() => setFullscreen(true)} title="Maximize">
            <FiMaximize2 size={22} />
          </MaximizeBtn>
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <canvas
              ref={canvasRef}
              width={700}
              height={400}
              style={{ cursor: eraser ? 'cell' : tool === 'pen' ? 'crosshair' : tool === 'rect' || tool === 'circle' ? 'crosshair' : 'default', background: canvasBgColor }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onClick={handleCanvasClick}
            />
            {eraser && cursorPos && (
              <div
                style={{
                  position: 'absolute',
                  left: cursorPos.x - (8 * size),
                  top: cursorPos.y - (8 * size),
                  width: 16 * size,
                  height: 16 * size,
                  border: '2px dotted #888',
                  borderRadius: '50%',
                  pointerEvents: 'none',
                  zIndex: 1000,
                }}
              />
            )}
            {/* Render other users' cursors */}
            {Object.entries(cursors).map(([uid, c]) => (
              uid !== user.uid && c.x != null && c.y != null ? (
                <div key={uid} style={{
                  position: 'absolute',
                  left: c.x - 12,
                  top: c.y - 36,
                  pointerEvents: 'none',
                  zIndex: 1001,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}>
                  <div style={{
                    background: '#222',
                    color: '#fff',
                    fontSize: 13,
                    borderRadius: 8,
                    padding: '2px 8px',
                    marginBottom: 2,
                    opacity: 0.92,
                    fontWeight: 500,
                  }}>{c.name}: {c.tool}</div>
                  <div style={{
                    width: 24,
                    height: 24,
                    border: '2px solid #222',
                    borderRadius: '50%',
                    background: '#fff',
                    opacity: 0.8,
                  }} />
                </div>
              ) : null
            ))}
            {previewShape && (
              <svg
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  pointerEvents: 'none',
                  width: 700,
                  height: 400,
                  zIndex: 10,
                }}
                width={700}
                height={400}
              >
                {previewShape.tool === 'rect' ? (
                  <rect
                    x={Math.min(previewShape.x1, previewShape.x2)}
                    y={Math.min(previewShape.y1, previewShape.y2)}
                    width={Math.abs(previewShape.x2 - previewShape.x1)}
                    height={Math.abs(previewShape.y2 - previewShape.y1)}
                    fill="none"
                    stroke={color}
                    strokeWidth={size}
                  />
                ) : previewShape.tool === 'circle' ? (
                  <ellipse
                    cx={(previewShape.x1 + previewShape.x2) / 2}
                    cy={(previewShape.y1 + previewShape.y2) / 2}
                    rx={Math.abs(previewShape.x2 - previewShape.x1) / 2}
                    ry={Math.abs(previewShape.y2 - previewShape.y1) / 2}
                    fill="none"
                    stroke={color}
                    strokeWidth={size}
                  />
                ) : null}
              </svg>
            )}
          </div>
        </CanvasWrapper>
        {textPos && tool === 'text' && (
          <form onSubmit={handleTextSubmit} style={{ position: 'absolute', left: textPos.x + 40, top: textPos.y + 120, zIndex: 10 }}>
            <input
              autoFocus
              type="text"
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              style={{ fontSize: size * 6 + 12, color, border: '1px solid #888', background: '#fff' }}
            />
            <button type="submit">Add</button>
          </form>
        )}
        {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      </WhiteboardLayout>
    )
  );
}

export default Whiteboard; 