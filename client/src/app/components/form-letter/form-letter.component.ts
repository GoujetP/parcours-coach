import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { GenerateLetterService, LetterResponse } from '../../services/generate-letter.service';

@Component({
  selector: 'app-form-letter',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './form-letter.component.html',
  styleUrls: ['./form-letter.component.scss']
})
export class FormLetterComponent {
  private fb = inject(FormBuilder);
  private letterService = inject(GenerateLetterService);

  // État de la lettre générée
  generatedLetter = signal<LetterResponse | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Initialisation du formulaire
  letterForm: FormGroup = this.fb.group({
    bacType: ['', Validators.required],
    specialties: [[] as string[]], // Tableau de strings
    
    targetCourse: ['', Validators.required],
    careerGoal: [''],
    
    hasAttendedJPO: [false],
    hasAttendedFairs: [false],
    hasSpokenWithAlumni: [false],
    isInCordeeReussite: [false],
    
    hasWorkExperience: [false],
    workExperienceDetails: [''],
    
    hasVolunteering: [false],
    volunteeringDetails: [''],
    
    hasSportOrArt: [false],
    sportOrArtDetails: [''],
    
    softSkills: [[] as string[]] // Tableau de strings
  });

  // --- GESTION DES ÉTIQUETTES (TAGS) ---
  
  addTag(event: Event, controlName: 'specialties' | 'softSkills') {
    event.preventDefault(); // Empêche de soumettre le formulaire en appuyant sur Entrée
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();

    if (value) {
      const currentTags = this.letterForm.get(controlName)?.value as string[];
      if (!currentTags.includes(value)) {
        this.letterForm.get(controlName)?.setValue([...currentTags, value]);
      }
      input.value = ''; // On vide le champ après ajout
    }
  }

  removeTag(tagToRemove: string, controlName: 'specialties' | 'softSkills') {
    const currentTags = this.letterForm.get(controlName)?.value as string[];
    this.letterForm.get(controlName)?.setValue(currentTags.filter(tag => tag !== tagToRemove));
  }

  // --- SOUMISSION ---
  
  onSubmit() {
    if (this.letterForm.valid) {
      this.isLoading.set(true);
      this.error.set(null);
      this.generatedLetter.set(null);

      this.letterService.generateLetter(this.letterForm.value).subscribe({
        next: (response: LetterResponse) => {
          this.generatedLetter.set(response);
          this.isLoading.set(false);
          console.log('Lettre générée avec succès:', response);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.error.set(err.error?.message || 'Une erreur est survenue lors de la génération de la lettre');
          console.error('Erreur:', err);
        }
      });
    } else {
      this.letterForm.markAllAsTouched(); // Force l'affichage des erreurs
    }
  }

  // --- ACTIONS SUR LA LETTRE GÉNÉRÉE ---

  copyToClipboard() {
    const content = this.generatedLetter()?.content;
    if (content) {
      navigator.clipboard.writeText(content).then(
        () => {
          console.log('Lettre copiée dans le presse-papiers');
          // Optionnel: afficher un message de confirmation
        },
        (err) => {
          console.error('Erreur lors de la copie:', err);
        }
      );
    }
  }

  resetForm() {
    this.letterForm.reset({
      specialties: [],
      softSkills: []
    });
    this.generatedLetter.set(null);
    this.error.set(null);
  }
}