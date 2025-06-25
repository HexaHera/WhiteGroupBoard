import React, { useEffect, useState } from 'react';
import { auth } from './firebase';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLock, FiUnlock, FiPlus, FiLogIn, FiKey, FiCopy, FiShare2 } from 'react-icons/fi';

const RoomsWrapper = styled.div`
  max-width: 520px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const RoomsLayout = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 40px;
  align-items: flex-start;
  @media (max-width: 900px) {
    flex-direction: column;
    gap: 32px;
  }
`;

const LeftColumn = styled.div`
  flex: 1 1 340px;
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const RightColumn = styled.div`
  flex: 1 1 320px;
  min-width: 280px;
`;

const CreateRoomCard = styled(motion.div)`
  background: ${({ theme }) => theme.colors.card};
  border-radius: ${({ theme }) => theme.borderRadius};
  box-shadow: ${({ theme }) => theme.colors.shadow};
  padding: 28px 28px 20px 28px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const RoomList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const RoomCard = styled(motion.div)`
  background: ${({ theme }) => theme.colors.card};
  border-radius: ${({ theme }) => theme.borderRadius};
  box-shadow: ${({ theme }) => theme.colors.shadow};
  padding: 18px 24px;
  display: flex;
  align-items: center;
  gap: 24px;
`;

const RoomInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  flex: 1;
  min-width: 0;
`;

const RoomMeta = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 16px;
`;

const RoomName = styled.span`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`;

const RoomType = styled.span`
  display: flex;
  align-items: center;
  font-size: 0.98em;
  color: #888;
  margin-left: 10px;
`;

const RoomCode = styled(RoomType)`
  color: ${({ theme }) => theme.colors.accent};
  font-weight: 500;
  margin-left: 0;
`;

const RoomIconButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  padding: 0;
  display: inline-flex;
  align-items: center;
  position: relative;
  margin-left: 8px;
`;

const CopiedTooltip = styled.span`
  position: absolute;
  top: -24px;
  left: 50%;
  transform: translateX(-50%);
  background: #222;
  color: ${({ theme }) => theme.colors.accent};
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 0.85em;
  z-index: 10;
  white-space: nowrap;
`;

const JoinBtnRow = styled.div`
  display: flex;
  align-items: center;
  margin-top: 10px;
`;

const JoinBtn = styled.button`
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.accentText};
  border: none;
  border-radius: 8px;
  padding: 8px 18px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  &:hover {
    filter: brightness(1.1);
  }
`;

const Form = styled.form`
  width: 100%;
  display: flex;
  gap: 12px;
  align-items: flex-end;
  margin-bottom: 8px;
`;

const Input = styled.input`
  flex: 1;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 1rem;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  outline: none;
  transition: box-shadow 0.2s;
  &:focus {
    box-shadow: 0 2px 8px rgba(0,0,0,0.10);
  }
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  font-size: 0.98em;
  gap: 6px;
  margin-left: 8px;
`;

const ErrorMsg = styled.div`
  color: #d32f2f;
  margin-top: 8px;
  font-size: 0.98em;
