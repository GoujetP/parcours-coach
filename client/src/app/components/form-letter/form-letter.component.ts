import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { GenerateLetterService, LetterResponse } from '../../services/generate-letter.service';
import { LoaderComponent } from '../loader/loader.component';
import { LetterResultComponent } from './letter-result/letter-result.component';

@Component({
  selector: 'app-form-letter',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoaderComponent, LetterResultComponent],
  templateUrl: './form-letter.component.html',
  styleUrls: ['./form-letter.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class FormLetterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private letterService = inject(GenerateLetterService);

  // État du formulaire
  showForm = signal(true);
  
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

  private readonly SESSION_STORAGE_KEY = 'letterFormData';

  ngOnInit() {
    // Récupérer les données sauvegardées du sessionStorage
    this.loadFormData();
    
    // Écouter les changements du formulaire et les sauvegarder
    this.letterForm.valueChanges.subscribe(() => {
      this.saveFormData();
    });
  }

  private saveFormData() {
    const formData = this.letterForm.getRawValue();
    sessionStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(formData));
  }

  private loadFormData() {
    const savedData = sessionStorage.getItem(this.SESSION_STORAGE_KEY);
    if (savedData) {
      try {
        const formData = JSON.parse(savedData);
        this.letterForm.patchValue(formData);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      }
    }
  }

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
  
  
  onSubmit() {
    if (this.letterForm.valid) {
      // Masquer le formulaire et afficher le loader
      this.showForm.set(false);
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
      this.letterForm.markAllAsTouched();
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
    // Revenir au formulaire en gardant les données sauvegardées
    this.showForm.set(true);
    this.generatedLetter.set(null);
    this.error.set(null);
  }

  clearFormData() {
    // Vider complètement le formulaire et le sessionStorage
    sessionStorage.removeItem(this.SESSION_STORAGE_KEY);
    this.letterForm.reset({
      specialties: [],
      softSkills: []
    });
    this.showForm.set(true);
    this.generatedLetter.set(null);
    this.error.set(null);
  }
}