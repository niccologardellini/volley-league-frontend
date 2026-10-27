import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/auth.service';
import { NotificheService } from '../../core/notifiche.service';

/** Account dimostrativi creati dal DataSeeder del backend (password: "password"). */
const DEMO = [
  { ruolo: 'Giudice sportivo', email: 'admin@volley.it', icona: 'gavel' },
  { ruolo: 'Dirigente', email: 'dirigente@4torri.it', icona: 'groups' },
  { ruolo: 'Arbitro', email: 'arbitro@fipav.it', icona: 'sports' },
  { ruolo: 'Giocatore', email: 'giocatore@4torri.it', icona: 'person' },
];

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notifiche = inject(NotificheService);

  protected readonly demo = DEMO;
  protected readonly invio = signal(false);
  protected readonly errore = signal<string | null>(null);
  protected readonly mostraPassword = signal(false);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  usaDemo(email: string): void {
    this.form.setValue({ email, password: 'password' });
    this.errore.set(null);
  }

  accedi(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.invio.set(true);
    this.errore.set(null);
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => this.router.navigateByUrl(this.auth.homeDelRuolo()),
      error: (e) => {
        this.errore.set(this.notifiche.messaggio(e));
        this.invio.set(false);
      },
    });
  }
}
