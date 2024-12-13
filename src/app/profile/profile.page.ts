import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { SqliteService } from '../services/sqlite.service';
import { CapacitorSQLite } from '@capacitor-community/sqlite';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {

  public nombreUsuario: string = '';
  public asistencias: any[] = [];

  constructor(private sqlite: SqliteService, private router: Router) {}

  async ngOnInit() {
    await this.loadUserData();
  }

  async loadUserData() {
    const correoActual = localStorage.getItem('correoUsuario');

    if (!correoActual) {
    console.error('No hay usuario en sesión');
    return;
    }

    console.log('Intentando recuperar datos con:', correoActual);
    
      try {
        const dbName = await this.sqlite.getDbName();
        const query = 'SELECT * FROM usuarios WHERE correo = ?';
        const result = await CapacitorSQLite.query({
          database: dbName,
          statement: query,
          values: [correoActual],
        });

        // Verifica si se encontraron resultados
        if (result.values && result.values.length > 0) {
          // Asume que el nombre está en la columna 'nombre' de la tabla
          this.nombreUsuario = result.values[0].nombre;
          console.log('Nombre del usuario:', this.nombreUsuario);
        } else {
          console.log('No se encontraron datos para el usuario.');
        }
      }
      catch (error) {
        console.error('Error al cargar datos del usuario:', error);
      }
  }


  CerrarSesion() {
    // Limpia los datos de la sesión
    localStorage.removeItem('correoUsuario');
    this.router.navigate(['/home']);
  }

}
