# Swagger definition and generation

Go in the `swagger` directory, we will process the file called `sensors.yaml`

```
 $> ./gradle clean swagger
```
Then, as explained in the README.md generated in the `generated` directory:
```
 $> cd generated
 $> npm install
 $> node index.js
```

#### If you are not 100% familiar with `Swagger`
Go to the [Swagger](http://swagger.io/) web site.
Swagger allows you to define the structure of your REST API (in `JSON`, or even better: in `yaml`). 
Then you can generate your code (client side, server side) in the language of your choice. 

#### After running the generation above
The command `./gradlew swagger` generated the NodeJS server side artifacts for you to implement your code.
To actually hook up the server-side code and the actually expected data, you just need to implement the required methods.

Example:
In the generated code (that is in rthe `generated` directory), edit the file named `controllers/SensorsService.js`, it originally looks like this:
```
exports.readADC = function(args, res, next) {
  /**
   * parameters expected in the args:
  **/
    var examples = {};
  examples['application/json'] = { };
  if(Object.keys(examples).length > 0) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
  }
  else {
    res.end();
  }
}
```
As you can see, some sample deata have been generated.
To hook up the real ones:
```
exports.readADC = function(args, res, next) {
  /**
   * parameters expected in the args:
  **/
  var data = 786; // <= This is where you would read the real sensor
  res.end(data.toString());
}
```

After implementing the required methods, your server is ready for duty, and can be reached by any REST client (curl, PostMan, ... whatever!).
 
