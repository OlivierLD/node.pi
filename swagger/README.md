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