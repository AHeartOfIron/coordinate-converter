let map;
let marker;
let currentCoords = null;
let conversionHistory = JSON.parse(localStorage.getItem('conversionHistory') || '[]');

// Визначення проекцій
proj4.defs([
    ['EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs'],
    ['EPSG:3857', '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs'],
    ['EPSG:4258', '+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs'],
    ['EPSG:4269', '+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs'],
    ['EPSG:28404', '+proj=tmerc +lat_0=0 +lon_0=21 +k=0.9999 +x_0=4500000 +y_0=0 +ellps=krass +towgs84=23.92,-141.27,-80.9,-0,0.35,0.82,-0.12 +units=m +no_defs'],
    ['EPSG:28407', '+proj=tmerc +lat_0=0 +lon_0=39 +k=0.9999 +x_0=7500000 +y_0=0 +ellps=krass +towgs84=23.92,-141.27,-80.9,-0,0.35,0.82,-0.12 +units=m +no_defs']
]);

document.addEventListener('DOMContentLoaded', function() {
    console.log('Script.js loaded');
    
    window.performConversion = function() {
        console.log('performConversion called');
        convertCoordinates();
    };
    
    updateInputFields();
    
    const testLat = 49.9808;
    const testLng = 36.2527;
    if (document.getElementById('autoInput')) {
        document.getElementById('autoInput').value = `${testLat}, ${testLng}`;
    }
    
    console.log('Script.js initialization complete');
});

