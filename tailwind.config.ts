import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				'terminal': ['Share Tech Mono', 'Courier New', 'monospace'],
				'display': ['Orbitron', 'Share Tech Mono', 'monospace'],
				'mono': ['Share Tech Mono', 'Courier New', 'monospace'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				/* DEFCON 80's Terminal Colors */
				'terminal-green': 'hsl(var(--terminal-green))',
				'neon-cyan': 'hsl(var(--neon-cyan))',
				'neon-magenta': 'hsl(var(--neon-magenta))',
				'neon-orange': 'hsl(var(--neon-orange))',
				'neon-yellow': 'hsl(var(--neon-yellow))',
				'danger-red': 'hsl(var(--danger-red))',
				'grid-green': 'hsl(var(--grid-green))',
				'scan-blue': 'hsl(var(--scan-blue))'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				/* DEFCON Terminal Animations */
				'terminal-flicker': 'terminal-flicker var(--flicker-duration) infinite linear',
				'terminal-scan': 'terminal-scan var(--scan-duration) infinite linear',
				'neon-glow': 'neon-glow var(--glow-duration) ease-in-out infinite alternate',
				'neon-pulse': 'neon-pulse 2s ease-in-out infinite',
				'scanner-sweep': 'scanner-sweep 3s infinite linear',
				'typing': 'typing 0.5s steps(20) infinite',
				'terminal-glow': 'terminal-glow var(--glow-duration) ease-in-out infinite alternate'
			},
			backgroundImage: {
				/* DEFCON Gradients */
				'gradient-terminal': 'var(--gradient-terminal)',
				'gradient-neon': 'var(--gradient-neon)',
				'gradient-scan': 'var(--gradient-scan)'
			},
			boxShadow: {
				/* Neon glow shadows */
				'neon-cyan': 'var(--shadow-neon-cyan)',
				'neon-green': 'var(--shadow-neon-green)',
				'neon-magenta': 'var(--shadow-neon-magenta)',
				'terminal': 'var(--shadow-terminal)'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
