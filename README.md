# 🌍 Coordinate Converter

Professional coordinate conversion tool supporting multiple coordinate systems with auto-detection and multilingual interface.

## ✨ Features

- **Auto-detection** of coordinate formats
- **15+ coordinate systems** supported
- **Multilingual interface** (Ukrainian, English, French)
- **Interactive map** with multiple layers
- **Dark/Light theme** toggle
- **History & Export** functionality
- **GPS extraction** from photos
- **Military grid** overlay

## 🗺️ Supported Coordinate Systems

### Input & Output Formats
- **DD** - Decimal Degrees
- **DMS** - Degrees/Minutes/Seconds
- **UTM** - Universal Transverse Mercator
- **MGRS** - Military Grid Reference System
- **Plus Codes** - Google Plus Codes
- **Geohash** - Base32 geocoding
- **Maidenhead** - Amateur radio locator
- **СК-42** - Soviet Coordinate System 1942
- **СК-63** - Soviet Coordinate System 1963
- **Gauss-Krüger** - Gauss-Krüger projection
- **УСК-2000** - Ukrainian Coordinate System
- **Ukrainian Military Grid** - КВ-XXXX-XXXX format
- **Ukrainian Artillery Grid** - XX-XX-XX-XX format
- **BNG** - British National Grid
- **Lambert** - Lambert Conformal Conic
- **ETRS89** - European Terrestrial Reference System
- **NAD83** - North American Datum 1983
- **Web Mercator** - Web Mercator projection

## 🚀 Quick Start

1. Open `coordinate_converter.html` in your browser
2. Enter coordinates in any supported format
3. Select output format or use auto-detection
4. Click "Convert" to get results
5. Use the interactive map for visual reference

## 🎯 Usage Examples

```
DD: 49.9808, 36.2527
DMS: 49°58'50.9"N 36°15'09.7"E
UTM: 37U 314628 5537350
MGRS: 37UCS146283
Ukrainian Military: КВ-1234-5678
Ukrainian Artillery: 37-12-34-56
```

## 🗂️ File Structure

```
coord_conv/
├── coordinate_converter.html  # Main application
├── index.html                # Redirect page
├── script.js                 # Additional JavaScript functions
├── README.md                 # This file
└── .gitignore               # Git ignore rules
```

## 🌐 Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 📱 Mobile Friendly

Responsive design works on all screen sizes with touch-friendly interface.

## 🔧 Technical Details

- **Pure HTML/CSS/JavaScript** - No dependencies
- **Leaflet.js** for interactive maps
- **Proj4js** for coordinate transformations
- **Local storage** for history and preferences
- **EXIF.js** for GPS extraction from photos

## 🎨 Themes

- **Light theme** - Default clean interface
- **Dark theme** - Red on black for better visibility

## 🌍 Languages

- 🇺🇦 **Ukrainian** (default)
- 🇺🇸 **English**
- 🇫🇷 **French**

## 📊 Map Layers

- **OSM** - OpenStreetMap
- **Satellite** - Google Satellite imagery
- **Topo** - Topographic maps
- **Hybrid** - Satellite with labels
- **Terrain** - Terrain visualization
- **Dark** - Dark theme map

## 🛠️ Tools

- **History** - View conversion history
- **Export** - Export data to CSV
- **Photo GPS** - Extract coordinates from photos
- **Military Grid** - Toggle coordinate grid overlay

## 📝 License

MIT License - feel free to use and modify.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📧 Contact

For questions or suggestions, please open an issue on GitHub.

---

**Made with ❤️ for coordinate conversion needs**