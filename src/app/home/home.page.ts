import { Component,OnInit} from '@angular/core';
import { NavController } from '@ionic/angular';
import { AnimationController } from '@ionic/angular';
import { IonImg } from '@ionic/angular';
import { Router } from '@angular/router';
import { SqliteService } from '../services/sqlite.service';
import { CapacitorSQLite } from '@capacitor-community/sqlite';
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  public inputEmail: string = '';
  public inputPassword: string = '';
  public errorMessage: string = '';

  constructor(private navCtrl: NavController,
    private anim: AnimationController,
    private router: Router,
    private sqlite: SqliteService

  ) {    this.inputEmail = '';
    this.inputPassword = '';
    this.errorMessage = '';}
  

    async login() {
      console.log('Intentando iniciar sesión con:', this.inputEmail, this.inputPassword);
    
      // Verifica si los campos están llenos
      if (!this.inputEmail || !this.inputPassword) {
        this.errorMessage = 'Por favor, ingresa correo y contraseña';
        return;
      }
    
      try {
        const dbName = await this.sqlite.getDbName();
        const query = 'SELECT * FROM usuarios WHERE correo = ? AND password = ?';
        const result = await CapacitorSQLite.query({
          database: dbName,
          statement: query,
          values: [this.inputEmail, this.inputPassword],
        });
    
        console.log('Resultado de la consulta de inicio de sesión:', result);
    
        if (result.values.length > 0) {
          const user = result.values[0];
          console.log('Inicio de sesión exitoso para el usuario:', user);
          this.errorMessage = '';
          this.router.navigate(['/principal']); // Redirige a la página principal
          localStorage.setItem('correoUsuario', this.inputEmail);
        } else {
          this.errorMessage = 'Correo o contraseña incorrectos';
        }
      } catch (error) {
        console.error('Error al iniciar sesión:', error);
        this.errorMessage = 'Error al procesar el inicio de sesión';
      }
    }

  isDarkTheme = true;

  toggleTheme(event: any) {
    this.isDarkTheme = event.detail.checked;
    document.body.classList.toggle('dark', this.isDarkTheme);
  }

  goToRegistro() {
    this.navCtrl.navigateForward('/registro');
  }

  goToPrincipal() {
    this.navCtrl.navigateForward('/principal');
  }

  animarError(index:number){
    this.anim.create()
    .addElement(document.querySelectorAll("input")[index]!)
    .duration(100)
    .iterations(3)
    .keyframes([
      {offset: 0, border: "1px transparent solid", transform: "translateX(0px)"},
      {offset: 0.25, border: "1px red solid", transform: "translateX(-5px)"},
      {offset: 0.5, border: "1px transparent solid", transform: "translateX(0px)"},
      {offset: 0.75, border: "1px red solid", transform: "translateX(5px)"},
      {offset: 1, border: "1px rgb(0, 0, 0) solid", transform: "translateX(0px)"},
    ]).play()
  }

}
