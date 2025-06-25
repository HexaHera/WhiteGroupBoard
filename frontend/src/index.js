import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ThemeProvider, createGlobalStyle } from 'styled-components';
import { lightTheme, darkTheme } from './theme';
import { FiMoon, FiSun } from 'react-icons/fi';

const GlobalStyle = createGlobalStyle`
  body {
    background: ${props => props.theme.colors.background};
    font-family: ${props => props.theme.fonts.main};
    margin: 0;
    color: ${props => props.theme.colors.text};
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    transition: background 0.3s;
  }
`;

function Root() {
  const [dark, setDark] = useState(false);
  return (
    <ThemeProvider theme={dark ? darkTheme : lightTheme}>
      <GlobalStyle />
      <App />
      <button
        onClick={() => setDark(d => !d)}
        style={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          zIndex: 1000,
          background: dark ? '#FFD600' : '#23272E',
          color: dark ? '#23272E' : '#FFD600',
          border: 'none',
          borderRadius: '50%',
          width: 48,
          height: 48,
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'background 0.3s, color 0.3s',
        }}
        title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {dark ? <FiSun size={24} /> : <FiMoon size={24} />}
      </button>
    </ThemeProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Root />);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
