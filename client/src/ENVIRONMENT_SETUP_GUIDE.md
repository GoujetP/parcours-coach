/**
 * GUIDE DE CONFIGURATION D'ENVIRONNEMENT ANGULAR 21
 *
 * J'ai créé une configuration complète pour gérer les URLs d'API selon l'environnement.
 *
 * FICHIERS CRÉÉS:
 *
 * 1. Fichiers d'environnement:
 *    ├── src/environments/environment.ts       (développement)
 *    └── src/environments/environment.prod.ts (production)
 *
 * 2. Service de configuration:
 *    └── src/app/shared/services/config.service.ts
 *
 * 3. Service API:
 *    └── src/app/services/generate-letter.service.ts
 *
 * 4. Configuration Angular:
 *    └── angular.json (fileReplacements pour prod)
 *    └── app.config.ts (provideHttpClient ajouté)
 *
 * COMMENT ÇA MARCHE?
 *
 * 1. En développement:
 *    - L'app utilise environment.ts
 *    - apiUrl = 'http://localhost:3000/api'
 *
 * 2. En production (ng build):
 *    - Angular remplace environment.ts par environment.prod.ts
 *    - apiUrl = 'https://api.parcours-coach.com/api'
 *
 * UTILISATION DANS UN COMPOSANT:
 *
 * import { GenerateLetterService } from '../../services/generate-letter.service';
 *
 * @Component({...})
 * export class FormLetterComponent {
 *   constructor(private letterService: GenerateLetterService) {}
 *
 *   onSubmit(): void {
 *     if (this.letterForm.valid) {
 *       this.letterService.generateLetter(this.letterForm.value).subscribe(
 *         (response) => {
 *           console.log('Lettre générée:', response);
 *           // Afficher le résultat à l'utilisateur
 *         },
 *         (error) => {
 *           console.error('Erreur:', error);
 *           // Afficher un message d'erreur
 *         }
 *       );
 *     }
 *   }
 * }
 *
 * COMMANDS:
 *
 * Développement (localhost:3000):
 * $ npm start
 *
 * Build production (api.parcours-coach.com):
 * $ npm run build
 *
 * MODIFIER LES URLS:
 *
 * 1. Pour dev, éditez: src/environments/environment.ts
 *    export const environment = {
 *      production: false,
 *      apiUrl: 'http://localhost:3000/api'  <- changer ici
 *    };
 *
 * 2. Pour prod, éditez: src/environments/environment.prod.ts
 *    export const environment = {
 *      production: true,
 *      apiUrl: 'https://votre-domaine.com/api'  <- mettre l'URL prod
 *    };
 *
 * AJOUTER D'AUTRES PROPRIÉTÉS:
 *
 * Vous pouvez ajouter d'autres paramètres à la configuration:
 *
 * environment.ts:
 * export const environment = {
 *   production: false,
 *   apiUrl: 'http://localhost:3000/api',
 *   apiTimeout: 5000,
 *   logLevel: 'debug',
 *   enableAnalytics: false
 * };
 *
 * environment.prod.ts:
 * export const environment = {
 *   production: true,
 *   apiUrl: 'https://api.parcours-coach.com/api',
 *   apiTimeout: 10000,
 *   logLevel: 'error',
 *   enableAnalytics: true
 * };
 *
 * Ensuite, accédez-les depuis ConfigService:
 * export class ConfigService {
 *   get apiUrl(): string { return environment.apiUrl; }
 *   get apiTimeout(): number { return environment.apiTimeout; }
 *   get logLevel(): string { return environment.logLevel; }
 *   get enableAnalytics(): boolean { return environment.enableAnalytics; }
 * }
 *
 * INTÉGRATION AVEC LE FORMULAIRE:
 *
 * Dans form-letter.component.ts, mettez à jour onSubmit():
 *
 * import { GenerateLetterService } from '../../services/generate-letter.service';
 *
 * export class FormLetterComponent {
 *   constructor(private letterService: GenerateLetterService) {}
 *
 *   onSubmit(): void {
 *     if (this.letterForm.valid) {
 *       this.letterService.generateLetter(this.letterForm.value).subscribe({
 *         next: (response) => {
 *           console.log('Succès:', response);
 *           // Afficher le succès
 *         },
 *         error: (err) => {
 *           console.error('Erreur API:', err);
 *           // Afficher l'erreur
 *         }
 *       });
 *     }
 *   }
 * }
 *
 * STRUCTURE FINALE:
 *
 * src/
 * ├── environments/
 * │   ├── environment.ts          (DEV: localhost:3000)
 * │   └── environment.prod.ts     (PROD: api.parcours-coach.com)
 * └── app/
 *     ├── services/
 *     │   └── generate-letter.service.ts  (utilise ConfigService)
 *     ├── shared/
 *     │   └── services/
 *     │       └── config.service.ts       (expose apiUrl)
 *     └── components/
 *         └── form-letter/
 *             └── form-letter.component.ts (utilise GenerateLetterService)
 *
 * DÉPLOIEMENT:
 *
 * 1. Mettez à jour environment.prod.ts avec votre URL réelle
 * 2. Lancez: ng build (crée dist/client/)
 * 3. Déployez le contenu de dist/client/ sur votre serveur
 * 4. L'app utilisera automatiquement environment.prod.ts en production
 */
