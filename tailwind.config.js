/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        gold: {
          50: '#FDF8EC',
          100: '#FAEECE',
          200: '#F4D98E',
          400: '#C8A84B',
          500: '#B8952F',
          600: '#8A6F2E',
          900: '#3D2E08',
        },
        ink: {
          DEFAULT: '#0D0F14',
          2: '#1A1D26',
          3: '#252936',
          4: '#333848',
        },
        surface: {
          1: '#161924',
          2: '#1E2233',
          3: '#252A3D',
        },
        emerald: '#2ECC8A',
        sapphire: '#4A90E8',
        coral: '#E8624A',
        violet: '#9B72E8',
      },
      backgroundImage: {
        'gradient-gold': 'linear-gradient(135deg, #C8A84B 0%, #E8C96A 50%, #C8A84B 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0D0F14 0%, #161924 50%, #0D0F14 100%)',
        'gradient-mesh': 'radial-gradient(ellipse at 20% 50%, rgba(200,168,75,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(74,144,232,0.06) 0%, transparent 50%)',
      },
      boxShadow: {
        'gold': '0 0 30px rgba(200, 168, 75, 0.15)',
        'gold-lg': '0 0 60px rgba(200, 168, 75, 0.2)',
        'inner-gold': 'inset 0 1px 0 rgba(200, 168, 75, 0.2)',
        'card': '0 4px 24px rgba(0,0,0,0.4)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(200,168,75,0.1)',
        '3d': '0 20px 60px rgba(0,0,0,0.5), 0 8px 20px rgba(0,0,0,0.3)',
        '3d-gold': '0 20px 60px rgba(200,168,75,0.15), 0 8px 20px rgba(0,0,0,0.3)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-gold': 'pulse-gold 3s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease forwards',
        'fade-in': 'fadeIn 0.6s ease forwards',
        'spin-slow': 'spin 20s linear infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-12px) rotate(1deg)' },
          '66%': { transform: 'translateY(-6px) rotate(-1deg)' },
        },
        'pulse-gold': {
          '0%, 100%': { opacity: 1, boxShadow: '0 0 20px rgba(200,168,75,0.3)' },
          '50%': { opacity: 0.8, boxShadow: '0 0 40px rgba(200,168,75,0.6)' },
        },
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(30px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        glow: {
          '0%, 100%': { filter: 'brightness(1)' },
          '50%': { filter: 'brightness(1.2)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      perspective: {
        '1000': '1000px',
        '2000': '2000px',
      },
    },
  },
  plugins: [],
};
