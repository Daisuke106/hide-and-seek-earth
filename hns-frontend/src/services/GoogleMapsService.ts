import { Loader } from '@googlemaps/js-api-loader';
import { SearchResult } from '../types';

class GoogleMapsService {
  private loader: Loader;
  private isLoaded = false;

  constructor() {
    this.loader = new Loader({
      apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
      version: 'weekly',
      libraries: ['places', 'geometry'],
    });
  }

  async initialize(): Promise<void> {
    if (!this.isLoaded) {
      await this.loader.load();
      this.isLoaded = true;
    }
  }

  async createMap(
    element: HTMLElement,
    options: google.maps.MapOptions
  ): Promise<google.maps.Map> {
    await this.initialize();
    return new google.maps.Map(element, options);
  }

  async createStreetViewPanorama(
    element: HTMLElement,
    options: google.maps.StreetViewPanoramaOptions
  ): Promise<google.maps.StreetViewPanorama> {
    await this.initialize();
    return new google.maps.StreetViewPanorama(element, options);
  }

  async searchPlaces(
    query: string,
    map: google.maps.Map
  ): Promise<SearchResult[]> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const service = new google.maps.places.PlacesService(map);

      service.textSearch(
        {
          query: query,
          location: map.getCenter(),
          radius: 50000, // 50km radius
        },
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            const searchResults: SearchResult[] = results
              .slice(0, 10)
              .map(result => ({
                placeId: result.place_id!,
                name: result.name!,
                position: {
                  lat: result.geometry!.location!.lat(),
                  lng: result.geometry!.location!.lng(),
                },
                address: result.formatted_address || '',
              }));
            resolve(searchResults);
          } else {
            reject(new Error(`Places search failed: ${status}`));
          }
        }
      );
    });
  }

  async getPlaceDetails(
    placeId: string,
    map: google.maps.Map
  ): Promise<google.maps.places.PlaceResult> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const service = new google.maps.places.PlacesService(map);

      service.getDetails(
        {
          placeId: placeId,
          fields: ['name', 'geometry', 'formatted_address', 'photos'],
        },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            resolve(place);
          } else {
            reject(new Error(`Place details request failed: ${status}`));
          }
        }
      );
    });
  }

  addMarker(
    map: google.maps.Map,
    position: google.maps.LatLngLiteral,
    options?: google.maps.MarkerOptions
  ): google.maps.Marker {
    return new google.maps.Marker({
      position,
      map,
      ...options,
    });
  }

  async calculateDistance(
    origin: google.maps.LatLngLiteral,
    destination: google.maps.LatLngLiteral
  ): Promise<number> {
    await this.initialize();

    const originLatLng = new google.maps.LatLng(origin.lat, origin.lng);
    const destLatLng = new google.maps.LatLng(destination.lat, destination.lng);

    return google.maps.geometry.spherical.computeDistanceBetween(
      originLatLng,
      destLatLng
    );
  }
}

export const googleMapsService = new GoogleMapsService();
