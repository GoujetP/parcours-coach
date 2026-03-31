import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from '../shared/services/config.service';

export interface LetterRequest {
  bacType: string;
  specialties: string[];
  targetCourse: string;
  careerGoal?: string;
  hasWorkExperience: boolean;
  workExperienceDetails?: string;
  hasSportOrArt: boolean;
  sportOrArtDetails?: string;
  hasAttendedJPO: boolean;
  hasSpokenWithAlumni: boolean;
  softSkills: string[];
}

export interface LetterResponse {
  content: string;
  responseId: string;
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
}

@Injectable({
  providedIn: 'root',
})
export class GenerateLetterService {
  constructor(
    private http: HttpClient,
    private config: ConfigService
  ) {}

  /**
   * Envoie les données du formulaire au backend pour générer une lettre
   * @param letterData Les données du formulaire
   * @returns Observable avec la lettre générée
   */
  generateLetter(letterData: LetterRequest) {
    const url = `${this.config.apiUrl}/letter/generate`;
    return this.http.post<LetterResponse>(url, letterData);
  }
}
