import React, { useState } from 'react';
import { auth, provider } from './firebase';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FcGoogle } from 'react-icons/fc';

const LoginWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.background};
`;

const LoginCard = styled(motion.div)`
  background: ${({ theme }) => theme.colors.card};
  border-radius: ${({ theme }) => theme.borderRadius};
  box-shadow: ${({ theme }) => theme.colors.shadow};
  padding: 40px 32px 32px 32px;
  min-width: 340px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Title = styled.h2`
  margin: 0 0 18px 0;
  font-weight: 700;
  letter-spacing: 1px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 14px;
  margin-bottom: 14px;
  border-radius: 10px;
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

const Button = styled.button`
  width: 100%;
  padding: 12px 0;
  border: none;
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.accentText};
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 10px;
  transition: filter 0.2s;
  &:hover {
    filter: brightness(1.1);
  }
`;

const GoogleBtn = styled(Button)`
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  color: #222;
  border: 1px solid #eee;
  font-weight: 500;
  margin-bottom: 0;
  &:hover {
    background: #f5f5f5;
  }
`;

const Divider = styled.div`
  width: 100%;
  text-align: center;
  margin: 18px 0 10px 0;
  color: #aaa;
  font-size: 0.95em;
  position: relative;
  &:before, &:after {
    content: '';
    display: inline-block;
    width: 40%;
    height: 1px;
    background: #eee;
    vertical-align: middle;
    margin: 0 8px;
  }
`;

const ErrorMsg = styled.div`
  color: #d32f2f;
  margin-top: 16px;
  font-size: 0.98em;
  text-align: center;
`;

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      onLogin(userCredential.user);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, provider);
      onLogin(result.user);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <LoginWrapper>
      <LoginCard
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Title>Sign in to Whiteboard</Title>
        <form onSubmit={handleEmailLogin} style={{ width: '100%' }}>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="username"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login with Email'}
          </Button>
        </form>
        <Divider>or</Divider>
        <GoogleBtn type="button" onClick={handleGoogleLogin} disabled={loading}>
          <FcGoogle size={22} style={{ marginRight: 10 }} />
          {loading ? 'Loading...' : 'Sign in with Google'}
        </GoogleBtn>
        {error && <ErrorMsg>{error}</ErrorMsg>}
      </LoginCard>
    </LoginWrapper>
  );
}

export default Login; 