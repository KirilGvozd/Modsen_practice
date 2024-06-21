// Напишите функцию, которая принимает число и выводит количество цифр в этом числе

function counterOfNumbers(number) {
    let numberString = number.toString();

    if (number < 0) {
        numberString = numberString.slice(1);
    }

    return numberString.length;
}

console.log(counterOfNumbers(5678));
console.log(counterOfNumbers(-5678));
console.log(counterOfNumbers(102134314));