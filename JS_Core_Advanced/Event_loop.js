// Используя Promise, выведите числа от 1 до 10 через секунду каждый раз.
// Ограничения: setTimeout и new Promise() мы можно вызывать только один раз.

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function printNumbers() {
    let currentNumber = 1;

    function printNextNumber() {
        if (currentNumber <= 10) {
            console.log(currentNumber);
            currentNumber++;
            wait(1000).then(printNextNumber);
        }
    }

    printNextNumber();
}

printNumbers();