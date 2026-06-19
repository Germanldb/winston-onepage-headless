import fs from 'fs';
import https from 'https';

const WC_STATE_MAP = {
    'Amazonas': 'AMA', 'Antioquia': 'ANT', 'Arauca': 'ARA', 'Atlántico': 'ATL',
    'Bogotá D.C.': 'DC', 'Bolívar': 'BOL', 'Boyacá': 'BOY', 'Caldas': 'CAL',
    'Caquetá': 'CAQ', 'Casanare': 'CAS', 'Cauca': 'CAU', 'Cesar': 'CES',
    'Chocó': 'CHO', 'Córdoba': 'COR', 'Cundinamarca': 'CUN', 'Guainía': 'GUA',
    'Guaviare': 'GUV', 'Huila': 'HUI', 'La Guajira': 'LAG', 'Magdalena': 'MAG',
    'Meta': 'MET', 'Nariño': 'NAR', 'Norte de Santander': 'NSA', 'Putumayo': 'PUT',
    'Quindío': 'QUI', 'Risaralda': 'RIS', 'Archipiélago de San Andrés, Providencia y Santa Catalina': 'SAP',
    'Santander': 'SAN', 'Sucre': 'SUC', 'Tolima': 'TOL', 'Valle del Cauca': 'VAC',
    'Vaupés': 'VAU', 'Vichada': 'VID'
};

https.get('https://www.datos.gov.co/resource/xdk5-pm3f.json?$limit=2000', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const raw = JSON.parse(data);
        const citiesMap = {};
        
        raw.forEach(item => {
            let depName = item.departamento;
            // Handle differences
            if (depName === 'Bogotá, D.C.') depName = 'Bogotá D.C.';
            
            const code = WC_STATE_MAP[depName];
            if (code) {
                if (!citiesMap[code]) citiesMap[code] = [];
                citiesMap[code].push(item.municipio);
            }
        });

        // Sort cities
        Object.keys(citiesMap).forEach(k => {
            citiesMap[k] = [...new Set(citiesMap[k])].sort();
        });

        fs.writeFileSync('src/lib/colombiaCities.json', JSON.stringify(citiesMap, null, 2));
        console.log('Created src/lib/colombiaCities.json with', Object.keys(citiesMap).length, 'departments.');
    });
});
