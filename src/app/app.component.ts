import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Componente radice: mostra la pagina corrispondente alla rotta attiva. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class AppComponent {}
