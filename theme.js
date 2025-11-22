// theme.js
export const Theme = {
  colors: {
    primary: '#4361ee',       // Vibrant blue
    secondary: '#3a0ca3',     // Deep purple
    accent: '#f72585',        // Pink accent
    success: '#4cc9f0',       // Light blue
    warning: '#f9c74f',       // Yellow
    danger: '#f94144',        // Red
    light: '#f8f9fa',         // Light background
    dark: '#212529',          // Dark text
    muted: '#6c757d',         // Muted text
    white: '#ffffff',         // Pure white
    card: '#ffffff',          // Card background
    border: '#dee2e6'         // Border color
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24
  },
  typography: {
    h1: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#212529'
    },
    h2: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#212529'
    },
    h3: {
      fontSize: 20,
      fontWeight: '600',
      color: '#212529'
    },
    body: {
      fontSize: 16,
      color: '#212529'
    },
    caption: {
      fontSize: 14,
      color: '#6c757d'
    }
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 8
    }
  }
};