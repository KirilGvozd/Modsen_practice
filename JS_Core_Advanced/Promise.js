// Напишите функцию, которая конвертирует функцию, основанную на callbacks, в функцию, основанную на Promises

function oldFunctionWithCallback(arg, callback) {
    setTimeout(() => {
        if (arg) {
            callback(null, "Success: " + arg);
        } else {
            callback("Error: Invalid argument", null);
        }
    }, 1000);
}

function promisify(callbackBasedFunction) {
    return function(arg) {
        return new Promise((resolve, reject) => {
            callbackBasedFunction(arg, (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });
    };
}

const promisedFunction = promisify(oldFunctionWithCallback);
const secondPromisedFunction = promisify(oldFunctionWithCallback);

promisedFunction("Test argument")
    .then(result => {
        console.log(result);
    })
    .catch(error => {
        console.error(error);
    });

secondPromisedFunction()
    .then(result => {
        console.log(result);
    })
    .catch(error => {
        console.error(error);
    })