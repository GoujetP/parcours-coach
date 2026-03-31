import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';


/**
 * Service pour accéder à la configuration globale de l'application
 * Permet de récupérer l'URL de l'API selon l'environnement
 */
@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  get apiUrl(): string {
    return environment.apiUrl;
  }

  get isProduction(): boolean {
    return environment.production;
  }
}
