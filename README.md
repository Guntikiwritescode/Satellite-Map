# ALCHEMIST - Satellite Tracking Terminal

A military-grade satellite tracking system providing real-time orbital surveillance of over 23,000 satellites currently in Earth's orbit. Built with modern web technologies and featuring a cyberpunk-inspired terminal interface.

## 🛰️ Features

- **Real-time Satellite Tracking**: Track over 23,000 active satellites with live orbital data
- **Interactive 3D Globe**: Immersive 3D visualization powered by Three.js
- **Multiple View Modes**: 
  - Tactical View: 3D globe with satellite positions
  - Data Grid: Comprehensive spreadsheet view
  - UI Guide: Interactive component documentation
  - Education: Learning modules about satellite technology
- **Terminal Aesthetic**: Cyberpunk-inspired UI with neon effects and terminal styling
- **Advanced Filtering**: Filter satellites by type, constellation, country, and more
- **Educational Content**: Learn about satellite technology and orbital mechanics
- **Audio Experience**: Ambient space-themed audio tracks

## 🚀 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom terminal themes
- **3D Graphics**: React Three Fiber + Three.js
- **UI Components**: Radix UI + Shadcn/UI
- **State Management**: Zustand
- **API Integration**: Space-Track.org API via Supabase functions
- **Backend**: Supabase (Database, Functions, Authentication)
- **Orbital Calculations**: satellite.js library

## 📡 Data Sources

- **Space-Track.org**: Official US Space Force catalog of space objects
- **Real-time TLE Data**: Two-Line Element sets for orbital calculations
- **Comprehensive Database**: Satellites, debris, rocket bodies, and more

## 🛠️ Installation & Development

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase CLI (for local development)

### Local Development

1. **Clone the repository**
```bash
git clone <repository-url>
cd alchemist-satellite-tracker
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env.local` file with:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Start development server**
```bash
npm run dev
```

The application will be available at `http://localhost:8080`

### Production Build

```bash
npm run build
npm run preview
```

## 🌐 Deployment

The application is designed to be deployed on modern hosting platforms:

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Netlify
1. Build command: `npm run build`
2. Publish directory: `dist`
3. Set environment variables in Netlify dashboard

### Other Platforms
The application builds to static files and can be deployed on any static hosting service.

## 🔧 Configuration

### Supabase Setup

1. **Create a new Supabase project**
2. **Deploy the Space-Track proxy function**:
```bash
supabase functions deploy space-track-proxy
```

3. **Set environment variables** in Supabase dashboard:
```
SPACE_TRACK_USERNAME=your_spacetrack_username
SPACE_TRACK_PASSWORD=your_spacetrack_password
ALLOWED_DOMAIN=your_production_domain
```

### Space-Track.org Account

1. Register for a free account at [space-track.org](https://www.space-track.org)
2. Verify your email and complete registration
3. Add credentials to Supabase environment variables

## 🎮 Usage

### Navigation
- **Tactical View**: Primary satellite tracking interface with 3D globe
- **Data Grid**: Spreadsheet view for detailed satellite data analysis
- **UI Guide**: Interactive documentation of all UI components
- **Education**: Learning modules about satellites and space technology

### Controls
- **Mouse**: Rotate and zoom the 3D globe
- **Search**: Find specific satellites by name or NORAD ID
- **Filters**: Filter by satellite type, constellation, or country
- **Selection**: Click satellites for detailed information

### Features
- **Real-time Updates**: Satellite positions update continuously
- **Orbital Predictions**: View future satellite passes
- **Educational Content**: Learn about different satellite types and missions
- **Audio Atmosphere**: Toggle ambient space-themed audio

## 📚 Educational Content

The application includes comprehensive educational modules covering:
- Satellite fundamentals and orbital mechanics
- Different types of satellites and their purposes
- Space agencies and their missions
- Historical timeline of space exploration
- Interactive learning experiences

## 🔒 Security & Privacy

- **No user tracking**: Application respects user privacy
- **Secure API access**: Space-Track credentials stored securely in Supabase
- **CORS protection**: API endpoints protected against unauthorized access
- **Rate limiting**: Respectful API usage to prevent abuse

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

### Development Guidelines
- Follow TypeScript best practices
- Maintain the terminal/cyberpunk aesthetic
- Ensure responsive design across devices
- Add tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Space-Track.org**: For providing comprehensive satellite tracking data
- **US Space Force**: For maintaining the official catalog of space objects
- **satellite.js**: For orbital mechanics calculations
- **React Three Fiber**: For 3D visualization capabilities
- **Supabase**: For backend infrastructure and API proxying

## 📞 Support

For questions, issues, or feature requests:
- Open an issue on GitHub
- Check the documentation in the UI Guide
- Review the educational content for usage tips

---

**ALCHEMIST** - Advanced satellite tracking for the modern age 🛰️
