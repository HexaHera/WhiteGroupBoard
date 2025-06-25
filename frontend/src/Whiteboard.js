import React, { useEffect, useRef, useState } from 'react';
import { db, auth } from './firebase';
import { doc, onSnapshot, updateDoc, arrayUnion, collection, setDoc } from 'firebase/firestore';
import styled, { useTheme } from 'styled-components';
import { FiEdit2, FiSquare, FiCircle, FiType, FiRotateCcw, FiRotateCw, FiTrash2, FiDownload, FiImage, FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import { MdOutlineAutoFixOff } from 'react-icons/md'; // for eraser
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const API_BASE = process.env.REACT_APP_API_BASE_URL;

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

const TooltipText = styled.span`
  visibility: hidden;
  width: auto;
  min-width: 80px;
  background-color: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.accentText};
  text-align: center;
  border-radius: 12px;
  padding: 6px 12px;
  position: absolute;
  z-index: 1;
  left: 110%;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0;
  transition: opacity 0.2s;
  white-space: nowrap;
  font-size: 0.9rem;
  font-weight: 500;
`;

const ToolBtn = styled.button`
  position: relative;
  background: ${({ active, theme }) => active ? theme.colors.accentLight : 'transparent'};
  color: ${({ theme }) => theme.colors.text};
  opacity: ${({ active }) => (active ? 1 : 0.7)};
  border: none;
  border-radius: 12px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 20px;
  transition: all 0.2s ease-in-out;
  box-shadow: ${({ active, theme }) => active ? theme.colors.shadow : 'none'};

  &:hover {
    opacity: 1;
    background: ${({ active, theme }) => active ? theme.colors.accentLight : theme.colors.accent + '20'};
  }

  &:hover ${TooltipText} {
    visibility: visible;
    opacity: 1;
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
  background: ${({ bg }) => bg};
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
  transition: all 0.2s;
  &:hover {
    filter: brightness(1.1);
  }
`;

const TextInputContainer = styled.form`
  position: absolute;
  z-index: 50;
  display: flex;
  gap: 8px;
  padding: 8px;
  background: ${({ theme }) => theme.colors.toolbar};
  border-radius: ${({ theme }) => theme.borderRadius};
  box-shadow: ${({ theme }) => theme.colors.shadow};
`;

const TextInput = styled.input`
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  padding: 8px 12px;
  border-radius: 12px;
  outline: none;
  font-size: 1rem;
`;

const AddBtn = styled.button`
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.accentText};
  border: none;
  border-radius: 12px;
  padding: 0 16px;
  cursor: pointer;
  font-weight: 500;
  transition: filter 0.2s;
  &:hover {
    filter: brightness(1.1);
  }
`;

function Whiteboard({ user, roomId }) {
  const theme = useTheme();
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
  const [canvasBg, setCanvasBg] = useState('');
  const [cursorPos, setCursorPos] = useState(null);
  const [cursors, setCursors] = useState({});
  const [previewShape, setPreviewShape] = useState(null);

  useEffect(() => {
    // Set initial canvas background based on theme
    setCanvasBg(theme.colors.background === '#FFF0F5' ? '#FEFBFB' : theme.colors.card);
  }, [theme]);

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

  // logic for pen, rect, circle
  const handlePointerDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (tool === 'pen') {
      setDrawing(true);
      setUndoStack([]);
      setLastPoint({ x, y });
      setCurrentStroke([{ x, y }]);
      const ctx = canvasRef.current.getContext('2d');
      ctx.strokeStyle = eraser ? canvasBg : color;
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
      const ctx = canvasRef.current.getContext('2d');
      ctx.strokeStyle = eraser ? canvasBg : color;
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
      const action = {
        type: 'stroke',
        points: currentStroke,
        color: eraser ? canvasBg : color,
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

    saveAction(action); // Save to Firestore
  };

  // Save to Firestore
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

  // On pointer move -> update cursor in Firestore
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

  // update Firestore on chnging tool
  useEffect(() => {
    if (!canvasRef.current) return;
    const x = canvasRef.current.width / 2;
    const y = canvasRef.current.height / 2;
    updateCursor(x, y, eraser ? 'Eraser' : tool.charAt(0).toUpperCase() + tool.slice(1));

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
            <ToolBtn active={tool === 'pen'} onClick={() => { setTool('pen'); setEraser(false); }}>
              <FiEdit2 size={28} />
              <TooltipText>Pen</TooltipText>
            </ToolBtn>
            <ToolBtn active={tool === 'rect'} onClick={() => { setTool('rect'); setEraser(false); }}>
              <FiSquare size={28} />
              <TooltipText>Rectangle</TooltipText>
            </ToolBtn>
            <ToolBtn active={tool === 'circle'} onClick={() => { setTool('circle'); setEraser(false); }}>
              <FiCircle size={28} />
              <TooltipText>Circle</TooltipText>
            </ToolBtn>
            <ToolBtn active={tool === 'text'} onClick={() => { setTool('text'); setEraser(false); }}>
              <FiType size={28} />
              <TooltipText>Text</TooltipText>
            </ToolBtn>
            <ToolBtn active={eraser} onClick={() => setEraser(e => !e)}>
              <MdOutlineAutoFixOff size={28} />
              <TooltipText>Eraser</TooltipText>
            </ToolBtn>
            <ToolBtn onClick={handleUndo}>
              <FiRotateCcw size={28} />
              <TooltipText>Undo</TooltipText>
            </ToolBtn>
            <ToolBtn onClick={handleRedo}>
              <FiRotateCw size={28} />
              <TooltipText>Redo</TooltipText>
            </ToolBtn>
            <ToolBtn onClick={handleClear}>
              <FiTrash2 size={28} />
              <TooltipText>Clear All</TooltipText>
            </ToolBtn>
            <ToolBtn onClick={handleExportImage}>
              <FiImage size={28} />
              <TooltipText>Save as PNG</TooltipText>
            </ToolBtn>
            <ToolBtn onClick={handleExportPDF}>
              <FiDownload size={28} />
              <TooltipText>Save as PDF</TooltipText>
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
                value={canvasBg}
                onChange={e => setCanvasBg(e.target.value)}
                disabled={eraser}
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
          <FullscreenCanvasWrapper bg={canvasBg}>
            <MaximizeBtn onClick={() => setFullscreen(false)} title="Minimize">
              <FiMinimize2 size={22} />
            </MaximizeBtn>
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <canvas
                ref={canvasRef}
                width={window.innerWidth * 0.7}
                height={window.innerHeight * 0.7}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onClick={handleCanvasClick}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{ cursor: tool === 'pen' ? 'crosshair' : 'default' }}
              />
              {textPos && (
                <TextInputContainer
                  onSubmit={handleTextSubmit}
                  style={{ top: textPos.y, left: textPos.x }}
                >
                  <TextInput
                    type="text"
                    value={textInput}
                    onChange={e => setTextInput(e.target.value)}
                    autoFocus
                    placeholder="Type here..."
                  />
                  <AddBtn type="submit">Add</AddBtn>
                </TextInputContainer>
              )}
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
          <ToolBtn active={tool === 'pen'} onClick={() => { setTool('pen'); setEraser(false); }}>
            <FiEdit2 size={28} />
            <TooltipText>Pen</TooltipText>
          </ToolBtn>
          <ToolBtn active={tool === 'rect'} onClick={() => { setTool('rect'); setEraser(false); }}>
            <FiSquare size={28} />
            <TooltipText>Rectangle</TooltipText>
          </ToolBtn>
          <ToolBtn active={tool === 'circle'} onClick={() => { setTool('circle'); setEraser(false); }}>
            <FiCircle size={28} />
            <TooltipText>Circle</TooltipText>
          </ToolBtn>
          <ToolBtn active={tool === 'text'} onClick={() => { setTool('text'); setEraser(false); }}>
            <FiType size={28} />
            <TooltipText>Text</TooltipText>
          </ToolBtn>
          <ToolBtn active={eraser} onClick={() => setEraser(e => !e)}>
            <MdOutlineAutoFixOff size={28} />
            <TooltipText>Eraser</TooltipText>
          </ToolBtn>
          <ToolBtn onClick={handleUndo}>
            <FiRotateCcw size={28} />
            <TooltipText>Undo</TooltipText>
          </ToolBtn>
          <ToolBtn onClick={handleRedo}>
            <FiRotateCw size={28} />
            <TooltipText>Redo</TooltipText>
          </ToolBtn>
          <ToolBtn onClick={handleClear}>
            <FiTrash2 size={28} />
            <TooltipText>Clear All</TooltipText>
          </ToolBtn>
          <ToolBtn onClick={handleExportImage}>
            <FiImage size={28} />
            <TooltipText>Save as PNG</TooltipText>
          </ToolBtn>
          <ToolBtn onClick={handleExportPDF}>
            <FiDownload size={28} />
            <TooltipText>Save as PDF</TooltipText>
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
              value={canvasBg}
              onChange={e => setCanvasBg(e.target.value)}
              disabled={eraser}
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
        <CanvasWrapper bg={canvasBg}>
          <MaximizeBtn onClick={() => setFullscreen(true)} title="Maximize">
            <FiMaximize2 size={22} />
          </MaximizeBtn>
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <canvas
              ref={canvasRef}
              width={700}
              height={400}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onClick={handleCanvasClick}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{ cursor: tool === 'pen' ? 'crosshair' : 'default' }}
            />
            {textPos && (
              <TextInputContainer
                onSubmit={handleTextSubmit}
                style={{ top: textPos.y, left: textPos.x }}
              >
                <TextInput
                  type="text"
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  autoFocus
                  placeholder="Type here..."
                />
                <AddBtn type="submit">Add</AddBtn>
              </TextInputContainer>
            )}
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
            {/* Render other user's cursors */}
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
        {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      </WhiteboardLayout>
    )
  );
}

export default Whiteboard; 