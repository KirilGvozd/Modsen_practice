// Напишите функцию, которая принимает массив с числами и находит сумму тех элементов этого массива,
// которые больше нуля и меньше десяти

function sumOfNumbers(array) {
    let sum = 0;

    for (let i = 0; i < array.length; i++) {
        if (array[i] > 0 && array[i] < 10) {
            sum += array[i];
        }
    }

    return sum;
}

console.log(sumOfNumbers([1,2,3,1,1,10]));