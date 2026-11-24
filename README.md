# Satellite Map

A 3D globe of every active satellite, where it is right now. Click one to see its orbit and details.

Live at [satellitemaplive.com](https://www.satellitemaplive.com).

## Run it

You need Node.js 22 or newer.

```bash
npm install
npm run owners   # downloads public/owners.json from CelesTrak
npm run dev      # http://localhost:8080
```

`npm run build` writes the site to `dist/`, and `npm test` runs the tests.

## Credits

Orbit data and owners from [CelesTrak](https://celestrak.org). Positions computed with [satellite.js](https://github.com/shashwatak/satellite-js). Earth image is [Blue Marble](https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/) by NASA Earth Observatory.

## License

MIT
