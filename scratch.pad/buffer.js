const nmea = "$IIRMC,225158,A,3730.075,N,12228.854,W,,,021014,15,E,A*3C";

let data = Buffer.from(nmea);

console.log('Data: ', data);
console.log('Len:' + data.length);

let txt = "";
for (let i=0; i<data.length; i++) {
  console.log('data[' + i + ']=' + data[i] + ", " + String.fromCharCode(data[i]));
  txt += String.fromCharCode(data[i]);
}
console.log("Finally:" + txt);
