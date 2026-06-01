import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { FormLetterComponent } from './components/form-letter/form-letter.component';
import { InterviewComponent } from './components/interview/interview.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'generate-letter',
    component: FormLetterComponent,
  },
  {
    path: 'interview',
    component: InterviewComponent,
  },
];
