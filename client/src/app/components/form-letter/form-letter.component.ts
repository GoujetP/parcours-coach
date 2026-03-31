import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-form-letter',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './form-letter.component.html',
  styleUrls: ['./form-letter.component.scss']
})
export class FormLetterComponent {
  private fb = inject(FormBuilder);

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
      console.log('Données prêtes pour NestJS :', this.letterForm.value);
      // Ici, tu pourras appeler ton service HTTP vers ton back-end NestJS
    } else {
      this.letterForm.markAllAsTouched(); // Force l'affichage des erreurs
    }
  }
}