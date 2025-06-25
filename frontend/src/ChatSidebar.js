import React, { useEffect, useRef, useState } from 'react';
import { db } from './firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = styled.div`
  width: 320px;
  height: 480px;
  border-left: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.chatBg};
  box-shadow: ${({ theme }) => theme.colors.shadow};
  border-radius: ${({ theme }) => theme.borderRadius};
  margin-top: 32px;
  margin-bottom: 32px;
  position: sticky;
  top: 32px;
  overflow: hidden;
`;

const Header = styled.div`
  background: ${({ theme }) => theme.colors.toolbar};
  padding: 16px 20px;
  font-weight: 600;
  font-size: 1.1rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  letter-spacing: 1px;
  position: sticky;
  top: 0;
  z-index: 2;
`;

const Messages = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 18px 16px 8px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: none;
`;

const Bubble = styled(motion.div)`
  align-self: ${({ mine }) => (mine ? 'flex-end' : 'flex-start')};
  background: ${({ mine, theme }) => mine ? theme.colors.accent : theme.colors.chatBubble};
  color: ${({ mine, theme }) => mine ? theme.colors.text : theme.colors.chatText};
  padding: 10px 16px;
  border-radius: 18px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  max-width: 80%;
  font-size: 1rem;
  word-break: break-word;
  position: relative;
  margin-bottom: 2px;
`;

const Sender = styled.span`
  font-size: 0.85em;
  font-weight: 500;
  opacity: 0.7;
  margin-right: 8px;
`;

const ChatForm = styled.form`
  display: flex;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding: 12px 12px 12px 16px;
  background: ${({ theme }) => theme.colors.toolbar};
`;

const ChatInput = styled.input`
  flex: 1;
  border: none;
  border-radius: 16px;
  padding: 10px 16px;
  font-size: 1rem;
  background: ${({ theme }) => theme.colors.card};
  color: ${({ theme }) => theme.colors.text};
  margin-right: 10px;
  outline: none;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  transition: box-shadow 0.2s;
  &:focus {
    box-shadow: 0 2px 8px rgba(0,0,0,0.10);
  }
`;

const SendBtn = styled.button`
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
  transition: background 0.2s;
  &:hover {
    background: #ffe066;
  }
`;

function ChatSidebar({ user, roomId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!roomId) return;
    const q = query(
      collection(db, 'rooms', roomId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    await addDoc(collection(db, 'rooms', roomId, 'messages'), {
      text: input,
      user: user.email || user.displayName || 'Anonymous',
      uid: user.uid,
      createdAt: serverTimestamp(),
    });
    setInput('');
  };

  return (
    <Sidebar>
      <Header>Room Chat</Header>
      <Messages>
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <Bubble
              key={msg.id}
              mine={msg.uid === user.uid}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <Sender>{msg.user}:</Sender> {msg.text}
            </Bubble>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </Messages>
      <ChatForm onSubmit={handleSend}>
        <ChatInput
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message..."
        />
        <SendBtn type="submit">➤</SendBtn>
      </ChatForm>
    </Sidebar>
  );
}

export default ChatSidebar; 