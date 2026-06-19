import fs from 'fs';
import https from 'https';

const WC_STATE_MAP = {
    'Amazonas': 'AMA', 'Antioquia': 'ANT', 'Arauca': 'ARA', 'Atlántico': 'ATL',
    'Bogotá D.C.': 'DC', 'Bolívar': 'BOL', 'Boyacá': 'BOY', 'Caldas': 'CAL',
    'Caquetá': 'CAQ', 'Casanare': 'CAS', 'Cauca': 'CAU', 'Cesar': 'CES',
    'Chocó': 'CHO', 'Córdoba': 'COR', 'Cundinamarca': 'CUN', 'Guainía': 'GUA',
    'Guaviare': 'GUV', 'Huila': 'HUI', 'La Guajira': 'LAG', 'Magdalena': 'MAG',
    'Meta': 'MET', 'Nariño': 'NAR', 'Norte de Santander': 'NSA', 'Putumayo': 'PUT',
    'Quindío': 'QUI', 'Risaralda': 'RIS', 'San Andrés y Providencia': 'SAP',
    'Santander': 'SAN', 'Sucre': 'SUC', 'Tolima': 'TOL', 'Valle del Cauca': 'VAC',
    'Vaupés': 'VAU', 'Vichada': 'VID'
};

https.get('https://raw.githubusercontent.com/marcovega/colombia-json/master/colombia.json', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const raw = JSON.parse(data);
            const citiesMap = {};
            
            raw.forEach(dep => {
                let depName = dep.departamento;
                if (depName === 'Bogotá') depName = 'Bogotá D.C.';
                if (depName === 'Archipiélago de San Andrés, Providencia y Santa Catalina') depName = 'San Andrés y Providencia';
                
                const code = WC_STATE_MAP[depName];
                if (code) {
                    citiesMap[code] = dep.ciudades.sort();
                } else {
                    console.log('No code found for:', depName);
                }
            });

            fs.writeFileSync('src/lib/colombiaCities.json', JSON.stringify(citiesMap, null, 2));
            console.log('Created src/lib/colombiaCities.json with', Object.keys(citiesMap).length, 'departments.');
        } catch (e) {
            console.error('Error parsing JSON:', e.message);
            console.log('Raw data sample:', data.substring(0, 200));
        }
    });
});
