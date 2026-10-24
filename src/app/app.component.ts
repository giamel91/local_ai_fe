import { Component, inject, ChangeDetectorRef, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule], 
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  domanda: string = '';
  // 1. Ora è un array che conterrà tutta la cronologia!
  storicoRisposte: any[] = []; 
  rispostaAi: any = null;
  staCaricando: boolean = false;

  private http = inject(HttpClient);
  // Strumento per forzare l'aggiornamento dello schermo
  private cdr = inject(ChangeDetectorRef); 
  private platformId = inject(PLATFORM_ID);
  
  
  // Questa funzione scatta DA SOLA appena l'utente apre o aggiorna la pagina
  ngOnInit() {
      // Durante il prerender non esiste un browser: la chiamata HTTP va saltata.
      if (!isPlatformBrowser(this.platformId)) return;

      const urlHistory = `${environment.apiBaseUrl}/api/ai/history`;
      
      this.http.get<string[]>(urlHistory).subscribe({
        next: (storiaGrezza) => {
          // Kafka ci manda stringhe di testo JSON. 
          // Le trasformiamo in oggetti veri che Angular può stampare a schermo
          this.storicoRisposte = storiaGrezza.map(testoJson => JSON.parse(testoJson));
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error("Impossibile recuperare lo storico da Kafka:", err);
        }
      });
  }

  inviaDomanda() {
    if (!this.domanda) return;

    this.staCaricando = true;
    const url = `${environment.apiBaseUrl}/api/ai/generate?message=${encodeURIComponent(this.domanda)}`;

    this.http.get(url).subscribe({
      next: (rispostaDalServer) => {
        // 1. Stampiamo in console per sicurezza
        console.log("BINGO! Angular ha ricevuto questo:", rispostaDalServer);
        
		// 2. Invece di sovrascrivere, "spingiamo" la nuova risposta in cima alla lista
		this.storicoRisposte.unshift(rispostaDalServer);
        this.staCaricando = false;
		this.domanda = ''; // Svuotiamo la casella di testo
		this.cdr.detectChanges();
		},

		
      error: (errore) => {
        console.error("Errore di chiamata:", errore);
        this.staCaricando = false;
        this.cdr.detectChanges();
      }
    });
  }
}