import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { LatLngExpression } from "leaflet";

const Map: React.FC = () => {
    const position: LatLngExpression = [51.505, -0.09]; // Example coordinates for London
    
    return(
        <MapContainer center={position} zoom={13} style={{height: "100vh", width: "100vw"}} >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={position}>
                <Popup> ¡Hola! </Popup>
            </Marker>
        </MapContainer>
    );
};

export default Map;