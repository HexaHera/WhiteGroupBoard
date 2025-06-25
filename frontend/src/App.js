import React, { useEffect, useState } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Login from './Login';
import Rooms from './Rooms';
import Whiteboard from './Whiteboard';
import ChatSidebar from './ChatSidebar';
import styled from 'styled-components';
import { FiLogOut } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const AppContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 100vh;
`;

const MainPanel = styled(motion.div)`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const Toolbar = styled(motion.div)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${({ theme }) => theme.colors.toolbar};
  box-shadow: ${({ theme }) => theme.colors.shadow};
  border-radius: ${({ theme }) => theme.borderRadius};
  padding: 18px 32px;
  margin-bottom: 24px;
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(8px);
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const Card = styled(motion.div)`
  background: ${({ theme }) => theme.colors.card};
  border-radius: ${({ theme }) => theme.borderRadius};
  box-shadow: ${({ theme }) => theme.colors.shadow};
  padding: 32px;
  margin-top: 32px;
`;

const Welcome = styled.span`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`;

const LogoutBtn = styled.button`
  background: ${({ theme }) => theme.colors.accent};
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: box-shadow 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  &:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.16);
    background: #ffe066;
  }
`;

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joinedRoomId, setJoinedRoomId] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div>Loading...</div>;

  if (!user) return <Login onLogin={setUser} />;

  if (!joinedRoomId) {
    return (
      <AppContainer>
        <MainPanel
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.4 }}
        >
          <Toolbar
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 style={{ fontWeight: 700, letterSpacing: 1 }}>DoodleDock</h2>
            <UserInfo>
              <Welcome>Welcome, {user.email || user.displayName}</Welcome>
              <LogoutBtn title="Logout" onClick={() => signOut(auth)}>
                <FiLogOut size={22} />
              </LogoutBtn>
            </UserInfo>
          </Toolbar>
          <Card
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Rooms user={user} onJoinRoom={setJoinedRoomId} />
          </Card>
        </MainPanel>
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <MainPanel
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.4 }}
      >
        <Toolbar
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 style={{ fontWeight: 700, letterSpacing: 1 }}>DoodleDock</h2>
          <UserInfo>
            <Welcome>Welcome, {user.email || user.displayName}</Welcome>
            <LogoutBtn title="Logout" onClick={() => signOut(auth)}>
              <FiLogOut size={22} />
            </LogoutBtn>
          </UserInfo>
        </Toolbar>
        <Card
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <h3 style={{ marginTop: 0 }}>Room: {joinedRoomId}</h3>
          <Whiteboard user={user} roomId={joinedRoomId} />
        </Card>
      </MainPanel>
      <AnimatePresence>
        <motion.div
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ duration: 0.4 }}
          style={{ marginLeft: 24 }}
        >
          <ChatSidebar user={user} roomId={joinedRoomId} />
        </motion.div>
      </AnimatePresence>
    </AppContainer>
  );
}

export default App;
