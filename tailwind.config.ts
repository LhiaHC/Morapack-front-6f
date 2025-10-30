import type { Config } from 'tailwindcss'
export default {
  darkMode: 'class',
  content: ['./index.html','./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta MoraPack - Verde teal profesional
        'teal': {
          50: '#E0F2F1',
          100: '#B2DFDB',
          200: '#80CBC4',
          300: '#4DB6AC',
          400: '#26A69A',
          500: '#009688',  // Color principal
          600: '#00897B',  // Verde principal MoraPack
          700: '#00796B',  // Verde oscuro
          800: '#00695C',
          900: '#004D40',
        },
        // Grises neutros
        'neutral-custom': {
          50: '#F5F7F8',   // Fondo gris claro
          100: '#E8EBED',
          200: '#D1D5D8',  // Bordes
          300: '#B4BBC0',
          400: '#8A959E',
          500: '#6B7882',
          600: '#51606D',
          700: '#3D4A56',
          800: '#2E3A3F',  // Texto oscuro
          900: '#1A2228',
        },
        // Variables CSS existentes (compatibilidad)
        border:'hsl(var(--border))', input:'hsl(var(--input))', ring:'hsl(var(--ring))',
        background:'hsl(var(--background))', foreground:'hsl(var(--foreground))',
        primary:{ DEFAULT:'hsl(var(--primary))', foreground:'hsl(var(--primary-foreground))' },
        secondary:{ DEFAULT:'hsl(var(--secondary))', foreground:'hsl(var(--secondary-foreground))' },
        muted:{ DEFAULT:'hsl(var(--muted))', foreground:'hsl(var(--muted-foreground))' },
        accent:{ DEFAULT:'hsl(var(--accent))', foreground:'hsl(var(--accent-foreground))' },
        destructive:{ DEFAULT:'hsl(var(--destructive))', foreground:'hsl(var(--destructive-foreground))' },
        card:{ DEFAULT:'hsl(var(--card))', foreground:'hsl(var(--card-foreground))' },
      },
      borderRadius:{
        lg:'var(--radius)',
        md:'calc(var(--radius) - 2px)',
        sm:'calc(var(--radius) - 4px)'
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'system-ui', '-apple-system', 'sans-serif'],
      }
    }
  },
  plugins: []
} satisfies Config
