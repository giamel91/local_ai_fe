import { Component, inject, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

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
  
  
  // Questa funzione scatta DA SOLA appena l'utente apre o aggiorna la pagina
  ngOnInit() {
      const urlHistory = 'http://localhost:8080/api/ai/history';
      
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
    const url = `http://localhost:8080/api/ai/generate?message=${encodeURIComponent(this.domanda)}`;

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