const cors = require('cors'); //permite que pueda acceptar peticiones de paginas fuera del servidor
require("dotenv").config(); //utiliza información del archivo ,env

const bcrypt = require('bcrypt'); //libreria para comparacion de hasheo

const express = require('express'); //framework de express para Node.js
const { MongoClient, ObjectId } = require('mongodb'); //uso de motor de mongodb
console.log("URI:", process.env.MONGO_URI);
const uri = process.env.MONGO_URI; //obtiene uri de .env

const app = express(); //instancia de aplicación HTTP para poder empezar a consultar queries GET o POST
//const client = new MongoClient('mongodb://localhost:27017'); //usa conexion de mondogdb local
const client = new MongoClient(uri);

client.connect() //se tiene que conectar a la base de datos
.then(() => console.log('Conexión completada a MongoDB')) //conexio completada
.catch(console.error); //error de conexion
const db = client.db('portal_web'); //obtiene conexión con la base de datos no relacional

app.use(cors()); //habilita cors
app.use(express.json()); //habilita peitiones POST
//peticion get para realizar busqueda de páginas
app.get('/busqueda', async (req, res) => { //req de datos enviados, res datos qeu se podran enviar
    console.log('Servidor recibió peticion GET de busqueda.html');
    const query = req.query.b //lee el atributo b que fue enviado

    const palabras = query.split(" "); //obtiene lista de palabras en caso de poner mas de una
    //se crea una expresion regular dinamica por cada palabra
    const regexes = palabras.map(p => new RegExp(p, 'i')); //i es para remover mayusculas

    //opcion 1, buscar que las palabras coincidan
    // const resultados = await db.collection('paginas').find({ //practicamente esta realizando una consulta mongsh
    //     "palabras clave": {$in: palabras} //in describe que regrese si alguna de las palabras proporcionada coincide con las palabras clave de la página.
    // }).toArray(); //convierte en arreglo
    //opcion 2, que alguna de las palabras coincida parcialmente por si la busqueda es de una palabra acortada
    const resultados = await db.collection('paginas').find({ //practicamente esta realizando una consulta mongsh
        "palabras_clave": {$in: regexes} //in describe que regrese si alguna de las palabras proporcionada coincide con las palabras clave de la página.
    }).toArray(); //convierte en arreglo


    console.log('Resultados obtenidos, enviando al cliente.');
    res.json(resultados); //por medio de conexion retorna resultados de busqueda en forma JSON
}
);
//peticion get para obtener datos del anuncio consultado
app.get('/obtener-anuncio', async (req, res) => {
    console.log('Servidor recibió peticion GET de anuncio.html');
    const query = req.query.a //lee el atributo "a"

    const resultado = await db.collection('anuncios').findOne({
        _id: new ObjectId(query) //utiliza el id para localizarlo
    })

    console.log('Anuncio obtenido, datos:', resultado);
    res.json(resultado); //retorna información de anuncio en JSON
});

app.get('/anun-princ', async (req, res) => {//atributo no necesario
    console.log('Servidor recibió peticion GET de pagina_principal.html');

    const consulta = {}; //consulta vacia porque queremos que tome todos los anuncios
    const filtro = {fecha: -1}; //ordene los anuncios del mas reciente al mas viejo
    const limite = 3; //solo se piden los primeros 3 resultados
    //consulta completa
    const resultados = await db.collection('anuncios').find(consulta).sort(filtro).limit(limite).toArray();

    console.log('Anuncios obtenidos, enviando al cliente.');
    res.json(resultados); //envia resultados usando conexión
});
//peticion POST para inicio de sesion
app.post('/api/login', async (req, res) => {
    try {
        const { correo, password } = req.body; //obtiene atributos

        //peticion de usuario
        const usuario = await db.collection('usuarios').findOne({
            correo: correo
        });

        // Si no existe
        if (!usuario) {
            return res.status(401).json({
                mensaje: 'Usuario o contraseña incorrectos'
            });
        }

        //Compara password con hash
        const coincide = await bcrypt.compare(
            password,
            usuario.password
        );

        //Si no coincide
        if (!coincide) {
            return res.status(401).json({
                mensaje: 'Usuario o contraseña incorrectos'
            });
        }

        //Login correcto
        console.log('Un usuario ingreso al portal.')
        res.json({
            mensaje: 'Login correcto'
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: 'Error del servidor'
        });
    }

});

app.listen(3000, () => {
    console.log('Servidor corriendo en el puerto 3000');
});