import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

/** Smista l'utente sulla pagina iniziale del proprio ruolo. */
@Component({ selector: 'app-home', template: '' })
export class HomeComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.router.navigateByUrl(this.auth.homeDelRuolo(), { replaceUrl: true });
  }
}
