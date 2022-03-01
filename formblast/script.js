const sceneEl = document.querySelector("a-scene");
var player = document.getElementById("player");


// Contadores
var puntuacionC = parseInt(document.querySelector("#puntuacionContador").innerHTML);
var vidasC = parseInt(document.querySelector("#vidasContador").innerHTML);
var disparosC = parseInt(document.querySelector("#disparosContador").innerHTML);


// Direcciones
var directionsBalas = [];
var directionsEnemigos = [];


// Sonidos
var bomb = document.getElementById("bombE");
var gameover = document.getElementById("gameoverE");
var loselife = document.getElementById("loselifeE");
var reload = document.getElementById("reloadE");
var shot = document.getElementById("shotE");


// Jugar
var jugar = document.getElementById("jugar");
var isPlaying = false;
var recargar = document.getElementById("recargar");


// Tiempo random para que aparezcan enemigos
let prevTime = 0;
let interval = 0;
let randomTime = 0;
const MIN = 900;
const MAX = 1800;


// Vectores
const objectPosition = new THREE.Vector3();
const viewerPosition = new THREE.Vector3();
const mat4 = new THREE.Matrix4();




// Modo de Realidad Aumentada
sceneEl.addEventListener("enter-vr", onEnterVR);
async function onEnterVR(){
  if(!sceneEl.is("ar-mode")) return;
  
  document.querySelector("#overlay").style.visibility = "visible";
  
  const xr = sceneEl.renderer.xr;
  const session = xr.getSession();
  const viewerSpace = await session.requestReferenceSpace('viewer');
  const refSpace = await session.requestReferenceSpace('local-floor');



  // Click en "Jugar"
  jugar.addEventListener('click', function(e){
    jugar.style.visibility = "hidden";
    document.querySelector("#puntuacion").style.visibility = "visible";
    document.querySelector("#vidas").style.visibility = "visible";
    document.querySelector("#disparos").style.visibility = "visible";
    recargar.style.visibility = "visible";
    isPlaying = true;
    document.querySelector("#puntuacionContador").innerHTML = puntuacionC;
    document.querySelector("#vidasContador").innerHTML = vidasC;
    document.querySelector("#disparosContador").innerHTML = disparosC;
    jugar.classList.remove('pausa');
  });



  // Recargar disparos
  var longpress = 2000;
  var delay;

  recargar.addEventListener('touchstart', function(e){
    recargar.classList.add('recargando');
    recargar.style.backgroundColor = "red";
    delay = setTimeout(check, longpress);
    function check() {
      reload.components.sound.playSound();
      disparosC = 10;
      document.querySelector("#disparosContador").innerHTML = disparosC;
    }
  }, true);
    
  recargar.addEventListener('touchend', function (e) {
    clearTimeout(delay);
    recargar.classList.remove('recargando');
    recargar.style.backgroundColor = 'rgb(' + 216 + ',' + 117 + ',' + 70 + ')';
  });



  // Jugador es alcanzado por enemigo
  player.addEventListener("hitstart", function(e){
    vidasC--;
    document.querySelector("#vidasContador").innerHTML = vidasC;
    navigator.vibrate(600);
    // Perder juego
    if(vidasC == 0){
      jugar.classList.add('pausa');
      gameover.components.sound.playSound();
      isPlaying = false;
      puntuacionC = 0;
      vidasC = 3;
      disparosC = 10;
      jugar.style.visibility = "visible";
      recargar.style.visibility = "hidden";
      jugar.innerHTML = "Volver a jugar"
      var enemigos = document.querySelectorAll(".enemigo");
      for(var i=0; i<enemigos.length; i++){
        sceneEl.removeChild(enemigos[i]);
      }
      var disparos = document.querySelectorAll(".disparo");
      for(var i=0; i<disparos.length; i++){
        sceneEl.removeChild(disparos[i]);
      }
      directionsBalas = [];
      directionsEnemigos = [];
    }
    // Perder vida
    else{
      oselife.components.sound.playSound();
    }
  });
  

  // Animaciones
  session.requestAnimationFrame(onXRFrame);
  function onXRFrame(t, xrFrame){
    session.requestAnimationFrame(onXRFrame);
    
    if(isPlaying) {

      // Actualizacion enemigos
      var enemigos = document.querySelectorAll(".enemigo");
      for(var i=0; i<enemigos.length; i++){
        // Distancia de los disparos a la que "desaparecen" (dieron al usuario)
        if(enemigos[i].object3D.position.z < -5 || enemigos[i].object3D.position.z > 5
        || enemigos[i].object3D.position.x < -5 || enemigos[i].object3D.position.x > 5
        || enemigos[i].object3D.position.y < -5 || enemigos[i].object3D.position.y > 5
        || enemigos[i].classList.contains("hundido")) {  
          sceneEl.removeChild(enemigos[i]);
          directionsEnemigos.splice(i, 1);
          return;
        }
        // Movimiento
        else {
          ['x', 'y', 'z'].forEach( axis =>{
            enemigos[i].object3D.position[axis] += directionsEnemigos[i][axis] * 0.06;
          });
        }
      }



      // Actualizacion balas
      var disparos = document.querySelectorAll(".disparo");
      for(var i=0; i<disparos.length; i++){
        // Distancia de los disparos a la que "desaparecen"
        if(disparos[i].object3D.position.z < -5 || disparos[i].object3D.position.z > 5
        || disparos[i].object3D.position.x < -5 || disparos[i].object3D.position.x > 5
        || disparos[i].object3D.position.y < -5 || disparos[i].object3D.position.y > 5) {  
          sceneEl.removeChild(disparos[i]);
          directionsBalas.splice(i, 1);
          return;
        }
        // Movimiento
        else {
          ['x', 'y', 'z'].forEach( axis => {
            disparos[i].object3D.position[axis] += directionsBalas[i][axis] * 0.13;
          });
        }
      }



      // Tiempo random para generar enemigos
      if (prevTime === 0){
        prevTime = t;
        randomTime = Math.floor(Math.random() * (MAX - MIN + 1) + MIN);
        return;
      } 
      interval += t - prevTime; 
      if (interval >= randomTime) {
        const event = new CustomEvent("newEnemy", {
          detail: {
            frame: xrFrame
          }
        });
        session.dispatchEvent(event);
        interval = 0;
        randomTime = Math.floor(1000 + (Math.random() * 4000));
      }
      prevTime = t;

    }
  }



  // Disparar balas
  session.addEventListener('selectstart', evt => {
    // Condiciones para poder disparar
    if(disparosC > 0 && !recargar.classList.contains("recargando") && !jugar.classList.contains("pausa")){
      disparosC--;
      navigator.vibrate(100);
      shot.components.sound.playSound();
      
      document.querySelector("#disparosContador").innerHTML = disparosC;

      const frame = evt.frame;   
      const refSpace = xr.getReferenceSpace();
      const pose = frame.getPose(evt.inputSource.targetRaySpace, refSpace);
  
      var disparoEl = document.createElement('a-sphere');
      disparoEl.setAttribute('class', 'disparo');
      disparoEl.setAttribute('color', 'red');
      disparoEl.setAttribute('radius', '0.1');
      sceneEl.appendChild(disparoEl);

      ['x', 'y', 'z'].forEach( axis => {
        disparoEl.object3D.position[axis] = pose.transform.position[axis];
      });

      var direction = new THREE.Vector3();
      direction.set(0, 0, -1);

      const matrixWorld = new THREE.Matrix4().fromArray(pose.transform.matrix);
      direction.applyMatrix4(matrixWorld);
      direction.sub(disparoEl.object3D.position).normalize();
      directionsBalas.push(direction);
    }

  });



  // Creación de enemigos
  session.addEventListener("newEnemy", function(ev){
    var enemigoEl = document.createElement('a-box');  
    enemigoEl.setAttribute('class', 'enemigo');
    enemigoEl.setAttribute('color', 'blue');
    enemigoEl.setAttribute('scale', '0.2 0.2 0.2');
    enemigoEl.setAttribute('data-aabb-collider-dynamic', '');
    enemigoEl.setAttribute('aabb-collider', 'objects: .disparo');
    sceneEl.appendChild(enemigoEl);

    // Colision enemigo-bala
    enemigoEl.addEventListener("hitstart", function(e){
      puntuacionC++;
      document.querySelector("#puntuacionContador").innerHTML = puntuacionC;
      navigator.vibrate(200);
      bomb.components.sound.playSound();
      enemigoEl.setAttribute('class', 'enemigo hundido');
      enemigoEl.setAttribute('scale', '0 0 0');
    });

    const pose = ev.detail.frame.getPose(viewerSpace, refSpace);
    if(!pose) return;

    const n = Math.floor(Math.random() *  30 ) + 1;
    const deg = map(n, 1, 30, -15, 15);
    function map(n, in_min, in_max, out_min, out_max) {
      return (n - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
    }
    
    objectPosition.set(Math.sin(deg * Math.PI / 180) * 4.9, Math.floor(Math.random() * 4) -1, -Math.cos(deg * Math.PI / 180) * 4.9);
    enemigoEl.object3D.position.copy(objectPosition);

    ['x', 'y', 'z'].forEach( axis =>{
      viewerPosition[axis] = pose.transform.position[axis];
    });

    var dirEnemigo = new THREE.Vector3();
    const matrixWorld2 = new THREE.Matrix4().fromArray(pose.transform.matrix);
    dirEnemigo.applyMatrix4(matrixWorld2);
    dirEnemigo.subVectors( viewerPosition, objectPosition ).normalize();
    directionsEnemigos.push(dirEnemigo);
  });



}