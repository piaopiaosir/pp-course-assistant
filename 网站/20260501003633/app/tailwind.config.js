/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        brand: {
          dark: '#141413',
          light: '#faf9f5',
          'mid-gray': '#b0aea5',
          'light-gray': '#e8e6dc',
          orange: '#d97757',
          blue: '#6a9bcc',
          green: '#788c5d',
        }
      },
      fontFamily: {
        heading: ['"Bodoni Moda"', 'Poppins', 'serif'],
        body: ['Jost', 'Lora', 'sans-serif'],
      },
      animation: {
        // 保留现有动画
        'fade-up': 'fadeUp var(--anim-duration-normal, 0.6s) var(--ease-out-expo, ease-out) forwards',
        'fade-in': 'fadeIn var(--anim-duration-normal, 0.6s) var(--ease-out-quart, ease-out) forwards',
        'scale-in': 'scaleIn var(--anim-duration-fast, 0.3s) var(--ease-out-expo, ease-out) forwards',
        // 新增动画
        'fade-up-delay': 'fadeUpDelay var(--anim-duration-slow, 0.9s) var(--ease-out-expo, ease-out) 0.2s forwards',
        'slide-in-right': 'slideInRight var(--anim-duration-normal, 0.6s) var(--ease-out-expo, ease-out) forwards',
        'slide-in-left': 'slideInLeft var(--anim-duration-normal, 0.6s) var(--ease-out-expo, ease-out) forwards',
        'scale-fade': 'scaleFade var(--anim-duration-normal, 0.6s) var(--ease-out-expo, ease-out) forwards',
        'pulse-subtle': 'pulseSubtle 2s var(--ease-in-out-quad, ease-in-out) infinite',
        'glow-pulse': 'glowPulse 2.5s var(--ease-in-out-quad, ease-in-out) infinite',
        'bounce-subtle': 'bounceSubtle 0.6s var(--ease-out-expo, ease-out)',
        'alert-flash': 'alertFlash 1.5s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        // 保留现有关键帧
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        // 新增关键帧
        fadeUpDelay: {
          '0%': { opacity: '0', transform: 'translateY(40px)' },
          '40%': { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(60px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-60px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleFade: {
          '0%': { opacity: '0', transform: 'scale(0.85)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSubtle: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.03)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(217, 119, 87, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(217, 119, 87, 0.6), 0 0 40px rgba(217, 119, 87, 0.3)' },
        },
        bounceSubtle: {
          '0%': { transform: 'translateY(0)' },
          '30%': { transform: 'translateY(-6px)' },
          '50%': { transform: 'translateY(0)' },
          '70%': { transform: 'translateY(-3px)' },
          '100%': { transform: 'translateY(0)' },
        },
        alertFlash: {
          '0%, 100%': { borderColor: 'rgba(248, 113, 113, 0.3)' },
          '50%': { borderColor: 'rgba(248, 113, 113, 0.8)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
