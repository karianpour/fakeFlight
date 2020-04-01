'use strict'
 
const Telnet = require('telnet-client')
const LatLon = require('./geodesy/latlon-spherical.js');
// const LatLon = require('./geodesy/latlon-ellipsoidal');

const readline = require('readline');
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.stdin.on('keypress', (str, key) => {
  if (key.ctrl && key.name === 'c') {
    process.exit();
  }else if (key.name === 'left') {
    console.log(`got to left`);
    left();
  }else if (key.name === 'right') {
    console.log(`got to right`);
    right();
  }else if (key.name === 'up') {
    console.log(`got to faster`);
    faster();
  }else if (key.name === 'down') {
    console.log(`got to slower`);
    slower();
  }else if (key.name === 'h') {
    console.log(`got to higher`);
    higher();
  }else if (key.name === 'l') {
    console.log(`got to lower`);
    lower();
  } else {
    console.log(key);
    console.log('no action');
  }
});
console.log(`
  Let's fly,\n
  Keys : left, right, up, down, h, l
  `
);

function left(){
  bearing = bearing - 5;
  if(bearing < 0) bearing = 360 + bearing;
  bearing = Math.round(bearing);
  printState();
}
function right(){
  bearing = bearing + 5;
  if(bearing >= 360) bearing = 0 + (bearing - 360);
  bearing = Math.round(bearing);
  printState();
}
function faster(){
  speed = Math.round(speed + 2);
  printState();
}
function slower(){
  speed = Math.round(speed - 2);
  printState();
}
function higher(){
  vspeed = Math.round((vspeed + 0.2) * 10) / 10;
  printState();
}
function lower(){
  vspeed = Math.round((vspeed - 0.2) * 10) / 10;
  printState();
}
function printState(){
  console.log({speed, vspeed, bearing});
}

async function run() {
  let connection = send && new Telnet()
 
  // these parameters are just examples and most probably won't work for your use-case.
  let params = {
      //host: '192.168.1.57',
      host: '127.0.0.1',
      port: 5554,
    // shellPrompt: '/ # ', // or negotiationMandatory: false
    negotiationMandatory: false,
    timeout: 500,
    sendTimeout: 900,
  }

  console.log('connecting');
  try {
    send && await connection.connect(params)
    console.log('connected');

    let i = 0;
    while(true) {
      i++;
      const p = createNextPoint(lastP);
      lastP = p;
      const cmd = `geo fix ${p.lon} ${p.lat} ${p.ele} 12`;
      console.log(i, cmd)
      try{
        send && await connection.send(cmd);
        !send && await wait(900);
      }catch(err){}
      await wait(100);
      i = i + 1;
    }

  } catch(error) {
    console.log('failed');
    console.error(error);
    // handle the throw (timeout)
  }
 
}

let send = true;
// let lastP = {lat: 27.3625, lon: 56.1548, ele: 580.0} // Geno
let lastP = {lat: 32.34615, lon: 51.03927, ele: 2683.0} //Rokh
let speed = 0;
let vspeed = 0;
let bearing = 90;

function createNextPoint(p) {

  const p1 = new LatLon(p.lat, p.lon);
  const t = 1000; // milisecond
  const distance = speed * 1000 / 3600 * t / 1000;// meter
  const lift = vspeed * t / 1000;// meter
  const p2 = p1.destinationPoint(distance, bearing);
  // console.log(p2);

  let lat = Math.round(p2._lat * 10000000) / 10000000, lon = Math.round(p2._lon * 10000000) / 10000000, ele = Math.round((p.ele + lift) * 100) / 100;

  return {lat, lon, ele}
}

run()


async function wait(n){
  return new Promise(resolve => {
      setTimeout(resolve, n);
  });
}