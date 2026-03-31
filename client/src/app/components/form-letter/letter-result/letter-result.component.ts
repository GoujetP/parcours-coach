import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoaderComponent } from "../../loader/loader.component";

@Component({
  selector: 'app-letter-result',
  standalone: true,
  imports: [CommonModule, LoaderComponent],
  templateUrl: './letter-result.component.html',
  styleUrls: ['./letter-result.component.scss']
})
export class LetterResultComponent {
  // Le texte généré reçu depuis le composant parent
  @Input() letterContent: string = '';
  
  // Événement envoyé au parent pour réinitialiser l'interface
  @Output() reset = new EventEmitter<void>();

  isCopied: boolean = false;
  isCopying: boolean = false;

  // Méthode moderne pour copier dans le presse-papier
  async copyToClipboard() {
    try {
      this.isCopying = true;
      await navigator.clipboard.writeText(this.letterContent);
      this.isCopying = false;
      this.isCopied = true;
    } catch (err) {
      console.error('Échec de la copie :', err);
      alert('Impossible de copier le texte automatiquement.');
      this.isCopying = false;
    }
  }

  onReset() {
    this.reset.emit(); // Prévient le parent qu'on veut refaire une lettre
  }
}