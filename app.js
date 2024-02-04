var map = L.map('map').setView([45.5017, -73.5673], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

var markers = [];
var selectedMarkerIcon = L.icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

var defaultMarkerIcon = L.icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

var points = [
    { name: "Point A", coordinates: [45.508, -73.567] },
    { name: "Point B", coordinates: [45.52, -73.55] },
    { name: "Point C", coordinates: [45.495, -73.58] },
    { name: "Point D", coordinates: [45.51, -73.55] },
    { name: "Point E", coordinates: [45.515, -73.565] }
];

var distances = [];

for (var i = 0; i < points.length; i++) {
    for (var j = i + 1; j < points.length; j++) {
        getDistanceBetweenTwoPoints(points[i].coordinates, points[j].coordinates, i, j);
    }
}

points.forEach(function(point) {
    var marker = L.marker(point.coordinates, { icon: defaultMarkerIcon }).addTo(map);
    marker.bindPopup(point.name);

    marker.on('click', function(event) {
        if (markers.length < 2) {
            markers.push(marker);
            marker.setIcon(selectedMarkerIcon);
            if (markers.length === 2) {
                routingControl = L.Routing.control({
                    waypoints: [
                        markers[0].getLatLng(),
                        markers[1].getLatLng()
                    ],
                    routeWhileDragging: true
                }).addTo(map);

                routingControl.on('routesfound', function(e) {
                    var routes = e.routes;
                    var distance = routes[0].summary.totalDistance / 1000; // Distance en Km
                    console.log("Distance entre les marqueurs:", markers[0]._popup._content, markers[1]._popup._content, distance.toFixed(2), "Km");
                });
            }
        } else {
            markers[0].setIcon(defaultMarkerIcon);
            markers.shift();
            markers.push(marker);
            marker.setIcon(selectedMarkerIcon);
            routingControl.setWaypoints([
                markers[0].getLatLng(),
                markers[1].getLatLng()
            ]);
        }
    });
    
});


async function getDistanceBetweenTwoPoints(pointA, pointB, indexA, indexB) {
    var response = await fetch(`http://router.project-osrm.org/route/v1/driving/${pointA[1]},${pointA[0]};${pointB[1]},${pointB[0]}?overview=false`);
    var data = await response.json();
    var distance = data.routes[0].distance;
    distances.push({ indices: [indexA, indexB], distance: distance });
    console.log("Distance entre", points[indexA].name, "et", points[indexB].name, ":", distance.toFixed(2), "m");
// save to local storage the distances between the points and the names of the points
    localStorage.setItem('distances', JSON.stringify(distances));
    localStorage.setItem('points', JSON.stringify(points));

    //write une matrice de distance avec le nom des points en ligne et en colonne
    var distanceMatrix = [];
    for (var i = 0; i < points.length; i++) {
        distanceMatrix[i] = [];
        for (var j = 0; j < points.length; j++) {
            distanceMatrix[i][j] = 0;
        }
    }
    distances.forEach(function(distance) {
        distanceMatrix[distance.indices[0]][distance.indices[1]] = distance.distance;
        distanceMatrix[distance.indices[1]][distance.indices[0]] = distance.distance;
    });

    console.log("Matrice de distance:", distanceMatrix);
}
