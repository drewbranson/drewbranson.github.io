// Initialize the map
var map = L.map('map').setView([50.674522, -120.32726739999998], 10);

// Add the tile layer (Google Satellite)
L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    detectRetina: true
}).addTo(map);