"use strict";

var myObj = {
  propOne: 'Property One',
  propTwo: 'Property Two'
};

for (var prop in myObj) {
  console.log('Property:' + prop + ' = ' + myObj[prop]);
}

var a = "B";
var b = "B";

var aa = [
  { key: a,
    val: 'akeu' },
  { key: b,
    val: 'coucou' }
];

console.log(aa);

var arr = [];
arr.push(123);
arr.push(234);
arr.push(345);
for (var el in arr) {
  console.log(arr[el]);
}
