const parser = new DOMParser();

// Async function used to retrieve start and end time from RADAR_1KM_RRAI layer GetCapabilities document
async function getRadarStartEndTime() {
  let response = await fetch('https://geo.weather.gc.ca/geomet/?lang=en&service=WMS&request=GetCapabilities&version=1.3.0&LAYERS=RADAR_1KM_RRAI&t=' + new Date().getTime())
  let data = await response.text().then(
    data => {
      let xml = parser.parseFromString(data, 'text/xml');
      let [start, end] = xml.getElementsByTagName('Dimension')[0].innerHTML.split('/');
      let default_ = xml.getElementsByTagName('Dimension')[0].getAttribute('default');
      return [start, end, default_];
    }
  )
  return [new Date(data[0]), new Date(data[1]), new Date(data[2])];
}

let frameRate = 1.0;
let animationId = null;
let startTime = null;
let endTime = null;
let defaultTime = null;
let currentTime = null;
let temperatureLayer;
let airQualityLayer;

let layers = [
  new ol.layer.Tile({
    source: new ol.source.OSM()
  }),
  new ol.layer.Image({
    source: new ol.source.ImageWMS({
      format: 'image/png',
      url: 'https://geo.weather.gc.ca/geomet/',
      params: {'LAYERS': 'RADAR_1KM_RRAI', 'TILED': true},
      crossOrigin: 'Anonymous'
    })
  }),
  new ol.layer.Image({
    source: new ol.source.ImageWMS({
      format: 'image/png',
      url: 'https://geo.weather.gc.ca/geomet/',
      params: {'LAYERS': 'RADAR_COVERAGE_RRAI.INV', 'TILED': true},
      transition: 0,
      crossOrigin: 'Anonymous'
    })
  }),
  temperatureLayer = new ol.layer.Tile({
    opacity: 0.4,
    source: new ol.source.TileWMS({
      url: 'https://geo.weather.gc.ca/geomet/',
      params: {'LAYERS': 'GDPS.ETA_TT', 'TILED': true},
      transition: 0,
      crossOrigin: 'Anonymous'
    })
  }),
  // new ol.layer.Image({
  //   source: new ol.source.ImageWMS({
  //     format: 'image/png',
  //     url: 'https://geo.weather.gc.ca/geomet/',
  //     params: {'LAYERS': 'RADAR_COVERAGE_RRAI.INV', 'TILED': true},
  //     transition: 0,
  //     crossOrigin: 'Anonymous'
  //   })
  // }),
  
];

let map = new ol.Map({
  target: 'map',
  layers: layers,
  view: new ol.View({
    center: ol.proj.fromLonLat([-120.33, 50.7]),
    zoom: 9
  })
});

let temperatureCanvas = document.createElement('canvas');
temperatureCanvas.setAttribute('id', 'temperature-canvas');
temperatureCanvas.style.position = 'absolute';
temperatureCanvas.style.top = '0';
temperatureCanvas.style.left = '0';
temperatureCanvas.width = map.getSize()[0];
temperatureCanvas.height = map.getSize()[1];
document.getElementById('map').appendChild(temperatureCanvas);


// If the image couldn't load due to a change in the time extent, get the new time extent
layers[1].getSource().on("imageloaderror", () => {
  getRadarStartEndTime().then(data => {
    currentTime = startTime = data[0];
    endTime = data[1];
    defaultTime = data[2];
    updateLayers();
    updateInfo();
    updateButtons();
  })
});

function updateLayers() {
  layers[1].getSource().updateParams({'TIME': currentTime.toISOString().split('.')[0]+"Z"});
  layers[2].getSource().updateParams({'TIME': currentTime.toISOString().split('.')[0]+"Z"});
}
function updateInfo() {
  let el = document.getElementById('info');
  el.innerHTML = `Time / Heure: ${currentTime.toISOString().substr(0, 16) + "Z"}`;
}


function displayTemperatureValues() {
  let mapSize = map.getSize();
  let temperatureSource = temperatureLayer.getSource();

  let ctx = temperatureCanvas.getContext('2d');
  ctx.clearRect(0, 0, mapSize[0], mapSize[1]);

  temperatureSource.on('tileloadend', function () {
    let temperatureFeatures = temperatureSource.getFeatures();
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'white';

    temperatureFeatures.forEach(function (feature) {
      let temperatureValue = feature.get('temperature');
      let geometry = feature.getGeometry();
      let coordinate = geometry.getCoordinates();
      let pixel = map.getPixelFromCoordinate(coordinate);
      let extent = geometry.getExtent();
      let pixelRatio = map.getPixelRatio();
      let textX = (pixel[0] - extent[0]) / pixelRatio + extent[0];
      let textY = (pixel[1] - extent[1]) / pixelRatio + extent[1];

      ctx.fillText(temperatureValue, textX, textY);
    });
  });
}