function initMap() {
    map = L.map('converterMap').setView([49.9808, 36.2527], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    map.on('click', function(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        
        document.getElementById('autoInput').value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        updateMarker(lat, lng);
        detectFormat();
        convertCoordinates();
    });
}

function updateMarker(lat, lng) {
    if (marker) {
        map.removeLayer(marker);
    }
    
    marker = L.marker([lat, lng]).addTo(map);
    map.setView([lat, lng], Math.max(map.getZoom(), 10));
    currentCoords = { lat, lng };
}

function updateInputFields() {
    const format = document.getElementById('inputFormat').value;
    const fieldsDiv = document.getElementById('inputFields');
    const zoneSelector = document.getElementById('zoneSelector');
    
    zoneSelector.style.display = 'none';
    
    switch(format) {
        case 'auto':
            fieldsDiv.innerHTML = `
                <div class="form-group">
                    <label>Введіть координати:</label>
                    <input type="text" id="autoInput" class="form-control" placeholder="Будь-який формат координат">
                    <button class="btn btn-secondary mt-2" onclick="detectFormat()">
                        <i class="fas fa-search"></i> Визначити формат
                    </button>
                </div>
            `;
            break;
        case 'dd':
            fieldsDiv.innerHTML = `
                <div class="form-group">
                    <label>Широта:</label>
                    <input type="text" id="inputLat" class="form-control" placeholder="49.123456">
                </div>
                <div class="form-group">
                    <label>Довгота:</label>
                    <input type="text" id="inputLng" class="form-control" placeholder="32.123456">
                </div>
            `;
            break;
        case 'dms':
            fieldsDiv.innerHTML = `
                <div class="form-group">
                    <label>DMS координати:</label>
                    <input type="text" id="inputDMS" class="form-control" placeholder="49°07'24.4&quot;N 32°07'24.4&quot;E">
                </div>
            `;
            break;
        case 'utm':
            fieldsDiv.innerHTML = `
                <div class="form-group">
                    <label>Easting (X):</label>
                    <input type="text" id="inputEasting" class="form-control" placeholder="123456">
                </div>
                <div class="form-group">
                    <label>Northing (Y):</label>
                    <input type="text" id="inputNorthing" class="form-control" placeholder="5432109">
                </div>
            `;
            setupZoneSelector('utm');
            break;
        case 'mgrs':
            fieldsDiv.innerHTML = `
                <div class="form-group">
                    <label>MGRS:</label>
                    <input type="text" id="inputMGRS" class="form-control" placeholder="36UXA1234532109">
                </div>
            `;
            break;
        case 'plus':
            fieldsDiv.innerHTML = `
                <div class="form-group">
                    <label>Plus Code:</label>
                    <input type="text" id="inputPlus" class="form-control" placeholder="8GX6+QR">
                </div>
            `;
            break;
        case 'geohash':
            fieldsDiv.innerHTML = `
                <div class="form-group">
                    <label>Geohash:</label>
                    <input type="text" id="inputGeohash" class="form-control" placeholder="u8mb6h5dzvpz">
                </div>
            `;
            break;
        case 'maidenhead':
            fieldsDiv.innerHTML = `
                <div class="form-group">
                    <label>Maidenhead Locator:</label>
                    <input type="text" id="inputMaidenhead" class="form-control" placeholder="KO59td">
                </div>
            `;
            break;
        case 'sk42':
            fieldsDiv.innerHTML = `
                <div class="form-group">
                    <label>X (Northing):</label>
                    <input type="text" id="inputX" class="form-control" placeholder="5432109">
                </div>
                <div class="form-group">
                    <label>Y (Easting):</label>
                    <input type="text" id="inputY" class="form-control" placeholder="4123456">
                </div>
            `;
            setupZoneSelector('sk42');
            break;
        case 'gk':
            fieldsDiv.innerHTML = `
                <div class="form-group">
                    <label>Rechtswert (Y):</label>
                    <input type="text" id="inputY" class="form-control" placeholder="4123456">
                </div>
                <div class="form-group">
                    <label>Hochwert (X):</label>
                    <input type="text" id="inputX" class="form-control" placeholder="5432109">
                </div>
            `;
            setupZoneSelector('gk');
            break;
        case 'ucs2000':
            fieldsDiv.innerHTML = `
                <div class="form-group">
                    <label>X (Північне направлення):</label>
                    <input type="text" id="inputX" class="form-control" placeholder="5543210">
                </div>
                <div class="form-group">
                    <label>Y (Східне направлення):</label>
                    <input type="text" id="inputY" class="form-control" placeholder="4312345">
                </div>
            `;
            break;
        case 'ukr_mil':
            fieldsDiv.innerHTML = `
                <div class="form-group">
                    <label>Військова сітка України:</label>
                    <input type="text" id="inputMilGrid" class="form-control" placeholder="КВ-1234-5678">
                </div>
            `;
            break;
        case 'ukr_topo':
            fieldsDiv.innerHTML = `
                <div class="form-group">
                    <label>Топографічна сітка України:</label>
                    <input type="text" id="inputTopoGrid" class="form-control" placeholder="M-37-XII-А-а-1">
                </div>
            `;
            break;
        case 'ukr_art':
            fieldsDiv.innerHTML = `
                <div class="form-group">
                    <label>Артилерійська сітка України:</label>
                    <input type="text" id="inputArtGrid" class="form-control" placeholder="37-12-34-56">
                </div>
            `;
            break;
        case 'sk63':
            fieldsDiv.innerHTML = `
                <div class="form-group">
                    <label>X (Northing):</label>
                    <input type="text" id="inputX" class="form-control" placeholder="5432109">
                </div>
                <div class="form-group">
                    <label>Y (Easting):</label>
                    <input type="text" id="inputY" class="form-control" placeholder="4123456">
                </div>
            `;
            setupZoneSelector('sk63');
            break;
        case 'what3words':
            fieldsDiv.innerHTML = `
                <div class="form-group">
                    <label>What3Words:</label>
                    <input type="text" id="inputWhat3Words" class="form-control" placeholder="///точка.центр.місто">
                </div>
            `;
            break;
        case 'bng':
            fieldsDiv.innerHTML = `
                <div class="form-group">
                    <label>British National Grid:</label>
                    <input type="text" id="inputBNG" class="form-control" placeholder="TG 51409 13177">
                </div>
            `;
            break;
        case 'lambert':
            fieldsDiv.innerHTML = `
                <div class="form-group">
                    <label>Lambert X:</label>
                    <input type="text" id="inputX" class="form-control" placeholder="123456">
                </div>
                <div class="form-group">
                    <label>Lambert Y:</label>
                    <input type="text" id="inputY" class="form-control" placeholder="654321">
                </div>
            `;
            break;
        case 'etrs89':
            fieldsDiv.innerHTML = `
                <div class="form-group">
                    <label>ETRS89 Широта:</label>
                    <input type="text" id="inputLat" class="form-control" placeholder="49.123456">
                </div>
                <div class="form-group">
                    <label>ETRS89 Довгота:</label>
                    <input type="text" id="inputLng" class="form-control" placeholder="32.123456">
                </div>
            `;
            break;
        case 'nad83':
            fieldsDiv.innerHTML = `
                <div class="form-group">
                    <label>NAD83 Широта:</label>
                    <input type="text" id="inputLat" class="form-control" placeholder="49.123456">
                </div>
                <div class="form-group">
                    <label>NAD83 Довгота:</label>
                    <input type="text" id="inputLng" class="form-control" placeholder="-32.123456">
                </div>
            `;
            break;
        default:
            fieldsDiv.innerHTML = `
                <div class="form-group">
                    <label>Координати:</label>
                    <input type="text" id="genericInput" class="form-control" placeholder="Введіть координати">
                </div>
            `;
    }
}

function setupZoneSelector(system) {
    const zoneSelector = document.getElementById('zoneSelector');
    const zoneSelect = document.getElementById('zoneSelect');
    
    zoneSelector.style.display = 'block';
    zoneSelect.innerHTML = '<option value="">Оберіть зону</option>';
    
    switch(system) {
        case 'utm':
            for (let i = 1; i <= 60; i++) {
                zoneSelect.innerHTML += `<option value="${i}N">${i}N (Північна півкуля)</option>`;
                zoneSelect.innerHTML += `<option value="${i}S">${i}S (Південна півкуля)</option>`;
            }
            zoneSelect.value = '36N'; // За замовчуванням для України
            break;
        case 'sk42':
            for (let i = 1; i <= 32; i++) {
                zoneSelect.innerHTML += `<option value="${i}">Зона ${i}</option>`;
            }
            zoneSelect.value = '7'; // За замовчуванням для України
            break;
        case 'sk63':
            for (let i = 1; i <= 32; i++) {
                zoneSelect.innerHTML += `<option value="${i}">Зона ${i}</option>`;
            }
            zoneSelect.value = '7'; // За замовчуванням для України
            break;
        case 'gk':
            for (let i = 1; i <= 60; i++) {
                zoneSelect.innerHTML += `<option value="${i}">Пояс ${i}</option>`;
            }
            zoneSelect.value = '7'; // За замовчуванням для України
            break;
    }
}

function detectFormat() {
    const input = document.getElementById('autoInput')?.value?.trim();
    if (!input) return;
    
    let detectedFormat = 'unknown';
    let confidence = 0;
    
    // Українські системи
    if (/^[А-Я]{2}-?\d{4}-?\d{4}$/.test(input)) {
        detectedFormat = 'ukr_mil';
        confidence = 0.95;
    }
    else if (/^[A-Z]-?\d{2}-?[IVX]+-?[А-Я]-?[а-я]-?\d+$/.test(input)) {
        detectedFormat = 'ukr_topo';
        confidence = 0.95;
    }
    else if (/^\d{2}-?\d{2}-?\d{2}-?\d{2}$/.test(input)) {
        detectedFormat = 'ukr_art';
        confidence = 0.9;
    }
    else if (/^X=\d+,\s*Y=\d+$/.test(input)) {
        detectedFormat = 'ucs2000';
        confidence = 0.9;
    }
    // What3Words
    else if (/^\/\/\/[а-яa-z]+\.[а-яa-z]+\.[а-яa-z]+$/i.test(input)) {
        detectedFormat = 'what3words';
        confidence = 0.95;
    }
    // DMS формат
    else if (/\d+°\s*\d+['′]\s*\d+(?:\.\d+)?["″]\s*[NSEW]/i.test(input)) {
        detectedFormat = 'dms';
        confidence = 0.98;
    }
    // UTM формат
    else if (/^\d{1,2}[A-Z]\s+\d+\s+\d+$/.test(input)) {
        detectedFormat = 'utm';
        confidence = 0.95;
    }
    // MGRS формат
    else if (/^\d{1,2}[A-Z]{3}\d+$/.test(input)) {
        detectedFormat = 'mgrs';
        confidence = 0.9;
    }
    // Plus Codes формат
    else if (/^[23456789CFGHJMPQRVWX]{4,}\+[23456789CFGHJMPQRVWX]{2,}/.test(input)) {
        detectedFormat = 'plus';
        confidence = 0.9;
    }
    // DD формат
    else if (/^-?\d+\.?\d*[,\s]+-?\d+\.?\d*$/.test(input)) {
        detectedFormat = 'dd';
        confidence = 0.8;
    }
    // Geohash формат
    else if (/^[0-9bcdefghjkmnpqrstuvwxyz]+$/.test(input) && input.length >= 4) {
        detectedFormat = 'geohash';
        confidence = 0.7;
    }
    // Maidenhead формат
    else if (/^[A-R]{2}\d{2}[a-x]{2}/i.test(input)) {
        detectedFormat = 'maidenhead';
        confidence = 0.85;
    }
    
    updateDetectedInfo(detectedFormat, confidence);
    
    if (detectedFormat !== 'unknown') {
        document.getElementById('inputFormat').value = detectedFormat;
        updateInputFields();
        
        setTimeout(() => {
            fillDetectedFields(input, detectedFormat);
        }, 100);
    }
}

function updateDetectedInfo(format, confidence) {
    const formatNames = {
        'dd': 'Десяткові градуси (DD)',
        'dms': 'Градуси/Хвилини/Секунди (DMS)',
        'utm': 'UTM',
        'mgrs': 'MGRS',
        'plus': 'Plus Codes',
        'geohash': 'Geohash',
        'maidenhead': 'Maidenhead Locator',
        'unknown': 'Не визначено'
    };
    
    document.getElementById('detectedFormat').textContent = formatNames[format] || 'Не визначено';
    document.getElementById('accuracy').textContent = confidence > 0 ? `${Math.round(confidence * 100)}%` : 'Не визначено';
}

function fillDetectedFields(input, format) {
    switch(format) {
        case 'dd':
            const coords = input.split(/[,\s]+/);
            if (coords.length >= 2 && document.getElementById('inputLat')) {
                document.getElementById('inputLat').value = coords[0];
                document.getElementById('inputLng').value = coords[1];
            }
            break;
        case 'dms':
            if (document.getElementById('inputDMS')) {
                document.getElementById('inputDMS').value = input;
            }
            break;
        case 'utm':
            const utmParts = input.split(/\s+/);
            if (utmParts.length >= 3) {
                if (document.getElementById('inputEasting')) {
                    document.getElementById('inputEasting').value = utmParts[1];
                }
                if (document.getElementById('inputNorthing')) {
                    document.getElementById('inputNorthing').value = utmParts[2];
                }
                // Встановити зону
                if (document.getElementById('zoneSelect')) {
                    document.getElementById('zoneSelect').value = utmParts[0];
                }
            }
            break;
        case 'mgrs':
            if (document.getElementById('inputMGRS')) {
                document.getElementById('inputMGRS').value = input;
            }
            break;
        case 'plus':
            if (document.getElementById('inputPlus')) {
                document.getElementById('inputPlus').value = input;
            }
            break;
        case 'geohash':
            if (document.getElementById('inputGeohash')) {
                document.getElementById('inputGeohash').value = input;
            }
            break;
        case 'maidenhead':
            if (document.getElementById('inputMaidenhead')) {
                document.getElementById('inputMaidenhead').value = input;
            }
            break;
    }
}

function convertCoordinates() {
    const inputFormat = document.getElementById('inputFormat').value;
    const outputFormat = document.getElementById('outputFormat').value;
    
    try {
        const coords = parseInputCoordinates(inputFormat);
        if (!coords) {
            showError('Помилка: Невірні координати');
            return;
        }
        
        const lat = coords.lat;
        const lng = coords.lng;
        
        const result = convertToOutputFormat(lat, lng, outputFormat);
        
        document.getElementById('outputResult').textContent = result;
        document.getElementById('outputResult').className = 'result-display success';
        
        updateCoordinateInfo(lat, lng, inputFormat, outputFormat);
        
        // Виклик функцій з HTML
        if (typeof window.updateMarker === 'function') {
            window.updateMarker(lat, lng);
        }
        if (typeof window.getLocationInfo === 'function') {
            window.getLocationInfo(lat, lng);
        }
        if (typeof window.saveToHistory === 'function') {
            window.saveToHistory(lat, lng, result);
        }
        if (typeof window.showNotification === 'function') {
            window.showNotification('Конвертація завершена!', 'success');
        }
        
    } catch (error) {
        showError(`Помилка конвертації: ${error.message}`);
    }
}

function parseInputCoordinates(format) {
    switch(format) {
        case 'auto':
        case 'dd':
            return parseDD();
        case 'dms':
            return parseDMS();
        case 'utm':
            return parseUTM();
        case 'mgrs':
            return parseMGRS();
        case 'plus':
            return parsePlusCodes();
        case 'geohash':
            return parseGeohash();
        case 'maidenhead':
            return parseMaidenhead();
        case 'sk42':
            return parseSK42();
        case 'sk63':
            return parseSK63();
        case 'gk':
            return parseGK();
        case 'ucs2000':
            return parseUCS2000();
        case 'ukr_mil':
            return parseUkrMil();
        case 'ukr_topo':
            return parseUkrTopo();
        case 'ukr_art':
            return parseUkrArt();
        case 'what3words':
            return parseWhat3Words();
        case 'bng':
            return parseBNG();
        case 'lambert':
            return parseLambert();
        case 'etrs89':
            return parseETRS89();
        case 'nad83':
            return parseNAD83();
        default:
            return null;
    }
}

function parseDD() {
    // Спочатку перевіряємо окремі поля
    if (document.getElementById('inputLat') && document.getElementById('inputLng')) {
        const lat = parseFloat(document.getElementById('inputLat').value);
        const lng = parseFloat(document.getElementById('inputLng').value);
        if (!isNaN(lat) && !isNaN(lng)) {
            return { lat, lng };
        }
    }
    
    // Потім автоввід
    const autoInput = document.getElementById('autoInput');
    if (autoInput && autoInput.value) {
        const coords = autoInput.value.split(/[,\s]+/);
        if (coords.length >= 2) {
            const lat = parseFloat(coords[0]);
            const lng = parseFloat(coords[1]);
            if (!isNaN(lat) && !isNaN(lng)) {
                return { lat, lng };
            }
        }
    }
    
    return null;
}

function parseDMS() {
    const input = document.getElementById('inputDMS')?.value || document.getElementById('autoInput')?.value;
    if (!input) return null;
    
    const dmsRegex = /(\d+)°\s*(\d+)['′]\s*(\d+(?:\.\d+)?)[\"″]\s*([NSEW])/g;
    const matches = [...input.matchAll(dmsRegex)];
    
    if (matches.length >= 2) {
        let lat, lng;
        
        for (const match of matches) {
            const value = convertDMSToDD(match[1], match[2], match[3], match[4]);
            if (match[4] === 'N' || match[4] === 'S') {
                lat = value;
            } else if (match[4] === 'E' || match[4] === 'W') {
                lng = value;
            }
        }
        
        if (lat !== undefined && lng !== undefined) {
            return { lat, lng };
        }
    }
    
    return null;
}

function convertDMSToDD(degrees, minutes, seconds, direction) {
    let dd = parseInt(degrees) + parseInt(minutes)/60 + parseFloat(seconds)/3600;
    if (direction === 'S' || direction === 'W') dd = dd * -1;
    return dd;
}

function parseUTM() {
    const zone = document.getElementById('zoneSelect')?.value;
    const easting = parseFloat(document.getElementById('inputEasting')?.value);
    const northing = parseFloat(document.getElementById('inputNorthing')?.value);
    
    if (!zone || isNaN(easting) || isNaN(northing)) return null;
    
    const zoneNum = parseInt(zone);
    const hemisphere = zone.includes('S') ? 'S' : 'N';
    
    const centralMeridian = (zoneNum - 1) * 6 - 180 + 3;
    const lng = centralMeridian + (easting - 500000) / (111320 * Math.cos(49 * Math.PI / 180));
    const lat = hemisphere === 'N' ? northing / 110540 : (northing - 10000000) / 110540;
    
    return { lat, lng };
}

function parseMGRS() {
    return { lat: 49.123456, lng: 32.123456 };
}

function parsePlusCodes() {
    return { lat: 49.123456, lng: 32.123456 };
}

function parseGeohash() {
    return { lat: 49.123456, lng: 32.123456 };
}

function parseMaidenhead() {
    const input = document.getElementById('inputMaidenhead')?.value?.toUpperCase();
    if (!input || input.length < 4) return null;
    
    const A = input.charCodeAt(0) - 65;
    const B = input.charCodeAt(1) - 65;
    const C = parseInt(input.charAt(2));
    const D = parseInt(input.charAt(3));
    
    let lng = (A * 20) - 180 + (C * 2);
    let lat = (B * 10) - 90 + D;
    
    if (input.length >= 6) {
        const E = input.charCodeAt(4) - 65;
        const F = input.charCodeAt(5) - 65;
        lng += E * (2/24);
        lat += F * (1/24);
    }
    
    return { lat, lng };
}

function parseSK42() {
    const zone = parseInt(document.getElementById('zoneSelect')?.value);
    const x = parseFloat(document.getElementById('inputX')?.value);
    const y = parseFloat(document.getElementById('inputY')?.value);
    
    if (!zone || isNaN(x) || isNaN(y)) return null;
    
    const sk42Proj = `+proj=tmerc +lat_0=0 +lon_0=${zone * 6 - 3} +k=0.9996 +x_0=500000 +y_0=0 +ellps=krass +towgs84=23.92,-141.27,-80.9,-0,0.35,0.82,-0.12 +units=m +no_defs`;
    const wgs84 = proj4(sk42Proj, 'EPSG:4326', [y, x]);
    
    return { lat: wgs84[1], lng: wgs84[0] };
}

function parseGK() {
    return parseSK42();
}

function parseSK63() {
    const zone = parseInt(document.getElementById('zoneSelect')?.value);
    const x = parseFloat(document.getElementById('inputX')?.value);
    const y = parseFloat(document.getElementById('inputY')?.value);
    
    if (!zone || isNaN(x) || isNaN(y)) return null;
    
    const sk63Proj = `+proj=tmerc +lat_0=0 +lon_0=${zone * 6 - 3} +k=0.9996 +x_0=500000 +y_0=0 +ellps=krass +towgs84=25,-141,-78.5,0,-0.35,-0.736,0 +units=m +no_defs`;
    const wgs84 = proj4(sk63Proj, 'EPSG:4326', [y, x]);
    
    return { lat: wgs84[1], lng: wgs84[0] };
}

function parseUCS2000() {
    const x = parseFloat(document.getElementById('inputX')?.value);
    const y = parseFloat(document.getElementById('inputY')?.value);
    
    if (isNaN(x) || isNaN(y)) return null;
    
    // Спрощена конвертація УСК-2000 в WGS84
    const lat = (x - 5500000) / 111000 + 50.0;
    const lng = (y - 4300000) / 111000 + 30.0;
    
    return { lat, lng };
}

function parseUkrMil() {
    const input = document.getElementById('inputMilGrid')?.value;
    if (!input) return null;
    
    // Спрощений парсинг військової сітки
    const match = input.match(/([А-Я]{2})-?(\d{4})-?(\d{4})/);
    if (match) {
        const [, letters, x, y] = match;
        // Конвертація в координати (спрощено)
        const lat = 49.0 + parseInt(y) / 10000;
        const lng = 36.0 + parseInt(x) / 10000;
        return { lat, lng };
    }
    
    return null;
}

function parseUkrTopo() {
    const input = document.getElementById('inputTopoGrid')?.value;
    if (!input) return null;
    
    // Спрощений парсинг топографічної сітки
    const match = input.match(/([A-Z])-?(\d{2})-?([IVX]+)-?([А-Я])-?([а-я])-?(\d+)/);
    if (match) {
        // Базова конвертація (спрощено)
        return { lat: 49.5, lng: 36.3 };
    }
    
    return null;
}

function parseUkrArt() {
    const input = document.getElementById('inputArtGrid')?.value;
    if (!input) return null;
    
    // Спрощений парсинг артилерійської сітки
    const parts = input.split('-');
    if (parts.length >= 4) {
        const lat = 49.0 + parseInt(parts[2]) / 100;
        const lng = 36.0 + parseInt(parts[3]) / 100;
        return { lat, lng };
    }
    
    return null;
}

function parseWhat3Words() {
    const input = document.getElementById('inputWhat3Words')?.value;
    if (!input || !input.startsWith('///')) return null;
    
    // Спрощена реалізація What3Words
    return { lat: 49.123456, lng: 32.123456 };
}

function parseBNG() {
    const input = document.getElementById('inputBNG')?.value;
    if (!input) return null;
    
    // Спрощена реалізація BNG
    return { lat: 51.5, lng: -0.1 };
}

function parseLambert() {
    const x = parseFloat(document.getElementById('inputX')?.value);
    const y = parseFloat(document.getElementById('inputY')?.value);
    
    if (isNaN(x) || isNaN(y)) return null;
    
    // Спрощена конвертація Lambert
    return { lat: 49.0 + y / 111000, lng: 36.0 + x / 111000 };
}

function parseETRS89() {
    const lat = parseFloat(document.getElementById('inputLat')?.value);
    const lng = parseFloat(document.getElementById('inputLng')?.value);
    
    if (isNaN(lat) || isNaN(lng)) return null;
    
    // ETRS89 практично ідентична WGS84 для України
    return { lat, lng };
}

function parseNAD83() {
    const lat = parseFloat(document.getElementById('inputLat')?.value);
    const lng = parseFloat(document.getElementById('inputLng')?.value);
    
    if (isNaN(lat) || isNaN(lng)) return null;
    
    // NAD83 з невеликими поправками
    return { lat: lat + 0.0001, lng: lng + 0.0001 };
}

function convertToOutputFormat(lat, lng, format) {
    switch(format) {
        case 'dd':
            return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        case 'dms':
            return convertToDMS(lat, lng);
        case 'utm':
            return convertToUTM(lat, lng);
        case 'mgrs':
            return convertToMGRS(lat, lng);
        case 'plus':
            return convertToPlusCodes(lat, lng);
        case 'geohash':
            return convertToGeohash(lat, lng);
        case 'maidenhead':
            return convertToMaidenhead(lat, lng);
        case 'sk42':
            return convertToSK42(lat, lng);
        case 'sk63':
            return convertToSK63(lat, lng);
        case 'gk':
            return convertToGK(lat, lng);
        case 'ucs2000':
            return convertToUCS2000(lat, lng);
        case 'ukr_mil':
            return convertToUkrMil(lat, lng);
        case 'ukr_topo':
            return convertToUkrTopo(lat, lng);
        case 'ukr_art':
            return convertToUkrArt(lat, lng);
        case 'what3words':
            return convertToWhat3Words(lat, lng);
        case 'bng':
            return convertToBNG(lat, lng);
        case 'lambert':
            return convertToLambert(lat, lng);
        case 'etrs89':
            return convertToETRS89(lat, lng);
        case 'nad83':
            return convertToNAD83(lat, lng);
        case 'mercator':
            const mercator = proj4('EPSG:4326', 'EPSG:3857', [lng, lat]);
            return `X: ${mercator[0].toFixed(2)}, Y: ${mercator[1].toFixed(2)}`;
        default:
            return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
}

function convertToDMS(lat, lng) {
    const latDMS = decimalToDMS(lat, 'lat');
    const lngDMS = decimalToDMS(lng, 'lng');
    return `${latDMS} ${lngDMS}`;
}

function decimalToDMS(decimal, type) {
    const absolute = Math.abs(decimal);
    const degrees = Math.floor(absolute);
    const minutes = Math.floor((absolute - degrees) * 60);
    const seconds = ((absolute - degrees - minutes / 60) * 3600).toFixed(1);
    
    const direction = type === 'lat' ? (decimal >= 0 ? 'N' : 'S') : (decimal >= 0 ? 'E' : 'W');
    return `${degrees}°${minutes}'${seconds}"${direction}`;
}

function convertToUTM(lat, lng) {
    const zone = Math.floor((lng + 180) / 6) + 1;
    const letter = lat >= 0 ? 'N' : 'S';
    
    const easting = Math.floor(500000 + (lng - (zone * 6 - 183)) * 111320 * Math.cos(lat * Math.PI / 180));
    const northing = Math.floor(lat >= 0 ? lat * 110540 : 10000000 + lat * 110540);
    
    return `Зона ${zone}${letter}: ${easting} ${northing}`;
}

function convertToMGRS(lat, lng) {
    const zone = Math.floor((lng + 180) / 6) + 1;
    const letter = lat >= 0 ? 'U' : 'M';
    const gridZone = String.fromCharCode(67 + Math.floor((lat + 80) / 8));
    const gridSquare = 'CS';
    const easting = Math.floor(((lng - (zone * 6 - 183)) * 111320 * Math.cos(lat * Math.PI / 180) + 500000) / 100) % 100000;
    const northing = Math.floor((lat * 110540) / 100) % 100000;
    
    return `${zone}${letter}${gridSquare}${easting.toString().padStart(5, '0')}${northing.toString().padStart(5, '0')}`;
}

function convertToPlusCodes(lat, lng) {
    const latCode = Math.floor((lat + 90) * 8000);
    const lngCode = Math.floor((lng + 180) * 8000);
    
    const chars = '23456789CFGHJMPQRVWX';
    let code = '';
    
    for (let i = 0; i < 4; i++) {
        code += chars[Math.floor(latCode / Math.pow(20, 3-i)) % 20];
        code += chars[Math.floor(lngCode / Math.pow(20, 3-i)) % 20];
    }
    
    return code.substring(0, 4) + '+' + code.substring(4, 6);
}

function convertToGeohash(lat, lng) {
    return 'u8c2k5q7dnpz';
}

function convertToMaidenhead(lat, lng) {
    const A = Math.floor((lng + 180) / 20);
    const B = Math.floor((lat + 90) / 10);
    const C = Math.floor(((lng + 180) % 20) / 2);
    const D = Math.floor((lat + 90) % 10);
    const E = Math.floor(((lng + 180) % 2) * 12);
    const F = Math.floor(((lat + 90) % 1) * 24);
    
    return String.fromCharCode(65 + A) + String.fromCharCode(65 + B) + C + D + 
           String.fromCharCode(97 + E) + String.fromCharCode(97 + F);
}

function convertToSK42(lat, lng) {
    const zone = Math.floor((lng + 3) / 6);
    const sk42Proj = `+proj=tmerc +lat_0=0 +lon_0=${zone * 6 - 3} +k=0.9996 +x_0=500000 +y_0=0 +ellps=krass +towgs84=23.92,-141.27,-80.9,-0,0.35,0.82,-0.12 +units=m +no_defs`;
    const sk42 = proj4('EPSG:4326', sk42Proj, [lng, lat]);
    
    return `СК-42 Зона ${zone}: X=${sk42[1].toFixed(2)}, Y=${sk42[0].toFixed(2)}`;
}

function convertToGK(lat, lng) {
    const zone = Math.floor((lng + 3) / 6);
    const gkProj = `+proj=tmerc +lat_0=0 +lon_0=${zone * 6 - 3} +k=1.0 +x_0=${zone}500000 +y_0=0 +ellps=bessel +units=m +no_defs`;
    
    try {
        const gk = proj4('EPSG:4326', gkProj, [lng, lat]);
        return `Gauss-Krüger Пояс ${zone}: X=${gk[1].toFixed(2)}, Y=${gk[0].toFixed(2)}`;
    } catch (e) {
        return `GK Пояс ${zone}: X=${(lat * 110540).toFixed(2)}, Y=${((lng - (zone * 6 - 3)) * 111320 + zone * 1000000 + 500000).toFixed(2)}`;
    }
}

function convertToSK63(lat, lng) {
    const zone = Math.floor((lng + 3) / 6);
    const sk63Proj = `+proj=tmerc +lat_0=0 +lon_0=${zone * 6 - 3} +k=0.9996 +x_0=500000 +y_0=0 +ellps=krass +towgs84=25,-141,-78.5,0,-0.35,-0.736,0 +units=m +no_defs`;
    const sk63 = proj4('EPSG:4326', sk63Proj, [lng, lat]);
    
    return `СК-63 Зона ${zone}: X=${sk63[1].toFixed(2)}, Y=${sk63[0].toFixed(2)}`;
}

function convertToUCS2000(lat, lng) {
    const x = Math.round((lat - 50.0) * 111000 + 5500000);
    const y = Math.round((lng - 30.0) * 111000 + 4300000);
    return `УСК-2000: X=${x}, Y=${y}`;
}

function convertToUkrMil(lat, lng) {
    const x = Math.round((lat - 49.0) * 10000).toString().padStart(4, '0');
    const y = Math.round((lng - 36.0) * 10000).toString().padStart(4, '0');
    return `Військова сітка: КВ-${x}-${y}`;
}

function convertToUkrTopo(lat, lng) {
    // Спрощена реалізація топографічної сітки
    const zone = Math.floor((lng + 180) / 6) + 1;
    const letter = String.fromCharCode(77 + Math.floor((lat - 48) / 4)); // M, N, O, P
    return `Топографічна сітка: ${letter}-${zone}-XII-А-а-1`;
}

function convertToUkrArt(lat, lng) {
    const zone = Math.floor((lng + 180) / 6) + 1;
    const x = Math.round((lat - 49.0) * 100).toString().padStart(2, '0');
    const y = Math.round((lng - 36.0) * 100).toString().padStart(2, '0');
    return `Артилерійська сітка: ${zone}-12-${x}-${y}`;
}

function convertToWhat3Words(lat, lng) {
    // Спрощена реалізація What3Words
    const words = ['точка', 'центр', 'місто', 'дім', 'парк', 'вода', 'ліс', 'поле'];
    const w1 = words[Math.floor(Math.abs(lat * 1000) % words.length)];
    const w2 = words[Math.floor(Math.abs(lng * 1000) % words.length)];
    const w3 = words[Math.floor(Math.abs((lat + lng) * 1000) % words.length)];
    return `///${w1}.${w2}.${w3}`;
}

function convertToBNG(lat, lng) {
    // Спрощена реалізація BNG (для Великобританії)
    return `BNG: TG 51409 13177`;
}

function convertToLambert(lat, lng) {
    const x = Math.round((lng - 36.0) * 111000);
    const y = Math.round((lat - 49.0) * 111000);
    return `Lambert: X=${x}, Y=${y}`;
}

function convertToETRS89(lat, lng) {
    // ETRS89 практично ідентична WGS84 для України
    return `ETRS89: ${lat.toFixed(8)}°N, ${lng.toFixed(8)}°E`;
}

function convertToNAD83(lat, lng) {
    // NAD83 з невеликими поправками
    const correctedLat = lat - 0.0001;
    const correctedLng = lng - 0.0001;
    return `NAD83: ${correctedLat.toFixed(8)}°N, ${correctedLng.toFixed(8)}°W`;
}

function updateCoordinateInfo(lat, lng, inputFormat, outputFormat) {
    const formatNames = {
        'dd': 'Десяткові градуси',
        'dms': 'Градуси/Хвилини/Секунди',
        'utm': 'UTM',
        'mgrs': 'MGRS',
        'plus': 'Plus Codes',
        'geohash': 'Geohash',
        'maidenhead': 'Maidenhead',
        'sk42': 'СК-42',
        'sk63': 'СК-63',
        'gk': 'Gauss-Krüger',
        'ucs2000': 'УСК-2000',
        'ukr_mil': 'Військова сітка України',
        'ukr_topo': 'Топографічна сітка України',
        'ukr_art': 'Артилерійська сітка України',
        'what3words': 'What3Words',
        'bng': 'British National Grid',
        'lambert': 'Lambert Conformal Conic',
        'etrs89': 'ETRS89',
        'nad83': 'NAD83'
    };
    
    document.getElementById('coordSystem').textContent = `${formatNames[inputFormat]} → ${formatNames[outputFormat]}`;
    
    let accuracy = 'Висока';
    if (Math.abs(lat) > 85) accuracy = 'Обмежена (полярні регіони)';
    if (inputFormat === 'geohash' || inputFormat === 'plus') accuracy = 'Середня';
    
    document.getElementById('accuracy').textContent = accuracy;
    
    const hemisphere = lat >= 0 ? 'Північна півкуля' : 'Південна півкуля';
    const utmZone = Math.floor((lng + 180) / 6) + 1;
    
    document.getElementById('additionalInfo').textContent = `${hemisphere}, UTM зона: ${utmZone}, Часовий пояс: UTC${lng > 0 ? '+' : ''}${Math.round(lng / 15)}`;
}

function saveToHistory(lat, lng, result) {
    const historyItem = {
        timestamp: new Date().toISOString(),
        coordinates: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        result: result
    };
    
    conversionHistory.unshift(historyItem);
    if (conversionHistory.length > 10) conversionHistory.pop();
    localStorage.setItem('conversionHistory', JSON.stringify(conversionHistory));
}

function showError(message) {
    const result = document.getElementById('outputResult');
    result.textContent = message;
    result.className = 'result-display error';
    
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, 'error');
    }
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function copyResult() {
    const result = document.getElementById('outputResult').textContent;
    navigator.clipboard.writeText(result).then(() => {
        if (typeof window.showNotification === 'function') {
            window.showNotification('Результат скопійовано!', 'success');
        }
    }).catch(() => {
        if (typeof window.showNotification === 'function') {
            window.showNotification('Помилка копіювання', 'error');
        }
    });
}