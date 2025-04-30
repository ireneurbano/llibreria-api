import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import BookSearch from "./BookSearch";
import { Book } from "./BookSearch";
import MoveMap from "./MoveMap";

// Coordenadas de los lugares de nacimiento de autores
const CITY_COORDINATES: Record<string, [number, number]> = {
    // Europa
    Madrid: [40.4168, -3.7038],        // Madrid, España
    Barcelona: [41.3851, 2.1734],      // Barcelona, España
    Mallorca: [39.6953, 3.0176],       // Mallorca, España
    España: [40.4637, -3.7492],        // España (centro aproximado)
    Londres: [51.5074, -0.1278],       // Londres, Reino Unido
    Yate: [51.5416, -2.4143],          // Yate, Reino Unido (Gloucestershire)
    París: [48.8566, 2.3522],          // París, Francia
    Roma: [41.9028, 12.4964],          // Roma, Italia
    Berlín: [52.5200, 13.4050],        // Berlín, Alemania
    
    // América
    BuenosAires: [-34.6037, -58.3816],
    Argentina: [-38.4161, -63.6167],  
    Cordoba: [-31.4135, -64.1810],  
    México: [19.4326, -99.1332],      
    NuevaYork: [40.7128, -74.0060], 
    Northcote: [37.7722, 144.9994],
    Rodesia: [-19.0154, 29.1549],
    Nuremberg: [49.4521, 11.0767],

   // Nueva York, Estados Unidos
    
    // Asia
    Tokio: [35.6762, 139.6503],        // Tokio, Japón
    
    // Desconocido
    Desconocida: [40.4168, -3.7038]    // Valor por defecto (Madrid)
};

const Map: React.FC = () => {
    const [books, setBooks] = React.useState<Book[]>([]);
    const [mapCenter, setMapCenter] = React.useState<[number, number]>([40.4168, -3.7038]);
    const [markerPosition, setMarkerPosition] = React.useState<[number, number] | null>(null);
    const [authorBirthPlace, setAuthorBirthPlace] = React.useState<string | null>(null);

    // Normalizar el lugar de nacimiento para que coincida con las claves
    const normalizeString = (str: string): string => {
        const normalized = str
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim()
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
            .replace(/\s+/g, " ");
            
        return normalized
            .replace(/(city|ciudad|town|municipality|province|county|district|state|of|de|del|la|el|the|republic|república)/g, "")
            .trim();
    };

    // Obtener las coordenadas según el lugar de nacimiento
    const getCoordinatesForPlace = (place: string): [number, number] => {
        const normalizedPlace = normalizeString(place);
        console.log("[Map] Buscando coordenadas para:", place, "- Normalizado:", normalizedPlace);
        
        // Buscar correspondencias exactas primero
        for (const [key, value] of Object.entries(CITY_COORDINATES)) {
            const normalizedKey = normalizeString(key);
            if (normalizedKey === normalizedPlace) {
                console.log("[Map] Coincidencia exacta encontrada:", key);
                return value;
            }
        }
        
        // Buscar correspondencias parciales
        for (const [key, value] of Object.entries(CITY_COORDINATES)) {
            const normalizedKey = normalizeString(key);
            if (normalizedPlace.includes(normalizedKey) || 
                normalizedKey.includes(normalizedPlace)) {
                console.log("[Map] Coincidencia parcial encontrada:", key);
                return value;
            }
        }
        
        // Países específicos
        if (normalizedPlace.includes("argentin")) {
            console.log("[Map] Detectado Argentina");
            return CITY_COORDINATES.Argentina;
        } else if (normalizedPlace.includes("españ") || normalizedPlace.includes("spain")) {
            console.log("[Map] Detectado España");
            return CITY_COORDINATES.España;
        }
        
        // Si no se encuentra ninguna coincidencia, devolver coordenadas desconocidas
        console.log("[Map] No se encontraron coincidencias, usando ubicación por defecto");
        return CITY_COORDINATES.Desconocida;
    };
    
    // Efecto para actualizar el centro del mapa cuando cambia el lugar de nacimiento
    useEffect(() => {
        if (authorBirthPlace) {
            console.log("[Map] Actualizando mapa con lugar de nacimiento:", authorBirthPlace);
            const coordinates = getCoordinatesForPlace(authorBirthPlace);
            console.log("[Map] Coordenadas encontradas:", coordinates);
            
            // Actualizar centro y marcador
            setMapCenter(coordinates);
            setMarkerPosition(coordinates);
        }
    }, [authorBirthPlace]);

    return (
        <div style={{ height: '100vh', width: '100%' }}>
            <BookSearch
                onSearchResults={(results) => {
                    console.log("[Map] Resultados de búsqueda recibidos", results);
                    setBooks(results);
                }}
                onUpdateMarker={(lat, lng, birthPlace) => {
                    console.log("[Map] Actualizando información del autor:", birthPlace);
                    setAuthorBirthPlace(birthPlace);
                }}
                onMapMove={(lat, lng) => {
                    console.log("[Map] Movimiento manual del mapa:", lat, lng);
                    setMapCenter([lat, lng]);
                }}
            />
            <MapContainer
                center={mapCenter}
                zoom={5}
                style={{ height: '100%', width: '100%' }}
            >
                <MoveMap center={mapCenter} />
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                {/* Solo mostrar el marcador si hay libros disponibles */}
                {books.length > 0 && markerPosition && (
                    <Marker key={books[0].key} position={markerPosition}>
                        <Popup>
                            <div style={{ minWidth: '250px' }}>
                                <h3>{books[0]?.title}</h3> {/* Nombre del libro */}
                                <p><strong>Autor:</strong> {books[0]?.author_name?.join(', ')}</p> {/* Nombre del autor */}
                                <p><strong>Lugar de nacimiento del autor:</strong> {books[0]?.author_birth_place}</p> {/* Lugar de nacimiento */}
                            </div>
                        </Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    );
};

export default Map;