function clearTemperatureValues() {
  let ctx = temperatureCanvas.getContext('2d');
  ctx.clearRect(0, 0, temperatureCanvas.width, temperatureCanvas.height);
}





function toggleTemperatureLayer() {
  temperatureLayer.setVisible(!temperatureLayer.getVisible());

  if (temperatureLayer.getVisible()) {
    displayTemperatureValues();
  } else {
    clearTemperatureValues();
  }
}



function toggleAirQualityLayer() {
  airQualityLayer.setVisible(!airQualityLayer.getVisible());
}


// Disable/enable buttons depending on the state of the map
function updateButtons() {
  if (animationId !== null) {
    disableButtons([fastBackwardButton, stepBackwardButton, stepForwardButton, fastForwardButton]);
    enableButtons([playPauseButton]);
  } else {
    if (currentTime <= startTime) {
      disableButtons([fastBackwardButton, stepBackwardButton]);
      enableButtons([playPauseButton, stepForwardButton, fastForwardButton]);
    } else if (currentTime >= endTime) {
      disableButtons([playPauseButton, stepForwardButton, fastForwardButton]);
      enableButtons([fastBackwardButton, stepBackwardButton]);
    } else {
      enableButtons([fastBackwardButton, stepBackwardButton, playPauseButton, stepForwardButton, fastForwardButton]);
    }
  }
}

function disableButtons(buttons) {
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].disabled = true;
  }
}

function enableButtons(buttons) {
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].disabled = false;
  }
}

function setTime() {
  if (currentTime >= endTime) {
    currentTime = endTime;
    togglePlayPause();
  } else {
    currentTime = new Date(currentTime);
    currentTime.setUTCMinutes(currentTime.getUTCMinutes() + 6);
  }
  updateLayers();
  updateInfo();
}

function togglePlayPause() {
  if (animationId !== null) {
    playPauseButton.firstElementChild.className = "fa fa-play";
    window.clearInterval(animationId);
    animationId = null;
    updateButtons();
  } else {
    playPauseButton.firstElementChild.className = "fa fa-pause";
    animationId = window.setInterval(setTime, 500 / frameRate);
    updateButtons();
  }
}

function fastBackward() {
  if (animationId == null && currentTime > startTime) {
    getRadarStartEndTime().then(data => {
      currentTime = startTime = data[0];
      endTime = data[1];
      defaultTime = data[2];
      updateLayers();
      updateInfo();
      updateButtons();
    });
  }
}

function stepBackward() {
  if (animationId == null && currentTime > startTime) {
    currentTime = new Date(currentTime);
    currentTime.setUTCMinutes(currentTime.getUTCMinutes() - 6);
    if (currentTime.getTime() === startTime.getTime()) {
      getRadarStartEndTime().then(data => {
        currentTime = startTime = data[0];
        endTime = data[1];
        defaultTime = data[2];
        updateLayers();
        updateInfo();
        updateButtons();
      });
    } else {
      updateLayers();
      updateInfo();
      updateButtons();
    }
  }
}

function stepForward() {
  if (animationId == null && currentTime < endTime) {
    currentTime = new Date(currentTime);
    currentTime.setUTCMinutes(currentTime.getUTCMinutes() + 6);
    updateLayers();
    updateInfo();
    updateButtons();
  }
}

function fastForward() {
  if (animationId == null && currentTime < endTime) {
    currentTime = new Date(endTime);
    updateLayers();
    updateInfo();
    updateButtons();
  }
}

function toggleLayers() {
  let layer = layers[1]; // Assuming you want to toggle the visibility of the second layer
  layer.setVisible(!layer.getVisible());
}

let fastBackwardButton = document.getElementById('fast-backward');
fastBackwardButton.addEventListener('click', fastBackward, false);

let stepBackwardButton = document.getElementById('step-backward');
stepBackwardButton.addEventListener('click', stepBackward, false);

let playPauseButton = document.getElementById('play-pause');
playPauseButton.addEventListener('click', togglePlayPause, false);

let stepForwardButton = document.getElementById('step-forward');
stepForwardButton.addEventListener('click', stepForward, false);

let fastForwardButton = document.getElementById('fast-forward');
fastForwardButton.addEventListener('click', fastForward, false);

let toggleLayerButton = document.getElementById('toggle-layers');
toggleLayerButton.addEventListener('click', toggleLayers, false);

let toggleTemperatureButton = document.getElementById('toggle-temperature');
toggleTemperatureButton.addEventListener('click', toggleTemperatureLayer, false);

// let toggleAirQualityButton = document.getElementById('toggle-air-quality');
// toggleAirQualityButton.addEventListener('click', toggleAirQualityLayer, false);


// Initialize the map
function initMap() {
  getRadarStartEndTime().then(data => {
    startTime = data[0];
    endTime = data[1];
    currentTime = defaultTime = data[2];
    updateLayers();
    updateInfo();
    updateButtons();
  });
}

initMap();