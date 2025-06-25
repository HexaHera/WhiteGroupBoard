// Light mode
export const lightTheme = {
  colors: {
    background: '#FFF0F5', // Light pink background
    card: 'rgba(255,255,255,0.9)',
    border: '#FADADD',
    accent: '#E5739D', // A more vibrant pink
    accentLight: '#FCE4EC', // Very light pink for active tool
    text: '#333',
    accentText: '#FFFFFF', // White text for on-accent elements
    toolbar: 'rgba(255,255,255,0.95)',
    shadow: '0 4px 24px rgba(0,0,0,0.08)',
    chatBg: 'rgba(255,255,255,0.85)',
    chatBubble: '#FFE4E1',
    chatText: '#333',
  },
  fonts: {
    main: '"San Francisco", "Segoe UI", "Roboto", Arial, sans-serif',
  },
  borderRadius: '18px',
  transition: '0.2s cubic-bezier(.4,0,.2,1)',
};
// Dark mode
export const darkTheme = {
  colors: {
    background: '#282129', // Darker, desaturated purple
    card: 'rgba(59, 48, 61, 0.95)', // Lighter purple-grey card
    border: '#524449',
    accent: '#E5739D', // Vibrant pink accent
    accentLight: '#4D3F4B', // Dark, muted pink/mauve for active tool
    text: '#F5EAF2', // Light pinkish-white text
    accentText: '#FFFFFF', // White text for on-accent elements
    toolbar: 'rgba(40,32,36,0.95)',
    shadow: '0 4px 24px rgba(0,0,0,0.32)',
    chatBg: 'rgba(30,32,36,0.95)',
    chatBubble: '#3A3335',
    chatText: '#E5739D',
  },
  fonts: {
    main: '"San Francisco", "Segoe UI", "Roboto", Arial, sans-serif',
  },
  borderRadius: '18px',
  transition: '0.2s cubic-bezier(.4,0,.2,1)',
}; 