`;

const API_BASE = process.env.REACT_APP_API_BASE_URL;

function Rooms({ user, onJoinRoom }) {
  const [rooms, setRooms] = useState([]);
  const [name, setName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [createdRoomCode, setCreatedRoomCode] = useState('');
  const [copyStatus, setCopyStatus] = useState({}); // { [roomId]: true/false }

  // Fetch only user's rooms
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        // Use user.uid to fetch rooms by userId
        const res = await fetch(`${API_BASE}/rooms/by-user/${user.uid}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setRooms(data);
        } else {
          setRooms([]);
          setError(data?.error || 'Failed to fetch your rooms');
        }
      } catch {
        setRooms([]);
        setError('Failed to fetch your rooms');
      }
    };
    if (user && user.uid) fetchRooms();
  }, [user]);

  // Create a new room
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setCreatedRoomCode('');
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, isPrivate }),
      });
      if (!res.ok) throw new Error('Failed to create room');
      const newRoom = await res.json();
      setRooms([...rooms, newRoom]);
      setName('');
      setIsPrivate(false);
      setCreatedRoomCode(newRoom.code);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  // Join a room by code
  const handleJoinByCode = async (e) => {
    e.preventDefault();
    setJoinLoading(true);
    setJoinError('');
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE}/rooms/join-by-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: joinCode.trim() }),
      });
      if (!res.ok) throw new Error('Invalid or inaccessible code');
      const room = await res.json();
      onJoinRoom(room.id);
    } catch (err) {
      setJoinError(err.message);
    }
    setJoinLoading(false);
  };

  const handleJoinRoom = (roomId) => {
    onJoinRoom(roomId);
  };

  const handleCopyCode = (roomId, code) => {
    navigator.clipboard.writeText(code);
    setCopyStatus(s => ({ ...s, [roomId]: true }));
    setTimeout(() => setCopyStatus(s => ({ ...s, [roomId]: false })), 1200);
  };

  const handleShareCode = async (room) => {
    const text = `Join my DoodleDock room: ${room.name}\nCode: ${room.code}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'DoodleDock Room', text });
      } catch { }
    } else {
      handleCopyCode(room.id, room.code);
      alert('Share not supported. Code copied to clipboard!');
    }
  };

  return (
    <RoomsWrapper>
      <RoomsLayout>
        <LeftColumn>
          {/* Create Room Section */}
          <CreateRoomCard
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h3 style={{ margin: 0, marginBottom: 16, fontWeight: 700 }}>Create a Room</h3>
            <Form onSubmit={handleCreateRoom}>
              <Input
                type="text"
                placeholder="Room name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
              <CheckboxLabel>
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={e => setIsPrivate(e.target.checked)}
                  style={{ marginRight: 4 }}
                />
                Private
              </CheckboxLabel>
              <JoinBtn type="submit" disabled={loading} style={{ minWidth: 110 }}>
                <FiPlus style={{ marginRight: 6 }} />
                {loading ? 'Creating...' : 'Create Room'}
              </JoinBtn>
            </Form>
            {createdRoomCode && (
              <div style={{ marginTop: 12, fontSize: '1.05em', color: '#4caf50', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiKey /> Room code: <b>{createdRoomCode}</b>
              </div>
            )}
            {error && <ErrorMsg>{error}</ErrorMsg>}
          </CreateRoomCard>

          {/* Join by Code Section */}
          <CreateRoomCard
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h3 style={{ margin: 0, marginBottom: 16, fontWeight: 700 }}>Join a Room by Code</h3>
            <Form onSubmit={handleJoinByCode}>
              <Input
                type="text"
                placeholder="Enter room code"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                required
                style={{ letterSpacing: 2, textTransform: 'uppercase' }}
              />
              <JoinBtn type="submit" disabled={joinLoading || !joinCode} style={{ minWidth: 110 }}>
                <FiKey style={{ marginRight: 6 }} />
                {joinLoading ? 'Joining...' : 'Join Room'}
              </JoinBtn>
            </Form>
            {joinError && <ErrorMsg>{joinError}</ErrorMsg>}
          </CreateRoomCard>
        </LeftColumn>
        <RightColumn>
          <div>
            <h3 style={{ margin: '18px 0 12px 0', fontWeight: 700, fontSize: '1.5em' }}>My Rooms</h3>
            <RoomList>
              <AnimatePresence>
                {(!Array.isArray(rooms) || rooms.length === 0) && (
                  <div style={{ color: '#888', fontSize: '1.05em', padding: '16px 0' }}>No rooms created yet.</div>
                )}
                {Array.isArray(rooms) && rooms.map(room => (
                  <RoomCard
                    key={room.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <RoomInfo>
                      <RoomName>{room.name}</RoomName>
                      <RoomMeta>
                        <RoomType>
                          {room.isPrivate ? <FiLock style={{ marginRight: 4 }} /> : <FiUnlock style={{ marginRight: 4 }} />}
                          {room.isPrivate ? 'Private' : 'Public'}
                        </RoomType>
                        <RoomCode>
                          <FiKey style={{ marginRight: 4 }} />
                          {room.code}
                          <RoomIconButton
                            title="Copy code"
                            onClick={() => handleCopyCode(room.id, room.code)}
                          >
                            <FiCopy />
                            {copyStatus[room.id] && (
                              <CopiedTooltip>Copied!</CopiedTooltip>
                            )}
                          </RoomIconButton>
                          <RoomIconButton
                            style={{ marginLeft: 4 }}
                            title="Share code"
                            onClick={() => handleShareCode(room)}
                          >
                            <FiShare2 />
                          </RoomIconButton>
                        </RoomCode>
                      </RoomMeta>
                    </RoomInfo>
                    <JoinBtn onClick={() => handleJoinRoom(room.id)}>
                      <FiLogIn /> Join
                    </JoinBtn>
                  </RoomCard>
                ))}
              </AnimatePresence>
            </RoomList>
          </div>
        </RightColumn>
      </RoomsLayout>
    </RoomsWrapper>
  );
}

export default Rooms; 