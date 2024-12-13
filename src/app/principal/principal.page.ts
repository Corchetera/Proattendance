import { Component,OnInit} from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { NavController } from '@ionic/angular';
@Component({
  selector: 'app-principal',
  templateUrl: './principal.page.html',
  styleUrls: ['./principal.page.scss'],
})
export class PrincipalPage implements OnInit {

  constructor(private navCtrl: NavController) {}

  ngOnInit() {
  }

  isDarkTheme = true;

  toggleTheme(event: any) {
    this.isDarkTheme = event.detail.checked;
    document.body.classList.toggle('dark', this.isDarkTheme);
  }
  
  // Función para abrir la cámara
  async sacarCamara() {
  const photo = await Camera.getPhoto({
    resultType: CameraResultType.Uri,
    source: CameraSource.Camera, 
    quality: 90
  });
  console.log('Foto tomada', photo);
}
  
  registrarAsistencia() {
    const email = localStorage.getItem('ultimoUsuario'); // Obtener el último usuario
    if (email) {
      const storedUser = localStorage.getItem(email); // Obtener el usuario completo
      if (storedUser) {
        const usuario = JSON.parse(storedUser);
        
        // Incrementar el contador de asistencias
        usuario.asistencias += 1;
  
        // Actualizar la fecha y hora de la última asistencia
        usuario.ultimaAsistencia = new Date().toISOString(); // Guardar en formato ISO
  
        // Almacenar el objeto actualizado en localStorage
        localStorage.setItem(email, JSON.stringify(usuario));
  
        console.log('Asistencia registrada con éxito:', usuario);
      }
    } else {
      console.warn('No hay usuario registrado.');
    }
  }

  goToProfile() {
    this.navCtrl.navigateForward('/profile');
  }
}
