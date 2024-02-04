var map = L.map('map').setView([45.5017, -73.5673], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let markers = [];
let routingControls = [];
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

// var points = [
//     { name: "Point A", coordinates: [45.508, -73.567] },
//     { name: "Point B", coordinates: [45.52, -73.55] },
//     { name: "Point C", coordinates: [45.495, -73.58] },
//     { name: "Point D", coordinates: [45.51, -73.55] },
//     { name: "Point E", coordinates: [45.515, -73.565] },
//     { name: "Point XD", coordinates: [45.615, -73.565] }
// ];

var distances = [];

// points.forEach(function(point) {
//     // var marker = L.marker(point.coordinates, { icon: defaultMarkerIcon }).addTo(map);
//     // marker.bindPopup(point.name);

    
// });

let counter = 0;
// let routingControl = L.Routing.control({})
map.on('click', (e)=>{
    console.log("test")
    let marker = L.marker(e.latlng  , { icon: defaultMarkerIcon }).addTo(map);
    marker.bindPopup(counter++);
    markers.push(marker)

    let routingControl = L.Routing.control({
        waypoints : markers.map((v)=>v.getLatLng()),
        routeWhileDragging: true,
    }).addTo(map)
    routingControls.push(routingControl)

    // marker.on('click', (event) => {
        // if (markers.length < 2) {
            // markers.push(marker);
            // marker.setIcon(selectedMarkerIcon);
            // if (markers.length === 2) {
            //     routingControl = L.Routing.control({
            //         waypoints: [
            //             markers[0].getLatLng(),
            //             markers[1].getLatLng()
            //         ],
            //         routeWhileDragging: true
            //     }).addTo(map);

            //     routingControl.on('routesfound', function(e) {
            //         var routes = e.routes;
            //         var distance = routes[0].summary.totalDistance / 1000; // Distance en Km
            //         console.log("Distance entre les marqueurs:", markers[0]._popup._content, markers[1]._popup._content, distance.toFixed(2), "Km");
            //         distances.push({
            //             from: markers[0]._popup._content,
            //             to: markers[1]._popup._content,
            //             distance: distance
            //         });
            //     });
            // }
        // } else {
        //     markers[0].setIcon(defaultMarkerIcon);
        //     markers.shift();
        //     markers.push(marker);
        //     marker.setIcon(selectedMarkerIcon);
        //     routingControl.setWaypoints([
        //         markers[0].getLatLng(),
        //         markers[1].getLatLng()
        //     ]);
        // }
    // });
})


document.getElementById('reset-button').addEventListener('click', (e)=>{
    markers.forEach((v)=>{
        v.removeFrom(map)
    })
    routingControls.forEach((v)=>{
        v.remove()
    })
    markers = []
    routingControls = []
});

document.getElementById('optimize-button').addEventListener('click', (e)=>{
    let pointsToSend = markers.map((v)=>{
        let coords = v.getLatLng()
        return {x : coords.lat, y : coords.lng}
    })
    fetch("http://localhost:3000/map", {
        method: 'POST',
        body: JSON.stringify(pointsToSend)
    }).then((response)=>response.json()).then(
        (points) => {
            console.log(points)
            markers.forEach((v)=>{
                v.removeFrom(map)
            });
            routingControls.forEach((v)=>{
                v.remove()
            })
            markers = []
            routingControls = []
            points.Points.forEach((point, index)=>{
                let marker = L.marker({lat:point.x, lng:point.y}  , { icon: defaultMarkerIcon }).addTo(map);
                marker.bindPopup(counter++);
                markers.push(marker)

            })    
            let routingControl = L.Routing.control({
                waypoints : markers.map((v)=>v.getLatLng()),
                routeWhileDragging: true,
            }).addTo(map)
            routingControls.push(routingControl);
        }
    )
})