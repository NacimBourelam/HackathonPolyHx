package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os/exec"

	routing "cloud.google.com/go/maps/routing/apiv2"
	"cloud.google.com/go/maps/routing/apiv2/routingpb"
	"google.golang.org/api/option"
	"google.golang.org/genproto/googleapis/type/latlng"
	"google.golang.org/grpc/metadata"
)

type Point struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

type PointList struct {
	Points []Point
}

func TestHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Add("Content-type", "application/json")
	w.Header().Add("Access-Control-Allow-Origin", "*")
	w.Write([]byte("{\"x\":34,\"y\":45}"))
}

func AlgoHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Add("Content-type", "application/json")
	w.Header().Add("Access-Control-Allow-Origin", "*")
	w.Header().Add("Access-Control-Allow-Methods", "POST, GET")
	w.Header().Add("Access-Control-Allow-Headers", "*")
	r.ParseForm()
	var points PointList
	if err := json.NewDecoder(r.Body).Decode(&points.Points); err != nil {
		log.Fatalf("Error happened in JSON Decoding. Err: %s", err)
	}

	newPoints, err := SolveTSPPython(points)
	if err != nil {
		log.Fatalf("Error happened in Algo Err: %s", err)
	}

	jsonPoints, err := json.Marshal(newPoints)
	if err != nil {
		log.Fatalf("Error happened in JSON Marhsal. Err: %s", err)
	}
	w.Write(jsonPoints)
	return

}

func MapHandler(w http.ResponseWriter, r *http.Request, ctx context.Context, client *routing.RoutesClient) {

	w.Header().Add("Content-type", "application/json")
	w.Header().Add("Access-Control-Allow-Origin", "*")
	w.Header().Add("Access-Control-Allow-Methods", "POST, GET")
	w.Header().Add("Access-Control-Allow-Headers", "*")
	r.ParseForm()
	var points PointList
	if err := json.NewDecoder(r.Body).Decode(&points.Points); err != nil {
		log.Fatalf("Error happened in JSON Decoding. Err: %s", err)
	}

	compute := SetApiRequest(points)

	ctx = metadata.AppendToOutgoingContext(ctx, "X-Goog-FieldMask", "*")
	computeRoutesResponse, err := client.ComputeRoutes(ctx, &compute)
	if err != nil {
		log.Fatalf("Error happened in JSON Marhsal. Err: %s", err)
	}

	var newPoints PointList
	newPoints.Points = append(newPoints.Points, points.Points[0])
	for _, v := range computeRoutesResponse.Routes {
		for _, index := range v.OptimizedIntermediateWaypointIndex {
			println(index)
			newPoints.Points = append(newPoints.Points, points.Points[1+index])
		}
		println()
	}
	newPoints.Points = append(newPoints.Points, points.Points[len(points.Points)-1])

	jsonPoints, err := json.Marshal(newPoints)
	if err != nil {
		log.Fatalf("Error happened in JSON Marhsal. Err: %s", err)
	}
	w.Write(jsonPoints)

}

func SolveTSPPython(points PointList) (*PointList, error) {
	marshalledPoints, err := json.Marshal(points)
	if err != nil {
		return nil, err
	}
	cmd := exec.Command("python3", "test.py", string(marshalledPoints))
	out, err := cmd.Output()

	if err != nil {
		return nil, err
	}

	var pointList PointList
	if err = json.Unmarshal(out, &pointList); err != nil {
		return nil, err
	}
	return &pointList, nil
}

func SetApiRequest(points PointList) routingpb.ComputeRoutesRequest {
	origin := Point{points.Points[0].X, points.Points[0].Y}
	destination := Point{points.Points[len(points.Points)-1].X, points.Points[len(points.Points)-1].Y}
	var intermediates []*routingpb.Waypoint
	for i := 1; i < len(points.Points)-1; i++ {
		intermediates = append(intermediates,
			&routingpb.Waypoint{
				LocationType: &routingpb.Waypoint_Location{
					Location: &routingpb.Location{
						LatLng: &latlng.LatLng{
							Latitude:  float64(points.Points[i].X),
							Longitude: float64(points.Points[i].Y),
						},
					},
				},
			})
	}

	computeRoutesReq := routingpb.ComputeRoutesRequest{
		Origin: &routingpb.Waypoint{
			LocationType: &routingpb.Waypoint_Location{
				Location: &routingpb.Location{
					LatLng: &latlng.LatLng{
						Latitude:  float64(origin.X),
						Longitude: float64(origin.Y),
					},
				},
			},
		},
		Destination: &routingpb.Waypoint{
			LocationType: &routingpb.Waypoint_Location{
				Location: &routingpb.Location{
					LatLng: &latlng.LatLng{
						Latitude:  float64(destination.X),
						Longitude: float64(destination.Y),
					},
				},
			},
		},
		Intermediates:         intermediates,
		RoutingPreference:     routingpb.RoutingPreference_ROUTING_PREFERENCE_UNSPECIFIED,
		TravelMode:            routingpb.RouteTravelMode_DRIVE,
		OptimizeWaypointOrder: true,
	}

	return computeRoutesReq
}

func main() {

	ctx := context.Background()
	client, err := routing.NewRoutesClient(ctx, option.WithAPIKey(("API")))
	if err != nil {
		fmt.Println(err)
	}
	defer client.Close()
	http.HandleFunc("/algo", AlgoHandler)
	http.HandleFunc("/test", TestHandler)
	http.HandleFunc("/map", func(w http.ResponseWriter, r *http.Request) {
		MapHandler(w, r, ctx, client)
	})

	http.ListenAndServe(":3000", nil)
	fmt.Print("XDDD")
}
