import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import BookSearch from "./BookSearch";

// Definir la interfaz para los libros
interface Book {
    title: string;
    author_name: string[];
    key: string;
}

const Map: React.FC = () => {
    const [books, setBooks] = React.useState<Book[]>([]);

    const handleSearchResults = (books: Book[]) => {
        setBooks(books);
    };

    // Coordenadas de varias ciudades de España
    const citiesCoordinates: { [city: string]: LatLngExpression } = {
        Madrid: [40.4168, -3.7038],
        Barcelona: [41.3784, 2.1925],
        Valencia: [39.4699, -0.3763],
        Sevilla: [37.3886, -5.9823],
        Zaragoza: [41.6488, -0.8891],
        Málaga: [36.7213, -4.4214],
        Bilbao: [43.2630, -2.9350],
        Alicante: [38.3452, -0.4810],
    };

    // Función para obtener una coordenada aleatoria
    const getRandomCoordinates = (): LatLngExpression => {
        const cityNames = Object.keys(citiesCoordinates);
        const randomCity = cityNames[Math.floor(Math.random() * cityNames.length)];
        return citiesCoordinates[randomCity];
    };

    return (
        <div>
            <BookSearch onSearchResults={handleSearchResults} />
            <MapContainer center={[40.4168, -3.7038]} zoom={6} style={{ height: '500px', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {books.map((book) => (
                    // Asignamos coordenadas aleatorias a cada libro
                    <Marker key={book.key} position={getRandomCoordinates()}>
                        <Popup>
                            <h3>{book.title}</h3>
                            <p>{book.author_name?.join(', ')}</p>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default Map;
