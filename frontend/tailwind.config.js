/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        heading: ['"Baloo 2"', 'cursive', 'sans-serif'],
        sans: ['"Nunito Sans"', 'sans-serif'],
      },
      colors: {
        brand: {
          yellow: '#FFD45A',
          gold: '#FFC52E',
          orange: '#FFB82E',
          secondaryOrange: '#F28C28',
          cream: '#FFF8E8',
          surface: '#FFF0D2',
          border: '#F7E4B6',
          brown: '#713B18',
          deepBrown: '#843B13',
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#FFC52E",
          foreground: "#713B18",
        },
        secondary: {
          DEFAULT: "#FFF0D2",
          foreground: "#713B18",
        },
        destructive: {
          DEFAULT: "#E11D48",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#FFF0D2",
          foreground: "#843B13",
        },
        accent: {
          DEFAULT: "#FFB82E",
          foreground: "#713B18",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#713B18",
        },
      },
      borderRadius: {
        '3xl': '1.5rem',
        '2xl': '1.25rem',
        xl: '1rem',
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.25rem",
      },
      boxShadow: {
        'btn': '0 4px 14px 0 rgba(242, 140, 40, 0.35)',
        'btn-hover': '0 6px 20px 0 rgba(242, 140, 40, 0.45)',
        'card-warm': '0 4px 20px -2px rgba(113, 59, 24, 0.06)',
      },
    },
  },
  plugins: [],
}
