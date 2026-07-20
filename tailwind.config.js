/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
        display: ['Fraunces', 'DM Sans', 'serif'],
      },
      colors: {
        steel: {
          ink: '#101215',
          panel: '#1B1E23',
          sidebar: '#15171B',
          line: '#2B2F36',
          muted: '#8A9099',
          faint: '#5B6169',
        },
        // Colores de temple: la secuencia real de óxido que toma el acero
        // al calentarlo (pajizo -> bronce -> violeta -> azul) — usada para
        // mapear las etapas del pipeline en vez de un arcoíris arbitrario.
        temper: {
          straw:  '#D4A017',
          bronze: '#B5651D',
          violet: '#7A4B8C',
          blue:   '#2C6E9E',
          gray:   '#6B7280',
          brass:  '#A67C3D',
        },
        flame: {
          DEFAULT: '#FF5A1F',
          dim: '#B23F15',
        },
      },
    },
  },
  plugins: [],
};
