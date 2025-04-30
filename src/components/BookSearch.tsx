import React, { useState, useEffect } from "react";
import axios from "axios";

export interface Book {
    key: string;
    title: string;
    author_name: string[];
    author_birth_place?: string;
}

interface BookSearchProps {
    onSearchResults: (books: Book[]) => void;
    onMapMove: (lat: number, lng: number) => void;
    onUpdateMarker: (lat: number, lng: number, authorBirthPlace: string) => void;  // Función para actualizar el marcador
}

const BookSearch: React.FC<BookSearchProps> = ({ onSearchResults, onMapMove, onUpdateMarker }) => {
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Coordenadas de ciudades y lugares de nacimiento conocidos
    const cityCoordinates: Record<string, { lat: number; lng: number }> = {
        "barcelona": { lat: 41.3851, lng: 2.1734 },
        "madrid": { lat: 40.4168, lng: -3.7038 },
        "londres": { lat: 51.5074, lng: -0.1278 },
        "northcote": {lat: 37.7722, lng: 144.9994},
        "nuremberg": {lat: 49.4521, lng: 11.0767},
        "Rodesia": {lat: -19.0154, lng: 29.1549},
        "paris": { lat: 48.8566, lng: 2.3522 },
        "nueva york": { lat: 40.7128, lng: -74.0060 },
        "mexico": { lat: 19.4326, lng: -99.1332 },
        "buenos aires": { lat: -34.6037, lng: -58.3816 },
        "roma": { lat: 41.9028, lng: 12.4964 },
        "yate": { lat: 51.5407, lng: -2.4184 },
        "berlin": { lat: 52.5200, lng: 13.4050 },
        "tokio": { lat: 35.6762, lng: 139.6503 },
        "mallorca": { lat: 39.6953, lng: 3.0176 },  // Mallorca, España
        "palma": { lat: 39.5696, lng: 2.6502 },
        "lugar de nacimiento desconocido": { lat: 39.3262, lng: -4.8381 },
        "desconocida": { lat: 39.3262, lng: -4.8381 }    // Coordenadas para un lugar desconocido
    };

    const normalizeString = (str: string) => {
        // Eliminar signos de puntuación y caracteres especiales
        const normalized = str
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim()
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
            .replace(/\s+/g, " ");
        
        // Eliminar palabras comunes que pueden aparecer en nombres de lugares
        return normalized
            .replace(/(city|ciudad|town|municipality|province|county|district|state|of|de|del|la|el|the|republic|república)/g, "")
            .trim();
    };

    // Función para obtener el lugar de nacimiento del autor desde DBpedia
    const getAuthorBirthPlace = async (authorName: string): Promise<string> => {
        // Usar múltiples patrones de consulta para aumentar las posibilidades de encontrar al autor
        const query = `
            PREFIX dbo: <http://dbpedia.org/ontology/>
            PREFIX dbp: <http://dbpedia.org/property/>
            PREFIX foaf: <http://xmlns.com/foaf/0.1/>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
            PREFIX schema: <http://schema.org/>

            SELECT ?birthPlaceLabel WHERE {
              {
                ?person a dbo:Person ;
                       foaf:name ?name ;
                       dbo:birthPlace ?birthPlace .
                ?birthPlace rdfs:label ?birthPlaceLabel .
                FILTER(CONTAINS(LCASE(?name), LCASE("${authorName}")))
                FILTER(LANG(?birthPlaceLabel) = "en" || LANG(?birthPlaceLabel) = "es")
              }
              UNION
              {
                ?person a dbo:Person ;
                        rdfs:label ?label ;
                        dbo:birthPlace ?birthPlace .
                ?birthPlace rdfs:label ?birthPlaceLabel .
                FILTER(CONTAINS(LCASE(?label), LCASE("${authorName}")))
                FILTER(LANG(?birthPlaceLabel) = "en" || LANG(?birthPlaceLabel) = "es")
              }
              UNION
              {
                ?person a dbo:Writer ;
                        rdfs:label ?label ;
                        dbo:birthPlace ?birthPlace .
                ?birthPlace rdfs:label ?birthPlaceLabel .
                FILTER(CONTAINS(LCASE(?label), LCASE("${authorName}")))
                FILTER(LANG(?birthPlaceLabel) = "en" || LANG(?birthPlaceLabel) = "es")
              }
              UNION
              {
                ?person a dbo:Person ;
                        rdfs:label ?label ;
                        dbp:birthPlace ?birthPlace .
                ?birthPlace rdfs:label ?birthPlaceLabel .
                FILTER(CONTAINS(LCASE(?label), LCASE("${authorName}")))
                FILTER(LANG(?birthPlaceLabel) = "en" || LANG(?birthPlaceLabel) = "es")
              }
            }
            LIMIT 1
        `;

        const url = 'https://dbpedia.org/sparql';
        const params = {
            query,
            format: 'json'
        };

        try {
            console.log(`Buscando lugar de nacimiento para: ${authorName}`);
            interface DBPediaResponse {
                results: {
                    bindings: {
                        birthPlaceLabel: { value: string };
                    }[];
                };
            }

            const response = await axios.get<DBPediaResponse>(url, { params });
            const bindings = response.data.results.bindings;
            
            if (bindings.length > 0) {
                return bindings[0].birthPlaceLabel.value;
            } else {
                console.log(`No birth place found for author: ${authorName}`);
                return "Lugar de nacimiento desconocido";
            }
        } catch (error) {
            console.error('Error al obtener el lugar de nacimiento:', error);
            return "Lugar de nacimiento desconocido";
        }
    };

    const handleSearch = async () => {
        if (!title.trim()) {
            setError("Por favor, ingresa un título de libro.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Buscar en OpenLibrary
            const olResponse = await axios.get<{ docs: { title: string; author_name?: string[]; key: string }[] }>(
                `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=1`
            );

            if (!olResponse.data.docs?.length) {
                setError("No se encontraron libros con este título.");
                return;
            }

            const olBook = olResponse.data.docs[0];
            const author = olBook.author_name?.[0];

            if (!author) {
                const book: Book = {
                    title: olBook.title,
                    author_name: ["Autor desconocido"],
                    key: olBook.key,
                    author_birth_place: "Autor desconocido"
                };
                
                onSearchResults([book]);
                onUpdateMarker(0, 0, "Autor desconocido");
                return;
            }

            console.log(`Buscando información sobre el autor: ${author}`);
            // Obtener lugar de nacimiento del autor desde DBpedia
            const authorBirthPlace = await getAuthorBirthPlace(author);

            // Crear objeto del libro con los datos obtenidos
            const book: Book = {
                title: olBook.title,
                author_name: olBook.author_name || ["Autor desconocido"],
                key: olBook.key,
                author_birth_place: authorBirthPlace
            };

            onSearchResults([book]);

            // Notificar al mapa sobre el lugar de nacimiento
            console.log("Lugar de nacimiento encontrado:", authorBirthPlace);
            
            // En lugar de intentar calcular las coordenadas aquí, solo enviamos
            // la información al mapa y dejamos que él se encargue
            onUpdateMarker(0, 0, authorBirthPlace);
            
            // No llamamos a onMapMove porque Map.tsx se encargará de mover el mapa
            // basándose en el lugar de nacimiento
        } catch (error) {
            console.error("Error al buscar el libro:", error);
            setError("Error al buscar el libro. Inténtalo de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Buscar libro por título"
            />
            <button onClick={handleSearch} disabled={loading}>
                {loading ? "Buscando..." : "Buscar"}
            </button>
            {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
    );
};

export default BookSearch;