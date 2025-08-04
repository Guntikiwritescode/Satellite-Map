Satellite Tracking Terminal

🛰️ A real-time satellite tracking application built with React, TypeScript, and Three.js.

## Features

- **Real-time satellite tracking** - Track thousands of active satellites using live orbital data
- **Interactive 3D globe** - Three.js visualization with Earth texture
- **Satellite filtering** - Filter by type, constellation, country, and more
- **Educational content** - Learn about satellites, orbits, and space technology
- **Space Station tracker** - Dedicated ISS tracking with pass predictions
- **Mobile responsive** - Works great on desktop, tablet, and mobile devices

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **3D Graphics**: Three.js, React Three Fiber, React Three Drei
- **UI Components**: Radix UI, Tailwind CSS, shadcn/ui
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **API**: Vercel Serverless Functions
- **Satellite Math**: satellite.js for orbital calculations
- **Deployment**: Vercel

## Data Sources

- **Space-Track.org**: Official US government satellite catalog
- **Real-time orbital elements (TLE)**: Two-line element sets for accurate positioning
- **Satellite metadata**: Launch dates, countries, constellations, purposes

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/alchemist-satellite-tracker.git
   cd alchemist-satellite-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## Development

The project uses Vite for fast development and hot module replacement.

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## API

The application uses a Vercel API route (`/api/space-track-proxy`) to securely access Space-Track.org data while handling CORS and authentication.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Space-Track.org** for providing satellite orbital data
- **Three.js** for 3D graphics capabilities
- **satellite.js** for orbital mechanics calculations
- **NASA** for Earth texture imagery

