import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CapacitorSQLite, capSQLiteChanges, capSQLiteValues, JsonSQLite } from '@capacitor-community/sqlite';
import { Device } from '@capacitor/device';
import { Preferences } from '@capacitor/preferences';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SqliteService {

  public dbReady: BehaviorSubject<boolean>
  public isWeb: boolean;
  public isIos: boolean;
  public dbName: string;

  constructor(
    private http: HttpClient
  ) { 
    this.dbReady = new BehaviorSubject(false);
    this.isWeb = false;
    this.isIos = false;
    this.dbName = ''; 
  }

  async init(){
    const info = await Device.getInfo();
    const sqlite = CapacitorSQLite as any;

    if(info.platform == 'android'){
      try {
        await sqlite.requestPermission();
      } catch (error) {
        console.error("esta app necesita permisos para funcionar")
      }



    }else if(info.platform == 'web'){
      this.isWeb = true;
      await sqlite.initWebStore();
      console.log("WebStore inicializado con éxito");
    }else if(info.platform == 'ios'){
      this.isIos = true;

    }

    this.setupDatabase();

  }

  async setupDatabase(){

    const dbSetup = await Preferences.get({key:
    'first_setup_key'})

    if(!dbSetup.value){
      this.downloadDatabase();
    }else{
      this.dbName = await this.getDbName();
      await CapacitorSQLite.createConnection({ database: this.dbName});
      await CapacitorSQLite.open({ database: this.dbName})
      this.dbReady.next(true);
    }
  }

  downloadDatabase(){

    this.http.get('assets/db/db.json').subscribe(
    async (jsonExport: JsonSQLite) => {

      const jsonstring = JSON.stringify(jsonExport);
      const isValid = await CapacitorSQLite.isJsonValid({jsonstring});

      if(isValid.result){
        this.dbName = jsonExport.database;
        await CapacitorSQLite.importFromJson({jsonstring});
        await CapacitorSQLite.createConnection({ database: this.dbName});
        await CapacitorSQLite.open({ database: this.dbName})

        await Preferences.set({key:'first_setup_key', value: '1'})
        await Preferences.set({key:'dbname', value: this.dbName})

        this.dbReady.next(true);

      }

    })

  }

  async getDbName(){

    if(!this.dbName){
      const dbname = await Preferences.get({key:
        'dbname'})
      if(dbname.value){
        this.dbName = dbname.value
      }
    }
    return this.dbName;
  }

  async findUserByEmail(email: string): Promise<any> {
    const dbName = await this.getDbName();
    const query = 'SELECT * FROM usuarios WHERE correo = ?';
    const result = await CapacitorSQLite.query({
      database: dbName,
      statement: query,
      values: [email],
    });
  
    if (result.values.length > 0) {
      const user = {
        id: result.values[0][0],
        correo: result.values[0][1],
        nombre: result.values[0][2],
        password: result.values[0][3],
      };
      return user;
    } else {
      return null; // Usuario no encontrado
    }
  }

  async userExists(correo: string): Promise<boolean> {
    const dbName = await this.getDbName();
    const query = 'SELECT COUNT(*) AS count FROM usuarios WHERE correo = ?';
    const result = await CapacitorSQLite.query({
      database: dbName,
      statement: query,
      values: [correo],
    });
    return result.values[0].count > 0;
  }

  async createUser(correo: string, nombre: string, password: string) {
    const exists = await this.userExists(correo);
    if(exists) {
      return Promise.reject('el correo ya esta registrado')
    }
    let sql = 'INSERT INTO usuarios (correo, nombre, password) VALUES (?, ?, ?)';

    console.log('SQL Statement:', sql);
    console.log('Values:', correo, nombre, password);
    
      const dbName = await this.getDbName();
      return CapacitorSQLite.executeSet({
        database: dbName,
        set: [
          {
            statement: sql,
            values:[
              correo,
              nombre,
              password
            ]
          }
        ]
      }).then( (changes : capSQLiteChanges) => {
        if(this.isWeb){
          CapacitorSQLite.saveToStore({ database: dbName })
        }
        return changes;
      }).catch( err => Promise.reject(err))
  }

  async testDatabase() {
    const users = await this.read();
    console.log('Usuarios en la base de datos:', users);
  }

  async getUserByEmail(correo: string): Promise<any> {
    const dbName = await this.getDbName();
    const query = 'SELECT * FROM usuarios WHERE correo = ?';
    const result = await CapacitorSQLite.query({
      database: dbName,
      statement: query,
      values: [correo],
    });
    if (result.values && result.values.length > 0) {
      const usuario = {
        id: result.values[0][0],
        correo: result.values[0][1],
        nombre: result.values[0][2],
        password: result.values[0][3],
      };
      console.log('Usuario obtenido:', usuario);
      return usuario;
    }
    return null; // Usuario no encontrado
  }

  async addAsistencia(usuarioId: number): Promise<any> {
    const dbName = await this.getDbName();
    const fechaHora = new Date().toISOString();  // Obtener la fecha y hora actual en formato ISO
    const sql = 'INSERT INTO asistencias (usuario_id, fecha_hora) VALUES (?, ?)';
  
    return CapacitorSQLite.executeSet({
      database: dbName,
      set: [
        {
          statement: sql,
          values: [usuarioId, fechaHora]
        }
      ]
    }).then((changes: capSQLiteChanges) => {
      console.log('Asistencia registrada');
      return changes;
    }).catch(err => {
      console.error('Error al registrar asistencia', err);
      return Promise.reject(err);
    });
  }

  async getAsistencias(usuarioId: number): Promise<any[]> {
    const dbName = await this.getDbName();
    const sql = 'SELECT * FROM asistencias WHERE usuario_id = ? ORDER BY fecha_hora DESC';
  
    return CapacitorSQLite.query({
      database: dbName,
      statement: sql,
      values: [usuarioId]
    }).then((response: any) => {
      return response.values.map((asistencia: any) => ({
        id: asistencia[0],
        usuario_id: asistencia[1],
        fecha_hora: asistencia[2]
      }));
    }).catch(err => {
      console.error('Error al obtener asistencias', err);
      return [];
    });
  }
  
  async read() {
    let sql = 'SELECT * FROM usuarios';
    const dbName = await this.getDbName();
    
    return CapacitorSQLite.query({
      database: dbName,
      statement: sql,
      values: []
    }).then((response: any) => {
      console.log('Respuesta de la consulta:', response);
      
      let usuarios: any[] = [];
      
      // Si la respuesta contiene valores, procesarlos
      if (response.values && response.values.length > 0) {
        for (let index = 0; index < response.values.length; index++) {
          const usuario = {
            id: response.values[index][0],
            correo: response.values[index][1],
            nombre: response.values[index][2],
            password: response.values[index][3]
          };
          console.log('Resultado de la consulta:', response.values);
          usuarios.push(usuario);
        }
      } else {
        console.log('No se encontraron usuarios en la base de datos');
      }
      
      return usuarios;
    }).catch(error => {
      console.error('Error al leer usuarios', error);
    });
  }

  // async read() {
  //   const sql = 'SELECT * FROM usuarios';
  //   const dbName = await this.getDbName();
  //   console.log('Consulta SQL para leer:', sql);
  
  //   try {
  //     const response = await CapacitorSQLite.query({
  //       database: dbName,
  //       statement: sql,
  //       values: []
  //     });
  //     console.log('Resultado de la consulta SELECT:', response);
  
  //     let usuarios: any[] = [];
  //     for (let index = 0; index < response.values.length; index++) {
  //       const usuario = {
  //         id: response.values[index][0], 
  //         correo: response.values[index][1],
  //         nombre: response.values[index][2],
  //         password: response.values[index][3]
  //       };
  //       usuarios.push(usuario);
  //     }
  //     return usuarios;
  //   } catch (error) {
  //     console.error('Error al leer usuarios:', error);
  //     return [];
  //   }
  // }

  // async read(){
  //   let sql = 'SELECT * FROM usuarios';
  //   const dbName = await this.getDbName();
  //   return CapacitorSQLite.query({
  //     database: dbName,
  //     statement: sql,
  //     values: []
  //   }).then((response: any) => {
  //     let usuarios: any[] = [];
      
  //     if(this.isIos && response.values.length > 0 ){
  //       response.values.shift();
  //     }

  //     for (let index = 0; index < response.values.length; index++){
  //       const usuario = {
  //         id: response.values[index][0], 
  //         correo: response.values[index][1],
  //         nombre: response.values[index][2],
  //         password: response.values[index][3]
  //       };
  //     usuarios.push(usuario);
  //     }
  //     return usuarios; 
  //   }).catch(error => {
  //     console.error('error al leer usuarios', error);
  //   });
  // }
}
