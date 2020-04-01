'use strict'
 
const Telnet = require('telnet-client')
const fs = require('fs');
const util = require('util');

// Convert fs.readFile into Promise version of same    
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

async function run() {
  let connection = new Telnet()
 
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

  const log = await readLog();
  
  console.log('connecting');
  try {
    await connection.connect(params)
    console.log('connected');

    let res;
  
    // console.log('ac on');
    // res = await connection.send('power ac on');
    // console.log('async result:', res)
    // await wait(3000);
    // console.log('ac off');
    // res = await connection.send('power ac off');
    // console.log('async result:', res)
/*
    thermal from 1700
*/
    for(let i = 1700 ; i < log.length - 1;){
        const p = log[i];
        const cmd = `geo fix ${p.lon} ${p.lat} ${p.ele} 12`;
        console.log(i, cmd)
        try{
            await connection.send(cmd);
        }catch(err){}
        await wait(100);
        i = i + 1;
    }

    await connection.end();
    await connection.destroy();
  
} catch(error) {
    console.log('failed');
    console.error(error);
    // handle the throw (timeout)
  }
 
}
 
run()

async function makeFile() {
  const log = await readLog();
    
  try {
    let cmd = `#!/bin/bash\necho "open 127.0.0.1 5554"\n` 
    cmd += `sleep 2\n`
    for(let i = 1700 ; i < log.length - 1;){
      const p = log[i];
      cmd += `echo "geo fix ${p.lon} ${p.lat} ${p.ele} 12"\n`;
      cmd += `sleep 0.95\n`
        
      i = i + 1;
    }
    await writeFile('./termal.sh', cmd);

    console.log('file written')

  } catch(error) {
    console.log('failed');
    console.error(error);
      // handle the throw (timeout)
  }
}

// makeFile();
  

async function readLog(){
    const dataBuffer = await readFile('./data/flightLog.gpx');
    const data = dataBuffer.toString();
    const log = [];

    console.log(typeof data)

    let i = 0;
    while(i >= 0){
        i = data.indexOf('<trkpt', i + 10);
        const latStart = data.indexOf('lat', i) + 5;
        const latEnd = data.indexOf('" ', latStart);
        const lonStart = data.indexOf('lon', i) + 5;
        const lonEnd = data.indexOf('">', lonStart);
        const eleStart = data.indexOf('ele', i) + 4;
        const eleEnd = data.indexOf('</ele', eleStart);
        const lat = data.substring(latStart, latEnd);
        const lon = data.substring(lonStart, lonEnd);
        const ele = data.substring(eleStart, eleEnd);
        const point = {lat, lon, ele};
        log.push(point);
    }
    return log;
}

async function wait(n){
    return new Promise(resolve => {
        setTimeout(resolve, n);
    });
}