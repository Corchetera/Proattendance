import { Component,OnInit} from '@angular/core';
import { NavController } from '@ionic/angular';
import { AnimationController } from '@ionic/angular';
import { IonImg } from '@ionic/angular';
import { Router } from '@angular/router';
import { SqliteService } from '../services/sqlite.service';
@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
})
export class RegistroPage implements OnInit {

  public correo: string;
  public nombre: string;
  public password: string;
  public repeatPassword: string;


  constructor(private navCtrl: NavController,
    private anim: AnimationController,
    private router: Router,
    private sqlite: SqliteService) { 
      this.correo = '';
      this.nombre = '';
      this.password = '';
      this.repeatPassword = '';
    }

  async createUser() {
    if (this.password !== this.repeatPassword) {
      console.error('Las contraseñas no coinciden');
      return;
    }
    try {
      const result = await this.sqlite.createUser(this.correo, this.nombre, this.password);
      console.log('Usuario creado:', result);
      this.router.navigate(['/home']); // O navega a la página deseada
      this.sqlite.testDatabase();
    } catch (error) {
      console.error('Error al crear el usuario:', error);
    }
  }

  ngOnInit() {
  }



  goToPrincipal() {

  }

  isDarkTheme = true;

  toggleTheme(event: any) {
    this.isDarkTheme = event.detail.checked;
    document.body.classList.toggle('dark', this.isDarkTheme);
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
